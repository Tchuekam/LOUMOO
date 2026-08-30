/**
 * LOUMOO Domain & Application Event Contracts
 * Standardized typed event definitions for cross-module decoupled messaging
 */

const EVENT_TYPES = {
  // Identity & Auth
  USER_CREATED: 'identity.user.created',
  USER_UPDATED: 'identity.user.updated',
  USER_DELETED: 'identity.user.deleted',
  USER_ROLE_ASSIGNED: 'identity.user.role_assigned',

  // Catalog & Products
  PRODUCT_VIEWED: 'catalog.product.viewed',
  PRODUCT_CREATED: 'catalog.product.created',
  PRODUCT_UPDATED: 'catalog.product.updated',

  // Commerce & Cart
  CART_ITEM_ADDED: 'commerce.cart.item_added',
  CHECKOUT_STARTED: 'commerce.checkout.started',
  ORDER_CREATED: 'commerce.order.created',
  ORDER_PAID: 'commerce.order.paid',

  // Promotions & Black FreeDay
  PROMOTION_VIEWED: 'promotions.promotion.viewed',
  BLACK_FREEDAY_CLAIM_ATTEMPTED: 'promotions.black_freeday.claim_attempted',
  BLACK_FREEDAY_CLAIMED: 'promotions.black_freeday.claimed',

  // Messaging
  MESSAGE_SENT: 'messaging.message.sent',
  VOICE_NOTE_RECORDED: 'messaging.voice_note.recorded'
};

function createDomainEvent(eventType, aggregateType, aggregateId, payload = {}, metadata = {}) {
  return {
    eventId: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
    eventType,
    aggregateType,
    aggregateId: String(aggregateId),
    payload,
    metadata: {
      timestamp: new Date().toISOString(),
      version: '1.0',
      ...metadata
    }
  };
}

module.exports = {
  EVENT_TYPES,
  createDomainEvent
};
