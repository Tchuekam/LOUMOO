/**
 * Use Case: Notification Preferences (04.09)
 * Manages user's notification channels (in-app, email, SMS, WhatsApp)
 * and categories (transactional, marketing, social, system), protecting
 * critical transactional security alerts from being disabled.
 */

const { z } = require('zod');
const { SupabaseClient, handleDatabaseFailure } = require('../../../infrastructure/database/SupabaseClient.js');
const CacheService = require('../../../infrastructure/cache/CacheService');
const { ValidationError } = require('../../../shared/errors/AppError');
const logger = require('../../../shared/logging/logger');

const UpdateNotifPrefsSchema = z.object({
  channels: z.object({
    inApp: z.boolean().optional(),
    email: z.boolean().optional(),
    sms: z.boolean().optional(),
    whatsapp: z.boolean().optional()
  }).optional(),
  categories: z.object({
    transactional: z.boolean().optional(), // Must remain true
    marketing: z.boolean().optional(),
    social: z.boolean().optional(),
    system: z.boolean().optional()
  }).optional()
});

class NotificationPreferencesUseCase {
  constructor() {
    this._memoryStore = new Map();
  }

  /**
   * Get notification preferences for user
   */
  async getPreferences(userId) {
    if (!userId) throw new ValidationError('User ID is required');

    const cacheKey = `notif_prefs:${userId}`;
    const cached = await CacheService.get(cacheKey);
    if (cached) return cached;

    let prefs = null;
    try {
      const supabase = SupabaseClient.getAdmin();
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) { handleDatabaseFailure(error, 'NotificationPreferences'); }
      if (!error && data) {
        prefs = this._mapRow(data);
      }
    } catch (err) {
      handleDatabaseFailure(err, 'Supabase query');
    }

    if (!prefs) {
      prefs = this._memoryStore.get(userId) || this._defaultPreferences(userId);
    }

    await CacheService.set(cacheKey, prefs, 300);
    return prefs;
  }

  /**
   * Update notification preferences
   */
  async updatePreferences(userId, updateData) {
    if (!userId) throw new ValidationError('User ID is required');

    const parseResult = UpdateNotifPrefsSchema.safeParse(updateData);
    if (!parseResult.success) {
      const msg = parseResult.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ');
      throw new ValidationError(`Invalid notification preferences: ${msg}`);
    }
    const data = parseResult.data;

    const current = await this.getPreferences(userId);

    const mergedChannels = {
      ...current.channels,
      ...(data.channels || {})
    };

    const mergedCategories = {
      ...current.categories,
      ...(data.categories || {}),
      transactional: true // IMMUTABLE: Transactional / Security notices must never be disabled
    };

    let updated = null;
    try {
      const supabase = SupabaseClient.getAdmin();
      const { data: row, error } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: userId,
          channels: {
            in_app: mergedChannels.inApp,
            email: mergedChannels.email,
            sms: mergedChannels.sms,
            whatsapp: mergedChannels.whatsapp
          },
          categories: {
            transactional: true,
            marketing: mergedCategories.marketing,
            social: mergedCategories.social,
            system: mergedCategories.system
          },
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) { handleDatabaseFailure(error, 'NotificationPreferences'); }
      if (!error && row) updated = this._mapRow(row);
    } catch (err) {
      handleDatabaseFailure(err, 'Supabase upsert');
    }

    if (!updated) {
      updated = {
        userId,
        channels: mergedChannels,
        categories: mergedCategories,
        updatedAt: new Date().toISOString()
      };
      this._memoryStore.set(userId, updated);
    }

    await CacheService.set(`notif_prefs:${userId}`, updated, 300);
    logger.info(`[NotificationPreferences] Updated preferences for user ${userId}`);
    return updated;
  }

  _defaultPreferences(userId) {
    return {
      userId,
      channels: {
        inApp: true,
        email: true,
        sms: true,
        whatsapp: false
      },
      categories: {
        transactional: true,
        marketing: true,
        social: true,
        system: true
      },
      updatedAt: new Date().toISOString()
    };
  }

  _mapRow(row) {
    const ch = row.channels || {};
    const cat = row.categories || {};
    return {
      id: row.id,
      userId: row.user_id,
      channels: {
        inApp: ch.in_app !== false,
        email: ch.email !== false,
        sms: ch.sms !== false,
        whatsapp: Boolean(ch.whatsapp)
      },
      categories: {
        transactional: true,
        marketing: cat.marketing !== false,
        social: cat.social !== false,
        system: cat.system !== false
      },
      updatedAt: row.updated_at
    };
  }
}

module.exports = new NotificationPreferencesUseCase();
