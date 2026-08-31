/**
 * Store Analytics Use Case (05.09 & Section 17 Store Analytics)
 * Private, seller-scoped performance analytics with time window filtering.
 *
 * REAL data source — there is NO fabricated metric anywhere. Every value is
 * computed from the live database:
 *   - orders:  iam.orders where seller_id = store.owner_id (order items are a
 *              JSONB array [{productId,title,quantity,priceXaf}])
 *   - views:   SUM(iam.listings.view_count) for the store's published listings
 *   - listings: COUNT published listings in the window
 *   - followers: COUNT iam.followed_stores rows for the store
 * A store with no orders reports zero revenue — the truth, not a marketing
 * number. `trackedMetricsAvailable: false` tells clients that visitor-level
 * metrics (unique visitors, conversion rate, traffic breakdown) require a
 * tracking pipeline and are intentionally NOT included.
 */

const { SupabaseClient, handleDatabaseFailure } = require('../../../infrastructure/database/SupabaseClient');
const CacheService = require('../../../infrastructure/cache/CacheService');
const logger = require('../../../shared/logging/logger');

const VALID_PERIODS = ['today', '7d', '30d', '90d'];

class StoreAnalyticsUseCase {
  static async getAnalytics(store, period = '30d') {
    const activePeriod = VALID_PERIODS.includes(period) ? period : '30d';

    const cacheKey = `seller:analytics:${store.id}:${activePeriod}`;
    const cached = await CacheService.get(cacheKey);
    if (cached) return cached;

    const analytics = await StoreAnalyticsUseCase._aggregate(store, activePeriod);

    await CacheService.set(cacheKey, analytics, 180);
    return analytics;
  }

  static async _aggregate(store, activePeriod) {
    const since = StoreAnalyticsUseCase._since(activePeriod);
    const ownerId = store.owner_id || store.ownerId || store.id;

    let orders = [];
    let listings = [];
    let followers = 0;
    let dbError = null;

    try {
      const supabase = SupabaseClient.getAdmin();

      const ordersRes = await supabase
        .from('orders')
        .select('total_amount_xaf, items, created_at')
        .eq('seller_id', ownerId)
        .gte('created_at', since);
      if (ordersRes.error) dbError = ordersRes.error;
      else orders = ordersRes.data || [];

      const listingsRes = await supabase
        .from('listings')
        .select('id, title, status, view_count, published_at')
        .eq('store_id', store.id);
      if (!dbError && listingsRes.error) dbError = listingsRes.error;
      else if (!dbError) listings = listingsRes.data || [];

      const followsRes = await supabase
        .from('followed_stores')
        .select('id', { count: 'exact' })
        .eq('store_id', store.id);
      if (!dbError && followsRes.error) dbError = followsRes.error;
      else if (!dbError && followsRes.count != null) followers = followsRes.count;
    } catch (err) {
      dbError = err;
    }

    if (dbError) {
      // Loud, never silent: a DB outage must not look like a real zero report.
      handleDatabaseFailure(dbError, 'StoreAnalyticsUseCase');
    }

    const published = listings.filter(l => l.status === 'PUBLISHED');
    const totalRevenueXaf = orders.reduce((s, o) => s + (Number(o.total_amount_xaf) || 0), 0);
    const totalViews = published.reduce((s, l) => s + (Number(l.view_count) || 0), 0);
    const topSellingProducts = StoreAnalyticsUseCase._topFromOrders(orders);

    return {
      storeId: store.id,
      storeName: store.name,
      period: activePeriod,
      dataSource: 'live',
      summary: {
        totalRevenueXaf,
        totalRevenueFormatted: totalRevenueXaf.toLocaleString('fr-FR') + ' XAF',
        totalOrders: orders.length,
        totalStoreViews: totalViews,
        totalPublishedListings: published.length,
        followersCount: followers
      },
      topSellingProducts,
      window: { from: since, to: new Date().toISOString() },
      trackedMetricsAvailable: false,
      generatedAt: new Date().toISOString()
    };
  }

  static _topFromOrders(orders) {
    const byProduct = new Map();
    for (const o of orders) {
      let items = [];
      try { items = Array.isArray(o.items) ? o.items : JSON.parse(o.items || '[]'); } catch (_) { items = []; }
      for (const it of items) {
        const key = it.productId || it.product_id || 'unknown-product';
        const entry = byProduct.get(key) || {
          id: key,
          title: it.title || 'Unnamed product',
          salesCount: 0,
          revenueXaf: 0
        };
        entry.salesCount += Number(it.quantity) || 1;
        entry.revenueXaf += Number(it.priceXaf || it.price_xaf || 0) * (Number(it.quantity) || 1);
        byProduct.set(key, entry);
      }
    }
    return [...byProduct.values()]
      .sort((a, b) => b.revenueXaf - a.revenueXaf)
      .slice(0, 10);
  }

  static _since(period) {
    const days = { today: 1, '7d': 7, '30d': 30, '90d': 90 }[period] || 30;
    return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  }
}

module.exports = StoreAnalyticsUseCase;
