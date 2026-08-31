/**
 * Store Settings Use Case (05.10 & Section 20 Store Settings)
 * Manages store fulfillment policies, payment options, and merchant privacy.
 */

const CacheService = require('../../../infrastructure/cache/CacheService');
const { SupabaseClient, handleDatabaseFailure } = require('../../../infrastructure/database/SupabaseClient.js');
const StoreSettings = require('../domain/StoreSettings');
const logger = require('../../../shared/logging/logger');

class StoreSettingsUseCase {
  static async getSettings(store) {
    const supabase = SupabaseClient.getAdmin();
    let data = null;

    try {
      const { data: res, error } = await supabase
        .from('store_settings')
        .select('*')
        .eq('store_id', store.id)
        .single();

      if (res && !error) data = res;
    } catch (err) {
      handleDatabaseFailure(err, 'Query');
    }

    const settings = new StoreSettings(data || { store_id: store.id });
    return settings.toJSON();
  }

  static async updateSettings(store, updates = {}) {
    const supabase = SupabaseClient.getAdmin();
    const dbUpdates = {
      currency: updates.currency,
      accepts_escrow: updates.acceptsEscrow,
      accepts_momo: updates.acceptsMomo,
      accepts_orange_money: updates.acceptsOrangeMoney,
      accepts_cash_on_delivery: updates.acceptsCashOnDelivery,
      allow_store_pickup: updates.allowStorePickup,
      allow_national_shipping: updates.allowNationalShipping,
      minimum_order_xaf: updates.minimumOrderXaf,
      auto_accept_orders: updates.autoAcceptOrders,
      notification_settings: updates.notificationSettings,
      privacy_settings: updates.privacySettings,
      updated_at: new Date().toISOString()
    };

    Object.keys(dbUpdates).forEach(k => {
      if (dbUpdates[k] === undefined) delete dbUpdates[k];
    });

    try {
      await supabase
        .from('store_settings')
        .upsert({ store_id: store.id, ...dbUpdates }, { onConflict: 'store_id' });
    } catch (err) {
      handleDatabaseFailure(err, 'Update');
    }

    await CacheService.del(`store:management:${store.id}`);

    return {
      storeId: store.id,
      ...dbUpdates
    };
  }
}

module.exports = StoreSettingsUseCase;
