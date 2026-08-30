/**
 * Store Location Use Case (05.12 & Section 24 Business Location)
 * Handles physical and commercial store addressing with privacy safeguards.
 */

const { SupabaseClient } = require('../../../infrastructure/database/SupabaseClient');
const CacheService = require('../../../infrastructure/cache/CacheService');
const StoreLocation = require('../domain/StoreLocation');
const logger = require('../../../shared/logging/logger');

class StoreLocationUseCase {
  static async getLocation(store, isOwnerOrStaff = false) {
    const supabase = SupabaseClient.admin;
    let data = null;

    try {
      const { data: res, error } = await supabase
        .from('iam.store_locations')
        .select('*')
        .eq('store_id', store.id)
        .single();

      if (res && !error) data = res;
    } catch (err) {
      logger.warn(`[StoreLocation] Query fallback: ${err.message}`);
    }

    const location = new StoreLocation(data || {
      store_id: store.id,
      city: store.city || 'Douala',
      region: 'Littoral',
      district_quarter: 'Akwa'
    });

    return isOwnerOrStaff ? location.toOwnerJSON() : location.toPublicJSON();
  }

  static async updateLocation(store, updates = {}) {
    const supabase = SupabaseClient.admin;
    const dbUpdates = {
      country: updates.country,
      region: updates.region,
      city: updates.city,
      district_quarter: updates.districtQuarter,
      street_address: updates.streetAddress,
      landmark: updates.landmark,
      building_floor: updates.buildingFloor,
      latitude: updates.latitude !== undefined ? Number(updates.latitude) : undefined,
      longitude: updates.longitude !== undefined ? Number(updates.longitude) : undefined,
      is_public: updates.isPublic,
      service_radius_km: updates.serviceRadiusKm !== undefined ? Number(updates.serviceRadiusKm) : undefined,
      updated_at: new Date().toISOString()
    };

    Object.keys(dbUpdates).forEach(k => {
      if (dbUpdates[k] === undefined) delete dbUpdates[k];
    });

    try {
      await supabase
        .from('iam.store_locations')
        .upsert({ store_id: store.id, ...dbUpdates }, { onConflict: 'store_id' });
    } catch (err) {
      logger.warn(`[StoreLocation] Update fallback: ${err.message}`);
    }

    await CacheService.del(`store:public:${store.id}`);
    await CacheService.del(`store:public:${store.slug}`);
    await CacheService.del(`store:management:${store.id}`);

    const location = new StoreLocation({ store_id: store.id, ...dbUpdates });
    return location.toOwnerJSON();
  }
}

module.exports = StoreLocationUseCase;
