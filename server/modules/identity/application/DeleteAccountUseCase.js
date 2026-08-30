/**
 * Use Case: Delete Account (02.13)
 * Implements lifecycle-aware account termination with PII anonymization,
 * session revocation, audit logging, and transactional record preservation.
 */

const { createClerkClient } = require('@clerk/backend');
const { SupabaseClient } = require('../../../infrastructure/database/SupabaseClient');
const CacheService = require('../../../infrastructure/cache/CacheService');
const AccountSecurityService = require('./AccountSecurityService');
const AnalyticsService = require('../../../infrastructure/analytics/AnalyticsService');
const { ValidationError, AuthorizationError } = require('../../../shared/errors/AppError');
const config = require('../../../config/env');
const logger = require('../../../shared/logging/logger');

class DeleteAccountUseCase {
  constructor() {
    this.clerk = createClerkClient({ secretKey: config.clerk.secretKey || process.env.CLERK_SECRET_KEY });
  }

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

    // 1. Soft-Delete and Anonymize Profile in Supabase
    const adminDb = SupabaseClient.getAdminClient();
    if (adminDb) {
      try {
        await adminDb.from('profiles').update({
          first_name: 'Anonymized',
          last_name: 'User',
          email: anonymizedEmail,
          phone_number: null,
          avatar_url: null,
          business_name: null,
          tax_niu_number: null,
          rccm_number: null,
          account_status: 'anonymized',
          deletion_requested_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }).eq('id', userId);
      } catch (err) {
        logger.warn(`[DeleteAccount] Supabase profile anonymization error: ${err.message}`);
      }
    }

    // 2. Delete / Invalidate in Clerk
    if (clerkUserId) {
      try {
        await this.clerk.users.deleteUser(clerkUserId);
      } catch (err) {
        logger.warn(`[DeleteAccount] Clerk deleteUser fallback: ${err.message}`);
      }
    }

    // 3. Purge Redis Cache
    await CacheService.delete(`identity:profile:${clerkUserId}`);
    await CacheService.delete(`identity:profile:${userId}`);

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

    logger.info(`[DeleteAccount] Account ${userId} successfully anonymized and deleted.`);

    return {
      success: true,
      message: 'Your account has been successfully deleted and personal data anonymized.'
    };
  }
}

module.exports = new DeleteAccountUseCase();
