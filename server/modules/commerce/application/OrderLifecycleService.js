/**
 * LOUMOO Commerce Core — Order Lifecycle Service
 * ---------------------------------------------------------------------------
 * Governs order status transitions and buyer cancellation workflows.
 * Enforces OrderStateMachine rules, concurrency checks, and anti-IDOR security.
 */

const { OrderRepository } = require('../infrastructure/OrderRepository');
const { OrderStateMachine } = require('../domain/OrderStateMachine');
const { FULFILLMENT_STATUS, PAYMENT_STATUS, DELIVERY_METHOD } = require('../domain/Order');
const CacheService = require('../../../infrastructure/cache/CacheService');
const { NotFoundError, ValidationError, AuthorizationError, ConflictError } = require('../../../shared/errors/AppError');
const logger = require('../../../shared/logging/logger');

let UserActivityUseCase = null;
let NotificationService = null;
try { UserActivityUseCase = require('../../identity/application/UserActivityUseCase'); } catch (e) {}
try { NotificationService = require('../../identity/application/NotificationService'); } catch (e) {}

/**
 * An order that is cancelled must not leave a rider heading to the shop. The
 * delivery module depends on commerce, so this is a lazy, best-effort call in
 * the other direction: it can never fail or slow the cancellation itself.
 */
async function cancelOpenDelivery(orderId, reason, actorId) {
  try {
    const { getSharedDeliveryService } = require('../../delivery/application/DeliveryService');
    await getSharedDeliveryService().cancelForOrder(orderId, { reason: reason || 'Order cancelled', actorId });
  } catch (e) {
    logger.warn(`[OrderLifecycle] Could not cancel the delivery for order ${orderId}: ${e.message}`);
  }
}

/**
 * A cancelled order owes the buyer nothing: move the buyer-protection attestation
 * to `refundable` (a refund is due if anything was paid — with pay-on-delivery,
 * nothing was). Best-effort and guarded — never fails the cancellation, and never
 * walks back a settled (released/refunded) or already-refundable order. NO money
 * moves. Returns the updated order, or the one passed in when nothing changed.
 */
async function markOrderRefundable(repository, order, actorId, reason) {
  const current = order.paymentStatus;
  if (current === PAYMENT_STATUS.RELEASED || current === PAYMENT_STATUS.REFUNDED || current === PAYMENT_STATUS.REFUNDABLE) {
    return order;
  }
  try {
    return await repository.updatePaymentStatusAtomic(order.id, current, PAYMENT_STATUS.REFUNDABLE, {
      note: reason || 'Order cancelled',
      updatedBy: actorId || 'system'
    });
  } catch (e) {
    logger.warn(`[OrderLifecycle] Could not mark order ${order.id} refundable: ${e.message}`);
    return order;
  }
}

class OrderLifecycleService {
  constructor(repository = null) {
    this.repository = repository || new OrderRepository();
  }

  /**
   * The order as the database has it NOW. findOrderById answers from a per-instance
   * cache that is never refreshed, and the delivery module writes through a different
   * repository instance, so a cancel or a status change decided on the cached copy
   * could act on a status the order no longer has.
   */
  _freshOrder(idOrNumber) {
    return typeof this.repository.findOrderByIdFresh === 'function'
      ? this.repository.findOrderByIdFresh(idOrNumber)
      : this.repository.findOrderById(idOrNumber);
  }

  /**
   * Cancels an order on behalf of the authenticated buyer (or merchant/admin).
   *
   * @param {string} orderId - ID or Order Number
   * @param {string} callerId - Authenticated user ID
   * @param {string} [reason='Buyer requested cancellation']
   * @param {object} [options]
   * @param {string} [options.userRole='customer']
   * @returns {Promise<object>} Cancelled order
   */
  async cancelOrder(orderId, callerId, reason = 'Buyer requested cancellation', { userRole = 'customer' } = {}) {
    if (!orderId) throw new ValidationError('Order ID is required.');
    if (!callerId) throw new AuthorizationError('Authentication required.');

    const order = await this._freshOrder(orderId);
    if (!order) {
      throw new NotFoundError('Order not found');
    }

    // Ownership check (404 Anti-Enumeration for non-owners)
    const isBuyer = order.buyerId === callerId;
    const isSeller = order.sellerId === callerId;
    const isAdmin = userRole === 'admin' || userRole === 'super_admin';

    if (!isBuyer && !isSeller && !isAdmin) {
      throw new NotFoundError('Order not found');
    }

    // Assert that the order can be cancelled in its current state
    OrderStateMachine.assertBuyerCanCancel(order.fulfillmentStatus, order.orderNumber);

    // Concurrency-safe atomic transition: only succeeds if still in PROCESSING status
    const cancelledOrder = await this.repository.updateFulfillmentStatusAtomic(
      order.id,
      FULFILLMENT_STATUS.PROCESSING,
      FULFILLMENT_STATUS.CANCELLED,
      {
        note: reason || 'Order cancelled',
        updatedBy: callerId
      }
    );

    // The buyer owes nothing on a cancelled order: the escrow attestation becomes
    // refundable (no money moves — pay on delivery).
    const settledOrder = await markOrderRefundable(this.repository, cancelledOrder, callerId, reason);

    await cancelOpenDelivery(order.id, reason, callerId);

    // Invalidate Buyer's Cache
    try {
      if (CacheService.delPattern) {
        await CacheService.delPattern(`purchases:${order.buyerId}:*`);
      } else if (CacheService.del) {
        await CacheService.del(`purchases:${order.buyerId}:all:20:0`);
      }
    } catch (e) {}

    // Activity log & notification
    if (UserActivityUseCase && typeof UserActivityUseCase.recordActivity === 'function') {
      UserActivityUseCase.recordActivity(order.buyerId, {
        actionType: 'order_cancelled',
        title: 'Order Cancelled',
        description: `Order ${order.orderNumber} was cancelled.`,
        resourceType: 'order',
        resourceId: order.id
      }).catch(e => logger.warn(`[OrderLifecycle] Activity log error: ${e.message}`));
    }

    if (NotificationService && typeof NotificationService.create === 'function') {
      NotificationService.create(order.buyerId, {
        type: 'order',
        tone: 'critical',
        title: `Order ${order.orderNumber} cancelled`,
        body: `Your order was cancelled. (${reason || 'Buyer requested'})`,
        metadata: { orderId: order.id, orderNumber: order.orderNumber }
      }).catch(e => logger.warn(`[OrderLifecycle] Notification error: ${e.message}`));
    }

    return settledOrder.toJSON();
  }

  /**
   * Transitions fulfillment status (merchant or admin operation).
   *
   * @param {string} orderId
   * @param {string} nextStatus
   * @param {string} callerId
   * @param {object} [options]
   * @param {string} [options.userRole='seller']
   * @param {string} [options.note='']
   * @returns {Promise<object>}
   */
  async updateFulfillmentStatus(orderId, nextStatus, callerId, { userRole = 'seller', note = '' } = {}) {
    if (!orderId) throw new ValidationError('Order ID is required.');
    if (!nextStatus) throw new ValidationError('Target status is required.');
    if (!callerId) throw new AuthorizationError('Authentication required.');

    const order = await this._freshOrder(orderId);
    if (!order) {
      throw new NotFoundError('Order not found');
    }

    const isSeller = order.sellerId === callerId;
    const isAdmin = userRole === 'admin' || userRole === 'super_admin';

    if (!isSeller && !isAdmin) {
      throw new NotFoundError('Order not found');
    }

    // A home delivery is moved by its DELIVERY, never by a status edit: it becomes
    // in_transit when the rider reports the parcel picked up and delivered only when
    // the buyer's handover code is confirmed, and those same events carry the
    // buyer-protection attestation (escrow_held, released). Letting the seller (or an
    // admin) write in_transit/delivered here marked an order delivered with no
    // handover, left payment_status 'pending' forever, and made the order impossible
    // to track (a delivery can only be created while the order is processing). An
    // administrator repairs a stuck delivery through the delivery reconcile route.
    // Cancelling is still allowed (from processing, by the state machine).
    const isHomeDelivery = (order.deliveryMethod || DELIVERY_METHOD.HOME_DELIVERY) !== DELIVERY_METHOD.STORE_PICKUP;
    if (isHomeDelivery && (nextStatus === FULFILLMENT_STATUS.IN_TRANSIT || nextStatus === FULFILLMENT_STATUS.DELIVERED)) {
      throw new ConflictError(
        'A home delivery is moved by its rider: it is in transit once the rider picks it up and delivered once ' +
        'the buyer\'s handover code is confirmed. Arrange a delivery for this order instead of changing its status.'
      );
    }

    // Enforce state transition rules
    OrderStateMachine.assertTransition(order.fulfillmentStatus, nextStatus, order.orderNumber);

    const updated = await this.repository.updateFulfillmentStatusAtomic(
      order.id,
      order.fulfillmentStatus,
      nextStatus,
      { note, updatedBy: callerId }
    );

    let result = updated;
    if (nextStatus === FULFILLMENT_STATUS.CANCELLED) {
      // Cancelling the order makes its escrow attestation refundable (no money
      // moves — pay on delivery), then releases any open delivery.
      result = await markOrderRefundable(this.repository, updated, callerId, note);
      await cancelOpenDelivery(order.id, note, callerId);
    }

    // Invalidate Buyer's Cache
    try {
      if (CacheService.delPattern) {
        await CacheService.delPattern(`purchases:${order.buyerId}:*`);
      }
    } catch (e) {}

    return result.toJSON();
  }
}

module.exports = { OrderLifecycleService };
