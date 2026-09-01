/**
 * LOUMOO — Onboarding Use Case
 * ---------------------------------------------------------------------------
 * Drives the resumable, server-backed onboarding journey.
 *
 * Rules:
 *   - Steps are validated server-side against a schema per step. The client
 *     cannot invent fields, and it cannot skip a step by not sending it.
 *   - Steps may only be submitted in order; a request for step 5 while step 3
 *     is outstanding is a 409 state conflict, not a silent success.
 *   - Completion is a server decision recorded with a timestamp. The browser
 *     never gets to declare itself onboarded.
 */

const { z } = require('zod');
const ProfileRepository = require('../infrastructure/ProfileRepository');
const OnboardingRepository = require('../infrastructure/OnboardingRepository');
const AccountStateService = require('./AccountStateService');
const UserActivityUseCase = require('./UserActivityUseCase');
const logger = require('../../../shared/logging/logger');
const { ValidationError, ConflictError, AuthorizationError } = require('../../../shared/errors/AppError');
const {
  ONBOARDING_STEPS,
  ONBOARDING_STEP_KEYS,
  ONBOARDING_STATUS,
  SELLER_STATUS,
  ACCOUNT_STATES
} = require('../domain/AccountState');

/* -------------------------------------------------------------------------- */
/* Per-step input schemas — the canonical definition of what onboarding asks   */
/* -------------------------------------------------------------------------- */

const CAMEROON_CITIES = [
  'douala', 'yaounde', 'bafoussam', 'bamenda', 'garoua', 'maroua',
  'ngaoundere', 'bertoua', 'buea', 'limbe', 'kribi', 'ebolowa', 'other'
];

function normalizeCity(v) {
  if (!v || typeof v !== 'string') return '';
  return v.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

const STEP_SCHEMAS = {
  PERSONAL_INFO: z.object({
    firstName: z.string().trim().min(1, 'First name is required').max(60),
    lastName: z.string().trim().min(1, 'Last name is required').max(60),
    phoneNumber: z.string().trim().max(32).optional().nullable(),
    phone: z.string().trim().max(32).optional().nullable(),
    city: z.string().trim().transform(normalizeCity).refine(
      v => !v || CAMEROON_CITIES.includes(v),
      { message: `City must be one of: ${CAMEROON_CITIES.join(', ')}` }
    ).optional().nullable()
  }),

  LOCATION: z.object({
    city: z.string().trim().transform(normalizeCity).refine(
      v => CAMEROON_CITIES.includes(v),
      { message: `City must be one of: ${CAMEROON_CITIES.join(', ')}` }
    ),
    address: z.string().trim().max(255).optional().nullable()
  }),

  MARKETPLACE_PREFERENCES: z.object({
    interests: z.array(z.string().trim().min(1).max(48)).max(20).default([]),
    priorities: z.array(z.string().trim().min(1).max(48)).max(20).default([])
  }),

  SELLER_SETUP: z.object({
    sellerType: z.enum(['individual', 'pro', 'service']),
    businessName: z.string().trim().max(120).optional().nullable(),
    rccmNumber: z.string().trim().max(64).optional().nullable(),
    taxNiuNumber: z.string().trim().max(64).optional().nullable()
  }).refine(
    data => data.sellerType === 'individual' || Boolean(data.businessName),
    { message: 'A business name is required for professional and service sellers', path: ['businessName'] }
  ),

  COMPLETION: z.object({
    acceptedTerms: z.literal(true, {
      errorMap: () => ({ message: 'You must accept the LOUMOO seller and marketplace terms to continue' })
    })
  })
};

/** Steps satisfied by the identity provider — never submitted by the client. */
const DERIVED_STEPS = new Set(ONBOARDING_STEPS.filter(s => s.derived).map(s => s.key));

class OnboardingUseCase {
  /**
   * Returns the resumable onboarding view: which step is next, what has been
   * completed, and the saved payloads so a resumed wizard can prefill itself.
   */
  static async getState(principal, accountState) {
    const draft = await OnboardingRepository.draftFor(principal.id);
    return {
      status: accountState.onboarding.status,
      nextStep: accountState.onboarding.nextStep,
      steps: accountState.onboarding.steps,
      completedCount: accountState.onboarding.completedCount,
      totalSteps: accountState.onboarding.totalSteps,
      percentage: accountState.onboarding.percentage,
      draft,
      accountState: accountState.state
    };
  }

  /**
   * Starts (or restarts) onboarding. Marks the derived steps complete, since
   * the user could not have reached here without a verified Clerk identity.
   *
   * @param {object} options.intent 'buyer' | 'seller' | 'both'
   */
  static async start(principal, { intent = 'buyer' } = {}) {
    if (!['buyer', 'seller', 'both'].includes(intent)) {
      throw new ValidationError('intent must be one of: buyer, seller, both');
    }

    const patch = {};
    if (principal.onboardingStatus === ONBOARDING_STATUS.NOT_STARTED) {
      patch.onboarding_status = ONBOARDING_STATUS.IN_PROGRESS;
      patch.onboarding_started_at = new Date().toISOString();
    }

    const wantsToSell = intent === 'seller' || intent === 'both';
    if (wantsToSell && principal.sellerStatus === SELLER_STATUS.NONE) {
      patch.seller_status = SELLER_STATUS.ONBOARDING;
    }

    if (Object.keys(patch).length > 0) {
      await ProfileRepository.update(principal.id, patch, principal.clerkUserId);
    }

    // Identity and contact verification are already satisfied by Clerk at this
    // point (the guard would not have let the request through otherwise), so
    // record them rather than asking the user to prove them twice.
    for (const stepKey of DERIVED_STEPS) {
      await OnboardingRepository.saveStep(principal.id, stepKey, {
        status: 'COMPLETED',
        payload: { source: 'clerk' }
      });
    }

    logger.info(`[Onboarding] user=${principal.id} started intent=${intent}`);
    return this.reload(principal.clerkUserId);
  }

  /**
   * Submits one onboarding step.
   *
   * @throws {ValidationError} 422-style structured field errors
   * @throws {ConflictError}   when the step is out of order or already done
   */
  static async submitStep(principal, accountState, stepKey, rawPayload) {
    if (!ONBOARDING_STEP_KEYS.includes(stepKey)) {
      throw new ValidationError(`Unknown onboarding step '${stepKey}'`, {
        allowedSteps: ONBOARDING_STEP_KEYS
      });
    }

    if (DERIVED_STEPS.has(stepKey)) {
      throw new ConflictError(
        `Step '${stepKey}' is established by the identity provider and cannot be submitted directly.`
      );
    }

    if (accountState.onboarding.status === ONBOARDING_STATUS.NOT_STARTED) {
      throw new ConflictError('Onboarding has not been started yet. Call POST /api/v1/onboarding/start first.');
    }

    // Order enforcement: the only step a user may submit is the one the server
    // says is next. This is what makes "skip to the end" impossible.
    const expected = accountState.onboarding.nextStep;
    if (expected && stepKey !== expected) {
      throw new ConflictError(
        `Onboarding steps must be completed in order. The next required step is '${expected}'.`,
        { expectedStep: expected, submittedStep: stepKey }
      );
    }

    const schema = STEP_SCHEMAS[stepKey];
    if (!schema) {
      throw new ValidationError(`Step '${stepKey}' does not accept a payload`);
    }

    const parsed = schema.safeParse(rawPayload || {});
    if (!parsed.success) {
      throw new ValidationError('Some details need your attention before you can continue.', {
        fields: parsed.error.issues.map(i => ({
          field: i.path.join('.') || '_',
          message: i.message
        }))
      });
    }

    const payload = parsed.data;

    // Project the step's answers onto the canonical profile columns.
    const patch = this._profilePatchForStep(stepKey, payload, principal);
    if (Object.keys(patch).length > 0) {
      await ProfileRepository.update(principal.id, patch, principal.clerkUserId);
    }

    await OnboardingRepository.saveStep(principal.id, stepKey, {
      status: 'COMPLETED',
      payload
    });

    // Recompute from scratch — never trust the pre-submit snapshot.
    const refreshed = await this.reload(principal.clerkUserId);

    // If that was the last applicable step, seal onboarding.
    if (refreshed.accountState.onboarding.nextStep === null
      && refreshed.principal.onboardingStatus !== ONBOARDING_STATUS.COMPLETED) {
      return this._complete(refreshed.principal);
    }

    logger.info(`[Onboarding] user=${principal.id} step=${stepKey} completed`);
    return refreshed;
  }

  static _profilePatchForStep(stepKey, payload, principal) {
    switch (stepKey) {
      case 'PERSONAL_INFO':
        return {
          first_name: payload.firstName,
          last_name: payload.lastName,
          ...((payload.phoneNumber || payload.phone) ? { phone_number: payload.phoneNumber || payload.phone } : {}),
          ...(payload.city ? { city: payload.city.toLowerCase() } : {})
        };
      case 'LOCATION':
        return {
          city: payload.city,
          ...(payload.address ? { business_address: payload.address } : {})
        };
      case 'MARKETPLACE_PREFERENCES':
        return {
          buyer_interests: payload.interests,
          shopping_priorities: payload.priorities
        };
      case 'SELLER_SETUP':
        return {
          seller_type: payload.sellerType,
          business_name: payload.businessName || null,
          rccm_number: payload.rccmNumber || null,
          tax_niu_number: payload.taxNiuNumber || null,
          // Selling intent recorded; the account is NOT seller-ready yet — a
          // store still has to be created and activated.
          seller_status: principal.sellerStatus === SELLER_STATUS.NONE
            ? SELLER_STATUS.ONBOARDING
            : principal.sellerStatus
        };
      default:
        return {};
    }
  }

  static async _complete(principal) {
    await ProfileRepository.update(principal.id, {
      onboarding_status: ONBOARDING_STATUS.COMPLETED,
      onboarding_completed_at: new Date().toISOString()
    }, principal.clerkUserId);

    await UserActivityUseCase.recordActivity(principal.id, {
      actionType: 'onboarding_completed',
      title: 'Onboarding complete',
      description: 'Your LOUMOO account setup is finished.'
    }).catch(() => null);

    logger.info(`[Onboarding] user=${principal.id} COMPLETED`);
    return this.reload(principal.clerkUserId);
  }

  /**
   * Records the user's intent to sell after onboarding is already complete.
   * Moves ACCOUNT_READY -> SELLER_VERIFICATION_REQUIRED.
   */
  static async startSelling(principal, accountState) {
    if (!accountState.capabilities.canStartSelling) {
      throw new AuthorizationError(
        'Finish setting up your account before you can start selling.',
        { currentState: accountState.state, requiredState: ACCOUNT_STATES.ACCOUNT_READY }
      );
    }
    if (principal.sellerStatus === SELLER_STATUS.READY) {
      // Already a seller — idempotent, not an error.
      return this.reload(principal.clerkUserId);
    }

    await ProfileRepository.update(principal.id, {
      seller_status: SELLER_STATUS.ONBOARDING
    }, principal.clerkUserId);

    logger.info(`[Onboarding] user=${principal.id} started seller onboarding`);
    return this.reload(principal.clerkUserId);
  }

  /**
   * Re-derives the account state after an onboarding write. Local-only: the
   * identity provider cannot have changed as a result of our own database
   * write, so asking it again would add latency and an extra failure mode.
   */
  static async reload(clerkUserId) {
    return AccountStateService.reloadLocal(clerkUserId);
  }
}

module.exports = OnboardingUseCase;
module.exports.STEP_SCHEMAS = STEP_SCHEMAS;
module.exports.CAMEROON_CITIES = CAMEROON_CITIES;
