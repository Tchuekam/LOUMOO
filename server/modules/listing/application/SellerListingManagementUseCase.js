/**
 * SellerListingManagementUseCase (06.15 Seller Listing Management & Section 31 Dashboard)
 * Provides merchant listing queries, tab counts, and bulk actions.
 */

const { SupabaseClient } = require('../../../infrastructure/database/SupabaseClient');
const CacheService = require('../../../infrastructure/cache/CacheService');
const logger = require('../../../shared/logging/logger');

// Baseline seller listings for demo and test environments
const BASELINE_SELLER_LISTINGS = [
  {
    id: 'lst_macbook_m2_douala',
    store_id: 'store_orca_electronics',
    seller_id: 'usr_rostand_123',
    listing_type: 'PHYSICAL_PRODUCT',
    category_id: 'laptops',
    title: 'Apple MacBook Air 13” M2 (Space Grey) — 8GB / 256GB SSD',
    slug: 'apple-macbook-air-13-m2-space-grey',
    brand: 'Apple',
    model: 'MacBook Air M2',
    condition: 'new',
    status: 'PUBLISHED',
    visibility: 'PUBLIC',
    currency: 'XAF',
    base_price_minor: 745000,
    has_variants: true,
    on_hand: 14,
    order_count: 18,
    view_count: 1240,
    media: [
      { id: 'med_1', url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8', is_cover: true }
    ],
    created_at: new Date(Date.now() - 86400000 * 10).toISOString()
  },
  {
    id: 'lst_anker_737_douala',
    store_id: 'store_orca_electronics',
    seller_id: 'usr_rostand_123',
    listing_type: 'PHYSICAL_PRODUCT',
    category_id: 'electronics',
    title: 'Anker 737 Power Bank (PowerCore 24K) 140W Fast Charging',
    slug: 'anker-737-power-bank-24k',
    brand: 'Anker',
    condition: 'new',
    status: 'PUBLISHED',
    visibility: 'PUBLIC',
    currency: 'XAF',
    base_price_minor: 62000,
    has_variants: false,
    on_hand: 8,
    order_count: 24,
    view_count: 890,
    media: [
      { id: 'med_2', url: 'https://images.unsplash.com/photo-1609592424300-84883391d374', is_cover: true }
    ],
    created_at: new Date(Date.now() - 86400000 * 5).toISOString()
  },
  {
    id: 'lst_ps5_slim_draft',
    store_id: 'store_orca_electronics',
    seller_id: 'usr_rostand_123',
    listing_type: 'PHYSICAL_PRODUCT',
    category_id: 'electronics',
    title: 'PlayStation 5 Slim 1TB Console (Sealed Box)',
    slug: 'playstation-5-slim-1tb',
    brand: 'Sony',
    condition: 'new',
    status: 'DRAFT',
    visibility: 'PUBLIC',
    currency: 'XAF',
    base_price_minor: 420000,
    has_variants: false,
    on_hand: 5,
    order_count: 0,
    view_count: 0,
    media: [],
    created_at: new Date().toISOString()
  }
];

class SellerListingManagementUseCase {
  static async getSellerListings(store, filters = {}) {
    const { status = 'all', search = '', limit = 50, page = 1 } = filters;
    const cacheKey = `listings:store:${store.id}:${status}:${search}:${page}`;

    return await CacheService.remember(cacheKey, 60, async () => {
      const supabase = SupabaseClient.admin;
      let listings = [...BASELINE_SELLER_LISTINGS];

      try {
        let q = supabase
          .from('iam.listings')
          .select('*, iam.listing_media(*)')
          .eq('store_id', store.id);

        if (status && status !== 'all') {
          q = q.eq('status', status.toUpperCase());
        }

        const { data, error } = await q.order('created_at', { ascending: false });
        if (data && !error && data.length > 0) {
          listings = data;
        }
      } catch (err) {
        logger.warn(`[SellerListings] DB query fallback: ${err.message}`);
      }

      // Filter in-memory
      let filtered = listings.filter(l => l.store_id === store.id || l.storeId === store.id);
      if (status && status !== 'all') {
        filtered = filtered.filter(l => (l.status || '').toLowerCase() === status.toLowerCase());
      }
      if (search) {
        const qStr = search.toLowerCase();
        filtered = filtered.filter(l => (l.title || '').toLowerCase().includes(qStr));
      }

      // Tab counts
      const allItems = listings.filter(l => l.store_id === store.id || l.storeId === store.id);
      const tabCounts = {
        all: allItems.length,
        live: allItems.filter(l => l.status === 'PUBLISHED').length,
        drafts: allItems.filter(l => l.status === 'DRAFT').length,
        sold: allItems.filter(l => (l.order_count || l.orderCount || 0) > 0).length,
        paused: allItems.filter(l => l.status === 'PAUSED').length,
        archived: allItems.filter(l => l.status === 'ARCHIVED').length
      };

      const startIndex = (parseInt(page, 10) - 1) * parseInt(limit, 10);
      const paginated = filtered.slice(startIndex, startIndex + parseInt(limit, 10));

      return {
        listings: paginated,
        tabCounts: tabCounts,
        total: filtered.length,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        hasMore: startIndex + paginated.length < filtered.length
      };
    }, 'catalog');
  }
}

module.exports = SellerListingManagementUseCase;
