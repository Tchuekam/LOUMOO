/**
 * Use Case: Purchase History & Orders (04.06)
 * Queries authentic customer orders, projecting buyer-safe order representations
 * (items, delivery status, escrow state, payments) without leaking merchant margins.
 */

const { z } = require('zod');
const { SupabaseClient, handleDatabaseFailure } = require('../../../infrastructure/database/SupabaseClient.js');
const CacheService = require('../../../infrastructure/cache/CacheService');
const { ValidationError, NotFoundError, AuthorizationError } = require('../../../shared/errors/AppError');
const logger = require('../../../shared/logging/logger');

class PurchaseHistoryUseCase {
  constructor() {
    // No in-memory order store. Orders live in iam.orders or they do not exist.
  }

  async getPurchaseHistory(userId, { status = 'all', limit = 20, offset = 0 } = {}) {
    if (!userId) throw new ValidationError('User ID is required');

    const cacheKey = `purchases:${userId}:${status}:${limit}:${offset}`;
    const cached = await CacheService.get(cacheKey);
    if (cached) return cached;

    let orders = [];
    let total = 0;

    try {
      const supabase = SupabaseClient.getAdmin();
      let query = supabase
        .from('orders')
        .select('*', { count: 'exact' })
        .eq('buyer_id', userId);

      if (status && status !== 'all') {
        query = query.eq('fulfillment_status', status);
      }

      const { data, count, error } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) { handleDatabaseFailure(error, 'PurchaseHistoryUseCase'); }

      /*
       * "This buyer has no orders" is an ANSWER, not a failure.
       *
       * An empty result used to be re-thrown as `new Error('No orders found')`
       * so the catch below would serve _ensureDemoOrders() — two fabricated
       * purchases including a 748,000 XAF iPhone with a tracking number and an
       * escrow state. Every new account was shown a delivery in progress for a
       * transaction that never happened, and the account dashboard counted it
       * as a real "active delivery".
       */
      orders = (data || []).map(this._mapRow);
      total = count || orders.length;
    } catch (err) {
      // Reached only when the database itself is unreachable. In production
      // handleDatabaseFailure rethrows; there is no invented order history.
      handleDatabaseFailure(err, 'Supabase query');
      logger.error(`[PurchaseHistory] Could not read orders for ${userId}: ${err.message}`);
      orders = [];
      total = 0;
    }

    const result = { orders, total, limit, offset };
    await CacheService.set(cacheKey, result, 60);
    return result;
  }

  /**
   * Place a new order from the buyer's bag.
   *
   * Payment integration is intentionally deferred, so orders are created with
   * payment_status 'pending' (pay on delivery / pay on pickup) and
   * fulfillment_status 'processing'. seller_id is left null on purpose: the cart
   * carries a store *name*, not a profiles.id, and seller_id is a FK to
   * iam.profiles — the seller name is preserved inside the items snapshot.
   */
  async createOrder(userId, payload = {}) {
    if (!userId) throw new ValidationError('User ID is required');

    const items = Array.isArray(payload.items) ? payload.items : [];
    if (!items.length) throw new ValidationError('Cannot place an order with an empty bag');

    const totalXaf = Number(payload.totalAmountXaf != null ? payload.totalAmountXaf : payload.totalXaf) || 0;
    if (totalXaf < 0) throw new ValidationError('Order total must be a positive amount');

    const orderNumber = payload.orderNumber
      ? String(payload.orderNumber).slice(0, 64)
      : ('LM-' + Date.now().toString(36).toUpperCase());
    const shippingAddress = (payload.shippingAddress && typeof payload.shippingAddress === 'object')
      ? payload.shippingAddress : {};

    let created = null;
    try {
      const supabase = SupabaseClient.getAdmin();
      const { data, error } = await supabase
        .from('orders')
        .insert({
          buyer_id: userId,
          seller_id: null,
          order_number: orderNumber,
          total_amount_xaf: totalXaf,
          items: items,
          shipping_address: shippingAddress,
          payment_status: 'pending',
          fulfillment_status: 'processing'
        })
        .select()
        .single();

      if (error) { handleDatabaseFailure(error, 'PurchaseHistoryUseCase.createOrder'); }
      if (!error && data) created = this._mapRow(data);
    } catch (err) {
      handleDatabaseFailure(err, 'Supabase createOrder');
      throw err;
    }

    if (!created) throw new Error('Order could not be created');

    // The buyer's purchase-history cache is now stale.
    try {
      if (CacheService.deletePattern) await CacheService.deletePattern(`purchases:${userId}:*`);
      else if (CacheService.del) await CacheService.del(`purchases:${userId}:all:20:0`);
    } catch (e) { /* cache invalidation is best-effort */ }

    return created;
  }

  /**
   * Get details for a single order (Strict buyer ownership verification)
   */
  async getOrderDetails(userId, orderId) {
    if (!userId || !orderId) throw new ValidationError('User ID and Order ID are required');

    let order = null;
    try {
      const supabase = SupabaseClient.getAdmin();
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (error) { handleDatabaseFailure(error, 'PurchaseHistoryUseCase'); }
      if (!error && data) {
        if (data.buyer_id !== userId) {
          throw new AuthorizationError('You are not authorized to view this order');
        }
        order = this._mapRow(data);
      }
    } catch (err) {
      if (err instanceof AuthorizationError) throw err;
      handleDatabaseFailure(err, 'Supabase getOrderDetails');
    }

    // An order that does not exist is a 404, never a demonstration order
    // conjured under the requested id.
    if (!order) throw new NotFoundError('Order not found');

    return order;
  }

  _mapRow(row) {
    return {
      id: row.id,
      buyerId: row.buyer_id,
      sellerId: row.seller_id,
      orderNumber: row.order_number,
      totalAmountXaf: Number(row.total_amount_xaf),
      items: row.items || [],
      shippingAddress: row.shipping_address || {},
      paymentStatus: row.payment_status,
      fulfillmentStatus: row.fulfillment_status,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}

module.exports = new PurchaseHistoryUseCase();
