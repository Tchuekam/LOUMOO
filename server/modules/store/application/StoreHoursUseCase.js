/**
 * Store Hours Use Case (05.11 & Section 22 Business Opening Information)
 * Manages operational schedules, 24/7 status, and temporary closures.
 */

const { SupabaseClient } = require('../../../infrastructure/database/SupabaseClient');
const CacheService = require('../../../infrastructure/cache/CacheService');
const StoreHours = require('../domain/StoreHours');
const logger = require('../../../shared/logging/logger');

class StoreHoursUseCase {
  static async getHours(store) {
    const supabase = SupabaseClient.admin;
    let data = null;

    try {
      const { data: res, error } = await supabase
        .from('iam.store_hours')
        .select('*')
        .eq('store_id', store.id)
        .single();

      if (res && !error) data = res;
    } catch (err) {
      logger.warn(`[StoreHours] Query fallback: ${err.message}`);
    }

    const hours = new StoreHours(data || { store_id: store.id });
    return hours.toJSON();
  }

  static async updateHours(store, updates = {}) {
    const supabase = SupabaseClient.admin;
    const dbUpdates = {
      timezone: updates.timezone,
      is_always_open: updates.isAlwaysOpen,
      is_temporarily_closed: updates.isTemporarilyClosed,
      temporary_closure_reason: updates.temporaryClosureReason,
      schedule: updates.schedule,
      updated_at: new Date().toISOString()
    };

    Object.keys(dbUpdates).forEach(k => {
      if (dbUpdates[k] === undefined) delete dbUpdates[k];
    });

    try {
      await supabase
        .from('iam.store_hours')
        .upsert({ store_id: store.id, ...dbUpdates }, { onConflict: 'store_id' });
    } catch (err) {
      logger.warn(`[StoreHours] Update fallback: ${err.message}`);
    }

    await CacheService.del(`store:public:${store.id}`);
    await CacheService.del(`store:public:${store.slug}`);
    await CacheService.del(`store:management:${store.id}`);

    const hours = new StoreHours({ store_id: store.id, ...dbUpdates });
    return hours.toJSON();
  }
}

module.exports = StoreHoursUseCase;
