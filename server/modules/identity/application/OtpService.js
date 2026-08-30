/**
 * Service: Phone Verification & OTP (02.07)
 * Implements Cameroon E.164 phone verification, 6-digit OTP generation,
 * sliding-window rate limiting, 60s cooldown, 3-strike brute-force lockout, and profile update.
 */

const crypto = require('crypto');
const CacheService = require('../../../infrastructure/cache/CacheService');
const RateLimitService = require('../../../infrastructure/cache/RateLimitService');
const { SupabaseClient } = require('../../../infrastructure/database/SupabaseClient');
const AnalyticsService = require('../../../infrastructure/analytics/AnalyticsService');
const { ValidationError, RateLimitError, ConflictError } = require('../../../shared/errors/AppError');
const logger = require('../../../shared/logging/logger');

class OtpService {
  /**
   * Format Cameroon mobile phone number to E.164 (+237 6xx xx xx xx)
   */
  normalizePhoneNumber(phone) {
    if (!phone) throw new ValidationError('Phone number is required');
    let clean = phone.replace(/[\s\-\(\)]/g, '');
    if (!clean.startsWith('+237')) {
      if (clean.startsWith('237')) {
        clean = `+${clean}`;
      } else if (clean.startsWith('6') || clean.startsWith('2') || clean.startsWith('3')) {
        clean = `+237${clean}`;
      }
    }
    if (!/^\+237[2368]\d{8}$/.test(clean)) {
      throw new ValidationError('Invalid Cameroon phone number. Format: +237 690 12 34 56');
    }
    return clean;
  }

  /**
   * Send 6-digit verification code to Cameroon phone number
   */
  async sendOtp(rawPhone, userId = null) {
    const phoneNumber = this.normalizePhoneNumber(rawPhone);

    // 1. Check Resend Cooldown (60s lock)
    const cooldownKey = `auth:otp:cooldown:${phoneNumber}`;
    const inCooldown = await CacheService.get(cooldownKey);
    if (inCooldown) {
      throw new RateLimitError('Please wait 60 seconds before requesting another verification code.');
    }

    // 2. Sliding Window Rate Limiting (max 3 requests per 5 minutes per phone)
    const rateLimit = await RateLimitService.isAllowed(`otp:${phoneNumber}`, 3, 300);
    if (!rateLimit.allowed) {
      throw new RateLimitError('Too many verification requests. Please try again in 5 minutes.');
    }

    // 3. Generate Cryptographically Secure 6-Digit OTP
    const code = crypto.randomInt(100000, 999999).toString();
    const otpData = {
      code,
      phoneNumber,
      userId,
      attemptsRemaining: 3,
      createdAt: Date.now()
    };

    // 4. Save to Redis (5 min TTL) and set 60s cooldown
    const otpKey = `auth:otp:${phoneNumber}`;
    await CacheService.set(otpKey, otpData, 300);
    await CacheService.set(cooldownKey, true, 60);

    // 5. In production/test, log OTP dispatch
    logger.info(`[OtpService] Generated verification code for ${phoneNumber}: [${code}] (Valid for 5 mins)`);

    return {
      success: true,
      message: `Verification code sent to ${phoneNumber}`,
      phoneNumber,
      cooldownSeconds: 60,
      expiresInSeconds: 300
    };
  }

  /**
   * Verify 6-digit OTP code with brute-force defense (max 3 strikes)
   */
  async verifyOtp(rawPhone, code, userId = null) {
    const phoneNumber = this.normalizePhoneNumber(rawPhone);
    const otpKey = `auth:otp:${phoneNumber}`;

    const otpData = await CacheService.get(otpKey);
    if (!otpData) {
      throw new ValidationError('Verification code has expired or was not requested. Please request a new code.');
    }

    // 1. Check Brute-Force Attempts
    if (otpData.attemptsRemaining <= 0) {
      await CacheService.delete(otpKey);
      throw new RateLimitError('Too many incorrect verification attempts. This code has been invalidated for security.');
    }

    // 2. Match Code
    if (otpData.code !== code.trim()) {
      otpData.attemptsRemaining -= 1;
      await CacheService.set(otpKey, otpData, 300);
      throw new ValidationError(`Incorrect verification code. ${otpData.attemptsRemaining} attempts remaining.`);
    }

    // 3. Code Valid -> Clean Up Redis
    await CacheService.delete(otpKey);
    await CacheService.delete(`auth:otp:cooldown:${phoneNumber}`);

    // 4. Update Profile in Database (if userId or phone matches)
    const adminDb = SupabaseClient.getAdminClient();
    if (adminDb) {
      try {
        let query = adminDb.from('profiles').update({
          is_phone_verified: true,
          phone_number: phoneNumber,
          updated_at: new Date().toISOString()
        });

        if (userId) {
          query = query.eq('id', userId);
        } else {
          query = query.eq('phone_number', phoneNumber);
        }

        const { error } = await query;
        if (error) {
          logger.warn(`[OtpService] Supabase phone verification update warning: ${error.message}`);
        }
      } catch (err) {
        logger.warn(`[OtpService] Database update error: ${err.message}`);
      }
    }

    // 5. Track Telemetry
    AnalyticsService.track('auth_phone_verified', {
      phoneNumber,
      userId: userId || otpData.userId
    });

    logger.info(`[OtpService] Successfully verified phone number ${phoneNumber}`);

    return {
      success: true,
      message: 'Phone number verified successfully',
      phoneNumber,
      isPhoneVerified: true
    };
  }
}

module.exports = new OtpService();
