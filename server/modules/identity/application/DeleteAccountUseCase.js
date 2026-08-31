/**
 * Use Case: Delete Account (02.13)
 * Implements lifecycle-aware account termination with PII anonymization,
 * session revocation, audit logging, and transactional record preservation.
 */

const { SupabaseDatabase } = require('../../../infrastructure/database/SupabaseClient.js');
const ClerkIdentityProvider = require('../infrastructure/ClerkIdentityProvider');
const ProfileRepository = require('../infrastructure/ProfileRepository');
const CacheService = require('../../../infrastructure/cache/CacheService');
const AccountSecurityService = require('./AccountSecurityService');
const AnalyticsService = require('../../../infrastructure/analytics/AnalyticsService');
const { ValidationError, AuthorizationError, InfrastructureError, NotFoundError } = require('../../../shared/errors/AppError');
const config = require('../../../config/env');
const logger = require('../../../shared/logging/logger');

class DeleteAccountUseCase {

  async execute(currentUser, { confirmText, reason = 'User requested deletion' }, context = {}) {
    if (!currentUser || !currentUser.id) {
      throw new AuthorizationError('Authentication required to perform account deletion');
    }

    if (confirmText !== 'DELETE') {
      throw new ValidationError('Explicit confirmation required: Please type "DELETE" to confirm account removal.');
    }

    const userId = currentUser.id;
    const clerkUserId = currentUser.clerkUserId;
    const anonymizedEmail = `anonymized_${userId.replace(/[^a-zA-Z0-9]/g, '')}@deleted.loumoo.cm`;

    // 1. Anonymize the profile FIRST.
    //    Order matters: if this fails the account still exists and the user can
    //    retry. Deleting the Clerk identity first would leave an orphaned
    //    profile full of personal data that nobody can any longer sign in to
    //    remove.
    const db = SupabaseDatabase.getAdmin();
    const { data: anonymized, error: anonymizeError } = await db.from('profiles').update({
      first_name: 'Anonymized',
      last_name: 'User',
      email: anonymizedEmail,
      phone_number: null,
      avatar_url: null,
      business_name: null,
      tax_niu_number: null,
      rccm_number: null,
      business_address: null,
      // Verification cannot outlive the identity it belonged to.
      email_verified_at: null,
      phone_verified_at: null,
      account_status: 'anonymized',
      status: 'deactivated',
      deletion_requested_at: new Date().toISOString(),
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }).eq('id', userId).select('id').maybeSingle();

    // A no-op update means the account is not there. Reporting success would
    // tell someone their data was erased when nothing was touched.
    if (!anonymizeError && !anonymized) {
      throw new NotFoundError('Account', userId);
    }

    if (anonymizeError) {
      throw new InfrastructureError(
        'Supabase',
        'We could not complete the deletion. Nothing was changed — please try again.',
        anonymizeError
      );
    }

    // 2. Delete the Clerk identity, which also revokes every session.
    //    A failure here is reported: the user's personal data is gone, but
    //    telling them the account is fully deleted when their sign-in still
    //    works would be a lie they would discover at the worst moment.
    let identityRemoved = false;
    if (clerkUserId && ClerkIdentityProvider.isConfigured) {
      try {
        await ClerkIdentityProvider.client.users.deleteUser(clerkUserId);
        identityRemoved = true;
      } catch (err) {
        if (err && (err.status === 404 || err.statusCode === 404)) {
          identityRemoved = true;   // already gone
        } else {
          logger.error(`[DeleteAccount] Clerk identity ${clerkUserId} could not be deleted: ${err.message}`);
        }
      }
    }

    // 3. Purge every cached copy of the principal, so no request served from
    //    cache can still resolve the deleted account.
    await ProfileRepository.invalidate(clerkUserId, userId);
    await CacheService.delete(`identity:profile:${clerkUserId}`);
    await CacheService.delete(`identity:profile:${userId}`);
    await CacheService.delete(`identity:public:${userId}`);

    // 4. Log Immutable Security Event
    await AccountSecurityService.logSecurityEvent({
      userId,
      eventType: 'account_anonymized',
      ipAddress: context.ip,
      userAgent: context.userAgent,
      metadata: { reason, anonymizedAt: new Date().toISOString() }
    });

    // 5. Track Telemetry
    AnalyticsService.track('account_deleted', {
      userId,
      distinctId: clerkUserId,
      properties: { reason }
    });

    logger.info(`[DeleteAccount] Account ${userId} anonymized (identity removed: ${identityRemoved}).`);

    // Report what actually happened. If the identity provider could not be
    // reached, the user's data is gone but their credentials may still work
    // briefly — saying otherwise would be a lie they discover at sign-in.
    return {
      success: true,
      identityRemoved,
      message: identityRemoved
        ? 'Your account has been deleted and your personal data anonymized.'
        : 'Your personal data has been anonymized. Removing your sign-in credentials is still in progress — '
          + 'contact LOUMOO support if you can still sign in after an hour.'
    };
  }
}

module.exports = new DeleteAccountUseCase();
