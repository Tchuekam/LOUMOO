/**
 * LOUMOO — Account State & Onboarding Routes
 * ---------------------------------------------------------------------------
 * `GET /api/v1/me/state` is the single endpoint the frontend guard consults.
 * It answers "what may this user do, and where should they be sent if they
 * may not do it" — the server decides, the browser renders.
 */

const express = require('express');
const router = express.Router();

const { requireAuth, requireCapability } = require('../guards/authGuard');
const AccountStateService = require('../../application/AccountStateService');
const OnboardingUseCase = require('../../application/OnboardingUseCase');
const { ACCOUNT_STATES, ONBOARDING_STEPS } = require('../../domain/AccountState');
const { ValidationError } = require('../../../../shared/errors/AppError');

/* ── The authoritative session + capability probe ────────────────────────── */

// GET /api/v1/me/state
router.get('/state', requireAuth, (req, res) => {
  res.json({
    status: 'success',
    data: AccountStateService.toClientState(req.principal, req.accountState)
  });
});

/**
 * GET /api/v1/me/state/resolve?intent=<screen or capability>
 * Asks the server where a user should go for a given intent, so the client
 * never has to reimplement the ladder — and so it cannot get it wrong.
 */
router.get('/state/resolve', requireAuth, (req, res, next) => {
  try {
    const capability = req.query.capability;
    if (!capability) {
      throw new ValidationError('Specify the capability you want to resolve, e.g. ?capability=canCreateListing');
    }
    const allowed = Boolean(req.accountState.capabilities[capability]);
    res.json({
      status: 'success',
      data: {
        capability,
        allowed,
        currentState: req.accountState.state,
        // When blocked, this is the ONE place the user must go next. Because
        // it is derived from a total function over states, it can never point
        // back at a screen the user is already blocked on — no redirect loops.
        resolveAt: allowed ? null : req.accountState.destination,
        resolveScreen: allowed ? null : req.accountState.screen,
        onboarding: req.accountState.onboarding
      }
    });
  } catch (err) { next(err); }
});

/* ── Onboarding ──────────────────────────────────────────────────────────── */

// GET /api/v1/me/onboarding — resumable state + saved step payloads
router.get('/onboarding', requireAuth, async (req, res, next) => {
  try {
    const state = await OnboardingUseCase.getState(req.principal, req.accountState);
    res.json({ status: 'success', data: state });
  } catch (err) { next(err); }
});

// GET /api/v1/me/onboarding/steps — the definition, for rendering the wizard
router.get('/onboarding/steps', (req, res) => {
  res.json({
    status: 'success',
    data: {
      steps: ONBOARDING_STEPS.map(s => ({
        key: s.key,
        title: s.title,
        derived: s.derived,
        sellerOnly: s.sellerOnly
      }))
    }
  });
});

// POST /api/v1/me/onboarding/start  { intent: 'buyer' | 'seller' | 'both' }
router.post('/onboarding/start', requireAuth, async (req, res, next) => {
  try {
    const { principal, accountState } = await OnboardingUseCase.start(req.principal, {
      intent: req.body.intent || 'buyer'
    });
    res.json({
      status: 'success',
      data: {
        ...AccountStateService.toClientState(principal, accountState),
        onboarding: await OnboardingUseCase.getState(principal, accountState)
      }
    });
  } catch (err) { next(err); }
});

/**
 * POST /api/v1/me/onboarding/steps/:stepKey
 * Submits one step. Out-of-order submissions are a 409; unknown fields and
 * invalid values come back as a structured 400 with per-field messages.
 */
router.post('/onboarding/steps/:stepKey', requireAuth, async (req, res, next) => {
  try {
    const { principal, accountState } = await OnboardingUseCase.submitStep(
      req.principal,
      req.accountState,
      req.params.stepKey,
      req.body
    );
    res.json({
      status: 'success',
      data: {
        ...AccountStateService.toClientState(principal, accountState),
        onboarding: await OnboardingUseCase.getState(principal, accountState)
      }
    });
  } catch (err) { next(err); }
});

/**
 * POST /api/v1/me/selling/start
 * ACCOUNT_READY -> SELLER_VERIFICATION_REQUIRED. Records the intent to sell;
 * it does NOT make the account seller-ready — activating a boutique does that.
 */
router.post('/selling/start',
  requireAuth,
  requireCapability('canStartSelling'),
  async (req, res, next) => {
    try {
      const { principal, accountState } = await OnboardingUseCase.startSelling(req.principal, req.accountState);
      res.json({ status: 'success', data: AccountStateService.toClientState(principal, accountState) });
    } catch (err) { next(err); }
  });

module.exports = router;
