/**
 * LOUMOO — Contact Verification Service
 * ---------------------------------------------------------------------------
 * Reports and refreshes the REAL verification state of a user's email and
 * phone, and refuses — loudly — to pretend about either.
 *
 * Ownership of truth:
 *   - Clerk verifies email and phone. It sends the message, it checks the
 *     code, it records the outcome.
 *   - LOUMOO mirrors that outcome into `iam.profiles.email_verified_at` /
 *     `phone_verified_at` because authorization queries need it locally, and
 *     re-reads Clerk whenever the client asks for a refresh.
 *
 * What this service will never do:
 *   - mark an address verified because a button was clicked
 *   - mark an address verified because it merely exists on the account
 *   - generate an "OTP" it has no way to deliver and call that verification
 */

const ClerkIdentityProvider = require('../infrastructure/ClerkIdentityProvider');
const ProfileRepository = require('../infrastructure/ProfileRepository');
const AccountStateService = require('./AccountStateService');
const AnalyticsService = require('../../../infrastructure/analytics/AnalyticsService');
const RateLimitService = require('../../../infrastructure/cache/RateLimitService');
const config = require('../../../config/env');
const logger = require('../../../shared/logging/logger');
const {
  ValidationError,
  ConflictError,
  RateLimitError,
  InfrastructureError,
  AppError
} = require('../../../shared/errors/AppError');

/** 501-style error carrying the exact configuration the operator must supply. */
class NotConfiguredError extends AppError {
  constructor(message, requirement) {
    super(message, {
      code: 'PHONE_VERIFICATION_NOT_CONFIGURED',
      statusCode: 503,
      details: { requirement }
    });
  }
}

class ContactVerificationService {
  /**
   * Current verification state, read from LOUMOO's mirror.
   * Pass `refresh: true` to re-read Clerk first — used when the user has just
   * completed a verification in another tab or on their phone.
   */
  static async getStatus(principal, { refresh = false } = {}) {
    let current = principal;

    if (refresh) {
      const resolved = await AccountStateService.resolve(principal.clerkUserId, { forceClerkRefresh: true });
      current = resolved.principal || principal;
    }

    const phoneCapability = ClerkIdentityProvider.phoneVerificationCapability();

    return {
      email: {
        address: current.email,
        verified: Boolean(current.emailVerifiedAt),
        verifiedAt: current.emailVerifiedAt,
        provider: config.verification.emailProvider,
        required: true
      },
      phone: {
        number: current.phoneNumber,
        verified: Boolean(current.phoneVerifiedAt),
        verifiedAt: current.phoneVerifiedAt,
        provider: phoneCapability.provider,
        available: phoneCapability.available,
        required: config.verification.phoneEnabled && Boolean(current.phoneNumber),
        configurationRequirement: phoneCapability.requirement
      },
      accountState: AccountStateService.derive(current).state
    };
  }

  /**
   * Re-reads Clerk and mirrors the result. This is how "I verified in another
   * tab" becomes visible to the API: the client asks, the server checks the
   * identity provider, and the answer is authoritative either way.
   */
  static async refresh(principal) {
    await this._throttle(`verify:refresh:${principal.id}`, 20, 60,
      'Too many verification checks. Wait a moment and try again.');

    const resolved = await AccountStateService.resolve(principal.clerkUserId, { forceClerkRefresh: true });
    if (!resolved.principal) {
      throw new ConflictError('This account is no longer available.');
    }

    const wasVerified = Boolean(principal.emailVerifiedAt);
    const isVerified = Boolean(resolved.principal.emailVerifiedAt);

    if (!wasVerified && isVerified) {
      logger.info(`[Verification] user=${principal.id} email verified (mirrored from Clerk)`);
      AnalyticsService.track(principal.id, 'contact_email_verified', { provider: 'clerk' });
    }

    return {
      status: await this.getStatus(resolved.principal),
      accountState: AccountStateService.toClientState(resolved.principal, resolved.accountState)
    };
  }

  /**
   * Email verification is driven by Clerk in the browser. This endpoint exists
   * so the client gets a precise, actionable instruction rather than a
   * fabricated "verification email sent" message from a server that sent
   * nothing.
   */
  static async requestEmailVerification(principal) {
    if (!principal.email) {
      throw new ValidationError('There is no email address on this account to verify.');
    }
    if (principal.emailVerifiedAt) {
      // Already verified is a normal outcome, not an error the user must fix.
      return {
        alreadyVerified: true,
        message: 'This email address is already verified.',
        email: principal.email
      };
    }

    await this._throttle(`verify:email:${principal.id}`, 5, 300,
      'Too many verification requests. Try again in a few minutes.');

    if (!ClerkIdentityProvider.isConfigured) {
      throw new InfrastructureError('Clerk', 'Email verification is unavailable: CLERK_SECRET_KEY is not configured');
    }

    return {
      alreadyVerified: false,
      email: principal.email,
      provider: 'clerk',
      // The browser SDK owns the send-and-check exchange; the server confirms
      // the outcome afterwards via refresh().
      action: 'CLERK_PREPARE_EMAIL_VERIFICATION',
      message: `Enter the 6-digit code we sent to ${principal.email}.`,
      confirmWith: 'POST /api/v1/auth/verification/refresh'
    };
  }

  /**
   * Phone verification. When no provider is configured this returns 503 with
   * the exact configuration required — it does not invent an SMS.
   */
  static async requestPhoneVerification(principal, rawPhoneNumber) {
    const capability = ClerkIdentityProvider.phoneVerificationCapability();

    if (!capability.available) {
      logger.warn('[Verification] Phone verification requested but not configured', {
        userId: principal.id,
        provider: capability.provider
      });
      throw new NotConfiguredError(
        'Phone verification is not available on this LOUMOO deployment yet.',
        capability.requirement
      );
    }

    const phoneNumber = this.normalizePhoneNumber(rawPhoneNumber || principal.phoneNumber);

    if (principal.phoneVerifiedAt && principal.phoneNumber === phoneNumber) {
      return { alreadyVerified: true, phoneNumber, message: 'This number is already verified.' };
    }

    await this._throttle(`verify:phone:${principal.id}`, 3, 300,
      'Too many code requests. Try again in five minutes.');

    return {
      alreadyVerified: false,
      phoneNumber,
      provider: capability.provider,
      action: 'CLERK_PREPARE_PHONE_VERIFICATION',
      message: `Enter the 6-digit code we sent to ${phoneNumber}.`,
      confirmWith: 'POST /api/v1/auth/verification/refresh'
    };
  }

  /**
   * Normalises a Cameroon mobile number to E.164.
   * Kept strict: a number the platform cannot dial is not a contact detail.
   */
  static normalizePhoneNumber(phone) {
    if (!phone) {
      throw new ValidationError('A phone number is required.', {
        fields: [{ field: 'phoneNumber', message: 'Required' }]
      });
    }

    let clean = String(phone).replace(/[\s\-().]/g, '');

    if (clean.startsWith('00237')) clean = `+${clean.slice(2)}`;
    if (!clean.startsWith('+')) {
      clean = clean.startsWith('237') ? `+${clean}` : `+237${clean}`;
    }

    if (!/^\+237[2368]\d{8}$/.test(clean)) {
      throw new ValidationError('Enter a valid Cameroon phone number, for example +237 690 12 34 56.', {
        fields: [{ field: 'phoneNumber', message: 'Invalid Cameroon phone number' }]
      });
    }
    return clean;
  }

  static async _throttle(key, max, windowSeconds, message) {
    const result = await RateLimitService.isAllowed(key, max, windowSeconds);
    if (!result.allowed) {
      throw new RateLimitError(message, result.retryAfter || windowSeconds);
    }
  }
}

module.exports = ContactVerificationService;
module.exports.NotConfiguredError = NotConfiguredError;
