/**
 * Store Discovery Use Case — public storefront search.
 * ---------------------------------------------------------------------------
 * Returns real, active, publicly visible stores.
 *
 * The previous revision merged a curated list of fictional storefronts into
 * every result. Since a store page is now a genuine database lookup, those
 * entries led shoppers to a 404 — the directory advertised boutiques that did
 * not exist. Discovery is database-backed only.
 */

const CacheService = require('../../../infrastructure/cache/CacheService');
const { SupabaseDatabase } = require('../../../infrastructure/database/SupabaseClient.js');
const { InfrastructureError } = require('../../../shared/errors/AppError');
const Store = require('../domain/Store');
const logger = require('../../../shared/logging/logger');

class StoreDiscoveryUseCase {
  static async discoverStores(filters = {}) {
    const query = (filters.query || '').toString().trim();
    const category = (filters.category || 'all').toString();
    const city = (filters.city || 'all').toString();
    const verifiedOnly = filters.verifiedOnly === true || filters.verifiedOnly === 'true';
    const page = Math.max(1, parseInt(filters.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(filters.limit, 10) || 20));

    const cacheKey = `stores:discovery:${category}:${city}:${verifiedOnly}:${query}:${page}:${limit}`;

    return CacheService.remember(cacheKey, 120, async () => {
      const db = SupabaseDatabase.getAdmin();
      const offset = (page - 1) * limit;

      let q = db
        .from('stores')
        .select('id, name, slug, description, category_id, logo_url, cover_url, is_verified, verification_tier, rating, rating_count, follower_count, product_count, status, visibility, created_at', { count: 'exact' })
        .eq('status', 'ACTIVE')
        .eq('visibility', 'PUBLIC')
        .is('deleted_at', null);

      if (category !== 'all') q = q.eq('category_id', category.toLowerCase());
      if (verifiedOnly) q = q.eq('is_verified', true);

      // Searching across name and description at the database level keeps
      // pagination honest — filtering a single page in memory would report
      // wrong totals and drop matches beyond it.
      if (query) {
        const escaped = query.replace(/[%,()]/g, ' ');
        q = q.or(`name.ilike.%${escaped}%,description.ilike.%${escaped}%`);
      }

      const { data, error, count } = await q
        .order('is_verified', { ascending: false })
        .order('rating', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        throw new InfrastructureError('Supabase', `store discovery failed: ${error.message}`, error);
      }

      let stores = (data || []).map(row => {
        const publicView = new Store(row).toPublicJSON();
        // Keep the raw column alongside the camelCase view: the storefront
        // cards read `categoryId`, while filters and tests address the column.
        publicView.category_id = row.category_id;
        publicView.is_verified = row.is_verified;
        return publicView;
      });

      // City lives on store_locations, one join away, so it is attached after
      // the page is fetched rather than duplicated onto every store row.
      if (stores.length > 0) {
        const { data: locations } = await db
          .from('store_locations')
          .select('store_id, city')
          .in('store_id', stores.map(st => st.id));

        const cityById = new Map((locations || []).map(l => [l.store_id, l.city]));
        stores.forEach(st => { st.city = cityById.get(st.id) || null; });
      }

      let cityFiltered = false;
      if (city !== 'all') {
        stores = stores.filter(st => (st.city || '').toLowerCase() === city.toLowerCase());
        cityFiltered = true;
      }

      return {
        stores,
        total: count || 0,
        page,
        limit,
        hasMore: offset + (data || []).length < (count || 0),
        cityFilterApplied: cityFiltered
      };
    }, 'catalog');
  }
}

module.exports = StoreDiscoveryUseCase;
