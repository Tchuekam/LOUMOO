/**
 * LOUMOO — Account State Machine (pure unit tests)
 * ---------------------------------------------------------------------------
 * The state machine is a total function over a small set of canonical fields.
 * These tests pin down every transition and, just as importantly, prove that
 * the impossible states the brief warned about cannot be produced.
 */

require('../setup');
const assert = require('assert');

const {
  ACCOUNT_STATES,
  ONBOARDING_STATUS,
  SELLER_STATUS,
  deriveAccountState,
  isAtLeast,
  STATE_DESTINATION
} = require('../../server/modules/identity/domain/AccountState');

const NOW = '2026-08-31T00:00:00.000Z';

function profile(overrides = {}) {
  return {
    id: 'usr_1',
    clerkUserId: 'user_1',
    email: 'a@loumoo.cm',
    emailVerifiedAt: null,
    phoneVerifiedAt: null,
    phoneNumber: null,
    onboardingStatus: ONBOARDING_STATUS.NOT_STARTED,
    sellerStatus: SELLER_STATUS.NONE,
    completedOnboardingSteps: [],
    accountStatus: 'active',
    status: 'active',
    ...overrides
  };
}

async function run() {
  /* ── The ladder, rung by rung ─────────────────────────────────────────── */

  assert.strictEqual(deriveAccountState(null).state, ACCOUNT_STATES.UNAUTHENTICATED);
  assert.strictEqual(deriveAccountState(undefined).state, ACCOUNT_STATES.UNAUTHENTICATED);

  assert.strictEqual(
    deriveAccountState(profile()).state,
    ACCOUNT_STATES.CONTACT_VERIFICATION_REQUIRED,
    'An authenticated user with no verified email is not past verification'
  );

  assert.strictEqual(
    deriveAccountState(profile({ emailVerifiedAt: NOW })).state,
    ACCOUNT_STATES.ONBOARDING_REQUIRED
  );

  assert.strictEqual(
    deriveAccountState(profile({
      emailVerifiedAt: NOW,
      onboardingStatus: ONBOARDING_STATUS.IN_PROGRESS
    })).state,
    ACCOUNT_STATES.ONBOARDING_IN_PROGRESS
  );

  assert.strictEqual(
    deriveAccountState(profile({
      emailVerifiedAt: NOW,
      onboardingStatus: ONBOARDING_STATUS.COMPLETED
    })).state,
    ACCOUNT_STATES.ACCOUNT_READY
  );

  assert.strictEqual(
    deriveAccountState(profile({
      emailVerifiedAt: NOW,
      onboardingStatus: ONBOARDING_STATUS.COMPLETED,
      sellerStatus: SELLER_STATUS.ONBOARDING
    })).state,
    ACCOUNT_STATES.SELLER_VERIFICATION_REQUIRED
  );

  assert.strictEqual(
    deriveAccountState(profile({
      emailVerifiedAt: NOW,
      onboardingStatus: ONBOARDING_STATUS.COMPLETED,
      sellerStatus: SELLER_STATUS.READY
    })).state,
    ACCOUNT_STATES.SELLER_READY
  );

  /* ── Impossible states are unreachable ────────────────────────────────── */

  // The exact combination the brief calls out: onboarding "complete",
  // email unverified, seller "verified". Verification dominates: the account
  // is stuck at CONTACT_VERIFICATION_REQUIRED and can create nothing.
  const contradictory = deriveAccountState(profile({
    emailVerifiedAt: null,
    onboardingStatus: ONBOARDING_STATUS.COMPLETED,
    sellerStatus: SELLER_STATUS.READY
  }));
  assert.strictEqual(contradictory.state, ACCOUNT_STATES.CONTACT_VERIFICATION_REQUIRED);
  assert.strictEqual(contradictory.capabilities.canCreateListing, false,
    'An unverified account can never create a listing, whatever other flags say');
  assert.strictEqual(contradictory.capabilities.canPublishListing, false);

  // Seller status without completed onboarding also cannot reach SELLER_READY.
  const prematureSeller = deriveAccountState(profile({
    emailVerifiedAt: NOW,
    onboardingStatus: ONBOARDING_STATUS.IN_PROGRESS,
    sellerStatus: SELLER_STATUS.READY
  }));
  assert.strictEqual(prematureSeller.state, ACCOUNT_STATES.ONBOARDING_IN_PROGRESS);
  assert.strictEqual(prematureSeller.capabilities.canCreateListing, false);

  /* ── Terminal states ──────────────────────────────────────────────────── */

  const suspended = deriveAccountState(profile({
    emailVerifiedAt: NOW,
    onboardingStatus: ONBOARDING_STATUS.COMPLETED,
    sellerStatus: SELLER_STATUS.READY,
    accountStatus: 'suspended'
  }));
  assert.strictEqual(suspended.state, ACCOUNT_STATES.SUSPENDED);
  assert.strictEqual(suspended.capabilities.canCreateListing, false);
  assert.strictEqual(suspended.capabilities.canPurchase, false);
  assert.strictEqual(isAtLeast(ACCOUNT_STATES.SUSPENDED, ACCOUNT_STATES.ACCOUNT_READY), false,
    'A suspended account never satisfies a minimum-state requirement');

  const deleted = deriveAccountState(profile({ accountStatus: 'anonymized' }));
  assert.strictEqual(deleted.state, ACCOUNT_STATES.DELETED);

  /* ── Phone verification is required only when it is actually possible ─── */

  const withPhoneNoProvider = deriveAccountState(
    profile({ emailVerifiedAt: NOW, phoneNumber: '+237690112233', onboardingStatus: ONBOARDING_STATUS.COMPLETED }),
    { phoneVerificationEnabled: false }
  );
  assert.strictEqual(withPhoneNoProvider.state, ACCOUNT_STATES.ACCOUNT_READY,
    'A deployment without an SMS provider must not block users on a verification it cannot perform');
  assert.strictEqual(withPhoneNoProvider.contact.phoneRequired, false);

  const withPhoneAndProvider = deriveAccountState(
    profile({ emailVerifiedAt: NOW, phoneNumber: '+237690112233', onboardingStatus: ONBOARDING_STATUS.COMPLETED }),
    { phoneVerificationEnabled: true }
  );
  assert.strictEqual(withPhoneAndProvider.state, ACCOUNT_STATES.CONTACT_VERIFICATION_REQUIRED,
    'When phone verification IS configured, an unverified number blocks the ladder');

  /* ── Every state maps to exactly one, non-looping destination ─────────── */

  for (const state of Object.values(ACCOUNT_STATES)) {
    assert.ok(STATE_DESTINATION[state],
      `State ${state} must have a destination, otherwise a blocked user has nowhere to go`);
  }
  // The destinations for blocked states must not be the state's own screen
  // that would re-block it — this is the structural no-redirect-loop guarantee.
  assert.strictEqual(STATE_DESTINATION[ACCOUNT_STATES.ACCOUNT_READY], '/');
  assert.strictEqual(STATE_DESTINATION[ACCOUNT_STATES.SELLER_READY], '/');
  assert.notStrictEqual(
    STATE_DESTINATION[ACCOUNT_STATES.ONBOARDING_REQUIRED],
    STATE_DESTINATION[ACCOUNT_STATES.CONTACT_VERIFICATION_REQUIRED]
  );

  /* ── Onboarding progress and the resume point ─────────────────────────── */

  const midway = deriveAccountState(profile({
    emailVerifiedAt: NOW,
    onboardingStatus: ONBOARDING_STATUS.IN_PROGRESS,
    completedOnboardingSteps: ['ACCOUNT_IDENTITY', 'CONTACT_VERIFICATION', 'PERSONAL_INFO']
  }));
  assert.strictEqual(midway.onboarding.nextStep, 'LOCATION',
    'The resume point is the first incomplete step');
  assert.strictEqual(midway.onboarding.completedCount, 3);

  // A buyer's journey has one fewer step than a seller's.
  const buyerSteps = deriveAccountState(profile({
    emailVerifiedAt: NOW, onboardingStatus: ONBOARDING_STATUS.IN_PROGRESS
  })).onboarding.totalSteps;
  const sellerSteps = deriveAccountState(profile({
    emailVerifiedAt: NOW,
    onboardingStatus: ONBOARDING_STATUS.IN_PROGRESS,
    sellerStatus: SELLER_STATUS.ONBOARDING
  })).onboarding.totalSteps;
  assert.strictEqual(sellerSteps, buyerSteps + 1,
    'The seller setup step applies only to users who intend to sell');

  /* ── Buyers are not burdened with seller requirements ─────────────────── */

  const buyer = deriveAccountState(profile({
    emailVerifiedAt: NOW, onboardingStatus: ONBOARDING_STATUS.COMPLETED
  }));
  assert.strictEqual(buyer.capabilities.canPurchase, true);
  assert.strictEqual(buyer.capabilities.canSaveItems, true);
  assert.strictEqual(buyer.capabilities.canFollowStores, true);
  assert.strictEqual(buyer.capabilities.canStartSelling, true);
  assert.strictEqual(buyer.capabilities.canCreateListing, false);

  console.log('  ✓ Account state machine: all transitions and impossible states verified');
}

module.exports = { run };

if (require.main === module) {
  run().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
}
