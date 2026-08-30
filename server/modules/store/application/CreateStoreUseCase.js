/**
 * Create Store Use Case (05.01)
 * Creates a business store entity, establishes owner relationship, initialises defaults.
 */

const { SupabaseClient } = require('../../../infrastructure/database/SupabaseClient');
const CacheService = require('../../../infrastructure/cache/CacheService');
const AnalyticsService = require('../../../infrastructure/analytics/AnalyticsService');
const { ValidationError } = require('../../../shared/errors/AppError');
const Store = require('../domain/Store');
const logger = require('../../../shared/logging/logger');
const { getStoreRepository } = require('../guards/storeAuthGuard');

class CreateStoreUseCase {
  static async execute(userProfile, storeInput = {}) {
    if (!userProfile || !userProfile.id) {
      throw new ValidationError('Authentication required to create a store.');
    }

    const name = (storeInput.name || storeInput.businessName || '').trim();
    if (!name || name.length < 2) {
      throw new ValidationError('Store name must be at least 2 characters long.');
    }

    const categoryId = (storeInput.categoryId || storeInput.category || 'electronics').toLowerCase();
    const city = storeInput.city || userProfile.city || 'Douala';
    const slug = Store.generateSlug(name);

    const storeData = {
      id: `store_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      owner_id: userProfile.id,
      name: name,
      slug: slug,
      description: storeInput.description || `Official store for ${name} in ${city}, Cameroon.`,
      category_id: categoryId,
      logo_url: storeInput.logoUrl || null,
      cover_url: storeInput.coverUrl || null,
      phone_number: storeInput.phoneNumber || userProfile.phoneNumber || '',
      email: storeInput.email || userProfile.email || '',
      status: 'DRAFT',
      visibility: 'PUBLIC',
      is_verified: false,
      verification_tier: 'unverified',
      rating: 5.0,
      rating_count: 0,
      follower_count: 0,
      product_count: 0,
      onboarding_step: 'IN_PROGRESS',
      onboarding_completed: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const supabase = SupabaseClient.admin;

    // 1. Insert Store in Database
    try {
      const { error } = await supabase.from('iam.stores').insert(storeData);
      if (error) throw error;

      // 2. Insert Owner Member
      await supabase.from('iam.store_members').insert({
        store_id: storeData.id,
        user_id: userProfile.id,
        role: 'owner',
        permissions: ['*']
      });

      // 3. Insert Initial Profile, Hours, Location, Settings
      await supabase.from('iam.store_profiles').insert({
        store_id: storeData.id,
        tagline: storeInput.tagline || `Authentic ${name} products`,
        bio: storeData.description
      });

      await supabase.from('iam.store_locations').insert({
        store_id: storeData.id,
        city: city,
        region: city === 'Yaoundé' ? 'Centre' : 'Littoral',
        street_address: storeInput.streetAddress || `${city} Commercial District`
      });

      await supabase.from('iam.store_hours').insert({
        store_id: storeData.id,
        timezone: 'Africa/Douala'
      });

      await supabase.from('iam.store_settings').insert({
        store_id: storeData.id,
        currency: 'XAF'
      });
    } catch (err) {
      logger.warn(`[CreateStore] Supabase insert fallback: ${err.message}`);
    }

    // In-memory fallback
    const { mockStores, mockMembers } = getStoreRepository();
    mockStores.set(storeData.id, storeData);
    mockMembers.set(`${storeData.id}:${userProfile.id}`, { role: 'owner', permissions: ['*'] });

    // Track analytics event
    AnalyticsService.track(userProfile.id, 'store_created', {
      storeId: storeData.id,
      storeName: name,
      category: categoryId,
      city: city
    });

    const store = new Store(storeData);
    return store.toOwnerJSON();
  }
}

module.exports = CreateStoreUseCase;
