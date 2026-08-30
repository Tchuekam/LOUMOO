/**
 * Store Analytics Entity — Daily Aggregate Metrics (05.09)
 */

class StoreAnalytics {
  constructor(data = {}) {
    this.id = data.id || null;
    this.storeId = data.store_id || data.storeId || null;
    this.date = data.date || new Date().toISOString().split('T')[0];
    this.viewsCount = Number(data.views_count || data.viewsCount || 0);
    this.uniqueVisitors = Number(data.unique_visitors || data.uniqueVisitors || 0);
    this.productViewsCount = Number(data.product_views_count || data.productViewsCount || 0);
    this.addToCartCount = Number(data.add_to_cart_count || data.addToCartCount || 0);
    this.ordersCount = Number(data.orders_count || data.ordersCount || 0);
    this.revenueXaf = Number(data.revenue_xaf || data.revenueXaf || 0);
    this.conversionRate = Number(data.conversion_rate || data.conversionRate || 0);
    this.createdAt = data.created_at || data.createdAt || new Date().toISOString();
  }

  toJSON() {
    return {
      id: this.id,
      storeId: this.storeId,
      date: this.date,
      viewsCount: this.viewsCount,
      uniqueVisitors: this.uniqueVisitors,
      productViewsCount: this.productViewsCount,
      addToCartCount: this.addToCartCount,
      ordersCount: this.ordersCount,
      revenueXaf: this.revenueXaf,
      conversionRate: this.conversionRate
    };
  }
}

module.exports = StoreAnalytics;
