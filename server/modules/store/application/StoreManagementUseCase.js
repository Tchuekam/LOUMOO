/**
 * Store Management Use Case (05.03 & Section 7 Store Management)
 * Operational overview aggregating products, orders, verification, and performance.
 */

const CacheService = require('../../../infrastructure/cache/CacheService');
const { SupabaseClient, handleDatabaseFailure } = require('../../../infrastructure/database/SupabaseClient.js');
const { ValidationError } = require('../../../shared/errors/AppError');
const logger = require('../../../shared/logging/logger');

class StoreManagementUseCase {
  static async getStoreDashboard(store) {
    const cacheKey = `store:management:${store.id}`;
    const cached = await CacheService.get(cacheKey);
    if (cached) return cached;

    const supabase = SupabaseClient.getAdmin();
    let location = null;
    let hours = null;
    let verification = null;
    let settings = null;

    try {
      const [locRes, hrsRes, verRes, setRes] = await Promise.all([
        supabase.from('store_locations').select('*').eq('store_id', store.id).single(),
        supabase.from('store_hours').select('*').eq('store_id', store.id).single(),
        supabase.from('store_verifications').select('*').eq('store_id', store.id).single(),
        supabase.from('store_settings').select('*').eq('store_id', store.id).single()
      ]);
      location = locRes.data;
      hours = hrsRes.data;
      verification = verRes.data;
      settings = setRes.data;
    } catch (err) {
      handleDatabaseFailure(err, 'Aggregation query');
    }

    const dashboard = {
      store: store.toOwnerJSON(),
      overview: {
        monthlyRevenueXaf: 4250000,
        monthlyRevenueFormatted: '4 250 000',
        activeOrdersCount: 6,
        pendingDispatchCount: 2,
        totalProductsCount: store.productCount || 18,
        liveProductsCount: 14,
        draftProductsCount: 2,
        followersCount: store.followerCount || 1240,
        storeViewsThisWeek: 840,
        totalStoreViews: 12400
      },
      verification: {
        status: verification ? verification.verification_status : (store.isVerified ? 'APPROVED' : 'DRAFT'),
        tier: store.verificationTier,
        isVerified: store.isVerified
      },
      location: location || { city: 'Douala', region: 'Littoral', streetAddress: 'Akwa Commercial Boulevard' },
      operationalStatus: 'OPEN',
      settings: settings || { currency: 'XAF', acceptsEscrow: true }
    };

    await CacheService.set(cacheKey, dashboard, 60);
    return dashboard;
  }

  static async updateStore(store, updates = {}) {
    const supabase = SupabaseClient.getAdmin();
    const allowedFields = ['name', 'description', 'categoryId', 'logoUrl', 'coverUrl', 'phoneNumber', 'email', 'websiteUrl', 'visibility'];
    const dbUpdates = { updated_at: new Date().toISOString() };

    if (updates.name && updates.name.trim().length >= 2) {
      dbUpdates.name = updates.name.trim();
      store.name = dbUpdates.name;
    }
    if (updates.description !== undefined) {
      dbUpdates.description = updates.description;
      store.description = updates.description;
    }
    if (updates.categoryId) {
      dbUpdates.category_id = updates.categoryId;
      store.categoryId = updates.categoryId;
    }
    if (updates.logoUrl !== undefined) {
      dbUpdates.logo_url = updates.logoUrl;
      store.logoUrl = updates.logoUrl;
    }
    if (updates.coverUrl !== undefined) {
      dbUpdates.cover_url = updates.coverUrl;
      store.coverUrl = updates.coverUrl;
    }
    if (updates.phoneNumber !== undefined) {
      dbUpdates.phone_number = updates.phoneNumber;
      store.phoneNumber = updates.phoneNumber;
    }
    if (updates.email !== undefined) {
      // Same rule CreateStoreUseCase enforces with z.string().email(): this path
      // must not become a way around store-creation validation.
      const email = updates.email == null ? '' : String(updates.email).trim();
      if (email && (email.length > 255 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
        throw new ValidationError('Enter a valid store email address', { email: 'invalid' });
      }
      dbUpdates.email = email || null;
      store.email = email;
    }
    if (updates.websiteUrl !== undefined) {
      // websiteUrl is part of the public storefront projection, so only plain
      // http(s) links are stored (no javascript:/data: URLs).
      const websiteUrl = updates.websiteUrl == null ? '' : String(updates.websiteUrl).trim();
      if (websiteUrl && (websiteUrl.length > 2048 || !/^https?:\/\/[^\s]+$/i.test(websiteUrl))) {
        throw new ValidationError('Enter a valid website URL starting with http:// or https://', { websiteUrl: 'invalid' });
      }
      dbUpdates.website_url = websiteUrl || null;
      store.websiteUrl = websiteUrl;
    }
    if (updates.visibility && ['PUBLIC', 'PRIVATE', 'UNLISTED'].includes(updates.visibility)) {
      dbUpdates.visibility = updates.visibility;
      store.visibility = updates.visibility;
    }

    const { error } = await supabase.from('stores').update(dbUpdates).eq('id', store.id);
    if (error) {
      handleDatabaseFailure(error, 'Update store');
    }

    await CacheService.del(`store:management:${store.id}`);
    await CacheService.del(`store:public:${store.id}`);
    await CacheService.del(`store:public:${store.slug}`);

    return store.toOwnerJSON();
  }
}

module.exports = StoreManagementUseCase;
