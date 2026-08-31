/**
 * Use Case: Followed Stores (04.05)
 * Manages user's followed boutique storefronts with duplicate prevention,
 * caching in Redis, and optimistic update invalidation.
 */

const { z } = require('zod');
const { SupabaseClient, handleDatabaseFailure } = require('../../../infrastructure/database/SupabaseClient.js');
const CacheService = require('../../../infrastructure/cache/CacheService');
const { ValidationError, NotFoundError, ConflictError } = require('../../../shared/errors/AppError');
const logger = require('../../../shared/logging/logger');

const FollowStoreSchema = z.object({
  storeId: z.string().min(1, 'Store ID is required'),
  storeName: z.string().min(1, 'Store name is required'),
  storeAvatar: z.string().optional().nullable(),
  city: z.string().optional().default('Douala'),
  isVerified: z.boolean().optional().default(true)
});

class FollowedStoresUseCase {
  constructor() {
    this._memoryStore = new Map();
  }

  /**
   * List followed stores for user with pagination
   */
  async listFollowedStores(userId, { limit = 20, offset = 0 } = {}) {
    if (!userId) throw new ValidationError('User ID is required');

    const cacheKey = `followed_stores:${userId}:${limit}:${offset}`;
    const cached = await CacheService.get(cacheKey);
    if (cached) return cached;

    let stores = [];
    let total = 0;

    try {
      const supabase = SupabaseClient.getAdmin();
      const { data, count, error } = await supabase
        .from('followed_stores')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) { handleDatabaseFailure(error, 'FollowedStores'); }
      if (!error && data) {
        stores = data.map(this._mapRow);
        total = count || stores.length;
      } else {
        throw error || new Error('No data');
      }
      // If the DB has no rows (or follow previously fell back to memory in dev),
      // surface the local in-memory store so state stays consistent.
      if (stores.length === 0) {
        const userStores = this._memoryStore.get(userId) || [];
        if (userStores.length > 0) {
          stores = userStores.slice(offset, offset + limit);
          total = userStores.length;
        }
      }
    } catch (err) {
      handleDatabaseFailure(err, 'Supabase query');
      const userStores = this._memoryStore.get(userId) || [];
      total = userStores.length;
      stores = userStores.slice(offset, offset + limit);
    }

    const result = { stores, total, limit, offset };
    await CacheService.set(cacheKey, result, 120);
    return result;
  }

  /**
   * Follow a merchant storefront
   */
  async followStore(userId, storeData) {
    if (!userId) throw new ValidationError('User ID is required');

    const parseResult = FollowStoreSchema.safeParse(storeData);
    if (!parseResult.success) {
      const msg = parseResult.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ');
      throw new ValidationError(`Invalid store data: ${msg}`);
    }
    const data = parseResult.data;

    let followed = null;

    try {
      const supabase = SupabaseClient.getAdmin();
      const { data: row, error } = await supabase
        .from('followed_stores')
        .insert({
          user_id: userId,
          store_id: data.storeId,
          store_name: data.storeName,
          store_avatar: data.storeAvatar,
          city: data.city,
          is_verified: data.isVerified
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new ConflictError('You are already following this store');
        }
        throw error;
      }
      followed = this._mapRow(row);
    } catch (err) {
      if (err instanceof ConflictError) throw err;
      handleDatabaseFailure(err, 'Supabase insert');
      
      const userStores = this._memoryStore.get(userId) || [];
      if (userStores.some(s => s.storeId === data.storeId)) {
        throw new ConflictError('You are already following this store');
      }
      followed = {
        id: `follow_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        userId,
        storeId: data.storeId,
        storeName: data.storeName,
        storeAvatar: data.storeAvatar,
        city: data.city,
        isVerified: data.isVerified,
        createdAt: new Date().toISOString()
      };
      userStores.unshift(followed);
      this._memoryStore.set(userId, userStores);
    }

    await this._invalidateCache(userId);
    logger.info(`[FollowedStores] User ${userId} followed store ${data.storeId}`);
    return followed;
  }

  /**
   * Unfollow a merchant storefront
   */
  async unfollowStore(userId, storeId) {
    if (!userId || !storeId) throw new ValidationError('User ID and Store ID are required');

    let deletedFromDb = false;
    try {
      const supabase = SupabaseClient.getAdmin();
      const { error } = await supabase
        .from('followed_stores')
        .delete()
        .eq('user_id', userId)
        .eq('store_id', storeId);

      if (error) throw error;
      deletedFromDb = true;
    } catch (err) {
      handleDatabaseFailure(err, 'Supabase delete');
    }

    // Always clean the memory store regardless of DB outcome
    const userStores = this._memoryStore.get(userId) || [];
    const filtered = userStores.filter(s => s.storeId !== storeId);
    this._memoryStore.set(userId, filtered);

    await this._invalidateCache(userId);
    logger.info(`[FollowedStores] User ${userId} unfollowed store ${storeId}`);
    return { success: true, unfollowedStoreId: storeId };
  }

  /**
   * Check if a storefront is followed by user
   */
  async isStoreFollowed(userId, storeId) {
    if (!userId || !storeId) return false;

    const cacheKey = `follow_check:${userId}:${storeId}`;
    const cached = await CacheService.get(cacheKey);
    if (cached !== null) return cached;

    let isFollowed = false;
    try {
      const supabase = SupabaseClient.getAdmin();
      const { data, error } = await supabase
        .from('followed_stores')
        .select('id')
        .eq('user_id', userId)
        .eq('store_id', storeId)
        .limit(1);

      if (error) throw error;
      if (data && data.length > 0) isFollowed = true;
      if (!isFollowed) {
        const userStores = this._memoryStore.get(userId) || [];
        if (userStores.some(s => s.storeId === storeId)) isFollowed = true;
      }
    } catch (err) {
      const userStores = this._memoryStore.get(userId) || [];
      isFollowed = userStores.some(s => s.storeId === storeId);
    }

    await CacheService.set(cacheKey, isFollowed, 300);
    return isFollowed;
  }

  async _invalidateCache(userId) {
    await CacheService.delPattern(`followed_stores:${userId}:*`);
    await CacheService.delPattern(`follow_check:${userId}:*`);
    await CacheService.del(`dashboard:${userId}`);
  }

  _mapRow(row) {
    return {
      id: row.id,
      userId: row.user_id,
      storeId: row.store_id,
      storeName: row.store_name,
      storeAvatar: row.store_avatar,
      city: row.city,
      isVerified: Boolean(row.is_verified),
      createdAt: row.created_at
    };
  }
}

module.exports = new FollowedStoresUseCase();
