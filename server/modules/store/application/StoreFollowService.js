/**
 * Store Follow Service (05.08 & Section 16 Follow Stores)
 * Reuses the canonical FollowedStoresUseCase and provides store-scoped follow endpoints.
 */

const FollowedStoresUseCase = require('../../identity/application/FollowedStoresUseCase');
const { SupabaseClient, handleDatabaseFailure } = require('../../../infrastructure/database/SupabaseClient.js');
const CacheService = require('../../../infrastructure/cache/CacheService');
const logger = require('../../../shared/logging/logger');

class StoreFollowService {
  static async followStore(userProfile, store) {
    // 1. Record canonical follow in identity domain
    await FollowedStoresUseCase.followStore(userProfile.id, {
      storeId: store.id,
      storeName: store.name,
      storeAvatar: store.logoUrl || null,
      city: store.city || 'Douala',
      isVerified: store.isVerified
    });

    // 2. Increment store follower count
    store.followerCount = (store.followerCount || 0) + 1;
    const supabase = SupabaseClient.getAdmin();
    try {
      await supabase
        .from('stores')
        .update({ follower_count: store.followerCount, updated_at: new Date().toISOString() })
        .eq('id', store.id);
    } catch (err) {
      handleDatabaseFailure(err, 'Increment');
    }

    await CacheService.del(`store:public:${store.id}`);
    await CacheService.del(`store:public:${store.slug}`);

    return {
      storeId: store.id,
      isFollowing: true,
      followerCount: store.followerCount
    };
  }

  static async unfollowStore(userProfile, store) {
    // 1. Remove canonical follow
    await FollowedStoresUseCase.unfollowStore(userProfile.id, store.id);

    // 2. Decrement store follower count safely
    store.followerCount = Math.max(0, (store.followerCount || 1) - 1);
    const supabase = SupabaseClient.getAdmin();
    try {
      await supabase
        .from('stores')
        .update({ follower_count: store.followerCount, updated_at: new Date().toISOString() })
        .eq('id', store.id);
    } catch (err) {
      handleDatabaseFailure(err, 'Decrement');
    }

    await CacheService.del(`store:public:${store.id}`);
    await CacheService.del(`store:public:${store.slug}`);

    return {
      storeId: store.id,
      isFollowing: false,
      followerCount: store.followerCount
    };
  }

  static async getFollowStatus(userId, storeId) {
    const isFollowing = await FollowedStoresUseCase.isFollowing(userId, storeId);
    return {
      storeId: storeId,
      isFollowing: isFollowing
    };
  }
}

module.exports = StoreFollowService;
