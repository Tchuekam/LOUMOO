/**
 * Identity Module — Sync Clerk User Use Case
 * Synchronizes Clerk webhook events (created, updated, deleted) into internal `iam.profiles`
 */

const { adminClient } = require('../../../infrastructure/database/SupabaseClient');
const CacheService = require('../../../infrastructure/cache/CacheService');
const OutboxService = require('../../../infrastructure/events/OutboxService');
const { EVENT_TYPES, createDomainEvent } = require('../../../infrastructure/events/EventContracts');
const AnalyticsService = require('../../../infrastructure/analytics/AnalyticsService');
const EmailProvider = require('../../../infrastructure/email/EmailProvider');
const logger = require('../../../shared/logging/logger');

// Local in-memory identity map fallback
const localProfiles = new Map();

class SyncClerkUserUseCase {
  async execute(clerkUserData, eventType = 'user.created') {
    const clerkUserId = clerkUserData.id;
    if (!clerkUserId) throw new Error('Clerk User ID is required for identity sync');

    const primaryEmail = clerkUserData.email_addresses?.find(e => e.id === clerkUserData.primary_email_address_id)?.email_address
      || clerkUserData.email_addresses?.[0]?.email_address
      || null;

    const primaryPhone = clerkUserData.phone_numbers?.find(p => p.id === clerkUserData.primary_phone_number_id)?.phone_number
      || clerkUserData.phone_numbers?.[0]?.phone_number
      || null;

    const firstName = clerkUserData.first_name || '';
    const lastName = clerkUserData.last_name || '';
    const avatarUrl = clerkUserData.image_url || clerkUserData.profile_image_url || null;

    const profileRecord = {
      clerk_user_id: clerkUserId,
      email: primaryEmail,
      phone_number: primaryPhone,
      first_name: firstName,
      last_name: lastName,
      avatar_url: avatarUrl,
      is_email_verified: Boolean(primaryEmail),
      is_phone_verified: Boolean(primaryPhone),
      primary_role: clerkUserData.public_metadata?.role || 'customer',
      metadata: clerkUserData.public_metadata || {},
      status: 'active',
      updated_at: new Date().toISOString()
    };

    let internalUserId = null;

    try {
      if (adminClient) {
        if (eventType === 'user.deleted') {
          await adminClient
            .from('profiles')
            .update({ status: 'deactivated', deleted_at: new Date().toISOString() })
            .eq('clerk_user_id', clerkUserId);
        } else {
          const { data, error } = await adminClient
            .from('profiles')
            .upsert(profileRecord, { onConflict: 'clerk_user_id' })
            .select('id')
            .single();

          if (!error && data) {
            internalUserId = data.id;
          }
        }
      }
    } catch (err) {
      logger.warn(`[SyncClerkUser] Supabase write failed, syncing locally: ${err.message}`);
    }

    if (!internalUserId) {
      internalUserId = localProfiles.get(clerkUserId)?.id || `usr_${clerkUserId.slice(-8)}`;
      localProfiles.set(clerkUserId, { id: internalUserId, ...profileRecord });
    }

    // Invalidate Redis profile cache
    await CacheService.delete(`profile:${clerkUserId}`, 'identity');
    await CacheService.delete(`profile:${internalUserId}`, 'identity');

    // Emit domain event
    const domainEvent = createDomainEvent(
      eventType === 'user.created' ? EVENT_TYPES.USER_CREATED : EVENT_TYPES.USER_UPDATED,
      'UserProfile',
      internalUserId,
      { clerkUserId, email: primaryEmail, role: profileRecord.primary_role }
    );
    await OutboxService.enqueue(domainEvent);

    // Track analytics event
    if (eventType === 'user.created') {
      AnalyticsService.identify(internalUserId, {
        email: primaryEmail,
        name: `${firstName} ${lastName}`.trim(),
        role: profileRecord.primary_role
      });
      AnalyticsService.track(internalUserId, 'user_signed_up', {
        provider: 'clerk',
        hasPhone: Boolean(primaryPhone),
        hasEmail: Boolean(primaryEmail)
      });

      if (primaryEmail) {
        EmailProvider.sendWelcomeEmail(primaryEmail, firstName).catch(e => {
          logger.warn(`[SyncClerkUser] Welcome email skipped: ${e.message}`);
        });
      }
    }

    logger.info(`[SyncClerkUser] Synchronized identity for ${clerkUserId} -> internal ID: ${internalUserId}`);
    return { internalUserId, clerkUserId, status: 'synced' };
  }
}

module.exports = {
  SyncClerkUserUseCase: new SyncClerkUserUseCase(),
  localProfiles
};
