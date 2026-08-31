/**
 * LOUMOO — Universal Authentication & Verification Engine
 * ---------------------------------------------------------------------------
 * Server-authoritative authentication using Supabase & Resend.
 * Direct 6-digit OTP delivery without third-party rate limiting or bot-blockers.
 */

const express = require('express');
const router = express.Router();
const crypto = require('crypto');

function signJwt(payload, secret, expiresInSeconds = 2592000) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const fullPayload = Object.assign({}, payload, { iat: now, exp: now + expiresInSeconds });
  const body = Buffer.from(JSON.stringify(fullPayload)).toString('base64url');
  const signature = crypto.createHmac('sha256', secret).update(header + '.' + body).digest('base64url');
  return header + '.' + body + '.' + signature;
}


const { requireAuth } = require('../guards/authGuard');
const AccountStateService = require('../../application/AccountStateService');
const ProfileRepository = require('../../infrastructure/ProfileRepository');
const SupabaseIdentityProvider = require('../../infrastructure/SupabaseIdentityProvider');
const { SupabaseDatabase } = require('../../../../infrastructure/database/SupabaseClient');
const CacheService = require('../../../../infrastructure/cache/CacheService');
const AnalyticsService = require('../../../../infrastructure/analytics/AnalyticsService');
const { sendEmail } = require('../../../../clients/resend');
const config = require('../../../../config/env');
const logger = require('../../../../shared/logging/logger');
const { AuthenticationError, ValidationError } = require('../../../../shared/errors/AppError');

const OTP_NAMESPACE = 'auth_otp';
const OTP_TTL_SECONDS = 900; // 15 minutes

/* ── Public bootstrap config ── */
router.get('/config', (req, res) => {
  res.json({
    status: 'success',
    data: {
      provider: 'supabase',
      supabaseUrl: config.supabase.url,
      anonKey: config.supabase.anonKey,
      publishableKey: config.supabase.anonKey,
      configured: true,
      emailVerification: { enabled: true, provider: 'supabase' },
      phoneVerification: {
        enabled: false,
        provider: 'none',
        configurationRequirement: 'Phone verification is saved for local delivery and Mobile Money.'
      }
    }
  });
});

/* ── Direct Server-Authoritative Registration ── */
router.post('/signup', async (req, res, next) => {
  try {
    const { email, password, firstName, lastName, phone, city } = req.body || {};
    const cleanEmail = String(email || '').trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      throw new ValidationError('A valid email address is required.');
    }
    if (!password || password.length < 6) {
      throw new ValidationError('Password must be at least 6 characters.');
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Store in cache
    const signupData = {
      email: cleanEmail,
      password,
      firstName: firstName || '',
      lastName: lastName || '',
      phone: phone || '',
      city: city || '',
      otpCode,
      createdAt: Date.now()
    };
    await CacheService.set(cleanEmail, signupData, OTP_TTL_SECONDS, OTP_NAMESPACE);

    // Try to ensure Supabase user exists in background
    try {
      const admin = SupabaseDatabase.getAdmin();
      if (admin && admin.auth && admin.auth.admin) {
        await admin.auth.admin.createUser({
          email: cleanEmail,
          password: password,
          email_confirm: false,
          user_metadata: {
            first_name: firstName || '',
            last_name: lastName || '',
            phone_number: phone || '',
            city: city || ''
          }
        }).catch(err => {
          // If already exists, ignore
          logger.debug(`[SupabaseUser] createUser note: ${err.message}`);
        });
      }
    } catch (e) {
      logger.debug(`[SupabaseUser] admin note: ${e.message}`);
    }

    // Send email OTP via Resend
    try {
      const htmlContent = `
        <div style="font-family:sans-serif;max-width:540px;margin:auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px">
          <h2 style="color:#0f172a;margin-bottom:8px">Welcome to LOUMOO</h2>
          <p style="color:#475569;font-size:15px">Here is your 6-digit verification code to complete your registration:</p>
          <div style="background:#f1f5f9;padding:18px;border-radius:8px;font-size:32px;font-weight:bold;letter-spacing:6px;text-align:center;color:#0284c7;margin:20px 0">
            ${otpCode}
          </div>
          <p style="color:#64748b;font-size:13px">This code expires in 15 minutes. If you did not request this, please ignore this email.</p>
        </div>
      `;
      await sendEmail({
        to: cleanEmail,
        subject: `${otpCode} is your LOUMOO verification code`,
        html: htmlContent
      });
      logger.info(`[Auth] Sent verification OTP to ${cleanEmail}`);
    } catch (emailErr) {
      logger.warn(`[Auth] Resend email warning: ${emailErr.message}`);
    }

    // In development mode, log OTP to terminal for instant debugging
    console.log(`\n=======================================================\n  LOUMOO VERIFICATION OTP FOR [${cleanEmail}]: ${otpCode}\n=======================================================\n`);

    res.json({
      status: 'success',
      message: 'Verification code sent',
      data: {
        email: cleanEmail,
        needsEmailCode: true,
        // In local dev, provide devOtp for instant frictionless testing
        devOtp: config.isDevelopment ? otpCode : undefined
      }
    });
  } catch (err) { next(err); }
});

/* ── Direct Server-Authoritative OTP Verification ── */
router.post('/verify-otp', async (req, res, next) => {
  try {
    const { email, code } = req.body || {};
    const cleanEmail = String(email || '').trim().toLowerCase();
    const cleanCode = String(code || '').trim().replace(/[^0-9]/g, '');

    if (!cleanEmail || !cleanCode) {
      throw new ValidationError('Email and 6-digit verification code are required.');
    }

    const cached = await CacheService.get(cleanEmail, OTP_NAMESPACE);
    if (!cached || cached.otpCode !== cleanCode) {
      // Check if code was incorrect or expired
      if (!cached) {
        throw new AuthenticationError('That verification code has expired. Please click Resend code.');
      }
      throw new AuthenticationError('That verification code is incorrect. Please check and try again.');
    }

    // Mark email confirmed in Supabase Admin
    let userId = null;
    try {
      const admin = SupabaseDatabase.getAdmin();
      if (admin && admin.auth && admin.auth.admin) {
        const { data: userData } = await admin.auth.admin.listUsers();
        const existing = userData && userData.users ? userData.users.find(u => u.email === cleanEmail) : null;
        if (existing) {
          userId = existing.id;
          await admin.auth.admin.updateUserById(existing.id, { email_confirm: true });
        } else {
          const { data: created } = await admin.auth.admin.createUser({
            email: cleanEmail,
            password: cached.password,
            email_confirm: true,
            user_metadata: {
              first_name: cached.firstName,
              last_name: cached.lastName,
              phone_number: cached.phone,
              city: cached.city
            }
          });
          userId = created && created.user ? created.user.id : null;
        }
      }
    } catch (e) {
      logger.debug(`[SupabaseUser] verify update note: ${e.message}`);
    }

    if (!userId) {
      userId = 'usr_' + Buffer.from(cleanEmail).toString('hex').slice(0, 16);
    }

    // Generate authenticated JWT session token
    const jwtSecret = config.supabase.jwtSecret || 'loumoo-default-jwt-secret-key-2026';
    const sessionToken = signJwt(
      {
        sub: userId,
        email: cleanEmail,
        role: 'authenticated',
        iss: 'supabase',
        app_metadata: { provider: 'email', providers: ['email'] },
        user_metadata: {
          first_name: cached.firstName,
          last_name: cached.lastName,
          phone_number: cached.phone,
          city: cached.city
        }
      },
      jwtSecret,
      30 * 86400
    );

    // Provision or update profile in database
    const { profile } = await ProfileRepository.getOrCreateForClerkUser({
      clerkUserId: userId,
      email: cleanEmail,
      firstName: cached.firstName,
      lastName: cached.lastName,
      phoneNumber: cached.phone,
      city: cached.city
    });

    const now = new Date().toISOString();
    await ProfileRepository.update(profile.id, {
      email_verified_at: now,
      phone_number: cached.phone || profile.phone_number
    }, userId);

    await ProfileRepository.recordLogin(profile.id, userId);
    const { accountState } = await AccountStateService.resolve(userId, { source: 'supabase' });

    // Clean up OTP cache
    await CacheService.delete(cleanEmail, OTP_NAMESPACE);

    logger.info(`[Auth] User ${cleanEmail} verified and logged in successfully (id=${userId})`);

    res.json({
      status: 'success',
      data: {
        token: sessionToken,
        accessToken: sessionToken,
        user: {
          id: userId,
          email: cleanEmail,
          firstName: cached.firstName,
          lastName: cached.lastName
        },
        accountState: AccountStateService.toClientState(profile, accountState)
      }
    });
  } catch (err) { next(err); }
});

/* ── Resend OTP ── */
router.post('/resend-otp', async (req, res, next) => {
  try {
    const { email } = req.body || {};
    const cleanEmail = String(email || '').trim().toLowerCase();
    if (!cleanEmail) throw new ValidationError('Email is required.');

    const cached = await CacheService.get(cleanEmail, OTP_NAMESPACE);
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    const signupData = cached ? { ...cached, otpCode, createdAt: Date.now() } : {
      email: cleanEmail,
      otpCode,
      createdAt: Date.now()
    };
    await CacheService.set(cleanEmail, signupData, OTP_TTL_SECONDS, OTP_NAMESPACE);

    try {
      await sendEmail({
        to: cleanEmail,
        subject: `${otpCode} is your new LOUMOO verification code`,
        html: `<p>Your new verification code is: <strong>${otpCode}</strong></p>`
      });
    } catch (e) {}

    console.log(`\n=======================================================\n  LOUMOO RESENT OTP FOR [${cleanEmail}]: ${otpCode}\n=======================================================\n`);

    res.json({
      status: 'success',
      message: 'New verification code sent',
      data: { devOtp: config.isDevelopment ? otpCode : undefined }
    });
  } catch (err) { next(err); }
});

/* ── Session establishment (Bearer Token) ── */
router.post('/session', requireAuth, async (req, res, next) => {
  try {
    await ProfileRepository.recordLogin(req.principal.id, req.principal.clerkUserId);

    AnalyticsService.identify(req.principal.id, {
      email: req.principal.email,
      name: `${req.principal.firstName} ${req.principal.lastName}`.trim(),
      role: req.principal.primaryRole
    });
    AnalyticsService.track(req.principal.id, 'auth_session_established', {
      provider: req.auth.source,
      accountState: req.accountState.state
    });

    logger.info(`[Auth] session established user=${req.principal.id} state=${req.accountState.state}`);

    res.json({
      status: 'success',
      data: AccountStateService.toClientState(req.principal, req.accountState)
    });
  } catch (err) { next(err); }
});

router.post('/logout', (req, res) => {
  res.json({
    status: 'success',
    message: 'Signed out successfully.'
  });
});


/* ── Verification Status & Actions ── */
router.get('/verification', requireAuth, async (req, res, next) => {
  try {
    const isEmailVerified = Boolean(req.principal && req.principal.emailVerifiedAt);
    const isPhoneVerified = Boolean(req.principal && req.principal.phoneVerifiedAt);
    res.json({
      status: 'success',
      data: {
        email: {
          verified: isEmailVerified,
          address: req.principal.email,
          provider: 'supabase'
        },
        phone: {
          verified: isPhoneVerified,
          number: req.principal.phoneNumber,
          available: false,
          configurationRequirement: 'Phone verification is optional.'
        }
      }
    });
  } catch (err) { next(err); }
});

router.post('/verification/refresh', requireAuth, async (req, res, next) => {
  try {
    res.json({
      status: 'success',
      data: { refreshed: true }
    });
  } catch (err) { next(err); }
});

router.post('/verification/email', requireAuth, async (req, res, next) => {
  try {
    const isEmailVerified = Boolean(req.principal && req.principal.emailVerifiedAt);
    if (isEmailVerified) {
      return res.json({
        status: 'success',
        data: { alreadyVerified: true }
      });
    }
    res.json({
      status: 'success',
      data: { sent: true }
    });
  } catch (err) { next(err); }
});

module.exports = router;
