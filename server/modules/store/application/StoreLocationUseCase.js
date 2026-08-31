/**
 * Store Location Use Case (05.12 & Section 24 Business Location)
 * Handles physical and commercial store addressing with privacy safeguards.
 */

const CacheService = require('../../../infrastructure/cache/CacheService');
const { SupabaseClient, handleDatabaseFailure } = require('../../../infrastructure/database/SupabaseClient.js');
const StoreLocation = require('../domain/StoreLocation');
const logger = require('../../../shared/logging/logger');

class StoreLocationUseCase {
  static async getLocation(store, isOwnerOrStaff = false) {
    const supabase = SupabaseClient.getAdmin();
    let data = null;

    try {
      const { data: res, error } = await supabase
        .from('store_locations')
        .select('*')
        .eq('store_id', store.id)
        .single();

      if (res && !error) data = res;
    } catch (err) {
      handleDatabaseFailure(err, 'Query');
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
    const supabase = SupabaseClient.getAdmin();
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
        .from('store_locations')
        .upsert({ store_id: store.id, ...dbUpdates }, { onConflict: 'store_id' });
    } catch (err) {
      handleDatabaseFailure(err, 'Update');
    }

    await CacheService.del(`store:public:${store.id}`);
    await CacheService.del(`store:public:${store.slug}`);
    await CacheService.del(`store:management:${store.id}`);

    const location = new StoreLocation({ store_id: store.id, ...dbUpdates });
    return location.toOwnerJSON();
  }
}

module.exports = StoreLocationUseCase;
