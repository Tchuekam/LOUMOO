/**
 * LOUMOO — Canonical Catalog Repository
 * ---------------------------------------------------------------------------
 * The authoritative query engine for buyer-facing product discovery.
 * Reads directly from PostgreSQL `iam.listings`, `iam.listing_media`, and
 * `iam.stores`.
 *
 * Rules:
 *   - Only returns listings that are status='PUBLISHED', visibility='PUBLIC',
 *     and deleted_at IS NULL.
 *   - Joins/hydrates store metadata and cover media URLs.
 *   - Supports full-text search, category taxonomy drilldown, and pagination.
 */

const { SupabaseDatabase } = require('../../../infrastructure/database/SupabaseClient');
const { InfrastructureError } = require('../../../shared/errors/AppError');
const MediaStorageService = require('../../../infrastructure/storage/MediaStorageService');

const CATALOG_SELECT_COLUMNS = [
  'id', 'store_id', 'seller_id', 'listing_type', 'category_id', 'title', 'slug',
  'short_description', 'description', 'brand', 'model', 'condition',
  'status', 'visibility', 'currency', 'base_price_minor', 'sale_price_minor',
  'compare_at_price_minor', 'has_variants', 'fulfillment_model',
  'view_count', 'save_count', 'order_count', 'rating', 'rating_count',
  'published_at', 'created_at', 'updated_at'
].join(', ');

class CatalogRepository {
  static get db() {
    return SupabaseDatabase.getAdmin();
  }

  /**
   * Discovers and queries published listings with flexible filters and pagination.
   *
   * @param {object} options
   * @param {string} [options.category]
   * @param {string} [options.vertical]
   * @param {string} [options.search]
   * @param {string} [options.storeId]
   * @param {string} [options.brand]
   * @param {number} [options.page=1]
   * @param {number} [options.limit=20]
   * @param {string} [options.sortBy='recent'] 'recent' | 'price_asc' | 'price_desc' | 'popular' | 'rating'
   */
  static async listPublishedListings({
    category,
    vertical,
    search,
    storeId,
    brand,
    page = 1,
    limit = 20,
    sortBy = 'recent'
  } = {}) {
    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(100, Math.max(1, Number(limit) || 20));
    const offset = (pageNum - 1) * limitNum;

    // `stores!inner(status)` + `.eq('stores.status','ACTIVE')` is an INNER JOIN:
    // a listing is only merchandisable while the boutique behind it is live.
    // Without it, products from DRAFT boutiques — stores that never completed
    // activation and whose owner is not even SELLER_READY — were on sale in the
    // public marketplace.
    let query = this.db
      .from('listings')
      .select(`${CATALOG_SELECT_COLUMNS}, stores!inner(status)`, { count: 'exact' })
      .eq('status', 'PUBLISHED')
      .eq('visibility', 'PUBLIC')
      .eq('stores.status', 'ACTIVE')
      .is('deleted_at', null);

    if (storeId) {
      query = query.eq('store_id', storeId);
    }

    if (category && category !== 'all') {
      query = query.eq('category_id', category);
    }

    if (brand) {
      query = query.ilike('brand', `%${brand}%`);
    }

    if (search && search.trim()) {
      const q = search.trim();
      // Searches across title, description, and brand
      query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%,brand.ilike.%${q}%`);
    }

    // Sort order
    switch (sortBy) {
      case 'price_asc':
        query = query.order('base_price_minor', { ascending: true, nullsFirst: false });
        break;
      case 'price_desc':
        query = query.order('base_price_minor', { ascending: false, nullsFirst: false });
        break;
      case 'popular':
        query = query
          .order('order_count', { ascending: false, nullsFirst: false })
          .order('view_count', { ascending: false, nullsFirst: false });
        break;
      case 'rating':
        query = query.order('rating', { ascending: false, nullsFirst: false });
        break;
      case 'recent':
      default:
        // `nullsFirst: false` is load-bearing, not a nicety. PostgreSQL sorts
        // NULLs FIRST for DESC by default, so rows carrying status=PUBLISHED
        // with a NULL published_at occupied the entire first page and buried
        // every genuinely published listing — a seller published an item and
        // never saw it appear in the marketplace.
        query = query
          .order('published_at', { ascending: false, nullsFirst: false })
          .order('created_at', { ascending: false, nullsFirst: false });
        break;
    }

    query = query.range(offset, offset + limitNum - 1);

    const { data: rows, error, count } = await query;
    if (error) {
      throw new InfrastructureError('Supabase', `Catalog query failed: ${error.message}`, error);
    }

    const listingList = rows || [];
    if (listingList.length === 0) {
      return {
        items: [],
        total: count || 0,
        page: pageNum,
        limit: limitNum,
        hasMore: false
      };
    }

    // Hydrate store metadata and cover images in parallel
    const listingIds = listingList.map(l => l.id);
    const storeIds = [...new Set(listingList.map(l => l.store_id).filter(Boolean))];

    const [mediaRows, storeRows] = await Promise.all([
      this._loadMediaForListings(listingIds),
      this._loadStores(storeIds)
    ]);

    const mediaByListing = mediaRows.reduce((acc, m) => {
      if (!acc[m.listing_id]) acc[m.listing_id] = [];
      acc[m.listing_id].push(m);
      return acc;
    }, {});

    const storesById = storeRows.reduce((acc, s) => {
      acc[s.id] = s;
      return acc;
    }, {});

    // Transform into canonical product contract
    const items = listingList.map(l => {
      const mediaList = mediaByListing[l.id] || [];
      const cover = mediaList.find(m => m.is_cover) || mediaList[0] || null;
      const coverUrl = cover ? (cover.url || `/media-fallback/${cover.storage_path}`) : null;
      const store = storesById[l.store_id] || null;
      return this._formatProductCard(l, coverUrl, store, mediaList);
    });

    return {
      items,
      total: count || items.length,
      page: pageNum,
      limit: limitNum,
      hasMore: offset + items.length < (count || items.length)
    };
  }

  /**
   * Resolves a single public product by ID or Slug from database.
   */
  static async findPublicProductByIdOrSlug(idOrSlug) {
    if (!idOrSlug) return null;

    // Same rule as the listing query: a product detail page must not be
    // reachable for a boutique that is not live, or the link would simply be a
    // back door into what the catalog refuses to list.
    let query = this.db
      .from('listings')
      .select(`${CATALOG_SELECT_COLUMNS}, stores!inner(status)`)
      .eq('status', 'PUBLISHED')
      .eq('visibility', 'PUBLIC')
      .eq('stores.status', 'ACTIVE')
      .is('deleted_at', null);

    if (idOrSlug.startsWith('lst_') || idOrSlug.includes('-')) {
      query = query.or(`id.eq.${idOrSlug},slug.eq.${idOrSlug}`);
    } else {
      query = query.eq('id', idOrSlug);
    }

    const { data: row, error } = await query.maybeSingle();
    if (error) {
      throw new InfrastructureError('Supabase', `Product lookup failed: ${error.message}`, error);
    }

    if (!row) return null;

    const [mediaRows, storeRows, attributes] = await Promise.all([
      this._loadMediaForListings([row.id]),
      this._loadStores([row.store_id]),
      this._loadAttributes(row.id)
    ]);

    const store = storeRows[0] || null;
    const media = mediaRows.map(m => ({
      id: m.id,
      url: m.url || `/media-fallback/${m.storage_path}`,
      isCover: m.is_cover,
      displayOrder: m.display_order,
      width: m.width,
      height: m.height,
      altText: m.alt_text
    }));

    const cover = media.find(m => m.isCover) || media[0] || null;

    return {
      ...this._formatProductCard(row, cover ? cover.url : null, store, media),
      description: row.description || '',
      shortDescription: row.short_description || '',
      attributes,
      media,
      coverImage: cover ? cover.url : null,
      images: media.map(m => m.url),
      condition: row.condition || 'new',
      fulfillmentModel: row.fulfillment_model || 'DELIVERY_OR_PICKUP',
      tags: row.tags || [],
      specs: attributes,
      store: store ? {
        id: store.id,
        name: store.name,
        slug: store.slug,
        logoUrl: store.logo_url,
        isVerified: Boolean(store.is_verified),
        verificationTier: store.verification_tier,
        rating: Number(store.rating) || 5.0,
        ratingCount: store.rating_count || 0,
        city: (store.metadata && store.metadata.city) || 'Douala'
      } : null
    };
  }

  static async _loadMediaForListings(listingIds) {
    if (!listingIds.length) return [];
    const { data, error } = await this.db
      .from('listing_media')
      .select('id, listing_id, url, storage_path, is_cover, display_order, width, height, alt_text')
      .in('listing_id', listingIds)
      .order('display_order', { ascending: true });

    if (error) return [];
    return data || [];
  }

  static async _loadStores(storeIds) {
    if (!storeIds.length) return [];
    const { data, error } = await this.db
      .from('stores')
      .select('id, name, slug, logo_url, is_verified, verification_tier, rating, rating_count, metadata')
      .in('id', storeIds);

    if (error) return [];
    return data || [];
  }

  static async _loadAttributes(listingId) {
    const { data, error } = await this.db
      .from('listing_attribute_values')
      .select('attribute_slug, value_text, value_number, value_boolean, value_json')
      .eq('listing_id', listingId);

    if (error || !data) return {};
    return data.reduce((acc, r) => {
      acc[r.attribute_slug] = r.value_json ?? r.value_boolean ?? r.value_number ?? r.value_text;
      return acc;
    }, {});
  }

  static _formatProductCard(listing, coverUrl, store, mediaList = []) {
    const priceMinor = Number(listing.base_price_minor) || 0;
    const salePriceMinor = listing.sale_price_minor ? Number(listing.sale_price_minor) : null;
    const formattedPrice = formatXaf(priceMinor);
    const storeName = store ? store.name : 'Verified Merchant';

    return {
      id: listing.id,
      slug: listing.slug || listing.id,
      title: listing.title,
      category: listing.category_id,
      brand: listing.brand || 'Bespoke',
      model: listing.model || '',
      price: formattedPrice,
      priceNumeric: priceMinor,
      salePrice: salePriceMinor ? formatXaf(salePriceMinor) : null,
      salePriceNumeric: salePriceMinor,
      currency: listing.currency || 'XAF',
      image: coverUrl,
      imageUrl: coverUrl,
      images: mediaList.map(m => m.url).filter(Boolean),
      merchant: storeName,
      storeName: storeName,
      storeId: listing.store_id,
      merchantCity: (store && store.metadata && store.metadata.city) || 'Douala',
      verified: store ? Boolean(store.is_verified) : true,
      rating: Number(listing.rating) || 5.0,
      reviewsCount: listing.rating_count || 0,
      soldCount: listing.order_count || 0,
      status: listing.status,
      visibility: listing.visibility,
      publishedAt: listing.published_at,
      createdAt: listing.created_at
    };
  }
}

function formatXaf(amount) {
  const s = String(Math.round(amount)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${s} FCFA`;
}

module.exports = CatalogRepository;
