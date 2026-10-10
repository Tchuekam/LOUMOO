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

    // supabase-js RETURNS a failed query as { error } rather than throwing, so the old
    // try/catch around an un-inspected upsert could never see one. The upsert also could
    // never succeed for a partial edit: street_address is NOT NULL with no default, and an
    // INSERT ... ON CONFLICT is checked against NOT NULL before the conflict is resolved, so
    // every update that did not resend the street failed (23502) while the endpoint answered
    // 200 with the values the caller had sent. Update the row that exists; create one (with
    // an empty street, which the column requires) only when there is none; and check the
    // error, so a failed write is reported instead of echoed back as saved.
    try {
      const { data: existing, error: readError } = await supabase
        .from('store_locations')
        .select('store_id')
        .eq('store_id', store.id)
        .maybeSingle();
      if (readError) throw readError;

      const { error: writeError } = existing
        ? await supabase.from('store_locations').update(dbUpdates).eq('store_id', store.id)
        : await supabase.from('store_locations').insert({ street_address: '', ...dbUpdates, store_id: store.id });
      if (writeError) throw writeError;
    } catch (err) {
      handleDatabaseFailure(err, 'Update store location');
    }

    await CacheService.del(`store:public:${store.id}`);
    await CacheService.del(`store:public:${store.slug}`);
    await CacheService.del(`store:management:${store.id}`);

    const location = new StoreLocation({ store_id: store.id, ...dbUpdates });
    return location.toOwnerJSON();
  }
}

module.exports = StoreLocationUseCase;
