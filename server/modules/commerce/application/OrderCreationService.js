/**
 * LOUMOO Commerce Core — Order Creation Service
 * ---------------------------------------------------------------------------
 * Primary coordinator for order placement.
 * Enforces strict input validation, listing/variant integrity, derived seller identity,
 * server-authoritative pricing, scoped idempotency, and concurrency controls.
 */

const crypto = require('crypto');
const { Order, OrderItem, FULFILLMENT_STATUS, PAYMENT_STATUS, DELIVERY_METHOD } = require('../domain/Order');
const { PricingEngine } = require('../domain/PricingEngine');
const { CreateOrderInputSchema } = require('../presentation/validators/orderSchemas');
const { OrderRepository } = require('../infrastructure/OrderRepository');
const IdempotencyService = require('../../../infrastructure/cache/IdempotencyService');
const CacheService = require('../../../infrastructure/cache/CacheService');
const {
  ValidationError,
  NotFoundError,
  ConflictError,
  AuthorizationError,
  IdempotencyError
} = require('../../../shared/errors/AppError');
const logger = require('../../../shared/logging/logger');

// Optional cross-cutting services (loaded lazily to avoid circular dependencies)
let UserActivityUseCase = null;
let NotificationService = null;
try { UserActivityUseCase = require('../../identity/application/UserActivityUseCase'); } catch (e) {}
try { NotificationService = require('../../identity/application/NotificationService'); } catch (e) {}

class OrderCreationService {
  constructor(repository = null) {
    this.repository = repository || new OrderRepository();
    // Concurrency mutex for in-flight creations per user
    this._activeLocks = new Set();
  }

  /**
   * Authoritatively places a new order.
   *
   * @param {string} userId - Authenticated user ID (strictly from auth context)
   * @param {object} payload - Untrusted request body
   * @param {object} [options]
   * @param {string|null} [options.idempotencyKey]
   * @returns {Promise<Order>}
   */
  async createOrder(userId, payload = {}, { idempotencyKey = null } = {}) {
    if (!userId) throw new AuthorizationError('Authentication required to place an order.');

    // 1. Enforce strict input schema validation
    const parsed = CreateOrderInputSchema.safeParse(payload);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      if (issue.code === 'unrecognized_keys') {
        const keysStr = (issue.keys || []).join(', ');
        throw new ValidationError(
          `Unexpected field(s) in order request: "${keysStr}". Privileged fields (sellerId, buyerId, status) are prohibited.`,
          parsed.error.issues
        );
      }
      const fieldPath = issue.path.join('.');
      throw new ValidationError(
        issue.message || `Invalid order request payload at "${fieldPath}"`,
        parsed.error.issues
      );
    }
    const data = parsed.data;

    // 2. Scoped Idempotency Check
    const effectiveIdempotencyKey = idempotencyKey || data.idempotencyKey;
    const scopedKey = effectiveIdempotencyKey ? `order:create:${userId}:${effectiveIdempotencyKey}` : null;
    let lockAcquired = false;

    if (scopedKey) {
      const authScope = crypto.createHash('sha256').update(userId).digest('hex').slice(0, 16);
      const idempotencyCheck = await IdempotencyService.checkOrLock(scopedKey, payload, 86400, authScope);

      if (idempotencyCheck.state === 'COMPLETED') {
        const cachedResponse = idempotencyCheck.responseBody;
        if (cachedResponse && cachedResponse.order) {
          logger.info(`[OrderCreationService] Idempotency hit: returning existing order for key ${effectiveIdempotencyKey}`);
          return cachedResponse.order;
        }
      }
      lockAcquired = true;
    }

    // Concurrency guard per user to prevent rapid double-clicks without idempotency key
    const userLockKey = `lock:createOrder:${userId}`;
    if (this._activeLocks.has(userLockKey)) {
      if (scopedKey) await IdempotencyService.releaseLock(scopedKey).catch(() => {});
      throw new ConflictError('Another order creation is currently processing for your account. Please wait.');
    }
    this._activeLocks.add(userLockKey);

    try {
      // 3. Resolve and authoritatively validate each listing and variant
      const evaluatedItems = [];

      for (const itemInput of data.items) {
        const listingId = itemInput.listingId || itemInput.productId || itemInput.id;
        const listing = await this.repository.findListingById(listingId);

        if (!listing) {
          throw new NotFoundError('Listing', listingId);
        }

        // Validate listing status and merchandisability
        if (listing.status !== 'PUBLISHED') {
          throw new ValidationError(
            `Listing "${listing.title}" cannot be purchased because it is not published (current status: ${listing.status}).`
          );
        }
        if (listing.visibility && listing.visibility !== 'PUBLIC') {
          throw new ValidationError(`Listing "${listing.title}" is not available for public checkout.`);
        }
        if (listing.deletedAt) {
          throw new NotFoundError('Listing', listingId);
        }
        if (listing.storeStatus && listing.storeStatus !== 'ACTIVE') {
          throw new ValidationError(`The seller boutique for "${listing.title}" is currently not accepting orders.`);
        }

        // Resolve variant if specified
        let unitPriceXaf = listing.salePriceMinor != null ? listing.salePriceMinor : listing.basePriceMinor;
        let variantTitle = null;
        let sku = listing.sku || null;

        if (itemInput.variantId) {
          const variant = await this.repository.findVariantById(listing.id, itemInput.variantId);
          if (!variant) {
            throw new ValidationError(
              `Variant "${itemInput.variantId}" does not exist for listing "${listing.title}".`
            );
          }
          if (!variant.isActive) {
            throw new ValidationError(
              `Variant "${variant.title || itemInput.variantId}" is currently not available for purchase.`
            );
          }
          unitPriceXaf = variant.priceMinor;
          variantTitle = variant.title;
          sku = variant.sku || sku;
        }

        // Verify inventory availability
        const invCheck = await this.repository.checkInventory(listing.id, itemInput.variantId, itemInput.quantity);
        if (!invCheck.isAvailable) {
          throw new ConflictError(
            `Insufficient stock for "${listing.title}". Only ${invCheck.availableQuantity} unit(s) available, but requested ${itemInput.quantity}.`
          );
        }

        // Assert client price match (if client sent a price, reject any tampering)
        PricingEngine.assertItemPriceMatch(itemInput, unitPriceXaf, listing.title);

        // Derive authoritative seller ID from listing/store — never from client
        const sellerId = listing.sellerId;
        if (!sellerId) {
          throw new ValidationError(`Listing "${listing.title}" is not associated with a valid seller.`);
        }

        evaluatedItems.push({
          listingId: listing.id,
          variantId: itemInput.variantId || null,
          title: variantTitle ? `${listing.title} (${variantTitle})` : listing.title,
          sku,
          unitPriceXaf,
          quantity: itemInput.quantity,
          sellerId,
          storeId: listing.storeId,
          storeName: listing.storeName,
          imageUrl: null,
          listing
        });
      }

      // 4. Server-Authoritative Pricing Calculation
      const clientSuppliedTotal = data.totalAmountXaf ?? data.totalXaf ?? null;
      const pricing = PricingEngine.calculateOrderPricing(evaluatedItems, {
        deliveryMethod: data.deliveryMethod,
        clientSuppliedTotal
      });

      // 5. Construct Order Aggregate
      const orderItems = pricing.lineItems.map(it => new OrderItem({
        listingId: it.listingId,
        variantId: it.variantId,
        title: it.title,
        sku: it.sku,
        unitPriceXaf: it.unitPriceXaf,
        quantity: it.quantity,
        sellerId: it.sellerId,
        storeId: it.storeId,
        storeName: it.storeName,
        imageUrl: it.imageUrl
      }));

      const primarySellerId = evaluatedItems[0].sellerId;
      const orderNumber = Order.generateOrderNumber();

      const order = new Order({
        orderNumber,
        buyerId: userId,
        sellerId: primarySellerId,
        items: orderItems,
        subtotalXaf: pricing.subtotalXaf,
        shippingFeeXaf: pricing.shippingFeeXaf,
        totalAmountXaf: pricing.totalAmountXaf,
        currency: 'XAF',
        shippingAddress: data.shippingAddress || {},
        deliveryMethod: data.deliveryMethod,
        paymentStatus: PAYMENT_STATUS.PENDING,
        fulfillmentStatus: FULFILLMENT_STATUS.PROCESSING,
        idempotencyKey: effectiveIdempotencyKey,
        timeline: [
          {
            status: FULFILLMENT_STATUS.PROCESSING,
            timestamp: new Date().toISOString(),
            note: 'Order placed (Pay on Delivery / Pay on Pickup).'
          }
        ]
      });

      // 6. Atomically persist to database
      const savedOrder = await this.repository.saveOrder(order);

      // 7. Save Idempotency Cache Result
      if (scopedKey) {
        const responseBody = {
          success: true,
          order: savedOrder.toJSON()
        };
        const authScope = crypto.createHash('sha256').update(userId).digest('hex').slice(0, 16);
        const payloadHash = crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex');
        await IdempotencyService.saveResponse(scopedKey, 201, responseBody, 86400, payloadHash, authScope).catch(err => {
          logger.warn(`[OrderCreationService] Failed to cache idempotency response: ${err.message}`);
        });
      }

      // 8. Invalidate Buyer's Purchase History Cache
      try {
        if (CacheService.deletePattern) {
          await CacheService.deletePattern(`purchases:${userId}:*`);
        } else if (CacheService.del) {
          await CacheService.del(`purchases:${userId}:all:20:0`);
        }
      } catch (cacheErr) {
        logger.warn(`[OrderCreationService] Cache invalidation warning: ${cacheErr.message}`);
      }

      // 9. Asynchronous Activity & Notification Dispatch
      if (UserActivityUseCase && typeof UserActivityUseCase.recordActivity === 'function') {
        UserActivityUseCase.recordActivity(userId, {
          actionType: 'order_placed',
          title: 'Order Placed',
          description: `Placed order ${savedOrder.orderNumber} (XAF ${savedOrder.totalAmountXaf}).`,
          resourceType: 'order',
          resourceId: savedOrder.id
        }).catch(e => logger.warn(`[OrderCreation] Activity log error: ${e.message}`));
      }

      if (NotificationService && typeof NotificationService.create === 'function') {
        NotificationService.create(userId, {
          type: 'order',
          tone: 'accent',
          title: `Order ${savedOrder.orderNumber} placed`,
          body: `Your order is confirmed — pay on delivery. Total XAF ${savedOrder.totalAmountXaf}.`,
          metadata: { orderId: savedOrder.id, orderNumber: savedOrder.orderNumber }
        }).catch(e => logger.warn(`[OrderCreation] Notification error: ${e.message}`));
      }

      return savedOrder;
    } catch (err) {
      if (scopedKey && lockAcquired) {
        await IdempotencyService.releaseLock(scopedKey).catch(() => {});
      }
      throw err;
    } finally {
      this._activeLocks.delete(userLockKey);
    }
  }
}

module.exports = { OrderCreationService };
