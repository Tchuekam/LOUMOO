/**
 * LOUMOO — Authentication & Verification Routes
 * ---------------------------------------------------------------------------
 * Clerk is the identity provider. Credentials are exchanged between the
 * browser and Clerk directly; this API never sees a password and never mints a
 * session of its own.
 *
 * The previous revision accepted any identifier with no password and returned
 * a token — an unauthenticated stranger could sign in as anyone. Those
 * endpoints now answer 501 with a pointer to the real flow rather than
 * silently continuing to work.
 */

const express = require('express');
const router = express.Router();

const { requireAuth } = require('../guards/authGuard');
const AccountStateService = require('../../application/AccountStateService');
const ContactVerificationService = require('../../application/ContactVerificationService');
const ProfileRepository = require('../../infrastructure/ProfileRepository');
const ClerkIdentityProvider = require('../../infrastructure/ClerkIdentityProvider');
const AnalyticsService = require('../../../../infrastructure/analytics/AnalyticsService');
const config = require('../../../../config/env');
const logger = require('../../../../shared/logging/logger');
const { AppError } = require('../../../../shared/errors/AppError');

/** 501 for the credential endpoints that used to fabricate sessions. */
class MovedToClerkError extends AppError {
  constructor(what) {
    super(
      `${what} is handled by Clerk in the browser, not by this API. ` +
      'Use the Clerk sign-in component, then call POST /api/v1/auth/session with the resulting session token.',
      {
        code: 'USE_CLERK_AUTHENTICATION',
        statusCode: 501,
        details: {
          publishableKey: config.clerk.publishableKey || null,
          completeWith: 'POST /api/v1/auth/session'
        }
      }
    );
  }
}

/* ── Public bootstrap: what the browser needs to start Clerk ─────────────── */
// GET /api/v1/auth/config
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
        configurationRequirement: 'Phone verification is handled via application profile data.'
      }
    }
  });
});

/* ── Session establishment ── */
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

// POST /api/v1/auth/logout — Clerk owns session revocation in the browser.
router.post('/logout', (req, res) => {
  res.json({
    status: 'success',
    message: 'Signed out. Clear the Clerk session in the browser to complete sign-out.'
  });
});

/* ── Verification ────────────────────────────────────────────────────────── */

// GET /api/v1/auth/verification
router.get('/verification', requireAuth, async (req, res, next) => {
  try {
    res.json({ status: 'success', data: await ContactVerificationService.getStatus(req.principal) });
  } catch (err) { next(err); }
});

/**
 * POST /api/v1/auth/verification/refresh
 * Re-reads Clerk and mirrors the result. This is the endpoint the client polls
 * after the user completes a code — and the one that makes "verified in
 * another tab" propagate correctly.
 */
router.post('/verification/refresh', requireAuth, async (req, res, next) => {
  try {
    res.json({ status: 'success', data: await ContactVerificationService.refresh(req.principal) });
  } catch (err) { next(err); }
});

// POST /api/v1/auth/verification/email
router.post('/verification/email', requireAuth, async (req, res, next) => {
  try {
    res.json({ status: 'success', data: await ContactVerificationService.requestEmailVerification(req.principal) });
  } catch (err) { next(err); }
});

// POST /api/v1/auth/verification/phone — 503 + requirement when unconfigured.
router.post('/verification/phone', requireAuth, async (req, res, next) => {
  try {
    const result = await ContactVerificationService.requestPhoneVerification(req.principal, req.body.phoneNumber);
    res.json({ status: 'success', data: result });
  } catch (err) { next(err); }
});

/* ── Retired credential endpoints ────────────────────────────────────────── */

router.post('/signup', (req, res, next) => next(new MovedToClerkError('Registration')));
router.post('/signin', (req, res, next) => next(new MovedToClerkError('Sign in')));
router.post('/password-reset/request', (req, res, next) => next(new MovedToClerkError('Password reset')));
router.post('/password-reset/confirm', (req, res, next) => next(new MovedToClerkError('Password reset')));

// The old `POST /email/verify` returned 200 "verified successfully" for anyone,
// authenticated or not, without touching any state. It now reports the truth.
router.post('/email/verify', requireAuth, async (req, res, next) => {
  try {
    res.json({ status: 'success', data: await ContactVerificationService.refresh(req.principal) });
  } catch (err) { next(err); }
});

// Legacy OTP paths kept addressable so old clients get an explicit answer
// instead of a 404 that looks like a routing bug.
router.post('/otp/send', requireAuth, async (req, res, next) => {
  try {
    const result = await ContactVerificationService.requestPhoneVerification(req.principal, req.body.phoneNumber);
    res.json({ status: 'success', data: result });
  } catch (err) { next(err); }
});

router.post('/otp/verify', requireAuth, async (req, res, next) => {
  try {
    res.json({ status: 'success', data: await ContactVerificationService.refresh(req.principal) });
  } catch (err) { next(err); }
});

module.exports = router;
module.exports.MovedToClerkError = MovedToClerkError;
