/**
 * Store Profile Use Case (05.04 & Section 9 Store Profile)
 * Exposes public storefront projections and allows authorized sellers to customize policies and branding.
 */

const CacheService = require('../../../infrastructure/cache/CacheService');
const { SupabaseClient, handleDatabaseFailure } = require('../../../infrastructure/database/SupabaseClient.js');
const StoreProfile = require('../domain/StoreProfile');
const StoreHours = require('../domain/StoreHours');
const StoreLocation = require('../domain/StoreLocation');
const Store = require('../domain/Store');
const { NotFoundError } = require('../../../shared/errors/AppError');
const logger = require('../../../shared/logging/logger');
const StoreRepository = require('../infrastructure/StoreRepository');

class StoreProfileUseCase {
  static async getPublicProfile(identifier) {
    const cacheKey = `store:public:${identifier}`;
    const cached = await CacheService.get(cacheKey);
    if (cached) return cached;

    const supabase = SupabaseClient.getAdmin();

    // Resolved from the database only. The previous revision fabricated an
    // "Orca Electronics" storefront for a hardcoded id, so a request for a
    // store that had never existed returned a convincing 200.
    const storeData = await StoreRepository.findByIdOrSlug(identifier);

    if (!storeData) {
      throw new NotFoundError('Store', identifier);
    }

    const store = new Store(storeData);

    // Fetch Profile, Location, Hours
    let profileData = {};
    let locationData = {};
    let hoursData = {};

    try {
      const [pRes, lRes, hRes] = await Promise.all([
        supabase.from('store_profiles').select('*').eq('store_id', store.id).single(),
        supabase.from('store_locations').select('*').eq('store_id', store.id).single(),
        supabase.from('store_hours').select('*').eq('store_id', store.id).single()
      ]);
      profileData = pRes.data || {};
      locationData = lRes.data || {};
      hoursData = hRes.data || {};
    } catch (e) {}

    const profile = new StoreProfile(profileData);
    const location = new StoreLocation(locationData);
    const hours = new StoreHours(hoursData);

    const publicView = {
      ...store.toPublicJSON(),
      tagline: profile.tagline || 'Certified Tech & Electronics Distributor',
      bio: profile.bio || store.description,
      returnPolicy: profile.returnPolicy,
      warrantyPolicy: profile.warrantyPolicy,
      shippingPolicy: profile.shippingPolicy,
      socialLinks: profile.socialLinks,
      badges: profile.badges,
      location: location.toPublicJSON(),
      hours: {
        timezone: hours.timezone,
        schedule: hours.schedule,
        currentStatus: hours.calculateCurrentStatus()
      }
    };

    await CacheService.set(cacheKey, publicView, 300);
    return publicView;
  }

  static async updateStoreProfile(store, updates = {}) {
    const supabase = SupabaseClient.getAdmin();
    const dbUpdates = {
      tagline: updates.tagline,
      bio: updates.bio,
      return_policy: updates.returnPolicy,
      warranty_policy: updates.warrantyPolicy,
      shipping_policy: updates.shippingPolicy,
      social_links: updates.socialLinks,
      updated_at: new Date().toISOString()
    };

    // Clean undefined fields
    Object.keys(dbUpdates).forEach(k => {
      if (dbUpdates[k] === undefined) delete dbUpdates[k];
    });

    try {
      await supabase
        .from('store_profiles')
        .upsert({ store_id: store.id, ...dbUpdates }, { onConflict: 'store_id' });
    } catch (err) {
      handleDatabaseFailure(err, 'Update profile');
    }

    await CacheService.del(`store:public:${store.id}`);
    await CacheService.del(`store:public:${store.slug}`);
    await CacheService.del(`store:management:${store.id}`);

    return {
      storeId: store.id,
      ...dbUpdates
    };
  }
}

module.exports = StoreProfileUseCase;
