/**
 * Use Case: Saved Items / Wishlist (04.04)
 * Manages user's saved products with duplicate prevention,
 * caching in Redis, and optimistic update invalidation.
 */

const { z } = require('zod');
const { SupabaseClient, handleDatabaseFailure } = require('../../../infrastructure/database/SupabaseClient.js');
const CacheService = require('../../../infrastructure/cache/CacheService');
const { ValidationError, NotFoundError, ConflictError } = require('../../../shared/errors/AppError');
const logger = require('../../../shared/logging/logger');

const SaveItemSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  title: z.string().min(1, 'Product title is required'),
  priceXaf: z.number().nonnegative('Price must be positive'),
  imageUrl: z.string().optional().nullable(),
  category: z.string().optional().default('General'),
  metadata: z.record(z.any()).optional().default({})
});

class SavedItemsUseCase {
  constructor() {
    this._memoryStore = new Map(); // Fallback in-memory store
  }

  /**
   * List saved items for user with pagination
   */
  async listSavedItems(userId, { limit = 20, offset = 0 } = {}) {
    if (!userId) throw new ValidationError('User ID is required');

    const cacheKey = `saved_items:${userId}:${limit}:${offset}`;
    const cached = await CacheService.get(cacheKey);
    if (cached) return cached;

    let items = [];
    let total = 0;

    try {
      const supabase = SupabaseClient.getAdmin();
      const { data, count, error } = await supabase
        .from('saved_items')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) { handleDatabaseFailure(error, 'SavedItems'); }
      if (!error && data) {
        items = data.map(this._mapRow);
        total = count || items.length;
      } else {
        throw error || new Error('No data');
      }
      // If the DB has no rows (or insert previously fell back to memory in dev),
      // surface the local in-memory store so state stays consistent.
      if (items.length === 0) {
        const userItems = this._memoryStore.get(userId) || [];
        if (userItems.length > 0) {
          items = userItems.slice(offset, offset + limit);
          total = userItems.length;
        }
      }
    } catch (err) {
      handleDatabaseFailure(err, 'Supabase query');
      const userItems = this._memoryStore.get(userId) || [];
      total = userItems.length;
      items = userItems.slice(offset, offset + limit);
    }

    const result = { items, total, limit, offset };
    await CacheService.set(cacheKey, result, 120);
    return result;
  }

  /**
   * Save a product for user (with duplicate prevention)
   */
  async saveItem(userId, itemData) {
    if (!userId) throw new ValidationError('User ID is required');

    const parseResult = SaveItemSchema.safeParse(itemData);
    if (!parseResult.success) {
      const msg = parseResult.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ');
      throw new ValidationError(`Invalid item data: ${msg}`);
    }
    const data = parseResult.data;

    let savedItem = null;

    try {
      const supabase = SupabaseClient.getAdmin();
      const { data: row, error } = await supabase
        .from('saved_items')
        .insert({
          user_id: userId,
          product_id: data.productId,
          title: data.title,
          price_xaf: data.priceXaf,
          image_url: data.imageUrl,
          category: data.category,
          metadata: data.metadata
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          throw new ConflictError('Item is already saved in your wishlist');
        }
        throw error;
      }
      savedItem = this._mapRow(row);
    } catch (err) {
      if (err instanceof ConflictError) throw err;
      handleDatabaseFailure(err, 'Supabase insert');
      
      const userItems = this._memoryStore.get(userId) || [];
      if (userItems.some(i => i.productId === data.productId)) {
        throw new ConflictError('Item is already saved in your wishlist');
      }
      savedItem = {
        id: `save_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        userId,
        productId: data.productId,
        title: data.title,
        priceXaf: data.priceXaf,
        imageUrl: data.imageUrl,
        category: data.category,
        metadata: data.metadata,
        createdAt: new Date().toISOString()
      };
      userItems.unshift(savedItem);
      this._memoryStore.set(userId, userItems);
    }

    // Invalidate Redis caches
    await this._invalidateCache(userId);
    logger.info(`[SavedItems] Saved product ${data.productId} for user ${userId}`);
    return savedItem;
  }

  /**
   * Remove item from saved wishlist
   */
  async removeItem(userId, productId) {
    if (!userId || !productId) throw new ValidationError('User ID and Product ID are required');

    try {
      const supabase = SupabaseClient.getAdmin();
      const { error } = await supabase
        .from('saved_items')
        .delete()
        .eq('user_id', userId)
        .eq('product_id', productId);

      if (error) throw error;
    } catch (err) {
      handleDatabaseFailure(err, 'Supabase delete');
    }

    // Always clean memory store regardless of DB outcome
    const userItems = this._memoryStore.get(userId) || [];
    const filtered = userItems.filter(i => i.productId !== productId);
    this._memoryStore.set(userId, filtered);

    await this._invalidateCache(userId);
    logger.info(`[SavedItems] Removed product ${productId} for user ${userId}`);
    return { success: true, removedProductId: productId };
  }

  /**
   * Quick check if a product is saved by user
   */
  async isItemSaved(userId, productId) {
    if (!userId || !productId) return false;

    const cacheKey = `saved_check:${userId}:${productId}`;
    const cached = await CacheService.get(cacheKey);
    if (cached !== null) return cached;

    let isSaved = false;
    try {
      const supabase = SupabaseClient.getAdmin();
      const { data, error } = await supabase
        .from('saved_items')
        .select('id')
        .eq('user_id', userId)
        .eq('product_id', productId)
        .limit(1);

      if (error) throw error;
      if (data && data.length > 0) isSaved = true;
      if (!isSaved) {
        const userItems = this._memoryStore.get(userId) || [];
        if (userItems.some(i => i.productId === productId)) isSaved = true;
      }
    } catch (err) {
      const userItems = this._memoryStore.get(userId) || [];
      isSaved = userItems.some(i => i.productId === productId);
    }

    await CacheService.set(cacheKey, isSaved, 300);
    return isSaved;
  }

  async _invalidateCache(userId) {
    await CacheService.delPattern(`saved_items:${userId}:*`);
    await CacheService.delPattern(`saved_check:${userId}:*`);
    await CacheService.del(`dashboard:${userId}`);
  }

  _mapRow(row) {
    return {
      id: row.id,
      userId: row.user_id,
      productId: row.product_id,
      title: row.title,
      priceXaf: Number(row.price_xaf),
      imageUrl: row.image_url,
      category: row.category,
      metadata: row.metadata || {},
      createdAt: row.created_at
    };
  }
}

module.exports = new SavedItemsUseCase();
