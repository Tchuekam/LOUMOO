/**
 * LOUMOO Unit Tests - Chasing an order nobody is arranging
 * ---------------------------------------------------------------------------
 * The seller is told when an order arrives. If nothing then happens, the circuit
 * stalls with nobody to blame: the buyer is waiting, the seller may not have looked
 * and no administrator knows. The sweeper therefore reminds the seller after 15
 * minutes and alerts the administrators once, in a single message, after 45. Pinned:
 *
 *   - who counts as "waiting" (no delivery, a cancelled one, or one with no rider) and
 *     who does not (a rider on it, a failed delivery the seller already knows about,
 *     a delivered, cancelled, refunded or pickup order, an order a day old);
 *   - each reminder fires once per order, in the right voice, and routes to the screen;
 *   - administrators get ONE alert for everything that crossed the line together;
 *   - a tier set to 0 is off, and unusable settings fall back to the defaults.
 */

require('../setup');
const assert = require('assert');
const config = require('../../server/config/env');

const { DeliveryService } = require('../../server/modules/delivery/application/DeliveryService');
const { DeliveryRepository } = require('../../server/modules/delivery/infrastructure/DeliveryRepository');
const { DeliveryEvents } = require('../../server/modules/delivery/infrastructure/DeliveryEvents');
const { OrderRepository } = require('../../server/modules/commerce/infrastructure/OrderRepository');
const { Order, FULFILLMENT_STATUS, DELIVERY_METHOD, PAYMENT_STATUS } = require('../../server/modules/commerce/domain/Order');

const SELLER = { userId: 'seller_1', userRole: 'seller' };
const ADMIN = { userId: 'admin_1', userRole: 'admin' };
const RIDER = { userId: 'rider_1', userRole: 'customer' };
const MIN = 60 * 1000;

function recordNotifications() {
  const NotificationService = require('../../server/modules/identity/application/NotificationService');
  const original = NotificationService.create;
  const sent = [];
  NotificationService.create = async (userId, payload) => { sent.push({ userId, ...payload }); return null; };
  return { sent, restore: () => { NotificationService.create = original; }, to: (id) => sent.filter((n) => n.userId === id), clear: () => { sent.length = 0; } };
}

let recorder = null;

async function world(options = {}) {
  // The fake clock starts at the real time: the repository stamps updatedAt from the
  // wall clock, so a clock set in the past would make a fresh cancellation look future-dated.
  let t = Date.now();
  const clock = { now: () => t, advance: (ms) => { t += ms; }, iso: (agoMs = 0) => new Date(t - agoMs).toISOString() };
  const orders = new OrderRepository({ db: null });
  const repo = new DeliveryRepository({ db: null });
  repo._adminIds = ['admin_1', 'admin_2'];
  const service = new DeliveryService({ repository: repo, orderRepository: orders, events: new DeliveryEvents(), now: clock.now, ...options });
  await service.registerDriver('rider_1', { name: 'Alain', phone: '+237600000001' }, ADMIN);
  if (recorder) recorder.clear(); // setting the world up told the rider; that is not under test
  const place = (ageMs, over = {}) => orders.saveOrder(new Order({
    buyerId: 'buyer_1', sellerId: 'seller_1', orderNumber: over.orderNumber,
    items: [{ listingId: 'l', title: 'Phone', unitPriceXaf: 50000, quantity: 1, sellerId: 'seller_1', storeName: 'Tech Shop' }],
    shippingAddress: { fullName: 'Awa Njoya', phone: '+237622222222', street: 'Rue 1', city: 'Douala' },
    deliveryMethod: DELIVERY_METHOD.HOME_DELIVERY, paymentStatus: PAYMENT_STATUS.PENDING, fulfillmentStatus: FULFILLMENT_STATUS.PROCESSING,
    createdAt: clock.iso(ageMs), ...over
  }));
  return { clock, orders, repo, service, place };
}

async function run() {
  console.log('  Testing the reminders for an order nobody is arranging...');
  const hadSecret = config.supabase.jwtSecret;
  if (!hadSecret) config.supabase.jwtSecret = 'unit-test-delivery-secret-0123456789abcdef';
  const rec = recordNotifications();
  recorder = rec;
  try {
    // ------------------------------------------------ the seller first, once, in their voice
    {
      const w = await world();
      const order = await w.place(5 * MIN, { orderNumber: 'KM-A' });
      assert.deepStrictEqual(await w.service.nudgeUndispatched(), { sellers: 0, admins: 0, overdue: 0 }, 'five minutes is not long enough');
      assert.strictEqual(rec.sent.length, 0);

      w.clock.advance(11 * MIN); // now 16 minutes
      const first = await w.service.nudgeUndispatched();
      assert.strictEqual(first.sellers, 1);
      const note = rec.to('seller_1')[0];
      assert.ok(note, 'the seller is reminded');
      assert.strictEqual(note.metadata.audience, 'seller');
      assert.strictEqual(note.metadata.action, 'open_dispatch', 'and it opens the dispatch board');
      assert.strictEqual(note.metadata.orderId, order.id, 'at that order');
      assert.ok(/KM-A/.test(note.title) && /still needs a rider/.test(note.title));
      assert.ok(/16 minutes/.test(note.body) && /Arrange the delivery/.test(note.body), 'it says how long, and what to do');
      assert.ok(!/Awa|622222222|Rue 1/.test(note.title + note.body), 'no customer details in a notification');
      assert.strictEqual(rec.to('admin_1').length, 0, 'administrators are not bothered yet');

      assert.strictEqual((await w.service.nudgeUndispatched()).sellers, 0, 'the reminder is sent once, not every minute');
      assert.strictEqual(rec.to('seller_1').length, 1);

      // ------------------------------------------------ then the administrators, in ONE message
      w.clock.advance(30 * MIN); // 46 minutes
      const later = await w.service.nudgeUndispatched();
      assert.strictEqual(later.overdue, 1);
      assert.strictEqual(later.sellers, 0, 'the seller is not chased again');
      for (const adminId of ['admin_1', 'admin_2']) {
        const alert = rec.to(adminId)[0];
        assert.ok(alert, `administrator ${adminId} is told`);
        assert.strictEqual(alert.metadata.audience, 'admin');
        assert.strictEqual(alert.metadata.action, 'open_dispatch');
        assert.ok(/An order has no rider/.test(alert.title) && /KM-A/.test(alert.body) && /45 minutes/.test(alert.body));
      }
      rec.clear();
      assert.deepStrictEqual(await w.service.nudgeUndispatched(), { sellers: 0, admins: 0, overdue: 0 }, 'and only once');
      assert.strictEqual(rec.sent.length, 0);
    }

    // ------------------------------------------ several orders cross the line together: one alert
    {
      rec.clear();
      const w = await world();
      for (const n of ['KM-1', 'KM-2', 'KM-3', 'KM-4', 'KM-5']) await w.place(50 * MIN, { orderNumber: n });
      const r = await w.service.nudgeUndispatched();
      assert.strictEqual(r.sellers, 5, 'each order\'s seller is reminded');
      assert.strictEqual(r.overdue, 5);
      assert.strictEqual(rec.to('admin_1').length, 1, 'but the administrator gets ONE message, not five');
      const alert = rec.to('admin_1')[0];
      assert.ok(/5 orders have no rider/.test(alert.title));
      assert.ok(/and 2 more/.test(alert.body), 'which names three and counts the rest');
    }

    // ----------------------------------------------- who is NOT waiting
    {
      rec.clear();
      const w = await world();
      const withRider = await w.place(30 * MIN, { orderNumber: 'KM-RIDER' });
      const d1 = await w.service.createDelivery(withRider.id, SELLER, {});
      await w.service.assignDriver(d1.id, 'rider_1', SELLER);
      rec.clear();

      const failed = await w.place(30 * MIN, { orderNumber: 'KM-FAILED' });
      const d2 = await w.service.createDelivery(failed.id, SELLER, {});
      await w.repo.updateWhere(d2.id, { status: 'pending_assignment' }, { status: 'cancelled' }); // then handled below
      // a failed delivery needs the seller's retry, but they were told when it failed
      const failedOrder = await w.place(30 * MIN, { orderNumber: 'KM-FAILED2' });
      const d3 = await w.service.createDelivery(failedOrder.id, SELLER, {});
      await w.repo.updateWhere(d3.id, { status: 'pending_assignment' }, { status: 'assigned', driverId: 'rider_1' });
      await w.repo.updateWhere(d3.id, { status: 'assigned' }, { status: 'accepted' });
      await w.repo.updateWhere(d3.id, { status: 'accepted' }, { status: 'picked_up' });
      await w.repo.updateWhere(d3.id, { status: 'picked_up' }, { status: 'failed', failureReason: 'customer unreachable' });

      await w.place(30 * MIN, { orderNumber: 'KM-DELIVERED', fulfillmentStatus: FULFILLMENT_STATUS.DELIVERED });
      await w.place(30 * MIN, { orderNumber: 'KM-CANCELLED', fulfillmentStatus: FULFILLMENT_STATUS.CANCELLED });
      await w.place(30 * MIN, { orderNumber: 'KM-REFUNDED', paymentStatus: PAYMENT_STATUS.REFUNDED });
      await w.place(30 * MIN, { orderNumber: 'KM-PICKUP', deliveryMethod: DELIVERY_METHOD.STORE_PICKUP });
      await w.place(26 * 60 * MIN, { orderNumber: 'KM-ANCIENT' });

      // A seller who cancels a delivery gets their 15 minutes to replace it, counted from
      // the cancellation; so let that time pass.
      w.clock.advance(20 * MIN);
      const r = await w.service.nudgeUndispatched();
      const reminded = rec.to('seller_1').map((n) => n.title);
      assert.ok(!reminded.some((t) => /KM-RIDER/.test(t)), 'an order with a rider on it is not chased');
      assert.ok(!reminded.some((t) => /KM-FAILED2/.test(t)), 'nor one whose delivery failed (the seller was told)');
      for (const gone of ['KM-DELIVERED', 'KM-CANCELLED', 'KM-REFUNDED', 'KM-PICKUP', 'KM-ANCIENT']) {
        assert.ok(!reminded.some((t) => t.includes(gone)), `${gone} is not chased`);
      }
      // The two that ARE waiting: one whose delivery was cancelled and never replaced.
      assert.ok(reminded.some((t) => /KM-FAILED\b/.test(t)), 'an order whose delivery was cancelled and never replaced is waiting');
      assert.strictEqual(r.sellers, 1);
    }

    // ------------------------------- a delivery created but never given a rider is also waiting
    {
      rec.clear();
      const w = await world();
      const order = await w.place(1 * MIN, { orderNumber: 'KM-NORIDER' });
      const created = await w.service.createDelivery(order.id, SELLER, {});
      w.clock.advance(20 * MIN);
      assert.strictEqual((await w.service.nudgeUndispatched()).sellers, 1);
      assert.ok(/Choose a rider/.test(rec.to('seller_1')[0].body), 'the advice fits: the delivery exists, so "choose a rider"');
      assert.strictEqual(rec.to('seller_1')[0].metadata.orderId, order.id);
      // Offered to a rider: now someone is on it, so the chase stops.
      rec.clear();
      await w.service.assignDriver(created.id, 'rider_1', SELLER);
      rec.clear();
      w.clock.advance(60 * MIN);
      assert.strictEqual((await w.service.nudgeUndispatched()).overdue, 0, 'an offered delivery is the rider\'s to answer (its own expiry handles that)');
    }

    // --------------------------------------------------------------- tiers can be switched off
    {
      rec.clear();
      const w = await world({ undispatchedSellerMs: 0, undispatchedAdminMs: 0 });
      await w.place(90 * MIN, { orderNumber: 'KM-OFF' });
      assert.strictEqual(w.service.nudgeEnabled, false);
      assert.deepStrictEqual(await w.service.nudgeUndispatched(), { sellers: 0, admins: 0 });
      assert.strictEqual(rec.sent.length, 0);

      const adminOnly = await world({ undispatchedSellerMs: 0, undispatchedAdminMs: 45 * MIN });
      await adminOnly.place(60 * MIN, { orderNumber: 'KM-ADMINONLY' });
      assert.strictEqual(adminOnly.service.nudgeEnabled, true);
      const r = await adminOnly.service.nudgeUndispatched();
      assert.strictEqual(r.sellers, 0, 'the seller tier is off');
      assert.strictEqual(r.overdue, 1, 'the administrator tier still works');
    }

    // ------------------------------------------------- settings from the environment
    {
      const keep = { s: process.env.DELIVERY_UNDISPATCHED_SELLER_MINUTES, a: process.env.DELIVERY_UNDISPATCHED_ADMIN_MINUTES };
      try {
        delete process.env.DELIVERY_UNDISPATCHED_SELLER_MINUTES; delete process.env.DELIVERY_UNDISPATCHED_ADMIN_MINUTES;
        let s = (await world()).service;
        assert.strictEqual(s.undispatchedSellerMs, 15 * MIN, 'default: remind the seller after 15 minutes');
        assert.strictEqual(s.undispatchedAdminMs, 45 * MIN, 'default: alert administrators after 45');
        process.env.DELIVERY_UNDISPATCHED_SELLER_MINUTES = '5'; process.env.DELIVERY_UNDISPATCHED_ADMIN_MINUTES = '0';
        s = (await world()).service;
        assert.strictEqual(s.undispatchedSellerMs, 5 * MIN);
        assert.strictEqual(s.undispatchedAdminMs, 0, '0 switches a tier off');
        process.env.DELIVERY_UNDISPATCHED_SELLER_MINUTES = 'soon'; process.env.DELIVERY_UNDISPATCHED_ADMIN_MINUTES = '-3';
        s = (await world()).service;
        assert.strictEqual(s.undispatchedSellerMs, 15 * MIN, 'a typo never switches reminders off');
        assert.strictEqual(s.undispatchedAdminMs, 45 * MIN);
      } finally {
        for (const [k, v] of [['DELIVERY_UNDISPATCHED_SELLER_MINUTES', keep.s], ['DELIVERY_UNDISPATCHED_ADMIN_MINUTES', keep.a]]) {
          if (v === undefined) delete process.env[k]; else process.env[k] = v;
        }
      }
    }

    // ---------------------------------- no administrator on record: the seller is still chased
    {
      rec.clear();
      const w = await world();
      w.repo._adminIds = [];
      await w.place(50 * MIN, { orderNumber: 'KM-NOADMIN' });
      const r = await w.service.nudgeUndispatched();
      assert.strictEqual(r.sellers, 1, 'the seller is still reminded');
      assert.strictEqual(r.admins, 0, 'and nobody to alert is not an error');
    }

    console.log('    ✓ Reminders: the seller is chased once, administrators get one alert, and only an order that is really waiting is chased.');
  } finally {
    rec.restore();
    if (!hadSecret) config.supabase.jwtSecret = hadSecret;
  }
}

module.exports = { run };
