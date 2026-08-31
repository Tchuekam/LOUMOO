/**
 * LOUMOO — Canonical Account State Machine
 * ---------------------------------------------------------------------------
 * THE single authoritative definition of "where is this user in their account
 * lifecycle, and what are they allowed to do".
 *
 * Every guard, every route, every UI screen derives its decision from
 * `deriveAccountState()`. Nothing else in the codebase is permitted to invent
 * its own combination of booleans.
 *
 *   UNAUTHENTICATED
 *         v                       (a verified Clerk session exists)
 *   CONTACT_VERIFICATION_REQUIRED (no verified email on the Clerk identity)
 *         v
 *   ONBOARDING_REQUIRED           (verified, but has not started onboarding)
 *         v
 *   ONBOARDING_IN_PROGRESS        (started, not finished)
 *         v
 *   ACCOUNT_READY                 (buyer-complete: can browse, buy, save)
 *         v                       (user opted into selling)
 *   SELLER_VERIFICATION_REQUIRED  (seller onboarding started/incomplete)
 *         v
 *   SELLER_READY                  (may create, edit and publish listings)
 *
 * Impossible states are impossible by construction: the state is *computed*
 * from a small set of canonical timestamps, never stored as an independent
 * flag that could drift out of sync.
 */

const ACCOUNT_STATES = Object.freeze({
  UNAUTHENTICATED: 'UNAUTHENTICATED',
  CONTACT_VERIFICATION_REQUIRED: 'CONTACT_VERIFICATION_REQUIRED',
  ONBOARDING_REQUIRED: 'ONBOARDING_REQUIRED',
  ONBOARDING_IN_PROGRESS: 'ONBOARDING_IN_PROGRESS',
  ACCOUNT_READY: 'ACCOUNT_READY',
  SELLER_VERIFICATION_REQUIRED: 'SELLER_VERIFICATION_REQUIRED',
  SELLER_READY: 'SELLER_READY',
  // Terminal / blocked states — never part of the happy path.
  SUSPENDED: 'SUSPENDED',
  DELETED: 'DELETED'
});

/** Ordinal rank used for "at least this far along" comparisons. */
const STATE_RANK = Object.freeze({
  [ACCOUNT_STATES.UNAUTHENTICATED]: 0,
  [ACCOUNT_STATES.CONTACT_VERIFICATION_REQUIRED]: 1,
  [ACCOUNT_STATES.ONBOARDING_REQUIRED]: 2,
  [ACCOUNT_STATES.ONBOARDING_IN_PROGRESS]: 3,
  [ACCOUNT_STATES.ACCOUNT_READY]: 4,
  [ACCOUNT_STATES.SELLER_VERIFICATION_REQUIRED]: 5,
  [ACCOUNT_STATES.SELLER_READY]: 6,
  [ACCOUNT_STATES.SUSPENDED]: -1,
  [ACCOUNT_STATES.DELETED]: -2
});

const ONBOARDING_STATUS = Object.freeze({
  NOT_STARTED: 'NOT_STARTED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED'
});

const SELLER_STATUS = Object.freeze({
  NONE: 'NONE',
  ONBOARDING: 'ONBOARDING',
  PENDING_VERIFICATION: 'PENDING_VERIFICATION',
  READY: 'READY',
  REJECTED: 'REJECTED'
});

/**
 * The buyer onboarding journey. Order is authoritative: `nextStep` walks this
 * list and returns the first step that is not yet completed.
 *
 * `ACCOUNT_IDENTITY` and `CONTACT_VERIFICATION` are satisfied by Clerk itself,
 * so they are marked `derived` — the server confirms them rather than asking
 * the user to fill in a form.
 */
const ONBOARDING_STEPS = Object.freeze([
  { key: 'ACCOUNT_IDENTITY', title: 'Account identity', derived: true, sellerOnly: false },
  { key: 'CONTACT_VERIFICATION', title: 'Contact verification', derived: true, sellerOnly: false },
  { key: 'PERSONAL_INFO', title: 'Personal information', derived: false, sellerOnly: false },
  { key: 'LOCATION', title: 'Location', derived: false, sellerOnly: false },
  { key: 'MARKETPLACE_PREFERENCES', title: 'Marketplace preferences', derived: false, sellerOnly: false },
  { key: 'SELLER_SETUP', title: 'Seller setup', derived: false, sellerOnly: true },
  { key: 'COMPLETION', title: 'Completion', derived: false, sellerOnly: false }
]);

const ONBOARDING_STEP_KEYS = Object.freeze(ONBOARDING_STEPS.map(s => s.key));

/**
 * Capabilities are the ONLY thing route guards should test. They are a pure
 * function of the account state, so there is exactly one place to change when
 * a rule changes.
 */
function capabilitiesFor(state, opts = {}) {
  const rank = STATE_RANK[state] ?? 0;
  const blocked = rank < 0;
  const authenticated = !blocked && rank >= STATE_RANK[ACCOUNT_STATES.CONTACT_VERIFICATION_REQUIRED];
  const verified = !blocked && rank >= STATE_RANK[ACCOUNT_STATES.ONBOARDING_REQUIRED];
  const accountReady = !blocked && rank >= STATE_RANK[ACCOUNT_STATES.ACCOUNT_READY];
  const sellerReady = state === ACCOUNT_STATES.SELLER_READY;

  return Object.freeze({
    canBrowse: true,
    canAuthenticate: authenticated,
    canVerifyContact: authenticated,
    canCompleteOnboarding: verified,
    canManageProfile: verified,
    canSaveItems: accountReady,
    canFollowStores: accountReady,
    canPurchase: accountReady,
    canStartSelling: accountReady,
    canManageStore: sellerReady || state === ACCOUNT_STATES.SELLER_VERIFICATION_REQUIRED,
    canCreateListing: sellerReady,
    canUploadListingMedia: sellerReady,
    canPublishListing: sellerReady && opts.storeActive !== false
  });
}

/**
 * The route a blocked user must be sent to in order to make progress.
 * Deterministic — this is what prevents redirect loops: every state maps to
 * exactly one destination, and that destination never maps back to itself.
 */
const STATE_DESTINATION = Object.freeze({
  [ACCOUNT_STATES.UNAUTHENTICATED]: '/sign-in',
  [ACCOUNT_STATES.CONTACT_VERIFICATION_REQUIRED]: '/verify',
  [ACCOUNT_STATES.ONBOARDING_REQUIRED]: '/onboarding',
  [ACCOUNT_STATES.ONBOARDING_IN_PROGRESS]: '/onboarding',
  [ACCOUNT_STATES.ACCOUNT_READY]: '/',
  [ACCOUNT_STATES.SELLER_VERIFICATION_REQUIRED]: '/seller/onboarding',
  [ACCOUNT_STATES.SELLER_READY]: '/',
  [ACCOUNT_STATES.SUSPENDED]: '/account/suspended',
  [ACCOUNT_STATES.DELETED]: '/sign-in'
});

/** UI screen ids in the existing LOUMOO prototype, mapped 1:1 to the above. */
const STATE_SCREEN = Object.freeze({
  [ACCOUNT_STATES.UNAUTHENTICATED]: 'signIn',
  [ACCOUNT_STATES.CONTACT_VERIFICATION_REQUIRED]: 'verifyEmail',
  [ACCOUNT_STATES.ONBOARDING_REQUIRED]: 'onboardWelcome',
  [ACCOUNT_STATES.ONBOARDING_IN_PROGRESS]: 'onboardProfile',
  [ACCOUNT_STATES.ACCOUNT_READY]: 'home',
  [ACCOUNT_STATES.SELLER_VERIFICATION_REQUIRED]: 'onboardSeller',
  [ACCOUNT_STATES.SELLER_READY]: 'home',
  [ACCOUNT_STATES.SUSPENDED]: 'signIn',
  [ACCOUNT_STATES.DELETED]: 'signIn'
});

/**
 * Contact verification policy.
 *
 * LOUMOO requires a verified email. Phone is required only when the platform
 * is configured with a working SMS/phone verification provider — we never
 * demand a verification the system is incapable of performing, and we never
 * pretend a phone is verified when it is not.
 */
function contactRequirement(profile, providerConfig = {}) {
  const emailVerified = Boolean(profile && profile.emailVerifiedAt);
  const phoneVerified = Boolean(profile && profile.phoneVerifiedAt);
  const phoneRequired = Boolean(providerConfig.phoneVerificationEnabled) && Boolean(profile && profile.phoneNumber);

  return {
    emailRequired: true,
    emailVerified,
    phoneRequired,
    phoneVerified,
    satisfied: emailVerified && (!phoneRequired || phoneVerified)
  };
}

/**
 * Derive the canonical account state.
 *
 * @param {object|null} profile  Normalised application profile (see
 *        UserProfile#toStateJSON) or null when there is no valid session.
 * @param {object} options
 * @param {boolean} options.phoneVerificationEnabled  Whether a real phone
 *        verification provider is configured for this deployment.
 * @param {boolean} options.storeActive  Whether the seller's store is active.
 * @returns {{state:string, capabilities:object, contact:object, onboarding:object, destination:string, screen:string}}
 */
function deriveAccountState(profile, options = {}) {
  if (!profile || !profile.id) {
    return buildResult(ACCOUNT_STATES.UNAUTHENTICATED, null, options);
  }

  if (profile.accountStatus === 'anonymized' || profile.status === 'deleted' || profile.deletedAt) {
    return buildResult(ACCOUNT_STATES.DELETED, profile, options);
  }
  if (profile.accountStatus === 'suspended' || profile.status === 'suspended') {
    return buildResult(ACCOUNT_STATES.SUSPENDED, profile, options);
  }

  const contact = contactRequirement(profile, options);
  if (!contact.satisfied) {
    return buildResult(ACCOUNT_STATES.CONTACT_VERIFICATION_REQUIRED, profile, options);
  }

  const onboardingStatus = profile.onboardingStatus || ONBOARDING_STATUS.NOT_STARTED;
  if (onboardingStatus === ONBOARDING_STATUS.NOT_STARTED) {
    return buildResult(ACCOUNT_STATES.ONBOARDING_REQUIRED, profile, options);
  }
  if (onboardingStatus === ONBOARDING_STATUS.IN_PROGRESS) {
    return buildResult(ACCOUNT_STATES.ONBOARDING_IN_PROGRESS, profile, options);
  }

  // Onboarding complete. Buyers stop here; sellers continue.
  const sellerStatus = profile.sellerStatus || SELLER_STATUS.NONE;

  if (sellerStatus === SELLER_STATUS.NONE || sellerStatus === SELLER_STATUS.REJECTED) {
    return buildResult(ACCOUNT_STATES.ACCOUNT_READY, profile, options);
  }
  if (sellerStatus === SELLER_STATUS.READY) {
    return buildResult(ACCOUNT_STATES.SELLER_READY, profile, options);
  }
  // ONBOARDING or PENDING_VERIFICATION
  return buildResult(ACCOUNT_STATES.SELLER_VERIFICATION_REQUIRED, profile, options);
}

function buildResult(state, profile, options) {
  const contact = contactRequirement(profile, options);
  return {
    state,
    rank: STATE_RANK[state],
    capabilities: capabilitiesFor(state, options),
    contact,
    onboarding: onboardingSummary(profile),
    seller: {
      status: (profile && profile.sellerStatus) || SELLER_STATUS.NONE,
      storeId: (profile && profile.primaryStoreId) || null
    },
    destination: STATE_DESTINATION[state],
    screen: STATE_SCREEN[state]
  };
}

/**
 * Summarises onboarding progress and — critically — computes the *resume
 * point*, so a user who abandons on step 4 comes back to step 4 on any device.
 */
function onboardingSummary(profile) {
  const status = (profile && profile.onboardingStatus) || ONBOARDING_STATUS.NOT_STARTED;
  const completed = (profile && Array.isArray(profile.completedOnboardingSteps))
    ? profile.completedOnboardingSteps
    : [];
  const wantsToSell = Boolean(profile && profile.sellerStatus && profile.sellerStatus !== SELLER_STATUS.NONE);

  const applicable = ONBOARDING_STEPS.filter(s => !s.sellerOnly || wantsToSell);
  const remaining = applicable.filter(s => !completed.includes(s.key));

  return {
    status,
    steps: applicable.map(s => ({
      key: s.key,
      title: s.title,
      derived: s.derived,
      completed: completed.includes(s.key)
    })),
    completedSteps: completed,
    nextStep: status === ONBOARDING_STATUS.COMPLETED ? null : (remaining[0] ? remaining[0].key : null),
    totalSteps: applicable.length,
    completedCount: applicable.length - remaining.length,
    percentage: applicable.length === 0
      ? 100
      : Math.round(((applicable.length - remaining.length) / applicable.length) * 100)
  };
}

/** True when `state` has reached at least `requiredState` on the happy path. */
function isAtLeast(state, requiredState) {
  const a = STATE_RANK[state];
  const b = STATE_RANK[requiredState];
  if (a === undefined || b === undefined) return false;
  if (a < 0) return false; // suspended / deleted never satisfy anything
  return a >= b;
}

module.exports = {
  ACCOUNT_STATES,
  STATE_RANK,
  STATE_DESTINATION,
  STATE_SCREEN,
  ONBOARDING_STATUS,
  ONBOARDING_STEPS,
  ONBOARDING_STEP_KEYS,
  SELLER_STATUS,
  deriveAccountState,
  capabilitiesFor,
  contactRequirement,
  onboardingSummary,
  isAtLeast
};
