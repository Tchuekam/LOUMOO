/**
 * LOUMOO — Account State Service
 * ---------------------------------------------------------------------------
 * Resolves the ONE authoritative answer to:
 *
 *     Who is this request from, and what are they allowed to do?
 *
 * Everything the server decides about verification, onboarding, seller
 * eligibility and listing permissions flows through here. Route handlers and
 * guards consume the result; they never recompute it from raw columns.
 */

const ProfileRepository = require('../infrastructure/ProfileRepository');
const ClerkIdentityProvider = require('../infrastructure/ClerkIdentityProvider');
const OnboardingRepository = require('../infrastructure/OnboardingRepository');
const config = require('../../../config/env');
const logger = require('../../../shared/logging/logger');
const {
  deriveAccountState,
  ACCOUNT_STATES,
  ONBOARDING_STATUS,
  SELLER_STATUS
} = require('../domain/AccountState');

/**
 * Maps a raw `iam.profiles` row plus its onboarding rows onto the neutral
 * shape the state machine consumes. Keeping this projection in one place is
 * what stops column names leaking into business logic.
 */
function projectProfile(row, completedSteps = []) {
  if (!row) return null;
  return {
    id: row.id,
    clerkUserId: row.clerk_user_id,
    email: row.email,
    phoneNumber: row.phone_number,
    firstName: row.first_name || '',
    lastName: row.last_name || '',
    avatarUrl: row.avatar_url,
    city: row.city,
    primaryRole: row.primary_role || 'customer',

    // Canonical verification state — timestamps, not booleans.
    emailVerifiedAt: row.email_verified_at,
    phoneVerifiedAt: row.phone_verified_at,

    onboardingStatus: row.onboarding_status || ONBOARDING_STATUS.NOT_STARTED,
    onboardingStartedAt: row.onboarding_started_at,
    onboardingCompletedAt: row.onboarding_completed_at,
    completedOnboardingSteps: completedSteps,

    sellerStatus: row.seller_status || SELLER_STATUS.NONE,
    sellerType: row.seller_type,
    businessName: row.business_name,
    primaryStoreId: row.primary_store_id,

    status: row.status,
    accountStatus: row.account_status,
    deletedAt: row.deleted_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

class AccountStateService {
  /**
   * Resolves the full authenticated principal for a verified Clerk user id.
   * Provisions the application profile on first sight, and refreshes the
   * mirrored verification state from Clerk when it may be stale.
   *
   * @param {string} clerkUserId  Already-verified subject of a session token.
   * @param {object} opts
   * @param {boolean} opts.forceClerkRefresh  Re-read Clerk even if recently synced.
   * @param {boolean} opts.skipClerk  Recompute from LOUMOO's own state only.
   *        Used immediately after this server wrote to the profile: our own
   *        write cannot have changed anything at the identity provider, and a
   *        round-trip there would only add latency and a failure mode.
   * @returns {Promise<{profile:object, principal:object, accountState:object}>}
   */
  static async resolve(clerkUserId, opts = {}) {
    let identity = null;

    // Test-harness principals have no Clerk record to read; they are
    // provisioned from their id alone and their verification state lives
    // entirely in LOUMOO's own database.
    const isTestPrincipal = opts.source === 'test-harness';

    if (!isTestPrincipal && !opts.skipClerk && ClerkIdentityProvider.isConfigured) {
      const clerkUser = await ClerkIdentityProvider.getUser(clerkUserId);
      if (!clerkUser) {
        // The session verified, but the identity is gone from Clerk (deleted
        // between issuing the token and now). Treat it as signed out.
        await ProfileRepository.markDeleted(clerkUserId).catch(() => null);
        return { profile: null, principal: null, accountState: deriveAccountState(null, stateOptions()) };
      }
      identity = ClerkIdentityProvider.normalizeUser(clerkUser);
    }

    let profileRow = await ProfileRepository.findByClerkUserId(clerkUserId, {
      useCache: !opts.forceClerkRefresh
    });

    if (!profileRow) {
      const seed = identity || {
        clerkUserId,
        email: null,
        emailVerified: false,
        phoneNumber: null,
        phoneVerified: false,
        firstName: '',
        lastName: ''
      };
      const { profile } = await ProfileRepository.getOrCreateForClerkUser(seed);
      profileRow = profile;
    } else if (identity && shouldResync(profileRow, opts.forceClerkRefresh)) {
      profileRow = await ProfileRepository.syncFromClerk(profileRow, identity);
    }

    const completedSteps = await OnboardingRepository.completedStepKeys(profileRow.id);
    const principal = projectProfile(profileRow, completedSteps);

    const accountState = deriveAccountState(principal, stateOptions());

    return { profile: profileRow, principal, accountState };
  }

  /**
   * Recomputes the state after a local write, without consulting Clerk.
   * @returns {Promise<{profile:object, principal:object, accountState:object}>}
   */
  static async reloadLocal(clerkUserId) {
    return this.resolve(clerkUserId, { skipClerk: true, forceClerkRefresh: true });
  }

  /** Recomputes the state for an already-loaded principal (no I/O). */
  static derive(principal, options = {}) {
    return deriveAccountState(principal, { ...stateOptions(), ...options });
  }

  static project(row, completedSteps = []) {
    return projectProfile(row, completedSteps);
  }

  /**
   * The client-facing state envelope. This is what the browser renders from —
   * a *projection* of the server's decision, never an input to it.
   */
  static toClientState(principal, accountState) {
    return {
      state: accountState.state,
      isAuthenticated: accountState.state !== ACCOUNT_STATES.UNAUTHENTICATED,
      capabilities: accountState.capabilities,
      contact: {
        email: principal ? principal.email : null,
        emailVerified: accountState.contact.emailVerified,
        phoneNumber: principal ? principal.phoneNumber : null,
        phoneVerified: accountState.contact.phoneVerified,
        phoneRequired: accountState.contact.phoneRequired,
        phoneVerificationAvailable: ClerkIdentityProvider.phoneVerificationCapability().available
      },
      onboarding: accountState.onboarding,
      seller: accountState.seller,
      destination: accountState.destination,
      screen: accountState.screen,
      user: principal
        ? {
          id: principal.id,
          firstName: principal.firstName,
          lastName: principal.lastName,
          fullName: `${principal.firstName} ${principal.lastName}`.trim(),
          email: principal.email,
          phoneNumber: principal.phoneNumber,
          avatarUrl: principal.avatarUrl,
          city: principal.city,
          primaryRole: principal.primaryRole,
          sellerType: principal.sellerType,
          businessName: principal.businessName,
          primaryStoreId: principal.primaryStoreId
        }
        : null
    };
  }
}

function stateOptions() {
  return {
    phoneVerificationEnabled: config.verification.phoneEnabled
  };
}

/** Re-read Clerk at most once every 5 minutes unless explicitly forced. */
function shouldResync(profileRow, force) {
  if (force) return true;
  if (!profileRow.clerk_last_synced_at) return true;
  const age = Date.now() - new Date(profileRow.clerk_last_synced_at).getTime();
  return age > 5 * 60 * 1000;
}

module.exports = AccountStateService;
module.exports.projectProfile = projectProfile;
