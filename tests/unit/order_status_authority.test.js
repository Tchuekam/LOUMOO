/**
 * Who may move an order, and when the buyer sees it.
 * ---------------------------------------------------------------------------
 * PATCH /orders/:id/status let the seller (or an admin) set `in_transit` or
 * `delivered` on ANY order. For a home delivery that skipped everything the delivery
 * exists to prove: the buyer saw DELIVERED with no handover code, `payment_status`
 * stayed `pending` forever (the buyer-protection attestation is only advanced by
 * delivery events), and the order could never be tracked (a delivery can only be
 * created while the order is `processing`). A home delivery now moves only through its
 * rider; a store pickup — which has no delivery — is still moved, and settled, by the
 * seller. Cancelling is unchanged.
 *
 * The same file pins the other half of "the dashboards reflect the same transaction":
 * the order detail read is fresh. It used to answer from a per-instance cache that is
 * never refreshed, so after the delivery module (another repository instance) delivered
 * and released the order the buyer still read processing/pending.
 */
'use strict';

require('../setup');
const assert = require('assert');
const { OrderRepository } = require('../../server/modules/commerce/infrastructure/OrderRepository');
const { OrderLifecycleService } = require('../../server/modules/commerce/application/OrderLifecycleService');
const { OrderQueryService } = require('../../server/modules/commerce/application/OrderQueryService');
const { Order, OrderItem, FULFILLMENT_STATUS, PAYMENT_STATUS, DELIVERY_METHOD } = require('../../server/modules/commerce/domain/Order');
const { ConflictError, NotFoundError } = require('../../server/shared/errors/AppError');

const item = () => new OrderItem({ listingId: 'l1', title: 'Shirt', unitPriceXaf: 15000, quantity: 1, totalLineXaf: 15000, sellerId: 'seller-1', storeId: 'st1', storeName: 'Shop' });

function makeOrder(repo, id, deliveryMethod) {
  const order = new Order({
    id, orderNumber: `KM-${id}`, buyerId: 'buyer-1', sellerId: 'seller-1', items: [item()],
    subtotalXaf: 15000, shippingFeeXaf: 1500, totalAmountXaf: 16500, deliveryMethod
  });
  repo._inMemoryOrders.set(id, order);
  return order;
}

async function rejects(fn, Type, re) {
  try { await fn(); } catch (e) {
    assert.ok(e instanceof Type, `expected ${Type.name}, got ${e && e.constructor && e.constructor.name}: ${e && e.message}`);
    if (re) assert.ok(re.test(e.message), `message "${e.message}" should match ${re}`);
    return;
  }
  assert.fail('expected a rejection');
}
