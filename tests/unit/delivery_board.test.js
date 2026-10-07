/**
 * LOUMOO — Delivery dispatch board and admin rider roster (contract v1.2)
 * ---------------------------------------------------------------------------
 * GET /dispatch: a seller's home-delivery orders that need or have a delivery.
 * GET /drivers?status=: the admin roster, suspended riders included, each rider with
 * their presence (offline / online / busy / paused / suspended) and last heartbeat,
 * and never a position; the seller's list of riders, which now holds only riders who
 * are online. Service level over the in-memory backends, the two new repository reads over a
 * query-builder stand-in, and the routes over real HTTP with a header-driven
 * stand-in for authentication. No database.
 */

require('../setup');

const assert = require('assert');
const http = require('http');
const express = require('express');
const config = require('../../server/config/env');

const errorHandler = require('../../server/shared/middleware/errorHandler');
const { AuthenticationError } = require('../../server/shared/errors/AppError');
const { createDeliveryRouter } = require('../../server/modules/delivery/presentation/routes/deliveryRoutes');
const { DeliveryService } = require('../../server/modules/delivery/application/DeliveryService');
const { DeliveryRepository } = require('../../server/modules/delivery/infrastructure/DeliveryRepository');
const { DeliveryEvents } = require('../../server/modules/delivery/infrastructure/DeliveryEvents');
const { OrderRepository } = require('../../server/modules/commerce/infrastructure/OrderRepository');
const { Order, FULFILLMENT_STATUS, DELIVERY_METHOD, PAYMENT_STATUS } = require('../../server/modules/commerce/domain/Order');

const MIN = 60 * 1000;
const OFFER_TTL_MS = 15 * MIN;
// How long a rider may go without a heartbeat before they stop counting as online. These
// cases are about the board and the roster, not about heartbeats, and some move the clock
// by the whole offer window (15 minutes): under the 2-minute default a rider put online at
// the start would look silent by then. An hour keeps that out of the way; the roster case
// that IS about silence asks for a short window explicitly.
const PRESENCE_TTL_MS = 60 * MIN;

async function code(promise) {
  try { await promise; return 'OK'; } catch (e) { return e.code || e.name || 'ERROR'; }
}

function makeWorld({ presenceTtlMs = PRESENCE_TTL_MS } = {}) {
  let t = Date.parse('2026-10-04T10:00:00.000Z');
  const clock = { now: () => t, advance: (ms) => { t += ms; } };
  const orders = new OrderRepository({ db: null });
  const repo = new DeliveryRepository({ db: null });
  const events = new DeliveryEvents();
  const service = new DeliveryService({ repository: repo, orderRepository: orders, events, now: clock.now, offerTtlMs: OFFER_TTL_MS, presenceTtlMs });
  return { clock, orders, repo, events, service };
}

/** The rider opens the app and goes online. Registering someone only makes them a rider. */
async function goOnline(w, riderId) {
  return w.service.riderGoOnline({ userId: riderId, userRole: 'customer' });
}

let seq = 0;
async function placeOrder(w, overrides = {}) {
  seq += 1;
  return w.orders.saveOrder(new Order({
    buyerId: 'buyer_1',
    sellerId: 'seller_1',
    items: [{ listingId: `lst_${seq}`, title: `Phone ${seq}`, unitPriceXaf: 50000, quantity: 2, sellerId: overrides.sellerId || 'seller_1', storeName: 'Tech Shop' }],
    shippingAddress: { fullName: 'Awa Njoya', phone: '+237622222222', street: 'Rue 1', neighbourhood: 'Bonanjo', city: 'Douala' },
    deliveryMethod: DELIVERY_METHOD.HOME_DELIVERY,
    paymentStatus: PAYMENT_STATUS.PAID,
    fulfillmentStatus: FULFILLMENT_STATUS.PROCESSING,
    ...overrides
  }));
}

const BUYER = { userId: 'buyer_1', userRole: 'customer' };
const SELLER = { userId: 'seller_1', userRole: 'seller' };
const SELLER2 = { userId: 'seller_2', userRole: 'seller' };
const ADMIN = { userId: 'admin_1', userRole: 'admin' };
const RIDER = { userId: 'rider_1', userRole: 'customer' };

/** Minimal Supabase query-builder stand-in over plain rows (see delivery_repository.test.js). */
function stubDb(tables) {
  const calls = [];
  return {
    calls,
    from(table) {
      const rows = tables[table] || [];
      const q = { filters: [], max: null, order: null };
      const log = (op, ...a) => { calls.push([table, op, ...a]); return q; };
      q.select = (c) => log('select', c);
      q.eq = (c, v) => { q.filters.push((r) => r[c] === v); return log('eq', c, v); };
      q.in = (c, vs) => { q.filters.push((r) => vs.includes(r[c])); return log('in', c, vs); };
      q.order = (c, o = {}) => { q.order = { c, asc: o.ascending !== false }; return log('order', c, o); };
      q.limit = (n) => { q.max = n; return log('limit', n); };
      q.then = (resolve) => {
        let out = rows.filter((r) => q.filters.every((f) => f(r)));
        if (q.order) out = [...out].sort((a, b) => (Date.parse(a[q.order.c]) - Date.parse(b[q.order.c])) * (q.order.asc ? 1 : -1));
        if (q.max != null) out = out.slice(0, q.max);
        return resolve({ data: out, error: null });
      };
      return q;
    }
  };
}

async function run() {
  console.log('  Testing Delivery dispatch board and rider roster...');

  const hadSecret = config.supabase.jwtSecret;
  if (!hadSecret) config.supabase.jwtSecret = 'unit-test-delivery-secret-0123456789abcdef';
  const NotificationService = require('../../server/modules/identity/application/NotificationService');
  const originalCreate = NotificationService.create;
  NotificationService.create = async () => null;

  try {
    // ------------------------------------------------------------- who may ask
    {
      const w = makeWorld();
      assert.strictEqual(await code(w.service.getDispatchBoard(BUYER)), 'PERMISSION_DENIED', 'a customer has no dispatch board');
      assert.strictEqual(await code(w.service.getDispatchBoard(RIDER)), 'PERMISSION_DENIED', 'nor does a rider');
      assert.strictEqual(await code(w.service.getDispatchBoard({ userRole: 'seller' })), 'PERMISSION_DENIED', 'no identity is refused');
      assert.strictEqual(await code(w.service.getDispatchBoard(SELLER, { view: 'everything' })), 'VALIDATION_ERROR', 'an unknown view is refused');
      assert.deepStrictEqual(await w.service.getDispatchBoard(SELLER), { items: [] }, 'an empty board is an empty list');
    }

    // ------------------------------------------- what a seller's board contains
    {
      const w = makeWorld();
      await w.service.registerDriver('rider_1', { name: 'Alain', phone: '+237600000001' }, ADMIN);
      await goOnline(w, 'rider_1'); // an offer can only go to a rider who is online
      const needsRider = await placeOrder(w);
      const offered = await placeOrder(w);
      const pickup = await placeOrder(w, { deliveryMethod: DELIVERY_METHOD.STORE_PICKUP });
      const otherSellers = await placeOrder(w, { sellerId: 'seller_2' });
      const cancelled = await placeOrder(w, { fulfillmentStatus: FULFILLMENT_STATUS.CANCELLED });
      const refunded = await placeOrder(w, { paymentStatus: PAYMENT_STATUS.REFUNDED });
      const done = await placeOrder(w, { fulfillmentStatus: FULFILLMENT_STATUS.DELIVERED });
      const created = await w.service.createDelivery(offered.id, SELLER, {});
      await w.service.assignDriver(created.id, 'rider_1', SELLER);

      const board = await w.service.getDispatchBoard(SELLER);
      const ids = board.items.map((i) => i.order.id);
      assert.deepStrictEqual(ids.sort(), [needsRider.id, offered.id].sort(),
        'only this seller\'s live home-delivery orders: no pickup, other seller, cancelled, refunded or delivered');
      assert.ok(!ids.includes(pickup.id) && !ids.includes(otherSellers.id) && !ids.includes(cancelled.id) && !ids.includes(refunded.id) && !ids.includes(done.id));

      const bare = board.items.find((i) => i.order.id === needsRider.id);
      assert.strictEqual(bare.delivery, null, 'an order with no delivery yet says so');
      assert.deepStrictEqual(Object.keys(bare.order).sort(),
        ['area', 'buyerName', 'fulfillmentStatus', 'id', 'itemCount', 'orderNumber', 'paymentStatus', 'placedAt', 'preferredDriver', 'preferredDriverId', 'title', 'totalXaf'],
        'the order summary carries exactly the documented fields');
      assert.strictEqual(bare.order.itemCount, 2, 'quantities are summed');
      assert.strictEqual(bare.order.area, 'Bonanjo, Douala');
      assert.strictEqual(bare.order.buyerName, 'Awa Njoya');
      assert.ok(bare.order.title && bare.order.title.startsWith('Phone'));
      assert.strictEqual(bare.order.preferredDriverId, null, 'an order with no preference says so');
      assert.strictEqual(bare.order.preferredDriver, null);

      const live = board.items.find((i) => i.order.id === offered.id).delivery;
      assert.strictEqual(live.status, 'assigned');
      assert.strictEqual(live.viewerRole, 'seller', 'the seller view');
      assert.strictEqual(live.driver.name, 'Alain', 'with the rider');
      assert.strictEqual(live.offerExpiresAt, new Date(w.clock.now() + OFFER_TTL_MS).toISOString(), 'and the offer deadline');
      assert.deepStrictEqual(live.timeline, [], 'the timeline is left to GET /:id');

      const completed = await w.service.getDispatchBoard(SELLER, { view: 'completed' });
      assert.deepStrictEqual(completed.items.map((i) => i.order.id), [done.id], 'delivered orders are in the completed view');

      assert.deepStrictEqual((await w.service.getDispatchBoard(SELLER2)).items.map((i) => i.order.id), [otherSellers.id], 'each seller sees only their own');
      const adminBoard = await w.service.getDispatchBoard(ADMIN);
      assert.deepStrictEqual(adminBoard.items.map((i) => i.order.id).sort(), [needsRider.id, offered.id, otherSellers.id].sort(), 'an admin sees every seller\'s');
      assert.strictEqual(adminBoard.items.find((i) => i.order.id === offered.id).delivery.viewerRole, 'admin');

      // The newest live order here is the refunded one: excluding it must not eat the limit.
      assert.strictEqual((await w.service.getDispatchBoard(SELLER, { limit: 1 })).items.length, 1, 'the limit applies, after exclusions');
    }

    // ---------------------------- the buyer's preferred provider reaches the board
    {
      const w = makeWorld();
      await w.service.registerDriver('rider_1', { name: 'Alain', phone: '+237600000001' }, ADMIN);
      // The buyer preferred Alain at checkout; the order carries it as a hint.
      const preferred = await placeOrder(w, { preferredDriverId: 'rider_1' });
      // A preference pointing at a rider who no longer exists must not break the
      // board: the id is still shown, but no rider is resolved.
      const ghostPref = await placeOrder(w, { preferredDriverId: 'rider_gone' });

      const board = await w.service.getDispatchBoard(SELLER);
      const row = board.items.find((i) => i.order.id === preferred.id);
      assert.strictEqual(row.order.preferredDriverId, 'rider_1', 'the buyer\'s choice reaches the seller');
      assert.ok(row.order.preferredDriver, 'and the rider is resolved for the seller to confirm');
      assert.strictEqual(row.order.preferredDriver.name, 'Alain');
      assert.strictEqual(row.order.preferredDriver.status, 'active', 'with status, so an unavailable rider can be flagged');

      const ghost = board.items.find((i) => i.order.id === ghostPref.id);
      assert.strictEqual(ghost.order.preferredDriverId, 'rider_gone', 'an unknown preference keeps its id');
      assert.strictEqual(ghost.order.preferredDriver, null, 'but resolves to no rider');
    }

    // ------------------------------------- the open delivery wins over an old one
    {
      const w = makeWorld();
      await w.service.registerDriver('rider_1', { name: 'Alain', phone: '+237600000001' }, ADMIN);
      const order = await placeOrder(w);
      const first = await w.service.createDelivery(order.id, SELLER, {});
      await w.service.cancelDelivery(first.id, 'Wrong pickup point', SELLER);
      w.clock.advance(MIN);
      const second = await w.service.createDelivery(order.id, SELLER, {});
      const row = (await w.service.getDispatchBoard(SELLER)).items.find((i) => i.order.id === order.id);
      assert.strictEqual(row.delivery.id, second.id, 'the board shows the open delivery, not the cancelled one');
    }

    // ------------------------------------------- lapsed offers, and who can sweep
    {
      const w = makeWorld();
      await w.service.registerDriver('rider_1', { name: 'Alain', phone: '+237600000001' }, ADMIN);
      await goOnline(w, 'rider_1');
      const order = await placeOrder(w);
      const d = await w.service.createDelivery(order.id, SELLER, {});
      await w.service.assignDriver(d.id, 'rider_1', SELLER);
      w.clock.advance(OFFER_TTL_MS + MIN);

      assert.strictEqual(await code(w.service.getDispatchBoard(BUYER)), 'PERMISSION_DENIED');
      assert.strictEqual((await w.repo.findById(d.id)).status, 'assigned', 'a refused caller made the platform do nothing');

      const row = (await w.service.getDispatchBoard(SELLER)).items.find((i) => i.order.id === order.id);
      assert.strictEqual(row.delivery.status, 'pending_assignment', 'the board never shows a dead offer');
      assert.strictEqual(row.delivery.offerExpiresAt, null);
    }

    // ------------------------------------------------------------ the roster
    {
      // A two-minute window, so the same world can show a rider going silent.
      const w = makeWorld({ presenceTtlMs: 2 * MIN });
      const T0 = new Date(w.clock.now()).toISOString();
      await w.service.registerDriver('rider_b', { name: 'Bruno', phone: '+237600000002' }, ADMIN);
      await w.service.registerDriver('rider_a', { name: 'Alain', phone: '+237600000001' }, ADMIN);
      await w.service.registerDriver('rider_z', { name: 'Aaron', phone: '+237600000003', status: 'suspended' }, ADMIN);
      await goOnline(w, 'rider_b'); // Bruno is online and holds an offer; Alain has never opened the app
      const order = await placeOrder(w);
      const d = await w.service.createDelivery(order.id, SELLER, {});
      await w.service.assignDriver(d.id, 'rider_b', SELLER);

      assert.strictEqual(await code(w.service.listRiderRoster(SELLER)), 'PERMISSION_DENIED', 'sellers never see suspended riders');
      assert.strictEqual(await code(w.service.listRiderRoster(BUYER)), 'PERMISSION_DENIED');
      assert.strictEqual(await code(w.service.listRiderRoster(ADMIN, { status: 'banned' })), 'VALIDATION_ERROR');

      const all = await w.service.listRiderRoster(ADMIN);
      assert.deepStrictEqual(all.map((r) => [r.id, r.status, r.openDeliveries]),
        [['rider_a', 'active', 0], ['rider_b', 'active', 1], ['rider_z', 'suspended', 0]],
        'active riders first, by name, each with status and workload; suspended last');
      // Each row now also says whether the rider is here (presence) and when they were last
      // heard from, and never WHERE they are: the whole row is pinned, not just a few fields.
      assert.deepStrictEqual(Object.keys(all[0]).sort(), ['id', 'lastSeenAt', 'name', 'openDeliveries', 'phone', 'presence', 'status']);
      assert.deepStrictEqual(all, [
        { id: 'rider_a', name: 'Alain', phone: '+237600000001', status: 'active', openDeliveries: 0, presence: 'offline', lastSeenAt: null },
        { id: 'rider_b', name: 'Bruno', phone: '+237600000002', status: 'active', openDeliveries: 1, presence: 'online', lastSeenAt: T0 },
        { id: 'rider_z', name: 'Aaron', phone: '+237600000003', status: 'suspended', openDeliveries: 0, presence: 'suspended', lastSeenAt: null }
      ], 'registered is not online: Alain never went online, Bruno did, Aaron is suspended; an offer does not make Bruno busy');
      assert.deepStrictEqual((await w.service.listRiderRoster(ADMIN, { status: 'suspended' })).map((r) => r.id), ['rider_z']);
      assert.deepStrictEqual((await w.service.listRiderRoster(ADMIN, { status: 'active' })).map((r) => r.id), ['rider_a', 'rider_b']);

      const presenceOf = async (id) => {
        const row = (await w.service.listRiderRoster(ADMIN)).find((r) => r.id === id);
        return [row.presence, row.lastSeenAt];
      };
      const A = { userId: 'rider_a', userRole: 'customer' };
      const B = { userId: 'rider_b', userRole: 'customer' };

      // Accepting the offer makes Bruno busy (the claim also counts as being heard from).
      await w.service.acceptDelivery(d.id, B);
      assert.deepStrictEqual(await presenceOf('rider_b'), ['busy', T0], 'a rider carrying a parcel is busy, not online');

      // Alain goes online a minute later, takes a break, and comes back.
      w.clock.advance(MIN);
      const T1 = new Date(w.clock.now()).toISOString();
      await goOnline(w, 'rider_a');
      assert.deepStrictEqual(await presenceOf('rider_a'), ['online', T1]);
      await w.service.riderPause(A);
      assert.strictEqual((await presenceOf('rider_a'))[0], 'paused', 'on a break');
      await w.service.riderResume(A);
      assert.deepStrictEqual(await presenceOf('rider_a'), ['online', T1], 'and back');

      // Three more minutes without a heartbeat: Alain (silent for 3 of 2 allowed) reads offline, but the
      // roster still says when he was last heard from; Bruno is carrying a parcel, so silence does not expire him.
      w.clock.advance(3 * MIN);
      assert.deepStrictEqual(await presenceOf('rider_a'), ['offline', T1], 'a silent rider is offline, with their last beat shown');
      assert.strictEqual((await presenceOf('rider_b'))[0], 'busy', 'a busy rider does not expire');
      // The seller's list tells "nobody is online" apart from "nobody is registered".
      assert.deepStrictEqual(await w.service.listDrivers(SELLER, { withSummary: true }),
        { drivers: [], summary: { registered: 2, available: 0 } }, 'two active riders, neither available now');

      // A suspension applied straight to the rider record (not through registerDriver) still wins over
      // whatever the presence row says: Bruno's row says busy, the roster says suspended.
      await w.repo.upsertDriver({ profileId: 'rider_b', name: 'Bruno', phone: '+237600000002', status: 'suspended' });
      assert.strictEqual((await presenceOf('rider_b'))[0], 'suspended', 'suspended beats busy');
      assert.deepStrictEqual((await w.service.listRiderRoster(ADMIN, { status: 'suspended' })).map((r) => r.id).sort(), ['rider_b', 'rider_z']);
    }

    // ------------------- busy is read from the deliveries, not only from the presence row
    {
      const w = makeWorld();
      await w.service.registerDriver('rider_1', { name: 'Alain', phone: '+237600000001' }, ADMIN);
      await goOnline(w, 'rider_1');
      const first = await w.service.createDelivery((await placeOrder(w)).id, SELLER, {});
      const second = await w.service.createDelivery((await placeOrder(w)).id, SELLER, {});
      await w.service.assignDriver(first.id, 'rider_1', SELLER);
      // The delivery moves to accepted without the presence row following (what a crash between the two
      // writes leaves behind): the row still says online.
      await w.repo.updateWhere(first.id, { status: 'assigned' }, { status: 'accepted', acceptedAt: new Date(w.clock.now()).toISOString() });
      assert.strictEqual((await w.repo.findPresence('rider_1')).status, 'online', 'setup: the stored row says online');

      const row = (await w.service.listRiderRoster(ADMIN)).find((r) => r.id === 'rider_1');
      assert.strictEqual(row.presence, 'busy', 'the roster reads busy from the accepted delivery');
      assert.deepStrictEqual(await w.service.listDrivers(SELLER, { withSummary: true }),
        { drivers: [], summary: { registered: 1, available: 0 } }, 'and the seller is not offered a rider who is carrying a parcel');
      let refused = null;
      try { await w.service.assignDriver(second.id, 'rider_1', SELLER); } catch (e) { refused = e; }
      assert.ok(refused, 'choosing them by hand is refused too');
      assert.strictEqual(refused.statusCode, 409);
      assert.strictEqual(refused.code, 'RIDER_BUSY');
      assert.strictEqual(refused.details.reason, 'busy');
      assert.strictEqual((await w.repo.findById(second.id)).status, 'pending_assignment', 'and the second delivery is still waiting');
    }

    // ------------------------------------------------- the two repository reads
    {
      // findOrdersBySeller: the delivery method lives in JSON, and a row without it is home delivery.
      const row = (id, seller, status, method, at) => ({
        id, order_number: `LM-${id}`, buyer_id: 'b', seller_id: seller, total_amount_xaf: 1000,
        items: [{ listingId: `lst_${id}`, title: 'X', quantity: 1, unitPriceXaf: 1000 }],
        shipping_address: method === undefined ? { city: 'Douala' } : { city: 'Douala', _deliveryMethod: method },
        payment_status: 'paid', fulfillment_status: status, created_at: at
      });
      const db = stubDb({ orders: [
        row('a', 's1', 'processing', 'HOME_DELIVERY', '2026-10-04T09:00:00Z'),
        row('b', 's1', 'processing', undefined, '2026-10-04T09:30:00Z'),        // no key: home delivery
        row('c', 's1', 'processing', 'STORE_PICKUP', '2026-10-04T09:45:00Z'),
        row('d', 's2', 'processing', 'HOME_DELIVERY', '2026-10-04T09:50:00Z'),
        row('e', 's1', 'delivered', 'HOME_DELIVERY', '2026-10-04T08:00:00Z')
      ] });
      const repo = new OrderRepository({ db });
      const got = await repo.findOrdersBySeller('s1', { statuses: ['processing'] });
      assert.deepStrictEqual(got.map((o) => o.id), ['b', 'a'], 'newest first; a row with no method key counts as home delivery; pickup dropped');
      assert.ok(db.calls.some(([t, op, c, v]) => t === 'orders' && op === 'eq' && c === 'seller_id' && v === 's1'), 'filtered by seller in SQL');
      assert.ok(db.calls.some(([t, op, c]) => op === 'in' && c === 'fulfillment_status'), 'and by status');
      assert.ok(!db.calls.some(([t, op, c]) => String(c).includes('_deliveryMethod')), 'but never by the JSON key in SQL');
      assert.deepStrictEqual((await repo.findOrdersBySeller(null, { statuses: ['processing'] })).map((o) => o.id), ['d', 'b', 'a'], 'null seller: everyone');
      assert.deepStrictEqual((await repo.findOrdersBySeller('s1', { statuses: ['processing'], limit: 1 })).map((o) => o.id), ['b']);

      // One unreadable row is skipped (and logged), not allowed to blank the board.
      const logger = require('../../server/shared/logging/logger');
      const broken = row('x', 's1', 'processing', 'HOME_DELIVERY', '2026-10-04T09:59:00Z');
      broken.items = [{ title: 'no listing id' }];
      const warned = [];
      const originalWarn = logger.warn;
      logger.warn = (m) => warned.push(String(m));
      try {
        const withBroken = new OrderRepository({ db: stubDb({ orders: [broken, row('a', 's1', 'processing', 'HOME_DELIVERY', '2026-10-04T09:00:00Z')] }) });
        assert.deepStrictEqual((await withBroken.findOrdersBySeller('s1', { statuses: ['processing'] })).map((o) => o.id), ['a'], 'the good row still comes back');
      } finally {
        logger.warn = originalWarn;
      }
      assert.ok(warned.some((m) => /Skipping unreadable order x/.test(m)), 'and the bad one is named in the log');
    }
    {
      // findLatestByOrders: open beats finished, else the newest finished; absent when none.
      const repo = new DeliveryRepository({ db: null });
      const mk = (id, orderId, status, createdAt) => ({ id, orderId, buyerId: 'b', sellerId: 's', driverId: null, status, pickup: {}, dropoff: {}, createdAt, updatedAt: createdAt });
      await repo.insertDelivery(mk('d1', 'o1', 'cancelled', '2026-10-04T09:00:00Z'));
      await repo.insertDelivery(mk('d2', 'o1', 'assigned', '2026-10-04T08:00:00Z'));
      await repo.insertDelivery(mk('d3', 'o2', 'cancelled', '2026-10-04T07:00:00Z'));
      await repo.insertDelivery(mk('d4', 'o2', 'delivered', '2026-10-04T09:30:00Z'));
      const map = await repo.findLatestByOrders(['o1', 'o2', 'o3', 'o1', null]);
      assert.strictEqual(map.get('o1').id, 'd2', 'the open delivery wins even when older');
      assert.strictEqual(map.get('o2').id, 'd4', 'otherwise the newest finished one');
      assert.strictEqual(map.has('o3'), false, 'no delivery: absent');
      assert.strictEqual((await repo.findLatestByOrders([])).size, 0);
    }

    // ---------------------------------------------------------------- over HTTP
    {
      const w = makeWorld();
      await w.service.registerDriver('rider_1', { name: 'Alain', phone: '+237600000001' }, ADMIN);
      await w.service.registerDriver('rider_2', { name: 'Bruno', phone: '+237600000002' }, ADMIN); // registered, never online
      await w.service.registerDriver('rider_9', { name: 'Zed', phone: '+237600000009', status: 'suspended' }, ADMIN);
      await goOnline(w, 'rider_1');
      await placeOrder(w);
      const fakeAuth = (req, res, next) => {
        const header = req.headers['x-test-user'];
        if (!header) return next(new AuthenticationError('Authentication required.'));
        const [id, role = 'customer'] = String(header).split('|');
        req.principal = { id, primaryRole: role };
        req.userId = id;
        return next();
      };
      const app = express();
      app.use(express.json());
      app.use('/d', createDeliveryRouter({ service: w.service, authenticate: fakeAuth, events: w.events }));
      app.use(errorHandler);
      const server = http.createServer(app);
      await new Promise((r) => server.listen(0, '127.0.0.1', r));
      const base = `http://127.0.0.1:${server.address().port}/d`;
      const get = async (path, user) => {
        const res = await fetch(base + path, { headers: user ? { 'x-test-user': user } : {}, signal: AbortSignal.timeout(8000) });
        let body = null; try { body = await res.json(); } catch (e) { /* none */ }
        return { status: res.status, body };
      };
      try {
        assert.strictEqual((await get('/dispatch')).status, 401, 'needs a session');
        assert.strictEqual((await get('/dispatch', 'buyer_1|customer')).status, 403);
        const ok = await get('/dispatch', 'seller_1|seller');
        assert.strictEqual(ok.status, 200);
        assert.strictEqual(ok.body.data.items.length, 1, 'the envelope carries { items }');
        assert.strictEqual(ok.body.data.items[0].delivery, null);
        assert.strictEqual((await get('/dispatch?view=completed', 'seller_1|seller')).status, 200);
        for (const bad of ['?view=all', '?limit=0', '?limit=101', '?limit=abc', '?view=active&view=completed']) {
          assert.strictEqual((await get('/dispatch' + bad, 'seller_1|seller')).status, 400, `${bad} is a 400`);
        }
        assert.strictEqual((await get('/dispatch?_=1', 'seller_1|seller')).status, 200, 'unknown query keys are ignored');

        assert.strictEqual((await get('/drivers?status=all', 'seller_1|seller')).status, 403, 'a seller cannot read the roster');
        const roster = await get('/drivers?status=all', 'admin_1|admin');
        assert.strictEqual(roster.status, 200);
        assert.deepStrictEqual(roster.body.data.drivers.map((r) => [r.id, r.status, r.presence]),
          [['rider_1', 'active', 'online'], ['rider_2', 'active', 'offline'], ['rider_9', 'suspended', 'suspended']],
          'the roster carries every rider with their presence: registered is not online');
        assert.strictEqual(roster.body.data.drivers[0].lastSeenAt, new Date(w.clock.now()).toISOString(), 'and when the online rider was last heard from');
        assert.strictEqual(roster.body.data.drivers[1].lastSeenAt, null, 'a rider who never went online has never been heard from');
        assert.ok(roster.body.data.drivers.every((r) => !('location' in r) && !('latitude' in r) && !('lat' in r)), 'never a position');
        assert.strictEqual((await get('/drivers?status=banned', 'admin_1|admin')).status, 400);
        const plain = await get('/drivers', 'seller_1|seller');
        assert.deepStrictEqual(plain.body.data.drivers.map((r) => r.id), ['rider_1'],
          'without status: the seller list, which now holds only the rider who is online (rider_2 is offline, rider_9 suspended)');
        assert.ok(!('status' in plain.body.data.drivers[0]), 'which does not carry a status');
        assert.deepStrictEqual(Object.keys(plain.body.data.drivers[0]).sort(), ['id', 'name', 'openDeliveries', 'phone'],
          'a seller is never given presence, last-seen or a position');
        assert.deepStrictEqual(plain.body.data.summary, { registered: 2, available: 1 }, 'with how many riders are registered and how many are available');
      } finally {
        if (server.closeAllConnections) server.closeAllConnections();
        await new Promise((r) => server.close(r));
      }
    }

    console.log('    ✓ Delivery board and roster: roles, filtering, open-over-finished, sweep after auth, HTTP validation hold.');
  } finally {
    NotificationService.create = originalCreate;
    if (!hadSecret) config.supabase.jwtSecret = hadSecret;
  }
}

module.exports = { run };
