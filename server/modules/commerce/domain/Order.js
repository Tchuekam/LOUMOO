/**
 * LOUMOO Commerce Core — Order & OrderItem Domain Entities
 * ---------------------------------------------------------------------------
 * Server-authoritative domain models for orders and order line items.
 * Ensures structural integrity, immutable calculations, and type safety.
 */

const crypto = require('crypto');

const FULFILLMENT_STATUS = Object.freeze({
  PROCESSING: 'processing',
  IN_TRANSIT: 'in_transit',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled'
});

const PAYMENT_STATUS = Object.freeze({
  PENDING: 'pending',
  PAID: 'paid',
  ESCROW_HELD: 'escrow_held',
  REFUNDED: 'refunded'
});

const DELIVERY_METHOD = Object.freeze({
  HOME_DELIVERY: 'HOME_DELIVERY',
  STORE_PICKUP: 'STORE_PICKUP'
});

class OrderItem {
  /**
   * @param {object} params
   * @param {string} params.listingId
   * @param {string|null} [params.variantId]
   * @param {string} params.title
   * @param {string|null} [params.sku]
   * @param {number} params.unitPriceXaf - Authoritative integer unit price in XAF
   * @param {number} params.quantity - Positive integer quantity
   * @param {string} params.sellerId - Legitimate seller ID from listing
   * @param {string|null} [params.storeId]
   * @param {string|null} [params.storeName]
   * @param {string|null} [params.imageUrl]
   */
  constructor({
    listingId,
    variantId = null,
    title,
    sku = null,
    unitPriceXaf,
    quantity,
    sellerId,
    storeId = null,
    storeName = null,
    imageUrl = null
  }) {
    if (!listingId) throw new Error('OrderItem requires listingId');
    if (!sellerId) throw new Error('OrderItem requires sellerId');
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new Error(`OrderItem quantity must be a positive integer, received: ${quantity}`);
    }
    if (!Number.isInteger(unitPriceXaf) || unitPriceXaf < 0) {
      throw new Error(`OrderItem unitPriceXaf must be a non-negative integer, received: ${unitPriceXaf}`);
    }

    this.listingId = String(listingId);
    this.variantId = variantId ? String(variantId) : null;
    this.title = String(title || 'Item');
    this.sku = sku ? String(sku) : null;
    this.unitPriceXaf = unitPriceXaf;
    this.quantity = quantity;
    this.totalLineXaf = unitPriceXaf * quantity;
    this.sellerId = String(sellerId);
    this.storeId = storeId ? String(storeId) : null;
    this.storeName = storeName ? String(storeName) : null;
    this.imageUrl = imageUrl ? String(imageUrl) : null;
  }

  toJSON() {
    return {
      listingId: this.listingId,
      variantId: this.variantId,
      title: this.title,
      sku: this.sku,
      unitPriceXaf: this.unitPriceXaf,
      quantity: this.quantity,
      totalLineXaf: this.totalLineXaf,
      sellerId: this.sellerId,
      storeId: this.storeId,
      storeName: this.storeName,
      imageUrl: this.imageUrl
    };
  }
}

class Order {
  /**
   * @param {object} params
   * @param {string} [params.id]
   * @param {string} params.orderNumber
   * @param {string} params.buyerId
   * @param {string} params.sellerId
   * @param {OrderItem[]} params.items
   * @param {number} params.subtotalXaf
   * @param {number} [params.shippingFeeXaf=0]
   * @param {number} params.totalAmountXaf
   * @param {string} [params.currency='XAF']
   * @param {object} [params.shippingAddress]
   * @param {string} [params.deliveryMethod='HOME_DELIVERY']
   * @param {string} [params.paymentStatus='pending']
   * @param {string} [params.fulfillmentStatus='processing']
   * @param {string|null} [params.idempotencyKey]
   * @param {Array} [params.timeline]
   * @param {string} [params.createdAt]
   * @param {string} [params.updatedAt]
   */
  constructor({
    id = null,
    orderNumber,
    buyerId,
    sellerId,
    items = [],
    subtotalXaf,
    shippingFeeXaf = 0,
    totalAmountXaf,
    currency = 'XAF',
    shippingAddress = {},
    deliveryMethod = DELIVERY_METHOD.HOME_DELIVERY,
    paymentStatus = PAYMENT_STATUS.PENDING,
    fulfillmentStatus = FULFILLMENT_STATUS.PROCESSING,
    idempotencyKey = null,
    timeline = [],
    createdAt = new Date().toISOString(),
    updatedAt = new Date().toISOString()
  }) {
    if (!buyerId) throw new Error('Order requires buyerId');
    if (!sellerId) throw new Error('Order requires sellerId');
    if (!items || !items.length) throw new Error('Order requires at least one item');

    this.id = id;
    this.orderNumber = orderNumber || Order.generateOrderNumber();
    this.buyerId = String(buyerId);
    this.sellerId = String(sellerId);
    this.items = items.map(it => it instanceof OrderItem ? it : new OrderItem(it));
    this.subtotalXaf = Number.isInteger(subtotalXaf) ? subtotalXaf : this.calculateSubtotal();
    this.shippingFeeXaf = Number.isInteger(shippingFeeXaf) ? shippingFeeXaf : 0;
    this.totalAmountXaf = Number.isInteger(totalAmountXaf) ? totalAmountXaf : (this.subtotalXaf + this.shippingFeeXaf);
    this.currency = currency || 'XAF';
    this.shippingAddress = typeof shippingAddress === 'object' && shippingAddress ? shippingAddress : {};
    this.deliveryMethod = deliveryMethod || DELIVERY_METHOD.HOME_DELIVERY;
    this.paymentStatus = paymentStatus || PAYMENT_STATUS.PENDING;
    this.fulfillmentStatus = fulfillmentStatus || FULFILLMENT_STATUS.PROCESSING;
    this.idempotencyKey = idempotencyKey || null;
    this.timeline = Array.isArray(timeline) ? timeline : [];
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  static generateOrderNumber() {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = crypto.randomBytes(3).toString('hex').toUpperCase();
    return `KM-${timestamp}-${random}`;
  }

  calculateSubtotal() {
    return this.items.reduce((sum, item) => sum + item.totalLineXaf, 0);
  }

  toJSON() {
    return {
      id: this.id,
      orderNumber: this.orderNumber,
      buyerId: this.buyerId,
      sellerId: this.sellerId,
      subtotalXaf: this.subtotalXaf,
      shippingFeeXaf: this.shippingFeeXaf,
      totalAmountXaf: this.totalAmountXaf,
      currency: this.currency,
      items: this.items.map(i => i.toJSON()),
      shippingAddress: this.shippingAddress,
      deliveryMethod: this.deliveryMethod,
      paymentStatus: this.paymentStatus,
      fulfillmentStatus: this.fulfillmentStatus,
      idempotencyKey: this.idempotencyKey,
      timeline: this.timeline,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

module.exports = {
  Order,
  OrderItem,
  FULFILLMENT_STATUS,
  PAYMENT_STATUS,
  DELIVERY_METHOD
};
