/**
 * LOUMOO Commerce Core — Order Query Service
 * ---------------------------------------------------------------------------
 * Read-side service enforcing anti-IDOR authorization and 404 anti-enumeration.
 * Buyers can only discover and inspect orders they own; merchants inspect store orders.
 */

const { OrderRepository } = require('../infrastructure/OrderRepository');
const CacheService = require('../../../infrastructure/cache/CacheService');
const { NotFoundError, ValidationError, AuthorizationError } = require('../../../shared/errors/AppError');

class OrderQueryService {
  constructor(repository = null) {
    this.repository = repository || new OrderRepository();
  }

  /**
   * Retrieves an order by ID or orderNumber with strict ownership verification.
   * Employs 404 Anti-Enumeration: returns NotFoundError if the caller does not own it.
   *
   * @param {string} orderId - ID or Order Number
   * @param {string} callerId - Authenticated caller profile ID
   * @param {object} [options]
   * @param {string} [options.userRole='customer']
   * @returns {Promise<object>}
   */
  async getOrderById(orderId, callerId, { userRole = 'customer' } = {}) {
    if (!orderId) throw new ValidationError('Order ID is required.');
    if (!callerId) throw new AuthorizationError('Authentication required.');

    const order = await this.repository.findOrderById(orderId);
    if (!order) {
      throw new NotFoundError('Order not found');
    }

    // Strict ownership boundary: Caller must be the buyer, seller, or system admin
    const isBuyer = order.buyerId === callerId;
    const isSeller = order.sellerId === callerId;
    const isAdmin = userRole === 'admin' || userRole === 'superadmin';

    if (!isBuyer && !isSeller && !isAdmin) {
      // 404 Anti-Enumeration Defense
      throw new NotFoundError('Order not found');
    }

    return order.toJSON();
  }

  /**
   * Paged query of customer purchase history with caching.
   *
   * @param {string} userId - Buyer ID
   * @param {object} [options]
   * @param {string} [options.status='all']
   * @param {number} [options.limit=20]
   * @param {number} [options.offset=0]
   * @returns {Promise<{orders: Array, total: number, limit: number, offset: number}>}
   */
  async getUserOrders(userId, { status = 'all', limit = 20, offset = 0 } = {}) {
    if (!userId) throw new ValidationError('User ID is required.');

    const safeLimit = Math.min(100, Math.max(1, Number(limit) || 20));
    const safeOffset = Math.max(0, Number(offset) || 0);

    const cacheKey = `purchases:${userId}:${status}:${safeLimit}:${safeOffset}`;
    const cached = await CacheService.get(cacheKey);
    if (cached) return cached;

    const result = await this.repository.findOrdersByBuyer(userId, {
      status,
      limit: safeLimit,
      offset: safeOffset
    });

    const formatted = {
      orders: result.orders.map(o => o.toJSON()),
      total: result.total,
      limit: safeLimit,
      offset: safeOffset
    };

    await CacheService.set(cacheKey, formatted, 60);
    return formatted;
  }
}

module.exports = { OrderQueryService };
