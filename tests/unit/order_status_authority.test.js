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

async function run() {
  // db: null = the repository's in-memory mode (no database, no network).
  const repo = new OrderRepository({ db: null });
  const lifecycle = new OrderLifecycleService(repo);
  const seller = { userRole: 'seller' };
  const admin = { userRole: 'admin' };

  // 1. A home delivery cannot be moved by a status edit — by anyone.
  makeOrder(repo, 'home-1', DELIVERY_METHOD.HOME_DELIVERY);
  for (const [who, opts, callerId] of [['the seller', seller, 'seller-1'], ['an admin', admin, 'admin-1']]) {
    for (const status of [FULFILLMENT_STATUS.IN_TRANSIT, FULFILLMENT_STATUS.DELIVERED]) {
      await rejects(() => lifecycle.updateFulfillmentStatus('home-1', status, callerId, opts), ConflictError, /moved by its rider/);
    }
    assert.strictEqual(repo._inMemoryOrders.get('home-1').fulfillmentStatus, FULFILLMENT_STATUS.PROCESSING, `${who} left the order untouched`);
    assert.strictEqual(repo._inMemoryOrders.get('home-1').paymentStatus, PAYMENT_STATUS.PENDING);
  }

  // 2. Cancelling a home delivery is still allowed, and makes the attestation refundable.
  const cancelled = await lifecycle.updateFulfillmentStatus('home-1', FULFILLMENT_STATUS.CANCELLED, 'seller-1', seller);
  assert.strictEqual(cancelled.fulfillmentStatus, FULFILLMENT_STATUS.CANCELLED);
  assert.strictEqual(cancelled.paymentStatus, PAYMENT_STATUS.REFUNDABLE);

  // 3. A stranger still learns nothing (404, not 403).
  makeOrder(repo, 'home-2', DELIVERY_METHOD.HOME_DELIVERY);
  await rejects(() => lifecycle.updateFulfillmentStatus('home-2', FULFILLMENT_STATUS.CANCELLED, 'someone-else', seller), NotFoundError);

  // 4. A store pickup has no delivery: the seller moves it, and handing it over settles it.
  makeOrder(repo, 'pick-1', DELIVERY_METHOD.STORE_PICKUP);
  const ready = await lifecycle.updateFulfillmentStatus('pick-1', FULFILLMENT_STATUS.IN_TRANSIT, 'seller-1', seller);
  assert.strictEqual(ready.fulfillmentStatus, FULFILLMENT_STATUS.IN_TRANSIT);
  assert.strictEqual(ready.paymentStatus, PAYMENT_STATUS.PENDING, 'ready for pickup is not yet a handover');
  const done = await lifecycle.updateFulfillmentStatus('pick-1', FULFILLMENT_STATUS.DELIVERED, 'seller-1', seller);
  assert.strictEqual(done.fulfillmentStatus, FULFILLMENT_STATUS.DELIVERED);
  assert.strictEqual(done.paymentStatus, PAYMENT_STATUS.RELEASED, 'a pickup handed over is settled (it has no delivery to do it)');

  // 5. The buyer's order detail is read FRESH. Two repository instances over one "database"
  //    stand in for the order service and the delivery module.
  const rows = new Map();
  const toRow = (o) => ({
    id: o.id, buyer_id: o.buyerId, seller_id: o.sellerId, order_number: o.orderNumber, total_amount_xaf: String(o.totalAmountXaf),
    items: o.items.map((i) => i.toJSON()),
    shipping_address: { _deliveryMethod: o.deliveryMethod, _subtotalXaf: o.subtotalXaf, _shippingFeeXaf: o.shippingFeeXaf, _timeline: [] },
    payment_status: o.paymentStatus, fulfillment_status: o.fulfillmentStatus, created_at: o.createdAt, updated_at: o.updatedAt
  });
  const sharedDb = {
    from: () => ({
      select: () => {
        let id = null;
        const q = new Proxy({}, {
          get: (_t, prop) => {
            if (prop === 'eq') return (col, val) => { if (col === 'id' || col === 'order_number') id = val; return q; };
            if (prop === 'maybeSingle' || prop === 'single') return () => Promise.resolve({ data: [...rows.values()].find((r) => r.id === id || r.order_number === id) || null, error: null });
            if (prop === 'then') return undefined;
            return () => q;
          }
        });
        return q;
      }
    })
  };
  const orderService = new OrderQueryService(new OrderRepository({ db: sharedDb }));
  const seed = new Order({ id: 'ord-9', orderNumber: 'KM-9', buyerId: 'buyer-1', sellerId: 'seller-1', items: [item()], subtotalXaf: 15000, shippingFeeXaf: 1500, totalAmountXaf: 16500 });
  rows.set('ord-9', toRow(seed));
  const first = await orderService.getOrderById('ord-9', 'buyer-1');
  assert.strictEqual(first.fulfillmentStatus, 'processing');
  // the delivery module delivers and releases the order, through its own repository
  Object.assign(rows.get('ord-9'), { fulfillment_status: 'delivered', payment_status: 'released' });
  const second = await orderService.getOrderById('ord-9', 'buyer-1');
  assert.strictEqual(second.fulfillmentStatus, 'delivered', 'the detail read reflects the delivered order, not a cached copy');
  assert.strictEqual(second.paymentStatus, 'released');

  console.log('    ✓ order_status_authority: a home delivery moves only through its rider; order reads are fresh');
}

module.exports = { run };
