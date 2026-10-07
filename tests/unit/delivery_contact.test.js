/**
 * LOUMOO Unit Tests - Who the delivery circuit contacts
 * ---------------------------------------------------------------------------
 * The circuit has four parties: the buyer, the seller, the rider and an admin.
 * Each one must hear about the moments that concern them, in their own role, and
 * every notification must say which screen it opens (`audience`, `action`).
 * Nothing here touches a database: orders and deliveries are in memory, and the
 * notification service is replaced by a recorder.
 *
 *   1. Placing an order contacts the buyer AND the seller; a bag that mixes
 *      stores is refused rather than filed under the wrong seller.
 *   2. Walking one delivery from creation to handover tells each party the right
 *      thing, and never tells a party about someone else's business.
 *   3. The exceptions reach an administrator (a locked handover, a suspended
 *      rider who still holds a parcel), because the seller is told "an
 *      administrator must resolve this" and nobody was telling the administrator.
 *   4. Riders hear about being registered, replaced and unlocked.
 *   5. A deployment whose delivery migration was never applied answers a plain
 *      503 instead of looking like an empty system. That includes the presence
 *      migration (017): without iam.rider_presence nobody can be offered anything.
 *   6. Rider presence (docs/DELIVERY_API.md, "Rider presence"): going online, pausing
 *      or going offline tells nobody; an offer taken back because its rider stopped
 *      being available tells that offer's SELLER (and only them); an offer refused
 *      because the rider is not available is never announced to anyone.
 *
 * Riders are only offered work while they are online, so every rider here is put
 * online after being registered, and the world's presence window is long enough
 * that it never lapses under the tests that move the clock for other reasons.
 */

require('../setup');
const assert = require('assert');
const config = require('../../server/config/env');

const { DeliveryService } = require('../../server/modules/delivery/application/DeliveryService');
const { DeliveryRepository, DeliveryNotReadyError } = require('../../server/modules/delivery/infrastructure/DeliveryRepository');
const { DeliveryEvents } = require('../../server/modules/delivery/infrastructure/DeliveryEvents');
const { OrderRepository } = require('../../server/modules/commerce/infrastructure/OrderRepository');
const { OrderCreationService } = require('../../server/modules/commerce/application/OrderCreationService');
const { Order, FULFILLMENT_STATUS, DELIVERY_METHOD, PAYMENT_STATUS } = require('../../server/modules/commerce/domain/Order');
const { codeFor } = require('../../server/modules/delivery/domain/HandoverCode');
const { MAX_HANDOVER_ATTEMPTS } = require('../../server/modules/delivery/domain/Delivery');

const BUYER = { userId: 'buyer_1', userRole: 'customer' };
const SELLER = { userId: 'seller_1', userRole: 'seller' };
const ADMIN = { userId: 'admin_1', userRole: 'admin' };
const RIDER = { userId: 'rider_1', userRole: 'customer' };
const NEAR = { lat: 4.0511, lng: 9.7679 };

async function code(promise) {
  try { await promise; return 'OK'; } catch (e) { return e.code || e.name || 'ERROR'; }
}

/** `CODE:reason` of a refusal (RIDER_UNAVAILABLE:paused), or 'OK': says WHY a rider was turned down. */
async function refusal(promise) {
  try { await promise; return 'OK'; } catch (e) {
    return `${e.code || e.name || 'ERROR'}${e.details && e.details.reason ? `:${e.details.reason}` : ''}`;
  }
}

/** Replaces the notification service with a recorder; returns it and a restore(). */
function recordNotifications() {
  const NotificationService = require('../../server/modules/identity/application/NotificationService');
  const original = NotificationService.create;
  const sent = [];
  NotificationService.create = async (userId, payload) => { sent.push({ userId, ...payload }); return null; };
  return {
    sent,
    restore: () => { NotificationService.create = original; },
    to: (userId) => sent.filter((n) => n.userId === userId),
    clear: () => { sent.length = 0; }
  };
}

// --------------------------------------------------------------- 1. placing an order

function listing(id, sellerId, storeName) {
  return {
    id, title: `Item ${id}`, status: 'PUBLISHED', visibility: 'PUBLIC', deletedAt: null, storeStatus: 'ACTIVE',
    basePriceMinor: 10000, salePriceMinor: null, sku: null, sellerId, storeId: `store_${sellerId}`, storeName, storePhone: '+237611111111'
  };
}

function makeCreationService() {
  const listings = { l1: listing('l1', 'seller_1', 'Tech Shop'), l2: listing('l2', 'seller_1', 'Tech Shop'), l3: listing('l3', 'seller_2', 'Books Corner') };
  const saved = [];
  const repository = {
    findListingById: async (id) => listings[id] || null,
    findVariantById: async () => null,
    checkInventory: async () => ({ isAvailable: true, availableQuantity: 99 }),
    saveOrder: async (order) => { order.id = `ord_${saved.length + 1}`; saved.push(order); return order; }
  };
  return { service: new OrderCreationService(repository), saved };
}

async function testOrderPlacement() {
  const rec = recordNotifications();
  try {
    // A home-delivery order tells the buyer it is placed and the seller to arrange a rider.
    {
      const { service, saved } = makeCreationService();
      const order = await service.createOrder('buyer_1', {
        items: [{ listingId: 'l1', quantity: 2 }, { listingId: 'l2', quantity: 1 }],
        shippingAddress: { fullName: 'Awa Njoya', phone: '+237622222222', street: 'Rue 1', city: 'Douala', neighbourhood: 'Bonanjo' },
        deliveryMethod: 'HOME_DELIVERY'
      });
      assert.strictEqual(saved.length, 1);

      const buyerNote = rec.to('buyer_1')[0];
      assert.ok(buyerNote, 'the buyer is told');
      assert.strictEqual(buyerNote.metadata.audience, 'buyer');
      assert.strictEqual(buyerNote.metadata.action, 'track_order');
      assert.strictEqual(buyerNote.metadata.orderId, order.id);

      const sellerNote = rec.to('seller_1')[0];
      assert.ok(sellerNote, 'the seller is told: this is what starts the circuit');
      assert.strictEqual(sellerNote.metadata.audience, 'seller');
      assert.strictEqual(sellerNote.metadata.action, 'open_dispatch', 'it opens the dispatch board');
      assert.strictEqual(sellerNote.metadata.orderId, order.id);
      assert.ok(/to deliver/i.test(sellerNote.title), 'it says there is something to deliver');
      assert.ok(/3 items/.test(sellerNote.body), 'it says what was ordered');
      assert.ok(/Bonanjo, Douala/.test(sellerNote.body), 'it says where to');
      assert.ok(/Arrange a rider/i.test(sellerNote.body), 'it says what to do next');
      assert.ok(!/Awa|622222222|Rue 1/.test(sellerNote.body + sellerNote.title), 'no customer phone or street in a notification');
    }

    // A pickup order does not tell the seller to find a rider.
    {
      rec.clear();
      const { service } = makeCreationService();
      await service.createOrder('buyer_1', { items: [{ listingId: 'l1', quantity: 1 }], deliveryMethod: 'STORE_PICKUP' });
      const sellerNote = rec.to('seller_1')[0];
      assert.ok(sellerNote && /pickup/i.test(sellerNote.title));
      assert.strictEqual(sellerNote.metadata.action, null, 'nothing to dispatch for a pickup');
    }

    // A bag from two stores is refused: it would be filed under one seller only.
    {
      rec.clear();
      const { service, saved } = makeCreationService();
      let error = null;
      try {
        await service.createOrder('buyer_1', { items: [{ listingId: 'l1', quantity: 1 }, { listingId: 'l3', quantity: 1 }], deliveryMethod: 'HOME_DELIVERY' });
      } catch (e) { error = e; }
      assert.ok(error, 'a mixed-store bag is refused');
      assert.strictEqual(error.code, 'VALIDATION_ERROR');
      assert.ok(/Tech Shop/.test(error.message) && /Books Corner/.test(error.message), 'it names the stores');
      assert.strictEqual(error.details[0].code, 'MULTI_SELLER_ORDER');
      assert.strictEqual(saved.length, 0, 'nothing was saved');
      assert.strictEqual(rec.sent.length, 0, 'nobody was told about an order that does not exist');
    }

    // A listing that does not exist (a showcase product) is a clean 404, not a crash.
    {
      const { service } = makeCreationService();
      assert.strictEqual(await code(service.createOrder('buyer_1', { items: [{ listingId: 'elec-1', quantity: 1 }] })), 'NOT_FOUND');
    }
  } finally {
    rec.restore();
  }
}

// ------------------------------------------------------------ 2-4. the circuit itself

const MIN = 60 * 1000;
// A rider's app may stay silent this long and still count as online. The service clamps
// it to an hour at most, which is as long as presence can be made to last.
const LONG_PRESENCE_TTL_MS = 60 * MIN;
// The window the silence scenarios use: short, and pinned here rather than read from a default.
const PRESENCE_TTL_MS = 2 * MIN;

function makeWorld({ presenceTtlMs = LONG_PRESENCE_TTL_MS } = {}) {
  let t = Date.parse('2026-10-03T10:00:00.000Z');
  const clock = { now: () => t, advance: (ms) => { t += ms; } };
  const orders = new OrderRepository({ db: null });
  const repo = new DeliveryRepository({ db: null });
  repo._adminIds = ['admin_1', 'admin_2'];
  const service = new DeliveryService({ repository: repo, orderRepository: orders, events: new DeliveryEvents(), now: clock.now, presenceTtlMs });
  return { clock, orders, repo, service };
}

async function placeOrder(world, { buyerId = 'buyer_1', sellerId = 'seller_1' } = {}) {
  return world.orders.saveOrder(new Order({
    buyerId,
    sellerId,
    items: [{ listingId: 'lst_1', title: 'Phone', unitPriceXaf: 50000, quantity: 1, sellerId, storeName: 'Tech Shop' }],
    shippingAddress: { fullName: 'Awa Njoya', phone: '+237622222222', street: 'Rue 1', city: 'Douala' },
    deliveryMethod: DELIVERY_METHOD.HOME_DELIVERY,
    paymentStatus: PAYMENT_STATUS.PAID,
    fulfillmentStatus: FULFILLMENT_STATUS.PROCESSING
  }));
}

/** An administrator registers a rider, who then opens the app and goes online. Returns who they act as. */
async function registerOnline(world, id, name, phone) {
  await world.service.registerDriver(id, { name, phone }, ADMIN);
  const caller = { userId: id, userRole: 'customer' };
  await world.service.riderGoOnline(caller);
  return caller;
}

const titles = (list) => list.map((n) => n.title);
const has = (list, re) => list.some((n) => re.test(n.title));

async function testTheCircuit() {
  const rec = recordNotifications();
  try {
    // ---- the happy path, party by party
    {
      const w = makeWorld();
      await w.service.registerDriver('rider_1', { name: 'Alain', phone: '+237600000001' }, ADMIN);
      assert.ok(has(rec.to('rider_1'), /now a LOUMOO rider/), 'a newly registered rider is told, and what to open');
      assert.strictEqual(rec.to('rider_1')[0].metadata.action, 'open_rider_hub');
      rec.clear();

      // Registered is not available: the rider opens the app and goes online. That tells nobody.
      await w.service.riderGoOnline(RIDER);
      assert.strictEqual((await w.service.getRiderPresence(RIDER)).status, 'online');
      assert.strictEqual(rec.sent.length, 0, 'going online is not news to anyone');

      const order = await placeOrder(w);
      const created = await w.service.createDelivery(order.id, SELLER, { dropoffLocation: { lat: 4.0601, lng: 9.7679 } });
      assert.ok(has(rec.to('buyer_1'), /Delivery being arranged/), 'the buyer hears a rider is being found');
      assert.strictEqual(rec.to('buyer_1')[0].metadata.audience, 'buyer');
      assert.strictEqual(rec.to('buyer_1')[0].metadata.deliveryId, created.id);
      assert.strictEqual(rec.to('seller_1').length, 0, 'the seller did this themselves: no echo');
      rec.clear();

      await w.service.assignDriver(created.id, 'rider_1', SELLER);
      assert.ok(has(rec.to('rider_1'), /New delivery assigned/));
      assert.strictEqual(rec.to('rider_1')[0].metadata.audience, 'rider');
      assert.strictEqual(rec.to('rider_1')[0].metadata.action, 'open_rider_hub');
      assert.strictEqual(rec.to('buyer_1').length, 0, 'the buyer is not bothered by an offer nobody has accepted');
      rec.clear();

      await w.service.acceptDelivery(created.id, RIDER);
      assert.ok(has(rec.to('buyer_1'), /rider accepted/i), 'the buyer is told someone is coming');
      assert.ok(has(rec.to('seller_1'), /rider accepted/i), 'the seller is told to have the parcel ready');
      assert.strictEqual(rec.to('seller_1')[0].metadata.audience, 'seller');
      assert.strictEqual(rec.to('seller_1')[0].metadata.action, 'open_dispatch');
      rec.clear();

      await w.service.recordLocation(created.id, { ...NEAR }, RIDER);
      w.clock.advance(5000);
      await w.service.updateStatus(created.id, 'picked_up', null, RIDER);
      assert.ok(has(rec.to('buyer_1'), /on its way/i));
      assert.ok(has(rec.to('seller_1'), /collected the parcel/i), 'the seller is told the parcel left');
      rec.clear();

      await w.service.updateStatus(created.id, 'arrived', null, RIDER);
      assert.ok(has(rec.to('buyer_1'), /rider has arrived/i));
      assert.ok(has(rec.to('seller_1'), /at the customer/i));
      assert.strictEqual(rec.to('admin_1').length, 0, 'nothing is wrong, so the admin is left alone');
      rec.clear();

      await w.service.completeDelivery(created.id, codeFor(created.id, 1), RIDER);
      assert.ok(has(rec.to('buyer_1'), /Order delivered/));
      assert.ok(has(rec.to('seller_1'), /Order delivered/));
      assert.strictEqual(rec.to('admin_1').length, 0);

      // Every delivery notification says whose it is and where it opens.
      for (const n of rec.sent) {
        assert.ok(['buyer', 'seller', 'rider', 'admin'].includes(n.metadata.audience), `"${n.title}" names its audience`);
        assert.ok(n.metadata.action, `"${n.title}" says which screen it opens`);
      }
    }

    // ---- a replaced rider is told the job went elsewhere
    {
      rec.clear();
      const w = makeWorld();
      await registerOnline(w, 'rider_1', 'Alain', '+237600000001');
      await registerOnline(w, 'rider_2', 'Bruno', '+237600000002');
      const order = await placeOrder(w);
      const created = await w.service.createDelivery(order.id, SELLER, {});
      await w.service.assignDriver(created.id, 'rider_1', SELLER);
      rec.clear();
      await w.service.assignDriver(created.id, 'rider_2', SELLER);
      assert.ok(has(rec.to('rider_2'), /New delivery assigned/));
      assert.ok(has(rec.to('rider_1'), /given to another rider/), 'the rider who lost the job is told');
      assert.strictEqual(rec.to('rider_1')[0].metadata.audience, 'rider');
    }

    // ---- exceptions reach an administrator
    {
      rec.clear();
      const w = makeWorld();
      await registerOnline(w, 'rider_1', 'Alain', '+237600000001');
      const order = await placeOrder(w);
      const created = await w.service.createDelivery(order.id, SELLER, { dropoffLocation: { lat: 4.0601, lng: 9.7679 } });
      await w.service.assignDriver(created.id, 'rider_1', SELLER);
      await w.service.acceptDelivery(created.id, RIDER);
      await w.service.recordLocation(created.id, { ...NEAR }, RIDER);
      w.clock.advance(5000);
      await w.service.updateStatus(created.id, 'picked_up', null, RIDER);
      await w.service.updateStatus(created.id, 'arrived', null, RIDER);
      rec.clear();

      const wrong = codeFor(created.id, 1) === '0000' ? '1111' : '0000';
      for (let i = 0; i < MAX_HANDOVER_ATTEMPTS; i += 1) await code(w.service.completeDelivery(created.id, wrong, RIDER));
      assert.ok(has(rec.to('seller_1'), /locked/i), 'the seller is told');
      for (const adminId of ['admin_1', 'admin_2']) {
        const alert = rec.to(adminId).find((n) => /locked/i.test(n.title));
        assert.ok(alert, `administrator ${adminId} is told: they are the ones who can unlock it`);
        assert.strictEqual(alert.metadata.audience, 'admin');
        assert.strictEqual(alert.metadata.deliveryId, created.id);
      }
      rec.clear();

      await w.service.resolveDelivery(created.id, { action: 'unlock' }, ADMIN);
      assert.ok(has(rec.to('buyer_1'), /code changed/i), 'the buyer is told to read the new code');
      assert.ok(has(rec.to('rider_1'), /unlocked/i), 'the rider is told to ask for it');
      rec.clear();

      // A rider suspended while carrying a parcel: the seller AND an administrator are told.
      await w.service.registerDriver('rider_1', { name: 'Alain', phone: '+237600000001', status: 'suspended' }, ADMIN);
      assert.ok(has(rec.to('seller_1'), /suspended/i));
      assert.ok(has(rec.to('admin_1'), /suspended rider still has a parcel/i), 'someone who can act is told');
      assert.ok(has(rec.to('rider_1'), /access was paused/i), 'the rider is told their access changed');
      rec.clear();

      await w.service.resolveDelivery(created.id, { action: 'fail', note: 'Rider suspended, parcel recovered' }, ADMIN);
      assert.ok(has(rec.to('seller_1'), /marked failed/i));
      assert.ok(has(rec.to('buyer_1'), /could not be completed/i));
      assert.ok(has(rec.to('rider_1'), /administrator closed your delivery/i), 'the rider learns the job is over');
    }

    // ---- no administrator on record: the alert is skipped, not fatal
    {
      rec.clear();
      const w = makeWorld();
      w.repo._adminIds = [];
      await registerOnline(w, 'rider_1', 'Alain', '+237600000001');
      const order = await placeOrder(w);
      const created = await w.service.createDelivery(order.id, SELLER, { dropoffLocation: { lat: 4.0601, lng: 9.7679 } });
      await w.service.assignDriver(created.id, 'rider_1', SELLER);
      await w.service.acceptDelivery(created.id, RIDER);
      await w.service.recordLocation(created.id, { ...NEAR }, RIDER);
      w.clock.advance(5000);
      await w.service.updateStatus(created.id, 'picked_up', null, RIDER);
      await w.service.updateStatus(created.id, 'arrived', null, RIDER);
      const wrong = codeFor(created.id, 1) === '0000' ? '1111' : '0000';
      const outcomes = [];
      for (let i = 0; i < MAX_HANDOVER_ATTEMPTS; i += 1) outcomes.push(await code(w.service.completeDelivery(created.id, wrong, RIDER)));
      assert.strictEqual(outcomes[outcomes.length - 1], 'DELIVERY_LOCKED', 'the rider still gets the lock answer');
    }
  } finally {
    rec.restore();
  }
}

// ------------------------------------------------------------ 6. rider presence

const noLongerAvailable = (list) => list.filter((n) => /no longer available/i.test(n.title));

async function testPresenceContacts() {
  const rec = recordNotifications();
  try {
    // ---- moving between online, paused and offline, and being refused work, tell nobody
    {
      const w = makeWorld();
      await w.service.registerDriver('rider_1', { name: 'Alain', phone: '+237600000001' }, ADMIN);
      await w.service.registerDriver('rider_2', { name: 'Bruno', phone: '+237600000002' }, ADMIN);
      rec.clear();

      await w.service.riderGoOnline(RIDER, { ...NEAR });
      w.clock.advance(30 * 1000);
      await w.service.riderHeartbeat(RIDER, { ...NEAR });
      await w.service.riderPause(RIDER);
      await w.service.riderResume(RIDER);
      assert.strictEqual((await w.service.getRiderPresence(RIDER)).status, 'online', 'the moves really happened');
      await w.service.riderGoOffline(RIDER);
      assert.strictEqual((await w.service.getRiderPresence(RIDER)).status, 'offline');
      assert.strictEqual(rec.sent.length, 0, 'online, heartbeat, pause, resume and offline with nothing to take back are not news to anyone');

      // A rider who is not available cannot be offered a delivery, and the refusal is not announced:
      // not to the rider (who would be told about a job they cannot take), not to the buyer, not to the seller.
      const order = await placeOrder(w);
      const created = await w.service.createDelivery(order.id, SELLER, {});
      rec.clear();
      assert.strictEqual(await refusal(w.service.assignDriver(created.id, 'rider_1', SELLER)), 'RIDER_UNAVAILABLE:offline', 'offline');
      assert.strictEqual(await refusal(w.service.assignDriver(created.id, 'rider_2', SELLER)), 'RIDER_UNAVAILABLE:offline', 'registered but never online');
      await w.service.riderGoOnline(RIDER);
      await w.service.riderPause(RIDER);
      assert.strictEqual(await refusal(w.service.assignDriver(created.id, 'rider_1', SELLER)), 'RIDER_UNAVAILABLE:paused', 'paused');
      assert.strictEqual(await code(w.service.autoAssignDriver(created.id, SELLER)), 'NO_RIDER_AVAILABLE', 'nobody is available, so nobody is picked');
      assert.strictEqual(rec.sent.length, 0, 'an offer that was refused is not announced to anyone');
      const untouched = await w.repo.findById(created.id);
      assert.strictEqual(untouched.status, 'pending_assignment');
      assert.strictEqual(untouched.driverId, null, 'and nobody holds it');

      // Control: once the rider is available the same call goes through and the rider IS told,
      // so the silence above is the rules and not a recorder that hears nothing.
      await w.service.riderResume(RIDER);
      rec.clear();
      await w.service.assignDriver(created.id, 'rider_1', SELLER);
      assert.ok(has(rec.to('rider_1'), /New delivery assigned/), 'an available rider is told about their offer');

      // Accepting makes the rider busy; going offline or pausing is then refused, and the refusal tells nobody.
      await w.service.acceptDelivery(created.id, RIDER);
      assert.strictEqual((await w.service.getRiderPresence(RIDER)).status, 'busy');
      rec.clear();
      assert.strictEqual(await refusal(w.service.riderGoOffline(RIDER)), 'RIDER_BUSY:busy', 'a rider carrying a parcel cannot go offline');
      assert.strictEqual(await refusal(w.service.riderPause(RIDER)), 'RIDER_BUSY:busy', 'nor pause');
      const second = await w.service.createDelivery((await placeOrder(w)).id, SELLER, {});
      rec.clear();
      assert.strictEqual(await refusal(w.service.assignDriver(second.id, 'rider_1', SELLER)), 'RIDER_BUSY:busy', 'and cannot be offered another');
      assert.strictEqual(rec.sent.length, 0, 'none of those refusals tells the buyer, the seller or an administrator anything');
    }

    // ---- a rider whose app went quiet cannot accept, and accepting tells the buyer and seller nothing
    {
      const w = makeWorld({ presenceTtlMs: PRESENCE_TTL_MS });
      await registerOnline(w, 'rider_1', 'Alain', '+237600000001');
      const order = await placeOrder(w);
      const created = await w.service.createDelivery(order.id, SELLER, {});
      await w.service.assignDriver(created.id, 'rider_1', SELLER);
      w.clock.advance(PRESENCE_TTL_MS); // the offer window (15 minutes) is still open; the presence window is not
      rec.clear();
      assert.strictEqual(await refusal(w.service.acceptDelivery(created.id, RIDER)), 'RIDER_UNAVAILABLE:expired');
      assert.strictEqual(rec.sent.length, 0, 'the buyer and seller are not told a rider accepted when they did not');
      assert.strictEqual((await w.repo.findById(created.id)).status, 'assigned', 'the offer is still there for when they are back');
    }

    // ---- an offer taken back because its rider stopped being available tells that seller, once
    for (const scenario of [
      { name: 'goes offline', stop: (w) => w.service.riderGoOffline(RIDER) },
      { name: 'pauses', stop: (w) => w.service.riderPause(RIDER) },
      { name: 'goes silent and their next heartbeat finds out', stop: async (w) => { w.clock.advance(PRESENCE_TTL_MS); await w.service.riderHeartbeat(RIDER); } },
      { name: 'goes silent and the sweep finds out', stop: async (w) => { w.clock.advance(PRESENCE_TTL_MS); await w.service.expireStalePresence(); } }
    ]) {
      const w = makeWorld({ presenceTtlMs: PRESENCE_TTL_MS });
      await registerOnline(w, 'rider_1', 'Alain', '+237600000001');
      const order = await placeOrder(w);
      const created = await w.service.createDelivery(order.id, SELLER, {});
      await w.service.assignDriver(created.id, 'rider_1', SELLER);
      rec.clear();

      await scenario.stop(w);

      const told = noLongerAvailable(rec.to('seller_1'));
      assert.strictEqual(told.length, 1, `rider ${scenario.name}: the seller is told once that the rider is no longer available`);
      assert.strictEqual(told[0].metadata.audience, 'seller');
      assert.strictEqual(told[0].metadata.action, 'open_dispatch', 'it opens the dispatch board');
      assert.strictEqual(told[0].metadata.deliveryId, created.id);
      assert.strictEqual(told[0].metadata.orderId, order.id);
      assert.ok(/Assign another rider/i.test(told[0].body), 'it says what to do next');
      assert.strictEqual(rec.to('buyer_1').length, 0, 'the buyer never heard of the offer, so is not told it was taken back');
      assert.strictEqual(rec.to('admin_1').length + rec.to('admin_2').length, 0, 'an ordinary offer taken back is not an administrator\'s business');
      assert.strictEqual(rec.sent.length, 1, `rider ${scenario.name}: the seller is the only one told`);
      const back = await w.repo.findById(created.id);
      assert.strictEqual(back.status, 'pending_assignment', 'the delivery is back with the seller');
      assert.strictEqual(back.driverId, null);
    }

    // ---- accepting one delivery takes the rider's other offers back, and tells THEIR sellers
    {
      const w = makeWorld();
      const SELLER2 = { userId: 'seller_2', userRole: 'seller' };
      await registerOnline(w, 'rider_1', 'Alain', '+237600000001');
      const orderA = await placeOrder(w);
      const orderB = await placeOrder(w, { buyerId: 'buyer_2', sellerId: 'seller_2' });
      const a = await w.service.createDelivery(orderA.id, SELLER, {});
      const b = await w.service.createDelivery(orderB.id, SELLER2, {});
      await w.service.assignDriver(a.id, 'rider_1', SELLER);
      await w.service.assignDriver(b.id, 'rider_1', SELLER2); // offers may stack until one is accepted
      rec.clear();

      await w.service.acceptDelivery(a.id, RIDER);

      assert.ok(has(rec.to('buyer_1'), /rider accepted/i), 'the buyer whose delivery was accepted is told');
      assert.ok(has(rec.to('seller_1'), /rider accepted/i), 'and its seller');
      assert.strictEqual(noLongerAvailable(rec.to('seller_1')).length, 0, 'the seller whose delivery was accepted is not also told it was taken back');
      const told = noLongerAvailable(rec.to('seller_2'));
      assert.strictEqual(told.length, 1, 'the other seller is told their rider is no longer available');
      assert.strictEqual(told[0].metadata.audience, 'seller');
      assert.strictEqual(told[0].metadata.action, 'open_dispatch');
      assert.strictEqual(told[0].metadata.deliveryId, b.id);
      assert.strictEqual(rec.to('buyer_2').length, 0, 'and their buyer is not');
      assert.strictEqual(rec.sent.length, 3, 'three notifications: the accepted buyer and seller, and the other seller');
      assert.strictEqual((await w.repo.findById(a.id)).status, 'accepted');
      assert.strictEqual((await w.repo.findById(b.id)).status, 'pending_assignment', 'the other offer is back with its seller');
    }

    // ---- a suspended rider who was online: the seller of their offer and the rider are told; they are offline, and stay so
    {
      const w = makeWorld();
      await registerOnline(w, 'rider_1', 'Alain', '+237600000001');
      const order = await placeOrder(w);
      const created = await w.service.createDelivery(order.id, SELLER, {});
      await w.service.assignDriver(created.id, 'rider_1', SELLER);
      rec.clear();

      await w.service.registerDriver('rider_1', { name: 'Alain', phone: '+237600000001', status: 'suspended' }, ADMIN);
      assert.strictEqual(noLongerAvailable(rec.to('seller_1')).length, 1, 'the seller is told the offer was taken back');
      assert.ok(has(rec.to('rider_1'), /access was paused/i), 'the rider is told their access changed');
      assert.strictEqual(rec.to('admin_1').length, 0, 'no parcel is stranded, so no administrator is alerted');
      assert.strictEqual(rec.to('buyer_1').length, 0);
      assert.strictEqual((await w.repo.findPresence('rider_1')).status, 'offline', 'a suspension forces the stored row offline');
      assert.strictEqual(await code(w.service.getRiderPresence(RIDER)), 'PERMISSION_DENIED', 'a suspended rider has no presence to read');
      rec.clear();

      await w.service.registerDriver('rider_1', { name: 'Alain', phone: '+237600000001', status: 'active' }, ADMIN);
      assert.ok(has(rec.to('rider_1'), /now a LOUMOO rider/), 'a reactivated rider is told');
      assert.strictEqual((await w.service.getRiderPresence(RIDER)).status, 'offline', 'but reactivation does not put them back online');
      assert.strictEqual(await refusal(w.service.assignDriver(created.id, 'rider_1', SELLER)), 'RIDER_UNAVAILABLE:offline', 'so they cannot be offered anything until they go online themselves');

      // Every presence notification says whose it is and where it opens, like the rest.
      for (const n of rec.sent) {
        assert.ok(['buyer', 'seller', 'rider', 'admin'].includes(n.metadata.audience), `"${n.title}" names its audience`);
        assert.ok(n.metadata.action, `"${n.title}" says which screen it opens`);
      }
    }
  } finally {
    rec.restore();
  }
}

// ------------------------------------------------- 5. a missing migration is a clear 503

/**
 * A database whose queries fail with `errorCode`. By default every table fails; with `only`
 * (a list of table names) just those do and every other table answers an empty success, which
 * is how "only migration 017 is missing" looks to the probe. `calls`, when given an array,
 * records the table of every query in order. `throwOn` makes the client itself throw for one
 * table, the way a dropped connection does.
 */
function brokenDb(errorCode, { only = null, calls = null, throwOn = null } = {}) {
  const failing = { data: null, error: { code: errorCode, message: 'relation does not exist' } };
  const q = (table) => {
    const broken = !only || only.includes(table);
    const chain = {};
    for (const m of ['select', 'eq', 'in', 'not', 'order', 'limit', 'update', 'insert', 'upsert', 'gt', 'gte', 'lte', 'or']) chain[m] = () => chain;
    chain.maybeSingle = async () => (broken ? failing : { data: null, error: null });
    chain.single = async () => (broken ? failing : { data: null, error: null });
    chain.then = (resolve) => resolve(broken ? failing : { data: [], error: null });
    return chain;
  };
  return {
    from: (table) => {
      if (calls) calls.push(table);
      if (throwOn === table) throw new Error('socket hang up');
      return q(table);
    }
  };
}

async function testMissingMigration() {
  const wasProduction = config.isProduction;
  try {
    config.isProduction = true;
    const repo = new DeliveryRepository({ db: brokenDb('PGRST205') });
    for (const call of [() => repo.findById('dlv_1'), () => repo.listDrivers(), () => repo.findDriver('rider_1'), () => repo.findByOrder('ord_1')]) {
      let error = null;
      try { await call(); } catch (e) { error = e; }
      assert.ok(error instanceof DeliveryNotReadyError, 'a missing table is a typed error, not an empty answer');
      assert.strictEqual(error.statusCode, 503);
      assert.strictEqual(error.code, 'DELIVERY_NOT_READY');
      assert.ok(!/relation|PGRST|iam\./.test(error.message), 'no database detail reaches the client');
    }
    assert.deepStrictEqual(await new DeliveryRepository({ db: brokenDb('42P01') }).probe().then((p) => p.ready), false, 'a direct Postgres error means the same');

    // A different failure is NOT mistaken for a missing migration.
    const flaky = await new DeliveryRepository({ db: brokenDb('XX000') }).probe();
    assert.strictEqual(flaky.ready, true, 'an unknown error is not reported as "migration missing"');

    // Outside production the development fallback is unchanged: no throw.
    config.isProduction = false;
    assert.strictEqual(await new DeliveryRepository({ db: brokenDb('PGRST205') }).findById('dlv_1'), null);
  } finally {
    config.isProduction = wasProduction;
  }
}

/**
 * Migration 017 on its own. The delivery tables can be there while iam.rider_presence is not
 * (a deploy that applied 013 and 014 and stopped): every presence read and write must then be
 * the same plain 503 in production, never an empty "nobody is online" that looks like a quiet
 * evening, and the boot probe must say which migration is missing.
 */
async function testMissingPresenceMigration() {
  const wasProduction = config.isProduction;
  const presenceCalls = (repo) => [
    ['findPresence', () => repo.findPresence('rider_1')],
    ['ensurePresence', () => repo.ensurePresence('rider_1')],
    ['transitionPresence', () => repo.transitionPresence('rider_1', ['online'], { status: 'busy' })],
    ['listPresence', () => repo.listPresence()],
    ['listFreshOnlinePresence', () => repo.listFreshOnlinePresence(new Date().toISOString())],
    ['findStalePresence', () => repo.findStalePresence(new Date().toISOString())],
    ['findStaleBusyPresence', () => repo.findStaleBusyPresence(new Date().toISOString())]
  ];
  try {
    config.isProduction = true;
    const repo = new DeliveryRepository({ db: brokenDb('PGRST205', { only: ['rider_presence'] }) });
    for (const [name, call] of presenceCalls(repo)) {
      let error = null;
      try { await call(); } catch (e) { error = e; }
      assert.ok(error instanceof DeliveryNotReadyError, `${name}: a missing presence table is a typed error, not an empty answer`);
      assert.strictEqual(error.statusCode, 503, `${name} answers 503`);
      assert.strictEqual(error.code, 'DELIVERY_NOT_READY', `${name} says delivery is not ready`);
      assert.ok(!/relation|PGRST|iam\.|rider_presence/.test(error.message), `${name}: no database detail reaches the client`);
    }
    // The delivery tables themselves are fine in that database: only presence is refused.
    assert.strictEqual(await repo.findById('dlv_1'), null, 'a read of a table that exists is not refused');

    // A rider's own presence call through the service is the same 503, not a 500 and not "offline".
    const service = new DeliveryService({ repository: new DeliveryRepository({ db: brokenDb('PGRST205') }), orderRepository: new OrderRepository({ db: null }), events: new DeliveryEvents() });
    assert.strictEqual(await code(service.getRiderPresence(RIDER)), 'DELIVERY_NOT_READY', 'a rider asking for their presence in a deployment without the tables gets the 503');

    // Outside production the development fallback is unchanged: no throw, and no row invented.
    config.isProduction = false;
    const dev = new DeliveryRepository({ db: brokenDb('PGRST205', { only: ['rider_presence'] }) });
    assert.strictEqual(await dev.findPresence('rider_1'), null, 'no row, no throw');
    assert.deepStrictEqual(await dev.listFreshOnlinePresence(new Date(0).toISOString()), [], 'nobody is online, no throw');
  } finally {
    config.isProduction = wasProduction;
  }
}

/** The boot probe (server/index.js): says "not ready" for a missing table, and only for that. */
async function testProbe() {
  // Every table there: ready, nothing to say, and it looked at BOTH the deliveries and the presence table.
  {
    const calls = [];
    const probe = await new DeliveryRepository({ db: brokenDb('PGRST205', { only: [], calls }) }).probe();
    assert.deepStrictEqual(probe, { ready: true }, 'a complete database is ready with no reason');
    assert.deepStrictEqual(calls, ['deliveries', 'rider_presence'], 'the probe checks the presence table as well as the deliveries one');
  }

  // Only the presence table missing: not ready, and the reason names migration 017 (not the ones that ran).
  for (const errorCode of ['PGRST205', '42P01']) {
    const calls = [];
    const probe = await new DeliveryRepository({ db: brokenDb(errorCode, { only: ['rider_presence'], calls }) }).probe();
    assert.strictEqual(probe.ready, false, `a missing presence table (${errorCode}) means not ready`);
    assert.ok(/017/.test(probe.reason), `the reason names migration 017 (got "${probe.reason}")`);
    assert.ok(/rider_presence/.test(probe.reason), 'and the table');
    assert.ok(!/013|014/.test(probe.reason), 'and not the migrations that were applied');
    assert.deepStrictEqual(calls, ['deliveries', 'rider_presence'], 'the deliveries table was checked first and was fine');
  }

  // The deliveries table missing: not ready, naming 013 and 014 (the presence table is not what is wrong first).
  {
    const probe = await new DeliveryRepository({ db: brokenDb('PGRST205') }).probe();
    assert.strictEqual(probe.ready, false);
    assert.ok(/013/.test(probe.reason) && /014/.test(probe.reason), `the reason names the delivery migrations (got "${probe.reason}")`);
  }

  // A flaky network is NOT a missing migration, whichever table it hits and however it shows up.
  for (const errorCode of ['XX000', '08006', '57014']) {
    for (const only of [['rider_presence'], ['deliveries']]) {
      const probe = await new DeliveryRepository({ db: brokenDb(errorCode, { only }) }).probe();
      assert.strictEqual(probe.ready, true, `error ${errorCode} on ${only[0]} is not reported as "migration missing"`);
    }
  }
  for (const table of ['rider_presence', 'deliveries']) {
    const probe = await new DeliveryRepository({ db: brokenDb('XX000', { only: [], throwOn: table }) }).probe();
    assert.strictEqual(probe.ready, true, `a dropped connection on ${table} is not "migration missing"`);
    assert.ok(/socket hang up/.test(probe.reason), 'but the probe says it could not check, and why');
  }

  // No database client (the in-memory store): nothing to probe.
  assert.strictEqual((await new DeliveryRepository({ db: null }).probe()).ready, true);
}

async function testAdminLookup() {
  const rows = [
    { id: 'admin_ok', primary_role: 'admin' },
    { id: 'admin_suspended', primary_role: 'admin', account_status: 'suspended' },
    { id: 'admin_deleted', primary_role: 'super_admin', deleted_at: '2026-01-01T00:00:00Z' },
    { id: 'admin_anon', primary_role: 'admin', account_status: 'anonymized' },
    { id: 'super_ok', primary_role: 'super_admin' }
  ];
  const db = {
    from(table) {
      assert.strictEqual(table, 'profiles');
      const chain = {};
      chain.select = () => chain;
      chain.in = (column, values) => { assert.strictEqual(column, 'primary_role'); assert.deepStrictEqual(values, ['admin', 'super_admin']); return chain; };
      chain.limit = async () => ({ data: rows, error: null });
      return chain;
    }
  };
  const ids = await new DeliveryRepository({ db }).listAdminIds({ limit: 10 });
  assert.deepStrictEqual(ids, ['admin_ok', 'super_ok'], 'only live administrators are alerted');
}

async function run() {
  console.log('  Testing who the delivery circuit contacts...');
  const hadSecret = config.supabase.jwtSecret;
  if (!hadSecret) config.supabase.jwtSecret = 'unit-test-delivery-secret-0123456789abcdef';
  try {
    await testOrderPlacement();
    await testTheCircuit();
    await testPresenceContacts();
    await testMissingMigration();
    await testMissingPresenceMigration();
    await testProbe();
    await testAdminLookup();
    console.log('    ✓ Every party is contacted in their own role; presence moves tell only the seller whose offer was taken back; exceptions reach an admin; a missing migration (013, 014 or 017) is a clear 503.');
  } finally {
    if (!hadSecret) config.supabase.jwtSecret = hadSecret;
  }
}

module.exports = { run };
