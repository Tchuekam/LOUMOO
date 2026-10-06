/**
 * LOUMOO Commerce Core — Order Creation Service
 * ---------------------------------------------------------------------------
 * Primary coordinator for order placement.
 * Enforces strict input validation, listing/variant integrity, derived seller identity,
 * server-authoritative pricing, scoped idempotency, and concurrency controls.
 */

const crypto = require('crypto');
const { Order, OrderItem, FULFILLMENT_STATUS, PAYMENT_STATUS, DELIVERY_METHOD } = require('../domain/Order');
const { PricingEngine, resolveCityRate, foldCity } = require('../domain/PricingEngine');
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
  constructor(repository = null, deps = {}) {
    this.repository = repository || new OrderRepository();
    // Concurrency mutex for in-flight creations per user
    this._activeLocks = new Set();
    // How a preferred provider is looked up when pricing the order. Injectable so
    // a test can supply providers without the shared delivery singleton; in
    // production it lazily reads the shared DeliveryService's repository, keeping
    // the commerce→delivery dependency soft (lazy, best-effort).
    this._resolveProvider = deps.resolveProvider || (async (profileId) => {
      const { getSharedDeliveryService } = require('../../delivery/application/DeliveryService');
      return getSharedDeliveryService().repo.findDriver(profileId);
    });
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
          return new Order(cachedResponse.order);
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
          storePhone: listing.storePhone || null,
          imageUrl: null,
          listing
        });
      }

      // An order belongs to exactly one seller: the seller is who receives it, who
      // arranges its delivery and who is paid. A bag that mixes stores would be
      // filed under the first item's seller and the others would never hear of
      // their goods, so it is refused and the client places one order per store.
      const sellerIds = new Set(evaluatedItems.map((it) => it.sellerId));
      if (sellerIds.size > 1) {
        const stores = [...new Set(evaluatedItems.map((it) => it.storeName || 'another store'))];
        throw new ValidationError(
          `Your bag has items from ${stores.length} different stores (${stores.join(', ')}). Each store delivers on its own, so place one order per store.`,
          [{ field: 'items', message: 'Items must all come from one store.', code: 'MULTI_SELLER_ORDER', stores }]
        );
      }

      // 4. Server-Authoritative Pricing Calculation
      const orderCity = data.shippingAddress?.city || data.city;
      let standardShippingFeeXaf = null;
      if (data.deliveryMethod !== DELIVERY_METHOD.STORE_PICKUP) {
        try {
          const SuperAdminRepository = require('../../../../SuperAdmin/backend/repositories/SuperAdminRepository');
          const cityRates = await SuperAdminRepository.getSetting('shipping_rates_by_city');
          // Accent- and punctuation-insensitive ("Yaoundé" is the table's "Yaounde"),
          // the same rule the checkout uses to show the fee.
          standardShippingFeeXaf = resolveCityRate(cityRates, orderCity);
        } catch (_) {}
      }

      // If the buyer preferred a specific provider, the order is priced by THAT
      // provider's own tariff when they set one — so the fee the picker showed is
      // the fee the order gets — never the city rate, and never a client-sent
      // price. Resolved server-side from the provider record. Best-effort and lazy
      // to keep the module dependency soft (delivery already depends on commerce):
      // an unknown, suspended, or out-of-area provider falls back to the city rate
      // and the dead preference is dropped rather than stored on the order.
      let effectivePreferredDriverId = data.deliveryMethod === DELIVERY_METHOD.STORE_PICKUP
        ? null
        : (data.preferredDriverId || null);
      if (effectivePreferredDriverId) {
        try {
          const provider = await this._resolveProvider(effectivePreferredDriverId);
          const folded = orderCity ? foldCity(orderCity) : '';
          const areas = provider && Array.isArray(provider.serviceAreas) ? provider.serviceAreas : [];
          const serves = provider && (areas.length === 0 || (folded && areas.includes(folded)));
          const active = provider && provider.status === 'active';
          if (active && serves) {
            if (provider.baseFeeXaf != null) standardShippingFeeXaf = provider.baseFeeXaf;
            // else the provider quotes the standard city rate: leave it as resolved.
          } else {
            // Gone, suspended, or cannot serve this city: do not keep a dead
            // preference on the order, and price at the city rate.
            effectivePreferredDriverId = null;
          }
        } catch (_) { /* delivery module unavailable: keep the hint, price at city rate */ }
      }

      const clientSuppliedTotal = data.totalAmountXaf ?? data.totalXaf ?? null;
      const pricing = PricingEngine.calculateOrderPricing(evaluatedItems, {
        deliveryMethod: data.deliveryMethod,
        clientSuppliedTotal,
        standardShippingFeeXaf
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
        storePhone: it.storePhone,
        imageUrl: it.imageUrl
      }));

      const primarySellerId = evaluatedItems[0].sellerId;
      const primarySellerPhone = evaluatedItems[0].storePhone || null;
      const orderNumber = Order.generateOrderNumber();

      const order = new Order({
        orderNumber,
        buyerId: userId,
        sellerId: primarySellerId,
        sellerPhone: primarySellerPhone,
        items: orderItems,
        subtotalXaf: pricing.subtotalXaf,
        shippingFeeXaf: pricing.shippingFeeXaf,
        totalAmountXaf: pricing.totalAmountXaf,
        currency: 'XAF',
        shippingAddress: data.shippingAddress || {},
        deliveryMethod: data.deliveryMethod,
        // The preference as RESOLVED above: null for pickup, or when the chosen
        // provider turned out unavailable, so the order never carries a dead pick.
        preferredDriverId: effectivePreferredDriverId,
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
        if (CacheService.delPattern) {
          await CacheService.delPattern(`purchases:${userId}:*`);
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

      this._notifyParties(savedOrder);

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

  /**
   * Tells both sides of a new order. The buyer gets their confirmation; the seller
   * gets the order itself, which is what starts the delivery circuit: for a home
   * delivery it is their cue to arrange a rider. `audience` and `action` in the
   * metadata tell the client which screen to open when the notification is tapped
   * (the same vocabulary as DeliveryService; see docs/DELIVERY_API.md).
   * Best effort: a notification that fails never fails an order that was saved.
   */
  _notifyParties(order) {
    if (!NotificationService || typeof NotificationService.create !== 'function') return;
    const warn = (who) => (e) => logger.warn(`[OrderCreation] ${who} notification error: ${e.message}`);
    const home = order.deliveryMethod === DELIVERY_METHOD.HOME_DELIVERY;
    const lines = order.items.reduce((n, it) => n + it.quantity, 0);
    const what = `${lines} ${lines === 1 ? 'item' : 'items'}`;

    NotificationService.create(order.buyerId, {
      type: 'order',
      tone: 'accent',
      title: `Order ${order.orderNumber} placed`,
      body: `Your order is confirmed — pay on delivery. Total XAF ${order.totalAmountXaf}.`,
      metadata: { orderId: order.id, orderNumber: order.orderNumber, audience: 'buyer', action: 'track_order' }
    }).catch(warn('Buyer'));

    const ship = order.shippingAddress || {};
    const area = [ship.neighbourhood, ship.city].filter(Boolean).join(', ');
    NotificationService.create(order.sellerId, {
      type: 'order',
      tone: 'sale',
      title: home ? `New order ${order.orderNumber} to deliver` : `New pickup order ${order.orderNumber}`,
      body: home
        ? `${what} · XAF ${order.totalAmountXaf}${area ? ` · to ${area}` : ''}. Arrange a rider from Deliveries.`
        : `${what} · XAF ${order.totalAmountXaf}. Get it ready for the customer to collect.`,
      metadata: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        audience: 'seller',
        action: home ? 'open_dispatch' : null
      }
    }).catch(warn('Seller'));
  }
}

module.exports = { OrderCreationService };
