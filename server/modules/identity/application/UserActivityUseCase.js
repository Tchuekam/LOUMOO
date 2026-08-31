/**
 * Use Case: User-Facing Activity History (04.07)
 * Records and presents high-level, privacy-safe user activity events
 * (profile updates, address edits, followed stores, saved wishlist, orders placed)
 * strictly decoupled from sensitive internal system audit logs.
 */

const { z } = require('zod');
const { SupabaseClient, handleDatabaseFailure } = require('../../../infrastructure/database/SupabaseClient.js');
const CacheService = require('../../../infrastructure/cache/CacheService');
const { ValidationError } = require('../../../shared/errors/AppError');
const logger = require('../../../shared/logging/logger');

const RecordActivitySchema = z.object({
  actionType: z.string().min(1, 'Action type is required'),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional().default(''),
  resourceType: z.string().optional().nullable(),
  resourceId: z.string().optional().nullable()
});

class UserActivityUseCase {
  constructor() {
    this._memoryStore = new Map();
  }

  /**
   * Record a privacy-safe user activity event
   */
  async recordActivity(userId, activityData) {
    if (!userId) return null;

    const parseResult = RecordActivitySchema.safeParse(activityData);
    if (!parseResult.success) {
      logger.warn(`[UserActivity] Invalid activity payload: ${parseResult.error.message}`);
      return null;
    }
    const data = parseResult.data;

    let activity = null;
    try {
      const supabase = SupabaseClient.getAdmin();
      const { data: row, error } = await supabase
        .from('user_activities')
        .insert({
          user_id: userId,
          action_type: data.actionType,
          title: data.title,
          description: data.description,
          resource_type: data.resourceType,
          resource_id: data.resourceId
        })
        .select()
        .single();

      if (error) throw error;
      if (row) activity = this._mapRow(row);
      else throw new Error('No row returned');
    } catch (err) {
      handleDatabaseFailure(err, 'Supabase insert');
      const userActs = this._memoryStore.get(userId) || [];
      activity = {
        id: `act_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        userId,
        actionType: data.actionType,
        title: data.title,
        description: data.description,
        resourceType: data.resourceType,
        resourceId: data.resourceId,
        createdAt: new Date().toISOString()
      };
      userActs.unshift(activity);
      this._memoryStore.set(userId, userActs);
    }

    // Invalidate activity feed cache
    await CacheService.delPattern(`user_activity:${userId}:*`);
    return activity;
  }

  /**
   * Get user activity feed with pagination
   */
  async getActivityFeed(userId, { limit = 20, offset = 0 } = {}) {
    if (!userId) throw new ValidationError('User ID is required');

    const cacheKey = `user_activity:${userId}:${limit}:${offset}`;
    const cached = await CacheService.get(cacheKey);
    if (cached) return cached;

    let activities = [];
    let total = 0;

    try {
      const supabase = SupabaseClient.getAdmin();
      const { data, count, error } = await supabase
        .from('user_activities')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) { handleDatabaseFailure(error, 'UserActivity'); }
      if (!error && data) {
        activities = data.map(this._mapRow);
        total = count || activities.length;
      } else {
        throw error || new Error('No data');
      }
    } catch (err) {
      handleDatabaseFailure(err, 'Supabase query');
      const userActs = this._memoryStore.get(userId) || [];
      total = userActs.length;
      activities = userActs.slice(offset, offset + limit);
    }

    const result = { activities, total, limit, offset };
    await CacheService.set(cacheKey, result, 60);
    return result;
  }

  _mapRow(row) {
    return {
      id: row.id,
      userId: row.user_id,
      actionType: row.action_type,
      title: row.title,
      description: row.description,
      resourceType: row.resource_type,
      resourceId: row.resource_id,
      createdAt: row.created_at
    };
  }
}

module.exports = new UserActivityUseCase();
