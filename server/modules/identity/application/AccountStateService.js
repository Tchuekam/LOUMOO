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
const StoreRepository = require('../../store/infrastructure/StoreRepository');
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
 * shape the state machine consumes.
 */
function projectProfile(row, completedSteps = []) {
  if (!row) return null;
  return {
    id: row.id,
    clerkUserId: row.clerk_user_id,
    username: row.username || `user_${row.id ? row.id.slice(0, 8) : 'anon'}`,
    bio: row.bio,
    headline: row.headline,
    socialLinks: row.social_links || {},
    badges: Array.isArray(row.badges) ? row.badges : [],
    followerCount: Number(row.follower_count) || 0,
    followingCount: Number(row.following_count) || 0,
    reputationScore: Number(row.reputation_score) || 100.00,
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
    taxNiuNumber: row.tax_niu_number || null,
    rccmNumber: row.rccm_number || null,
    businessAddress: row.business_address || null,
    kycDocType: row.kyc_doc_type || null,
    kycDocStatus: row.kyc_doc_status || 'pending',

    // Long-term interests & priorities (declared through any onboarding path).
    buyerInterests: row.buyer_interests || [],
    shoppingPriorities: row.shopping_priorities || [],

    // Adaptive (intent-aware) onboarding lifecycle.
    adaptiveStatus: row.adaptive_status || 'NOT_STARTED',
    adaptiveCompletedAt: row.adaptive_completed_at,

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
   */
  static async resolve(clerkUserId, opts = {}) {
    let identity = null;

    const isTestPrincipal = opts.source === 'test-harness';

    if (!isTestPrincipal && !opts.skipClerk && opts.source !== 'supabase' && ClerkIdentityProvider.isConfigured) {
      const clerkUser = await ClerkIdentityProvider.getUser(clerkUserId);
      if (!clerkUser) {
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

    // Self-heal primary_store_id if the user owns a store in iam.stores
    if (!profileRow.primary_store_id) {
      try {
        const owned = await StoreRepository.findOwnedBy(profileRow.id);
        if (owned && owned.length > 0) {
          profileRow.primary_store_id = owned[0].id;
          ProfileRepository.update(profileRow.id, { primary_store_id: owned[0].id }, profileRow.clerk_user_id).catch(() => {});
        }
      } catch (err) {
        logger.warn(`[AccountStateService] Store resolution notice: ${err.message}`);
      }
    }

    const completedSteps = await OnboardingRepository.completedStepKeys(profileRow.id);
    const principal = projectProfile(profileRow, completedSteps);

    const accountState = deriveAccountState(principal, stateOptions());

    return { profile: profileRow, principal, accountState };
  }

  /**
   * Recomputes the state after a local write, without consulting Clerk.
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
   * The client-facing state envelope.
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
          username: principal.username,
          firstName: principal.firstName,
          lastName: principal.lastName,
          fullName: `${principal.firstName} ${principal.lastName}`.trim(),
          avatarUrl: principal.avatarUrl,
          headline: principal.headline,
          bio: principal.bio,
          followerCount: principal.followerCount,
          followingCount: principal.followingCount,
          reputationScore: principal.reputationScore,
          email: principal.email,
          phoneNumber: principal.phoneNumber,
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

function shouldResync(profileRow, force) {
  if (force) return true;
  if (!profileRow.clerk_last_synced_at) return true;
  const age = Date.now() - new Date(profileRow.clerk_last_synced_at).getTime();
  return age > 5 * 60 * 1000;
}

module.exports = AccountStateService;
module.exports.projectProfile = projectProfile;