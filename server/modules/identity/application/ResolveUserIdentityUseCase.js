/**
 * Identity Module — Resolve User Identity Use Case
 * Resolves an authenticated Clerk User ID to the internal UserProfile entity with Redis caching
 */

const { adminClient } = require('../../../infrastructure/database/SupabaseClient');
const CacheService = require('../../../infrastructure/cache/CacheService');
const UserProfile = require('../entities/UserProfile');
const { localProfiles } = require('./SyncClerkUserUseCase');
const logger = require('../../../shared/logging/logger');

class ResolveUserIdentityUseCase {
  async execute(clerkUserId) {
    if (!clerkUserId) return null;

    const cacheKey = `profile:${clerkUserId}`;

    return await CacheService.remember(cacheKey, 600, async () => {
      // 1. Check Supabase Database
      try {
        if (adminClient) {
          const { data, error } = await adminClient
            .from('profiles')
            .select('*')
            .eq('clerk_user_id', clerkUserId)
            .single();

          if (!error && data) {
            return new UserProfile({
              id: data.id,
              clerkUserId: data.clerk_user_id,
              email: data.email,
              phoneNumber: data.phone_number,
              firstName: data.first_name,
              lastName: data.last_name,
              avatarUrl: data.avatar_url,
              city: data.city,
              primaryRole: data.primary_role,
              isPhoneVerified: data.is_phone_verified,
              isEmailVerified: data.is_email_verified,
              metadata: data.metadata,
              status: data.status,
              createdAt: data.created_at,
              updatedAt: data.updated_at
            });
          }
        }
      } catch (err) {
        logger.warn(`[ResolveUserIdentity] Supabase lookup error for ${clerkUserId}: ${err.message}`);
      }

      // 2. Check local in-memory profile map
      const local = localProfiles.get(clerkUserId);
      if (local) {
        return new UserProfile({
          id: local.id,
          clerkUserId: local.clerk_user_id,
          email: local.email,
          phoneNumber: local.phone_number,
          firstName: local.first_name,
          lastName: local.last_name,
          avatarUrl: local.avatar_url,
          primaryRole: local.primary_role || 'customer'
        });
      }

      // 3. Auto-provision standard profile if first time seen
      const fallbackId = `usr_${clerkUserId.slice(-8)}`;
      const fallbackProfile = new UserProfile({
        id: fallbackId,
        clerkUserId,
        firstName: 'LOUMOO',
        lastName: 'Member',
        primaryRole: 'customer'
      });

      localProfiles.set(clerkUserId, {
        id: fallbackId,
        clerk_user_id: clerkUserId,
        first_name: 'LOUMOO',
        last_name: 'Member',
        primary_role: 'customer'
      });

      return fallbackProfile;
    }, 'identity');
  }
}

module.exports = new ResolveUserIdentityUseCase();
