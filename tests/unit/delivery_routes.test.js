/**
 * LOUMOO — Delivery HTTP routes and live stream
 * ---------------------------------------------------------------------------
 * Drives the real delivery router over a real HTTP server (with the real error
 * handler and the real compression middleware, which is what buffers an SSE
 * stream if the headers are wrong) on top of the in-memory backends. No database.
 *
 * Authentication is replaced by a header-driven stand-in so the suite needs no
 * identity provider; a structural test pins that the PRODUCTION router puts
 * requireAuth in front of every single route.
 *
 * Riders are only offered work while they are ONLINE (docs/DELIVERY_API.md, "Rider
 * presence"), so the flows below put their riders online through the real
 * POST /driver/presence/online endpoint first, and the world's presence window is
 * the longest the service allows so that it never lapses under the tests that
 * move the clock for other reasons. The presence endpoints themselves (who may
 * call them, what they accept, what they change and what that does to dispatch)
 * have their own section near the end, with its own short window.
 */

require('../setup');

const assert = require('assert');
const http = require('http');
const express = require('express');
const compression = require('compression');
const config = require('../../server/config/env');

const errorHandler = require('../../server/shared/middleware/errorHandler');
const { AuthenticationError } = require('../../server/shared/errors/AppError');
const { requireAuth } = require('../../server/modules/identity/presentation/guards/authGuard');
const productionRouter = require('../../server/modules/delivery/presentation/routes/deliveryRoutes');
const { createDeliveryRouter } = productionRouter;
const { DeliveryService } = require('../../server/modules/delivery/application/DeliveryService');
const { DeliveryRepository } = require('../../server/modules/delivery/infrastructure/DeliveryRepository');
const { DeliveryEvents } = require('../../server/modules/delivery/infrastructure/DeliveryEvents');
const { OrderRepository } = require('../../server/modules/commerce/infrastructure/OrderRepository');
const { Order, FULFILLMENT_STATUS, DELIVERY_METHOD, PAYMENT_STATUS } = require('../../server/modules/commerce/domain/Order');
const { eventForViewer } = require('../../server/modules/delivery/domain/Delivery');

const BUYER = 'buyer_1|customer';
const SELLER = 'seller_1|seller';
const ADMIN = 'admin_1|admin';
const RIDER = 'rider_1|customer';
const RIDER2 = 'rider_2|customer';
const STRANGER = 'stranger_1|customer';
const NEAR = { lat: 4.0511, lng: 9.7679 };

// Header-driven stand-in for requireAuth: "x-test-user: <id>|<role>".
function fakeAuth(req, res, next) {
  const header = req.headers['x-test-user'];
  if (!header) return next(new AuthenticationError('Authentication required.'));
  const [id, role = 'customer'] = String(header).split('|');
  req.principal = { id, primaryRole: role };
  req.userId = id;
  return next();
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// How long a rider may stay silent and still count as online. One hour is the most the service
// allows: used wherever presence is not the subject. The presence section below uses its own.
const LONG_PRESENCE_TTL_MS = 60 * 60 * 1000;

async function waitFor(predicate, what, ms = 3000) {
  const start = Date.now();
  while (Date.now() - start < ms) {
    const v = predicate();
    if (v) return v;
    await sleep(15);
  }
  throw new Error(`Timed out waiting for ${what}`);
}

/** `(method, path, user, body) => { status, body }` against `<base><path>`, with a timeout so a hung response fails the test. */
function requester(base) {
  return async (method, path, user, body) => {
    const res = await fetch(base + path, {
      method,
      headers: { ...(user ? { 'x-test-user': user } : {}), 'content-type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(8000)
    });
    let json = null;
    try { json = await res.json(); } catch (e) { /* no body */ }
    return { status: res.status, body: json };
  };
}

async function main() {
  let t = Date.parse('2026-10-03T10:00:00.000Z');
  const clock = { now: () => t, advance: (ms) => { t += ms; } };
  const orders = new OrderRepository({ db: null });
  const repo = new DeliveryRepository({ db: null });
  const events = new DeliveryEvents();
  const service = new DeliveryService({ repository: repo, orderRepository: orders, events, now: clock.now, presenceTtlMs: LONG_PRESENCE_TTL_MS });

  // Stand-in for the live account lookup the production router performs: lets a
  // test suspend or demote a user while their stream is open.
  const revokedUsers = new Set();
  const demotedUsers = new Set();
  const revalidate = async (who) => {
    if (revokedUsers.has(who.userId)) return null;
    return demotedUsers.has(who.userId) ? { userId: who.userId, userRole: 'customer' } : who;
  };

  const limits = { heartbeatMs: 40, maxStreamMs: 60000, maxStreamsPerUser: 3 };
  const router = createDeliveryRouter({ service, authenticate: fakeAuth, events, revalidate, ...limits });
  const shortLivedRouter = createDeliveryRouter({ service, authenticate: fakeAuth, events, revalidate, heartbeatMs: 40, maxStreamMs: 200, maxStreamsPerUser: 3 });
  const LEAK_HEARTBEAT_MS = 37; // unique, so a leaked heartbeat interval is attributable to these routers
  const leakRouter = createDeliveryRouter({ service, authenticate: fakeAuth, events, revalidate, heartbeatMs: LEAK_HEARTBEAT_MS, maxStreamMs: 60000, maxStreamsPerUser: 50 });
  const noStreamRouter = createDeliveryRouter({ service, authenticate: fakeAuth, events, revalidate, streamSupported: false });

  const app = express();
  app.use(compression({ threshold: 0 })); // as in production: this is what buffers a badly-headed stream
  app.use(express.json());
  app.use('/api/v1/deliveries', router);
  app.use('/short/deliveries', shortLivedRouter);
  app.use('/leak/deliveries', leakRouter);
  app.use('/nostream/deliveries', noStreamRouter);
  app.use(errorHandler);

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const openStreams = [];

  async function call(method, path, user, body) {
    // The timeout matters: if a stream route regressed and answered 200, fetch would
    // wait on the open response forever and stall the whole master test runner.
    const res = await fetch(base + path, {
      method,
      headers: { ...(user ? { 'x-test-user': user } : {}), 'content-type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(8000)
    });
    let json = null;
    try { json = await res.json(); } catch (e) { /* no body */ }
    return { status: res.status, body: json };
  }
  const api = (method, path, user, body) => call(method, `/api/v1/deliveries${path}`, user, body);

  function openStream(path, user) {
    return new Promise((resolve, reject) => {
      const st = { events: [], raw: '', ended: false, status: null, headers: null, buffer: '' };
      const req = http.get(base + path, { headers: { 'x-test-user': user, 'accept-encoding': 'gzip' } }, (res) => {
        st.status = res.statusCode;
        st.headers = res.headers;
        st.res = res;
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
          st.raw += chunk;
          st.buffer += chunk;
          let idx;
          while ((idx = st.buffer.indexOf('\n\n')) !== -1) {
            const block = st.buffer.slice(0, idx);
            st.buffer = st.buffer.slice(idx + 2);
            const ev = { type: 'message', data: null };
            for (const line of block.split('\n')) {
              if (line.startsWith(':')) ev.type = 'comment';
              else if (line.startsWith('event: ')) ev.type = line.slice(7);
              else if (line.startsWith('retry: ')) { ev.type = 'retry'; ev.data = Number(line.slice(7)); }
              else if (line.startsWith('data: ')) ev.data = JSON.parse(line.slice(6));
            }
            st.events.push(ev);
          }
        });
        res.on('end', () => { st.ended = true; });
        res.on('close', () => { st.ended = true; });
        resolve(st);
      });
      st.req = req;
      req.on('error', (err) => { if (!st.ended) reject(err); });
      openStreams.push(st);
    });
  }
  const typesOf = (st) => st.events.filter((e) => e.type !== 'retry' && e.type !== 'comment').map((e) => e.type);
  const closeStream = (st) => { try { st.req.destroy(); } catch (e) { /* gone */ } };

  async function placeOrder(overrides = {}) {
    const order = new Order({
      buyerId: 'buyer_1',
      sellerId: 'seller_1',
      items: [{ listingId: 'lst_1', title: 'Phone', unitPriceXaf: 50000, quantity: 1, sellerId: 'seller_1', storeName: 'Tech Shop' }],
      shippingAddress: { fullName: 'Awa Njoya', phone: '+237622222222', street: 'Rue 1', neighbourhood: 'Bonanjo', city: 'Douala' },
      deliveryMethod: DELIVERY_METHOD.HOME_DELIVERY,
      paymentStatus: PAYMENT_STATUS.PAID,
      fulfillmentStatus: FULFILLMENT_STATUS.PROCESSING,
      ...overrides
    });
    return orders.saveOrder(order);
  }

  async function newAssignedDelivery({ accept = false } = {}) {
    const order = await placeOrder();
    const created = await api('POST', '/', SELLER, { orderId: order.id, dropoffLocation: { lat: 4.0601, lng: 9.7679 } });
    assert.strictEqual(created.status, 201, JSON.stringify(created.body));
    const id = created.body.data.delivery.id;
    assert.strictEqual((await api('POST', `/${id}/assign`, SELLER, { driverId: 'rider_1' })).status, 200);
    if (accept) assert.strictEqual((await api('POST', `/${id}/accept`, RIDER)).status, 200);
    return { order, id };
  }

  // The suite replaces notifications so nothing touches a real table.
  const NotificationService = require('../../server/modules/identity/application/NotificationService');
  const originalCreate = NotificationService.create;
  NotificationService.create = async () => null;
  const hadSecret = config.supabase.jwtSecret;
  if (!hadSecret) config.supabase.jwtSecret = 'unit-test-delivery-secret-0123456789abcdef';

  try {
    // ---------------------------------------------------------- route table
    {
      const table = productionRouter.stack
        .filter((l) => l.route)
        .flatMap((l) => Object.keys(l.route.methods).map((m) => `${m.toUpperCase()} ${l.route.path}`))
        .sort();
      const expected = [
        'GET /drivers', 'GET /dispatch', 'GET /providers', 'GET /providers/following', 'GET /providers/:id', 'GET /providers/:id/riders',
        'POST /drivers/:profileId', 'GET /driver/me', 'GET /by-order/:orderId', 'POST /',
        'GET /:id/stream', 'GET /:id/code', 'GET /:id',
        'POST /:id/assign', 'POST /:id/auto-assign', 'POST /:id/delegate', 'POST /:id/cancel', 'POST /:id/resolve', 'POST /:id/reconcile',
        'POST /:id/accept', 'POST /:id/decline', 'POST /:id/status', 'POST /:id/location', 'POST /:id/complete'
      ].sort();
      assert.deepStrictEqual(table, expected, 'the route table matches docs/DELIVERY_API.md (update both together)');

      // Every production route is behind the real authentication guard.
      for (const layer of productionRouter.stack.filter((l) => l.route)) {
        assert.strictEqual(layer.route.stack[0].handle, requireAuth, `${layer.route.path} must start with requireAuth`);
      }
      // Literal paths come before /:id so "drivers" is never read as a delivery id.
      const order = productionRouter.stack.filter((l) => l.route).map((l) => l.route.path);
      assert.ok(order.indexOf('/drivers') < order.indexOf('/:id'));
      assert.ok(order.indexOf('/driver/me') < order.indexOf('/:id/code'));
      // The rider presence endpoints are literal too, and every one is registered ahead of the
      // parameterised delivery routes, so no future "/:id/..." route can swallow them.
      for (const path of ['/driver/presence', '/driver/presence/online', '/driver/presence/offline', '/driver/presence/pause', '/driver/presence/resume', '/driver/presence/heartbeat']) {
        assert.ok(order.indexOf(path) !== -1, `${path} is registered`);
        for (const param of ['/:id', '/:id/code', '/:id/stream', '/:id/accept', '/:id/location']) {
          assert.ok(order.indexOf(path) < order.indexOf(param), `${path} is registered before ${param}`);
        }
      }
      // Presence has exactly the routes the contract lists: nothing that takes a rider id or a status.
      assert.deepStrictEqual(
        table.filter((r) => /presence/.test(r)),
        ['GET /driver/presence', 'POST /driver/presence/heartbeat', 'POST /driver/presence/offline', 'POST /driver/presence/online', 'POST /driver/presence/pause', 'POST /driver/presence/resume'],
        'presence is /driver/presence/* and carries no rider id in its path'
      );
      assert.ok(!table.some((r) => /presence.*:/.test(r)), 'no presence route has a path parameter, so none can name another rider');
    }

    // The production router really does refuse anonymous callers (no database involved).
    {
      const prodApp = express();
      prodApp.use(express.json());
      prodApp.use('/d', productionRouter);
      prodApp.use(errorHandler);
      const prodServer = http.createServer(prodApp);
      await new Promise((resolve) => prodServer.listen(0, '127.0.0.1', resolve));
      const prodBase = `http://127.0.0.1:${prodServer.address().port}`;
      for (const [method, path] of [
        ['GET', '/drivers'], ['GET', '/x1'], ['POST', '/'], ['GET', '/x1/stream'], ['POST', '/x1/location'], ['GET', '/x1/code'],
        ['GET', '/driver/presence'], ['POST', '/driver/presence/online'], ['POST', '/driver/presence/offline'],
        ['POST', '/driver/presence/pause'], ['POST', '/driver/presence/resume'], ['POST', '/driver/presence/heartbeat']
      ]) {
        const res = await fetch(prodBase + '/d' + path, { method, headers: { 'content-type': 'application/json' }, body: method === 'POST' ? '{}' : undefined });
        assert.strictEqual(res.status, 401, `${method} ${path} without a session is 401`);
      }
      await new Promise((resolve) => prodServer.close(resolve));
    }

    // ------------------------------------------------------- authentication
    for (const [method, path] of [
      ['GET', '/drivers'], ['GET', '/driver/me'], ['GET', '/dlv_x'], ['POST', '/'], ['POST', '/dlv_x/location'],
      ['GET', '/driver/presence'], ['POST', '/driver/presence/online'], ['POST', '/driver/presence/offline'],
      ['POST', '/driver/presence/pause'], ['POST', '/driver/presence/resume'], ['POST', '/driver/presence/heartbeat']
    ]) {
      const r = await api(method, path, null, method === 'POST' ? {} : undefined);
      assert.strictEqual(r.status, 401, `${method} ${path} needs a session`);
      assert.strictEqual(r.body.error.code, 'UNAUTHENTICATED');
    }

    // ---------------------------------------------------------------- riders
    assert.strictEqual((await api('POST', '/drivers/rider_1', SELLER, { name: 'Alain', phone: '+237600000001' })).status, 403, 'only admins register riders');
    assert.strictEqual((await api('POST', '/drivers/rider_1', ADMIN, { name: 'Alain', phone: '+237600000001', role: 'admin' })).status, 400, 'unknown keys are rejected');
    assert.strictEqual((await api('POST', '/drivers/rider_1', ADMIN, { name: 'Alain', phone: '+237600000001', status: 'banished' })).status, 400, 'status must be a known value');
    const registered = await api('POST', '/drivers/rider_1', ADMIN, { name: 'Alain', phone: '+237600000001' });
    assert.strictEqual(registered.status, 200);
    assert.strictEqual(registered.body.data.driver.status, 'active');
    await api('POST', '/drivers/rider_2', ADMIN, { name: 'Bruno', phone: '+237600000002' });

    // Registered is not available: with nobody online there is nobody to pick, and the answer says
    // how many riders exist, so a screen can say "nobody is online" instead of "no riders yet".
    const nobody = await api('GET', '/drivers', SELLER);
    assert.strictEqual(nobody.status, 200, '/drivers is the rider list, not a delivery called "drivers"');
    assert.deepStrictEqual(nobody.body.data.drivers, [], 'two riders are registered and neither is online: nobody can be picked');
    assert.deepStrictEqual(nobody.body.data.summary, { registered: 2, available: 0 });

    // The riders open the app and go online, over the real endpoint.
    const wentOnline = await api('POST', '/driver/presence/online', RIDER, {});
    assert.strictEqual(wentOnline.status, 200, JSON.stringify(wentOnline.body));
    assert.strictEqual(wentOnline.body.success, true);
    assert.strictEqual(wentOnline.body.data.presence.status, 'online');
    assert.strictEqual(wentOnline.body.data.presence.available, true);
    const wentOnline2 = await api('POST', '/driver/presence/online', RIDER2, { ...NEAR, accuracyM: 12 });
    assert.strictEqual(wentOnline2.status, 200, JSON.stringify(wentOnline2.body));
    assert.deepStrictEqual(wentOnline2.body.data.presence.location, { ...NEAR, accuracyM: 12 }, 'the rider sees the position they sent');

    const listed = await api('GET', '/drivers', SELLER);
    assert.strictEqual(listed.status, 200);
    assert.deepStrictEqual(listed.body.data.drivers.map((d) => d.id).sort(), ['rider_1', 'rider_2']);
    assert.deepStrictEqual(listed.body.data.summary, { registered: 2, available: 2 });
    for (const d of listed.body.data.drivers) {
      assert.deepStrictEqual(Object.keys(d).sort(), ['id', 'name', 'openDeliveries', 'phone'], 'a seller picks from names and workload: never a rider\'s position or presence record');
    }
    assert.strictEqual((await api('GET', '/drivers', BUYER)).status, 403, 'customers cannot list riders');
    assert.strictEqual((await api('GET', '/driver/me', STRANGER)).status, 403, 'non-riders have no rider overview');

    // ---------------------------------------------------------------- create
    const order = await placeOrder();
    assert.strictEqual((await api('POST', '/', SELLER, {})).status, 400, 'orderId is required');
    assert.strictEqual((await api('POST', '/', SELLER, { orderId: order.id, buyerId: 'attacker' })).status, 400, 'privileged fields are refused');
    assert.strictEqual((await api('POST', '/', SELLER, { orderId: order.id, status: 'delivered' })).status, 400, 'status cannot be injected on create');
    assert.strictEqual((await api('POST', '/', SELLER, { orderId: order.id, dropoffLocation: { lat: 1, lng: 2, alt: 3 } })).status, 400, 'strict nested objects');
    assert.strictEqual((await api('POST', '/', SELLER, { orderId: order.id, dropoffLocation: { lat: 95, lng: 0 } })).status, 400, 'range errors come from the service');
    assert.strictEqual((await api('POST', '/', STRANGER, { orderId: order.id })).status, 404, 'a stranger gets 404');
    const created = await api('POST', '/', SELLER, { orderId: order.id, dropoffLocation: { lat: 4.0601, lng: 9.7679 } });
    assert.strictEqual(created.status, 201);
    assert.strictEqual(created.body.success, true);
    const deliveryId = created.body.data.delivery.id;
    assert.strictEqual(created.body.data.delivery.status, 'pending_assignment');
    assert.strictEqual(created.body.data.delivery.viewerRole, 'seller');
    const dup = await api('POST', '/', SELLER, { orderId: order.id });
    assert.strictEqual(dup.status, 409, 'one open delivery per order');
    assert.strictEqual(dup.body.error.code, 'CONFLICT');

    // ----------------------------------------------------------------- reads
    assert.strictEqual((await api('GET', `/${deliveryId}`, STRANGER)).status, 404);
    assert.strictEqual((await api('GET', '/dlv_nope', BUYER)).status, 404);
    const buyerView = await api('GET', `/${deliveryId}`, BUYER);
    assert.strictEqual(buyerView.status, 200);
    assert.strictEqual(buyerView.body.data.delivery.viewerRole, 'buyer');
    assert.strictEqual((await api('GET', `/by-order/${order.id}`, BUYER)).body.data.delivery.id, deliveryId);
    assert.strictEqual((await api('GET', `/by-order/${order.orderNumber}`, SELLER)).body.data.delivery.id, deliveryId, 'order number works');
    assert.strictEqual((await api('GET', `/by-order/${order.id}`, STRANGER)).status, 404);

    // ---------------------------------------------------------------- assign
    assert.strictEqual((await api('POST', `/${deliveryId}/assign`, BUYER, { driverId: 'rider_1' })).status, 403);
    assert.strictEqual((await api('POST', `/${deliveryId}/assign`, SELLER, {})).status, 400);
    assert.strictEqual((await api('POST', `/${deliveryId}/assign`, SELLER, { driverId: 'rider_1', status: 'delivered' })).status, 400, 'no status injection on assign');
    assert.strictEqual((await api('POST', `/${deliveryId}/assign`, SELLER, { driverId: 'ghost' })).status, 400);
    const assigned = await api('POST', `/${deliveryId}/assign`, SELLER, { driverId: 'rider_1' });
    assert.strictEqual(assigned.status, 200);
    assert.strictEqual(assigned.body.data.delivery.driver.id, 'rider_1');

    // ----------------------------------------------------------- rider flow
    const mine = await api('GET', '/driver/me', RIDER);
    assert.strictEqual(mine.status, 200);
    assert.deepStrictEqual(mine.body.data.deliveries.map((d) => d.id), [deliveryId]);
    assert.deepStrictEqual(Object.keys(mine.body.data.deliveries[0].dropoff).sort(), ['area', 'location'], 'before accepting, a coarse drop-off only');
    assert.strictEqual(mine.body.data.presence.status, 'online', 'holding only an offer, the rider is still online');

    assert.strictEqual((await api('POST', `/${deliveryId}/accept`, STRANGER)).status, 404);
    assert.strictEqual((await api('POST', `/${deliveryId}/accept`, SELLER)).status, 403);
    assert.strictEqual((await api('POST', `/${deliveryId}/accept`, RIDER, { surprise: true })).status, 200, 'accept takes no body, extra keys on an empty action are ignored');
    assert.strictEqual((await api('POST', `/${deliveryId}/accept`, RIDER)).status, 409, 'second accept conflicts');
    const carrying = await api('GET', '/driver/presence', RIDER);
    assert.strictEqual(carrying.body.data.presence.status, 'busy', 'accepting made the rider busy');
    assert.strictEqual(carrying.body.data.presence.available, false);
    assert.strictEqual((await api('GET', '/drivers', SELLER)).body.data.drivers.some((d) => d.id === 'rider_1'), false, 'and a busy rider is not offered to the next seller');

    assert.strictEqual((await api('POST', `/${deliveryId}/location`, RIDER, { lat: 'x', lng: 1 })).status, 400);
    assert.strictEqual((await api('POST', `/${deliveryId}/location`, RIDER, { ...NEAR, owner: 'me' })).status, 400, 'strict');
    assert.strictEqual((await api('POST', `/${deliveryId}/location`, RIDER, { ...NEAR, accuracyM: 900 })).status, 400, 'poor GPS fix refused');
    assert.strictEqual((await api('POST', `/${deliveryId}/location`, BUYER, { ...NEAR })).status, 403);
    const ping = await api('POST', `/${deliveryId}/location`, RIDER, { ...NEAR, speedKmh: 18, heading: 45, accuracyM: 8 });
    assert.strictEqual(ping.status, 200);
    assert.strictEqual(ping.body.data.accepted, true);
    clock.advance(1000);
    const throttled = await api('POST', `/${deliveryId}/location`, RIDER, { ...NEAR });
    assert.strictEqual(throttled.status, 200, 'an ignored ping is not an error');
    assert.deepStrictEqual(throttled.body.data, { accepted: false, reason: 'throttled' });

    assert.strictEqual((await api('POST', `/${deliveryId}/status`, RIDER, { status: 'delivered' })).status, 400, 'a rider cannot self-report delivered');
    assert.strictEqual((await api('POST', `/${deliveryId}/status`, RIDER, {})).status, 400);
    clock.advance(5000);
    const picked = await api('POST', `/${deliveryId}/status`, RIDER, { status: 'picked_up' });
    assert.strictEqual(picked.status, 200);
    assert.strictEqual((await orders.findOrderById(order.id)).fulfillmentStatus, FULFILLMENT_STATUS.IN_TRANSIT, 'pickup moved the order through the route');
    assert.strictEqual((await api('POST', `/${deliveryId}/status`, RIDER, { status: 'arrived' })).status, 200);

    // ----------------------------------------------------- handover & finish
    assert.strictEqual((await api('GET', `/${deliveryId}/code`, SELLER)).status, 403);
    assert.strictEqual((await api('GET', `/${deliveryId}/code`, STRANGER)).status, 404);
    const codeRes = await api('GET', `/${deliveryId}/code`, BUYER);
    assert.strictEqual(codeRes.status, 200);
    const code = codeRes.body.data.code;
    assert.ok(/^\d{4}$/.test(code));
    assert.strictEqual(codeRes.body.data.digits, 4);
    const wrong = String((Number(code) + 1) % 10000).padStart(4, '0');
    assert.strictEqual((await api('POST', `/${deliveryId}/complete`, RIDER, {})).status, 400);
    assert.strictEqual((await api('POST', `/${deliveryId}/complete`, RIDER, { code: 'abcd' })).status, 400);
    assert.strictEqual((await api('POST', `/${deliveryId}/complete`, RIDER, { code: wrong })).status, 400, 'wrong code');
    assert.strictEqual((await api('POST', `/${deliveryId}/complete`, BUYER, { code })).status, 403, 'the buyer cannot complete');
    const done = await api('POST', `/${deliveryId}/complete`, RIDER, { code });
    assert.strictEqual(done.status, 200);
    assert.strictEqual(done.body.data.delivery.status, 'delivered');
    assert.strictEqual((await orders.findOrderById(order.id)).fulfillmentStatus, FULFILLMENT_STATUS.DELIVERED);
    assert.strictEqual((await api('POST', `/${deliveryId}/complete`, RIDER, { code })).status, 409, 'replay refused');
    const free = await api('GET', '/driver/presence', RIDER);
    assert.strictEqual(free.body.data.presence.status, 'online', 'handing the parcel over gave the rider back: busy -> online');
    assert.strictEqual(free.body.data.presence.available, true);

    // --------------------------------------- 423 reaches the client as a 423
    {
      const { id } = await newAssignedDelivery({ accept: true });
      clock.advance(5000);
      await api('POST', `/${id}/location`, RIDER, { ...NEAR });
      clock.advance(5000);
      await api('POST', `/${id}/status`, RIDER, { status: 'picked_up' });
      await api('POST', `/${id}/status`, RIDER, { status: 'arrived' });
      const real = (await api('GET', `/${id}/code`, BUYER)).body.data.code;
      const bad = String((Number(real) + 1) % 10000).padStart(4, '0');
      let last;
      for (let i = 0; i < 5; i += 1) last = await api('POST', `/${id}/complete`, RIDER, { code: bad });
      assert.strictEqual(last.status, 423, 'the fifth wrong code locks the delivery with a real 423');
      assert.strictEqual(last.body.error.code, 'DELIVERY_LOCKED');
      assert.strictEqual((await api('POST', `/${id}/complete`, RIDER, { code: real })).status, 423, 'even the right code is refused');
      assert.strictEqual((await api('POST', `/${id}/status`, RIDER, { status: 'failed', note: 'escape' })).status, 423, 'and failing is not an escape');

      assert.strictEqual((await api('POST', `/${id}/resolve`, SELLER, { action: 'unlock' })).status, 403);
      assert.strictEqual((await api('POST', `/${id}/resolve`, ADMIN, { action: 'wipe' })).status, 400);
      assert.strictEqual((await api('POST', `/${id}/resolve`, ADMIN, { action: 'unlock', extra: 1 })).status, 400);
      assert.strictEqual((await api('POST', `/${id}/resolve`, ADMIN, { action: 'unlock' })).status, 200);
      const fresh = (await api('GET', `/${id}/code`, BUYER)).body.data;
      assert.strictEqual(fresh.attemptsRemaining, 5);
      assert.strictEqual((await api('POST', `/${id}/complete`, RIDER, { code: fresh.code })).status, 200);
      assert.strictEqual((await api('POST', `/${id}/reconcile`, SELLER)).status, 403);
      assert.strictEqual((await api('POST', `/${id}/reconcile`, ADMIN)).status, 200);
    }

    // ---------------------------------------------------- cancel / decline
    {
      const { id } = await newAssignedDelivery();
      assert.strictEqual((await api('POST', `/${id}/cancel`, BUYER, {})).status, 403, 'the buyer cannot cancel once a rider is assigned');
      assert.strictEqual((await api('POST', `/${id}/cancel`, SELLER, { reason: 'x', nope: 1 })).status, 400);
      const declined = await api('POST', `/${id}/decline`, RIDER);
      assert.strictEqual(declined.status, 200);
      assert.deepStrictEqual(declined.body.data.delivery, { id, status: 'pending_assignment' });
      const cancelled = await api('POST', `/${id}/cancel`, BUYER, { reason: 'Changed my mind' });
      assert.strictEqual(cancelled.status, 200, 'the buyer may cancel while nobody is assigned');
      assert.strictEqual(cancelled.body.data.delivery.status, 'cancelled');
    }

    // ------------------------------------------------------------ the stream
    {
      assert.strictEqual((await api('GET', '/dlv_nope/stream', BUYER)).status, 404);
      const { id } = await newAssignedDelivery();
      assert.strictEqual((await api('GET', `/${id}/stream`, STRANGER)).status, 404, 'strangers cannot stream');
      assert.strictEqual((await api('GET', `/${id}/stream`, null)).status, 401);

      const buyerStream = await openStream(`/api/v1/deliveries/${id}/stream`, BUYER);
      const sellerStream = await openStream(`/api/v1/deliveries/${id}/stream`, SELLER);
      assert.strictEqual(buyerStream.status, 200);
      assert.ok(/text\/event-stream/.test(buyerStream.headers['content-type']));
      assert.ok(/no-transform/.test(buyerStream.headers['cache-control']), 'no-transform keeps the compression middleware from buffering the stream');
      assert.strictEqual(buyerStream.headers['content-encoding'], undefined, 'the stream is not compressed');
      await waitFor(() => typesOf(buyerStream).includes('status'), 'the buyer snapshot');
      const snap = buyerStream.events.find((e) => e.type === 'status').data;
      assert.strictEqual(snap.status, 'assigned');
      assert.ok(buyerStream.events.some((e) => e.type === 'retry'), 'the client is told how long to wait before reconnecting');
      await waitFor(() => buyerStream.events.some((e) => e.type === 'comment'), 'a keep-alive comment');

      // Accept: both see it. Position before pickup: the seller sees it, the buyer does not.
      await api('POST', `/${id}/accept`, RIDER);
      await waitFor(() => buyerStream.events.some((e) => e.type === 'status' && e.data.status === 'accepted'), 'accepted on the buyer stream');
      clock.advance(5000);
      await api('POST', `/${id}/location`, RIDER, { ...NEAR, speedKmh: 20 });
      await waitFor(() => sellerStream.events.some((e) => e.type === 'location'), 'the seller sees the rider');
      await sleep(80);
      assert.ok(!typesOf(buyerStream).includes('location'), 'the buyer is NOT sent the rider position before pickup');
      assert.ok(!typesOf(buyerStream).includes('eta'));

      // After pickup the buyer gets position and ETA too.
      clock.advance(5000);
      await api('POST', `/${id}/status`, RIDER, { status: 'picked_up' });
      await waitFor(() => buyerStream.events.some((e) => e.type === 'status' && e.data.status === 'picked_up'), 'picked_up');
      // Move the rider ~0.65 km closer over 30 s (78 km/h: plausible), so the ETA actually changes.
      clock.advance(30000);
      await api('POST', `/${id}/location`, RIDER, { lat: 4.057, lng: 9.7679 });
      const live = await waitFor(() => buyerStream.events.find((e) => e.type === 'location'), 'a live position for the buyer');
      assert.strictEqual(live.data.lat, 4.057);
      assert.strictEqual(live.data.status, undefined, 'internal fields are not on the wire');
      await waitFor(() => buyerStream.events.some((e) => e.type === 'eta' && e.data.etaMinutes >= 1), 'an ETA for the buyer');

      // Connecting late still yields the current state, including the last position.
      const late = await openStream(`/api/v1/deliveries/${id}/stream`, BUYER);
      await waitFor(() => typesOf(late).includes('location'), 'the snapshot includes the last position');
      assert.strictEqual(late.events.find((e) => e.type === 'status').data.status, 'picked_up');
      closeStream(late);

      // Finishing the delivery ends every stream.
      await api('POST', `/${id}/status`, RIDER, { status: 'arrived' });
      const realCode = (await api('GET', `/${id}/code`, BUYER)).body.data.code;
      await api('POST', `/${id}/complete`, RIDER, { code: realCode });
      await waitFor(() => buyerStream.events.some((e) => e.type === 'end'), 'the end event');
      assert.strictEqual(buyerStream.events.find((e) => e.type === 'end').data.reason, 'complete');
      assert.ok(buyerStream.events.some((e) => e.type === 'status' && e.data.status === 'delivered'), 'the final status is delivered before the end');
      await waitFor(() => buyerStream.ended && sellerStream.ended, 'both streams to close');

      // A finished delivery: snapshot, then immediately closed.
      const after = await openStream(`/api/v1/deliveries/${id}/stream`, BUYER);
      await waitFor(() => after.ended, 'a finished delivery stream to close');
      assert.deepStrictEqual(typesOf(after).slice(-2), ['status', 'end']);
      assert.strictEqual(events.listenerCount(id), 0, 'nothing stays subscribed once a delivery\'s streams have all ended');
    }

    // A replaced rider loses their stream.
    {
      const { id } = await newAssignedDelivery();
      const riderStream = await openStream(`/api/v1/deliveries/${id}/stream`, RIDER);
      await waitFor(() => typesOf(riderStream).includes('status'), 'the rider snapshot');
      assert.strictEqual((await api('POST', `/${id}/assign`, SELLER, { driverId: 'rider_2' })).status, 200);
      await waitFor(() => riderStream.events.some((e) => e.type === 'end'), 'the access-revoked end');
      assert.strictEqual(riderStream.events.find((e) => e.type === 'end').data.reason, 'access_revoked');
      await waitFor(() => riderStream.ended, 'the replaced rider stream to close');
    }

    // Per-user cap, and the slot is released when a stream closes.
    {
      const { id } = await newAssignedDelivery();
      const held = [];
      for (let i = 0; i < limits.maxStreamsPerUser; i += 1) {
        const st = await openStream(`/api/v1/deliveries/${id}/stream`, BUYER);
        await waitFor(() => typesOf(st).includes('status'), `stream ${i + 1} to open`);
        held.push(st);
      }
      assert.strictEqual(router.openStreamCount(), limits.maxStreamsPerUser, 'the router counts open streams');
      const over = await api('GET', `/${id}/stream`, BUYER);
      assert.strictEqual(over.status, 429, 'a 4th concurrent stream is refused');
      assert.strictEqual(over.body.error.code, 'RATE_LIMITED');
      const otherUser = await openStream(`/api/v1/deliveries/${id}/stream`, SELLER);
      assert.strictEqual(otherUser.status, 200, 'the cap is per user, not global');
      held.push(otherUser);
      // 3 buyer streams + 1 seller stream are open; closing one frees exactly one slot.
      closeStream(held[0]);
      await waitFor(() => router.openStreamCount() === limits.maxStreamsPerUser, 'the closed stream to release its slot');
      const reopened = await openStream(`/api/v1/deliveries/${id}/stream`, BUYER);
      assert.strictEqual(reopened.status, 200, 'after a stream closes, the user can open another');
      await waitFor(() => typesOf(reopened).includes('status'), 'the reopened stream snapshot');
      held.push(reopened);
      for (const st of held.slice(1)) closeStream(st);
    }

    // Streams have a maximum life; the client reconnects.
    {
      const { id } = await newAssignedDelivery();
      const st = await openStream(`/short/deliveries/${id}/stream`, BUYER);
      await waitFor(() => st.events.some((e) => e.type === 'end'), 'the lifetime end', 2000);
      assert.strictEqual(st.events.find((e) => e.type === 'end').data.reason, 'timeout');
      await waitFor(() => st.ended, 'the stream to close after its lifetime');
    }

    // The live account is re-checked while a stream is open (suspension, deletion, demotion).
    {
      const { id } = await newAssignedDelivery();
      const buyerStream = await openStream(`/api/v1/deliveries/${id}/stream`, BUYER);
      await waitFor(() => typesOf(buyerStream).includes('status'), 'a buyer snapshot');
      revokedUsers.add('buyer_1'); // the account is suspended after the stream opened
      await waitFor(() => buyerStream.events.some((e) => e.type === 'end'), 'the revocation to close the stream', 2000);
      assert.strictEqual(buyerStream.events.find((e) => e.type === 'end').data.reason, 'access_revoked');
      revokedUsers.delete('buyer_1');

      const adminStream = await openStream(`/api/v1/deliveries/${id}/stream`, ADMIN);
      await waitFor(() => typesOf(adminStream).includes('status'), 'an admin snapshot');
      demotedUsers.add('admin_1'); // demoted: no longer an admin, and not a participant either
      await waitFor(() => adminStream.events.some((e) => e.type === 'end'), 'the demotion to close the stream', 2000);
      assert.strictEqual(adminStream.events.find((e) => e.type === 'end').data.reason, 'access_revoked', 'a demoted admin keeps nothing from their old role');
      demotedUsers.delete('admin_1');
    }

    // Slot reservation is race-free: a burst of simultaneous connects cannot exceed the cap.
    {
      const { id } = await newAssignedDelivery();
      await waitFor(() => router.openStreamCount() === 0, 'earlier streams to be released before the burst');
      const burst = await Promise.all(Array.from({ length: limits.maxStreamsPerUser + 2 }, () => openStream(`/api/v1/deliveries/${id}/stream`, BUYER)));
      const statuses = burst.map((b) => b.status).sort();
      assert.strictEqual(statuses.filter((c) => c === 200).length, limits.maxStreamsPerUser, 'exactly the cap is admitted');
      assert.strictEqual(statuses.filter((c) => c === 429).length, 2, 'the rest are refused');
      burst.forEach(closeStream);
      await waitFor(() => router.openStreamCount() === 0, 'the burst streams to be released');
      assert.strictEqual(events.listenerCount(id), 0, 'no subscription outlives its stream');
    }

    // A client that leaves while the snapshot is still loading leaks nothing.
    {
      const { id } = await newAssignedDelivery();
      const original = service.getDelivery.bind(service);
      service.getDelivery = async (...args) => { const r = await original(...args); await sleep(200); return r; };
      try {
        const st = await openStream(`/api/v1/deliveries/${id}/stream`, BUYER).catch(() => null);
        // the response has not started (snapshot pending); abandon the request
        const pending = new Promise((resolve) => setTimeout(resolve, 60));
        await pending;
        if (st) closeStream(st);
        await sleep(350);
      } finally {
        service.getDelivery = original;
      }
      assert.strictEqual(router.openStreamCount(), 0, 'the reserved slot is released when the client disconnects mid-snapshot');
      assert.strictEqual(events.listenerCount(id), 0, 'and so is the subscription');
    }

    // A terminal event that lands while the snapshot is loading ends the stream
    // cleanly and does NOT leave a heartbeat timer running behind it.
    {
      const liveHeartbeats = new Set();
      const realSetInterval = global.setInterval;
      const realClearInterval = global.clearInterval;
      global.setInterval = (fn, ms, ...rest) => {
        const handle = realSetInterval(fn, ms, ...rest);
        if (ms === LEAK_HEARTBEAT_MS) liveHeartbeats.add(handle);
        return handle;
      };
      global.clearInterval = (handle) => { liveHeartbeats.delete(handle); return realClearInterval(handle); };

      const original = service.getDelivery.bind(service);
      let slow = true;
      service.getDelivery = async (...args) => { const r = await original(...args); if (slow) await sleep(250); return r; };
      try {
        const { id } = await newAssignedDelivery();
        const streamPromise = openStream(`/leak/deliveries/${id}/stream`, BUYER);
        await sleep(60); // the snapshot was read (non-terminal) and is being held back
        slow = false;
        assert.strictEqual((await api('POST', `/${id}/cancel`, SELLER, { reason: 'while you were connecting' })).status, 200);
        const st = await streamPromise;
        await waitFor(() => st.ended, 'the stream to end after the buffered terminal event', 3000);
        assert.strictEqual(st.events.find((e) => e.type === 'end').data.reason, 'complete');
        await sleep(2 * LEAK_HEARTBEAT_MS + 20);
        assert.strictEqual(liveHeartbeats.size, 0, 'no heartbeat interval survives an ended stream');
        assert.ok(!st.events.some((e) => e.type === 'comment'), 'and no keep-alive was ever written to the closed stream');
      } finally {
        service.getDelivery = original;
        global.setInterval = realSetInterval;
        global.clearInterval = realClearInterval;
      }
      assert.strictEqual(leakRouter.openStreamCount(), 0);
    }

    // A GET that carries a body (read by express.json()) still gets its stream, not a hung response.
    {
      const { id } = await newAssignedDelivery();
      const st = await new Promise((resolve, reject) => {
        // A regression here means NO response at all, so the test itself must not wait forever.
        const hung = setTimeout(() => reject(new Error('a GET carrying a body was left hanging with no response')), 3000);
        const state = { events: [], buffer: '', ended: false, status: null };
        const req = http.request(`${base}/api/v1/deliveries/${id}/stream`, {
          method: 'GET',
          headers: { 'x-test-user': BUYER, 'content-type': 'application/json', 'content-length': 2 }
        }, (res) => {
          clearTimeout(hung);
          state.status = res.statusCode;
          state.res = res;
          res.setEncoding('utf8');
          res.on('data', (c) => { state.buffer += c; if (/event: status/.test(state.buffer)) state.sawStatus = true; });
          res.on('close', () => { state.ended = true; });
          resolve(state);
        });
        state.req = req;
        req.on('error', (e) => { if (!state.ended) reject(e); });
        req.write('{}');
        req.end();
        openStreams.push(state);
      });
      assert.strictEqual(st.status, 200, 'a GET with a body is answered');
      await waitFor(() => st.sawStatus, 'the snapshot on a GET-with-body stream');
      closeStream(st);
    }

    // Serverless runtimes answer at once instead of hanging.
    {
      const { id } = await newAssignedDelivery();
      const started = Date.now();
      const res = await call('GET', `/nostream/deliveries/${id}/stream`, BUYER);
      assert.strictEqual(res.status, 501);
      assert.strictEqual(res.body.error.code, 'STREAM_UNSUPPORTED');
      assert.ok(Date.now() - started < 1500, 'it answers immediately');
      assert.strictEqual((await call('GET', `/nostream/deliveries/${id}`, BUYER)).status, 200, 'polling the same delivery still works');
      assert.strictEqual(noStreamRouter.openStreamCount(), 0, 'no slot is ever reserved');
      assert.strictEqual((await call('GET', `/nostream/deliveries/${id}/stream`, null)).status, 401, 'unauthenticated callers still get 401, not 501');
      assert.strictEqual((await call('GET', `/nostream/deliveries/dlv_nope/stream`, BUYER)).status, 501, 'the unsupported answer does not depend on the delivery');
      assert.ok(productionRouter.isServerlessRuntime({ AWS_LAMBDA_FUNCTION_NAME: 'api' }));
      assert.ok(productionRouter.isServerlessRuntime({ NETLIFY: 'true' }));
      assert.ok(productionRouter.isServerlessRuntime({ VERCEL: '1' }));
      assert.ok(!productionRouter.isServerlessRuntime({}));
    }

    // Graceful shutdown ends every open stream with a reason.
    {
      const { id } = await newAssignedDelivery();
      const a = await openStream(`/api/v1/deliveries/${id}/stream`, BUYER);
      const b = await openStream(`/api/v1/deliveries/${id}/stream`, SELLER);
      await waitFor(() => typesOf(a).includes('status') && typesOf(b).includes('status'), 'both snapshots');
      router.closeAllStreams('server_restart');
      await waitFor(() => a.ended && b.ended, 'both streams to close on shutdown');
      assert.strictEqual(a.events.find((e) => e.type === 'end').data.reason, 'server_restart');
      assert.strictEqual(b.events.find((e) => e.type === 'end').data.reason, 'server_restart');
      assert.strictEqual(router.openStreamCount(), 0);
      router.closeAllStreams(); // idempotent with nothing open
    }

    // Validation details are bounded and flat.
    {
      const junk = Object.fromEntries(Array.from({ length: 60 }, (_, i) => [`junk${i}`, i]));
      const res = await api('POST', '/', SELLER, { orderId: 'x', ...junk });
      assert.strictEqual(res.status, 400);
      const details = res.body.error.details;
      assert.ok(Array.isArray(details) && details.length <= 5, `details are capped (${details && details.length})`);
      for (const d of details) {
        assert.deepStrictEqual(Object.keys(d).sort(), ['field', 'message']);
        assert.ok(String(d.message).length <= 200);
      }
      assert.ok(JSON.stringify(res.body).length < 2000, 'the error body stays small whatever the client sent');
    }

    // Editing a rider never silently reactivates a suspended one.
    {
      await api('POST', '/drivers/rider_suspended', ADMIN, { name: 'Chris', phone: '+237600000003', status: 'suspended' });
      const edited = await api('POST', '/drivers/rider_suspended', ADMIN, { name: 'Chris N.', phone: '+237600000003' });
      assert.strictEqual(edited.status, 200);
      assert.strictEqual(edited.body.data.driver.status, 'suspended', 'omitting status leaves it suspended');
      assert.strictEqual(edited.body.data.driver.name, 'Chris N.', 'but the edit applied');
      const reactivated = await api('POST', '/drivers/rider_suspended', ADMIN, { name: 'Chris N.', phone: '+237600000003', status: 'active' });
      assert.strictEqual(reactivated.body.data.driver.status, 'active', 'reactivating takes an explicit status');
      const brandNew = await api('POST', '/drivers/rider_fresh', ADMIN, { name: 'Dan', phone: '+237600000004' });
      assert.strictEqual(brandNew.body.data.driver.status, 'active', 'a new rider starts active');
    }

    // Every stream has been released.
    for (const st of openStreams) closeStream(st);
    await waitFor(() => router.openStreamCount() === 0 && shortLivedRouter.openStreamCount() === 0, 'all streams to be released', 4000);

    // ------------------------------------------------ eventForViewer, directly
    {
      const loc = { type: 'location', status: 'accepted', lat: 1, lng: 2, at: 't', speedKmh: 3, heading: 4 };
      assert.strictEqual(eventForViewer(loc, 'buyer'), null, 'buyer: no position before pickup');
      assert.deepStrictEqual(eventForViewer(loc, 'seller'), { lat: 1, lng: 2, at: 't', speedKmh: 3, heading: 4 });
      assert.deepStrictEqual(eventForViewer({ ...loc, status: 'picked_up' }, 'buyer'), { lat: 1, lng: 2, at: 't', speedKmh: 3, heading: 4 });
      assert.strictEqual(eventForViewer({ type: 'eta', status: 'assigned', etaMinutes: 3, distanceKm: 1 }, 'buyer'), null);
      assert.deepStrictEqual(eventForViewer({ type: 'eta', status: 'arrived', etaMinutes: 0, distanceKm: 0 }, 'buyer'), { etaMinutes: 0, distanceKm: 0 });
      assert.deepStrictEqual(
        eventForViewer({ type: 'status', status: 'accepted', at: 't', etaMinutes: 9, distanceKm: 2 }, 'buyer'),
        { status: 'accepted', at: 't', etaMinutes: null, distanceKm: null },
        'a buyer status event before pickup carries no ETA'
      );
      assert.strictEqual(eventForViewer({ type: 'status', status: 'accepted', at: 't', etaMinutes: 9, distanceKm: 2 }, 'driver').etaMinutes, 9);
      assert.strictEqual(eventForViewer({ type: 'mystery', status: 'accepted' }, 'seller'), null, 'unknown event types are dropped');
      assert.strictEqual(eventForViewer(null, 'seller'), null);
      assert.strictEqual(eventForViewer({}, 'seller'), null);
    }

    // -------------------------------- dispatch: auto-assign, rider list, offer expiry
    // Its own server and repositories: auto-assign ranks every active rider, so the
    // riders and deliveries the sections above left behind must not skew it.
    {
      const ordersD = new OrderRepository({ db: null });
      const repoD = new DeliveryRepository({ db: null });
      const eventsD = new DeliveryEvents();
      const OFFER_MS = 15 * 60 * 1000;
      const serviceD = new DeliveryService({ repository: repoD, orderRepository: ordersD, events: eventsD, now: clock.now, offerTtlMs: OFFER_MS, presenceTtlMs: LONG_PRESENCE_TTL_MS });
      const appD = express();
      appD.use(express.json());
      appD.use('/d', createDeliveryRouter({ service: serviceD, authenticate: fakeAuth, events: eventsD, revalidate }));
      appD.use(errorHandler);
      const serverD = http.createServer(appD);
      await new Promise((resolve) => serverD.listen(0, '127.0.0.1', resolve));
      const baseD = `http://127.0.0.1:${serverD.address().port}`;
      const OTHER_SELLER = 'seller_2|seller';
      const d = async (method, path, user, body) => {
        const res = await fetch(`${baseD}/d${path}`, {
          method,
          headers: { ...(user ? { 'x-test-user': user } : {}), 'content-type': 'application/json' },
          body: body === undefined ? undefined : JSON.stringify(body),
          signal: AbortSignal.timeout(8000)
        });
        let json = null;
        try { json = await res.json(); } catch (e) { /* no body */ }
        return { status: res.status, body: json };
      };
      const newDelivery = async () => {
        const order = await ordersD.saveOrder(new Order({
          buyerId: 'buyer_1',
          sellerId: 'seller_1',
          items: [{ listingId: 'lst_d', title: 'Phone', unitPriceXaf: 50000, quantity: 1, sellerId: 'seller_1', storeName: 'Tech Shop' }],
          shippingAddress: { fullName: 'Awa Njoya', phone: '+237622222222', street: 'Rue 1', neighbourhood: 'Bonanjo', city: 'Douala' },
          deliveryMethod: DELIVERY_METHOD.HOME_DELIVERY,
          paymentStatus: PAYMENT_STATUS.PAID,
          fulfillmentStatus: FULFILLMENT_STATUS.PROCESSING
        }));
        const created = await d('POST', '/', SELLER, { orderId: order.id });
        assert.strictEqual(created.status, 201, JSON.stringify(created.body));
        return created.body.data.delivery.id;
      };

      try {
        await d('POST', '/drivers/rider_1', ADMIN, { name: 'Alain', phone: '+237600000001' });
        await d('POST', '/drivers/rider_2', ADMIN, { name: 'Bruno', phone: '+237600000002' });
        // Registered riders are not offered anything until they are online.
        const id = await newDelivery();
        const beforeOnline = await d('POST', `/${id}/auto-assign`, SELLER, {});
        assert.strictEqual(beforeOnline.status, 409, 'two registered riders, none online: nobody to offer it to');
        assert.strictEqual(beforeOnline.body.error.code, 'NO_RIDER_AVAILABLE');
        assert.strictEqual((await repoD.findById(id)).status, 'pending_assignment', 'and nothing was assigned');
        assert.strictEqual((await d('POST', '/driver/presence/online', RIDER, {})).status, 200);
        assert.strictEqual((await d('POST', '/driver/presence/online', RIDER2, {})).status, 200);

        // Authentication and roles.
        const anon = await d('POST', `/${id}/auto-assign`, null, {});
        assert.strictEqual(anon.status, 401, 'auto-assign needs a session');
        assert.strictEqual(anon.body.error.code, 'UNAUTHENTICATED');
        assert.strictEqual((await d('POST', `/${id}/auto-assign`, BUYER, {})).status, 403, 'the buyer cannot dispatch their own order');
        assert.strictEqual((await d('POST', `/${id}/auto-assign`, STRANGER, {})).status, 404, 'a stranger gets a 404, not a hint that it exists');
        assert.strictEqual((await d('POST', `/${id}/auto-assign`, OTHER_SELLER, {})).status, 404, "another seller cannot dispatch it");
        assert.strictEqual((await d('POST', '/dlv_missing/auto-assign', SELLER, {})).status, 404);
        assert.strictEqual((await repoD.findById(id)).status, 'pending_assignment', 'none of those changed anything');

        // The call itself. A body is ignored: the server decides, not the client.
        const auto = await d('POST', `/${id}/auto-assign`, SELLER, { driverId: 'rider_2', status: 'delivered', surprise: true });
        assert.strictEqual(auto.status, 200, JSON.stringify(auto.body));
        const delivery = auto.body.data.delivery;
        assert.strictEqual(delivery.status, 'assigned');
        assert.strictEqual(delivery.driver.id, 'rider_1', 'the server chose, ignoring the body');
        assert.strictEqual(delivery.viewerRole, 'seller');
        assert.strictEqual(delivery.offerExpiresAt, new Date(clock.now() + OFFER_MS).toISOString(), 'the response carries the deadline');

        // offerExpiresAt over the wire: staff and rider see it, the buyer never does.
        assert.strictEqual((await d('GET', `/${id}`, RIDER)).body.data.delivery.offerExpiresAt, delivery.offerExpiresAt);
        assert.strictEqual((await d('GET', `/${id}`, BUYER)).body.data.delivery.offerExpiresAt, null);
        assert.strictEqual((await d('GET', '/driver/me', RIDER)).body.data.deliveries[0].offerExpiresAt, delivery.offerExpiresAt, "and so does the rider's own list");

        // The rider list: workload, order, and the optional deliveryId.
        const list = await d('GET', '/drivers', SELLER);
        assert.strictEqual(list.status, 200);
        assert.deepStrictEqual(list.body.data.drivers.map((r) => [r.id, r.openDeliveries]), [['rider_2', 0], ['rider_1', 1]], 'least busy first, with the count');
        assert.ok(list.body.data.drivers.every((r) => !('declined' in r)), 'no declined flag without a deliveryId');
        const withHistory = await d('GET', `/drivers?deliveryId=${id}`, SELLER);
        assert.strictEqual(withHistory.status, 200);
        assert.ok(withHistory.body.data.drivers.every((r) => r.declined === false), 'with one, every rider has the flag');
        assert.strictEqual((await d('GET', '/drivers?_=1700000000', SELLER)).status, 200, 'unrelated query keys are ignored');
        const empty = await d('GET', '/drivers?deliveryId=', SELLER);
        assert.strictEqual(empty.status, 400, 'an empty deliveryId is a 400');
        assert.strictEqual(empty.body.error.code, 'VALIDATION_ERROR');
        assert.strictEqual((await d('GET', '/drivers?deliveryId=a&deliveryId=b', SELLER)).status, 400, 'a repeated deliveryId is a 400, not a crash');
        assert.strictEqual((await d('GET', `/drivers?deliveryId=${'x'.repeat(200)}`, SELLER)).status, 400, 'an over-long deliveryId is a 400');
        assert.strictEqual((await d('GET', '/drivers?deliveryId=dlv_missing', SELLER)).status, 404);
        assert.strictEqual((await d('GET', `/drivers?deliveryId=${id}`, OTHER_SELLER)).status, 404, "another seller cannot read this delivery's history");
        assert.strictEqual((await d('GET', `/drivers?deliveryId=${id}`, BUYER)).status, 403, 'a customer cannot list riders at all');

        // A decline is remembered and steers the next pick.
        assert.strictEqual((await d('POST', `/${id}/decline`, RIDER)).status, 200);
        const afterDecline = await d('GET', `/drivers?deliveryId=${id}`, SELLER);
        // Both are idle again, so they tie on workload and the order falls back to the name.
        assert.deepStrictEqual(afterDecline.body.data.drivers.map((r) => [r.id, r.declined]), [['rider_1', true], ['rider_2', false]]);
        const second = await d('POST', `/${id}/auto-assign`, SELLER);
        assert.strictEqual(second.body.data.delivery.driver.id, 'rider_2', 'the rider who declined is not offered it again');

        // Nobody left: a clean 409 with its own code, and the delivery is untouched.
        assert.strictEqual((await d('POST', `/${id}/decline`, RIDER2)).status, 200);
        const none = await d('POST', `/${id}/auto-assign`, SELLER);
        assert.strictEqual(none.status, 409);
        assert.strictEqual(none.body.error.code, 'NO_RIDER_AVAILABLE');
        assert.strictEqual(none.body.success, false);
        assert.strictEqual((await repoD.findById(id)).status, 'pending_assignment');

        // An unanswered offer: 409 OFFER_EXPIRED on accept, then it is back with the seller.
        assert.strictEqual((await d('POST', `/${id}/assign`, SELLER, { driverId: 'rider_1' })).status, 200);
        clock.advance(OFFER_MS);
        const late = await d('POST', `/${id}/accept`, RIDER);
        assert.strictEqual(late.status, 409, 'accepting at the deadline is refused');
        assert.strictEqual(late.body.error.code, 'OFFER_EXPIRED');
        assert.strictEqual((await d('GET', '/driver/me', RIDER)).body.data.deliveries.length, 0, 'it has left the rider\'s list');
        assert.strictEqual((await d('GET', `/${id}`, RIDER)).status, 404, 'and the rider no longer has access');
        const back = await d('GET', `/${id}`, SELLER);
        assert.strictEqual(back.body.data.delivery.status, 'pending_assignment', 'the seller sees it waiting for a new rider');
        assert.strictEqual(back.body.data.delivery.offerExpiresAt, null);
        assert.strictEqual((await d('GET', '/driver/presence', RIDER)).body.data.presence.status, 'online', 'a late accept did not leave the rider busy');
      } finally {
        if (serverD.closeAllConnections) serverD.closeAllConnections();
        await new Promise((resolve) => serverD.close(resolve));
      }
    }

    // ------------------------------------------------ rider presence, over the wire
    // Its own server, repositories and a SHORT presence window (the 2-minute default, pinned
    // here), because this is the section that moves the clock past it. `repoP` is read only to
    // look at what was stored; every change below is made through an endpoint.
    {
      const PRESENCE_TTL_MS = 2 * 60 * 1000;
      const BEAT_MS = 30 * 1000; // what the client is asked to send
      const RIDER3 = 'rider_3|customer';
      const iso = (ms) => new Date(ms).toISOString();
      const ordersP = new OrderRepository({ db: null });
      const repoP = new DeliveryRepository({ db: null });
      const eventsP = new DeliveryEvents();
      const serviceP = new DeliveryService({ repository: repoP, orderRepository: ordersP, events: eventsP, now: clock.now, presenceTtlMs: PRESENCE_TTL_MS });
      const appP = express();
      appP.use(express.json());
      appP.use('/p', createDeliveryRouter({ service: serviceP, authenticate: fakeAuth, events: eventsP, revalidate }));
      appP.use(errorHandler);
      const serverP = http.createServer(appP);
      await new Promise((resolve) => serverP.listen(0, '127.0.0.1', resolve));
      const p = requester(`http://127.0.0.1:${serverP.address().port}/p`);

      const PRESENCE_CALLS = [
        ['GET', '/driver/presence'], ['POST', '/driver/presence/online'], ['POST', '/driver/presence/offline'],
        ['POST', '/driver/presence/pause'], ['POST', '/driver/presence/resume'], ['POST', '/driver/presence/heartbeat']
      ];
      const presenceOf = (res) => res.body.data.presence;
      const statusOf = async (user) => presenceOf(await p('GET', '/driver/presence', user)).status;
      const goOnline = (user) => p('POST', '/driver/presence/online', user, {});
      const newDelivery = async () => {
        const order = await ordersP.saveOrder(new Order({
          buyerId: 'buyer_1',
          sellerId: 'seller_1',
          items: [{ listingId: 'lst_p', title: 'Phone', unitPriceXaf: 50000, quantity: 1, sellerId: 'seller_1', storeName: 'Tech Shop' }],
          shippingAddress: { fullName: 'Awa Njoya', phone: '+237622222222', street: 'Rue 1', neighbourhood: 'Bonanjo', city: 'Douala' },
          deliveryMethod: DELIVERY_METHOD.HOME_DELIVERY,
          paymentStatus: PAYMENT_STATUS.PAID,
          fulfillmentStatus: FULFILLMENT_STATUS.PROCESSING
        }));
        const created = await p('POST', '/', SELLER, { orderId: order.id });
        assert.strictEqual(created.status, 201, JSON.stringify(created.body));
        return created.body.data.delivery.id;
      };
      /** The answer is a refusal: this status, this error code and, when given, this reason. */
      const assertRefused = (res, status, errorCode, reason, what) => {
        assert.strictEqual(res.status, status, `${what}: status (${JSON.stringify(res.body)})`);
        assert.strictEqual(res.body.success, false, `${what}: not a success`);
        assert.strictEqual(res.body.error.code, errorCode, `${what}: error code`);
        if (reason) assert.strictEqual(res.body.error.details.reason, reason, `${what}: reason`);
      };
      const lastEvent = async (id) => { const events = await repoP.listEvents(id); return events[events.length - 1]; };

      try {
        // ---- only a registered rider has presence, whoever else they are
        for (const [who, label] of [[STRANGER, 'a customer who is not a rider'], [SELLER, 'a seller'], [ADMIN, 'an administrator']]) {
          for (const [method, path] of PRESENCE_CALLS) {
            const res = await p(method, path, who, method === 'POST' ? {} : undefined);
            assertRefused(res, 403, 'PERMISSION_DENIED', null, `${label}: ${method} ${path}`);
            assert.strictEqual(res.body.error.message, 'You are not a registered rider.');
          }
        }
        for (const id of ['stranger_1', 'seller_1', 'admin_1']) {
          assert.strictEqual(await repoP.findPresence(id), null, `no presence row was created for ${id}`);
        }

        for (const [id, name, n] of [['rider_1', 'Alain', 1], ['rider_2', 'Bruno', 2], ['rider_3', 'Chris', 3]]) {
          assert.strictEqual((await p('POST', `/drivers/${id}`, ADMIN, { name, phone: `+23760000000${n}` })).status, 200);
        }

        // ---- a registered rider who never opened the app is offline
        assert.deepStrictEqual(presenceOf(await p('GET', '/driver/presence', RIDER)), {
          status: 'offline', available: false, reason: 'offline', lastSeenAt: null, expiresAt: null,
          ttlSeconds: 120, heartbeatIntervalMs: 30000, location: null, updatedAt: null
        }, 'registered is not available');
        assert.strictEqual(await repoP.findPresence('rider_1'), null, 'reading presence creates nothing');

        // ---- the body carries a position and NOTHING else: no status, no rider
        for (const [path, body] of [
          ['/driver/presence/online', { status: 'online' }],
          ['/driver/presence/online', { available: true }],
          ['/driver/presence/online', { riderId: 'rider_2' }],
          ['/driver/presence/online', { driverId: 'rider_2' }],
          ['/driver/presence/online', { ...NEAR, owner: 'me' }],
          ['/driver/presence/resume', { status: 'online' }],
          ['/driver/presence/heartbeat', { status: 'online' }],
          ['/driver/presence/heartbeat', { profileId: 'rider_2' }],
          ['/driver/presence/offline', { status: 'offline' }],
          ['/driver/presence/offline', { riderId: 'rider_2' }],
          ['/driver/presence/pause', { driverId: 'rider_2' }],
          ['/driver/presence/online', { lat: 'x', lng: 1 }],
          ['/driver/presence/online', { lat: 95, lng: 0 }],
          ['/driver/presence/online', { ...NEAR, accuracyM: -3 }],
          ['/driver/presence/heartbeat', { lat: 4.05 }]
        ]) {
          const res = await p('POST', path, RIDER, body);
          assertRefused(res, 400, 'VALIDATION_ERROR', null, `${path} ${JSON.stringify(body)}`);
        }
        assert.strictEqual(await repoP.findPresence('rider_1'), null, 'none of the refused calls wrote anything');
        assert.strictEqual(await statusOf(RIDER), 'offline');

        // ---- going online, with a position
        const t0 = clock.now();
        const online = await p('POST', '/driver/presence/online', RIDER, { ...NEAR, accuracyM: 12 });
        assert.strictEqual(online.status, 200, JSON.stringify(online.body));
        assert.strictEqual(online.body.success, true);
        assert.deepStrictEqual(presenceOf(online), {
          status: 'online', available: true, reason: null, lastSeenAt: iso(t0), expiresAt: iso(t0 + PRESENCE_TTL_MS),
          ttlSeconds: 120, heartbeatIntervalMs: 30000, location: { ...NEAR, accuracyM: 12 }, updatedAt: iso(t0)
        });
        const stored = await repoP.findPresence('rider_1');
        assert.deepStrictEqual(
          [stored.status, stored.latitude, stored.longitude, stored.accuracy, stored.lastSeenAt],
          ['online', NEAR.lat, NEAR.lng, 12, iso(t0)],
          'the availability position lives on the presence row'
        );
        assert.deepStrictEqual(await repoP.listLocations('rider_1'), [], 'and is not a delivery GPS point');

        // ---- only the authenticated rider's own presence moves
        for (const body of [{ riderId: 'rider_1' }, { driverId: 'rider_1' }, { profileId: 'rider_1' }, { userId: 'rider_1' }, { id: 'rider_1' }]) {
          assertRefused(await p('POST', '/driver/presence/offline', RIDER2, body), 400, 'VALIDATION_ERROR', null, `rider_2 naming ${Object.keys(body)[0]}`);
        }
        const aimed = await p('POST', '/driver/presence/offline?riderId=rider_1', RIDER2, {});
        assert.strictEqual(aimed.status, 200, 'a query string is ignored: this is rider_2 going offline, which they already are');
        assert.strictEqual(presenceOf(aimed).status, 'offline');
        assertRefused(await p('POST', '/driver/presence/pause?riderId=rider_1', RIDER2, {}), 409, 'RIDER_UNAVAILABLE', 'offline', 'rider_2 pausing while offline');
        assert.deepStrictEqual(await repoP.findPresence('rider_1'), stored, 'rider_1\'s stored presence is exactly as it was');
        assert.strictEqual(await statusOf(RIDER), 'online');

        // ---- the heartbeat: keeps a rider alive, refreshes position, is cheap
        clock.advance(BEAT_MS);
        const beat1 = await p('POST', '/driver/presence/heartbeat', RIDER, { lat: 4.06, lng: 9.77 });
        assert.strictEqual(beat1.status, 200, JSON.stringify(beat1.body));
        assert.strictEqual(presenceOf(beat1).status, 'online');
        assert.strictEqual(presenceOf(beat1).lastSeenAt, iso(t0 + BEAT_MS), 'a beat moves lastSeenAt to now');
        assert.strictEqual(presenceOf(beat1).expiresAt, iso(t0 + BEAT_MS + PRESENCE_TTL_MS), 'and the expiry with it');
        assert.deepStrictEqual(presenceOf(beat1).location, { lat: 4.06, lng: 9.77, accuracyM: null });

        clock.advance(10 * 1000);
        const beat2 = await p('POST', '/driver/presence/heartbeat', RIDER); // no body at all
        assert.strictEqual(beat2.status, 200);
        assert.strictEqual(presenceOf(beat2).lastSeenAt, iso(t0 + BEAT_MS + 10 * 1000));
        assert.strictEqual(presenceOf(beat2).location, null, 'a beat without a position clears the old one');

        clock.advance(2 * 1000);
        const written = await repoP.findPresence('rider_1');
        const beat3 = await p('POST', '/driver/presence/heartbeat', RIDER, { lat: 4.07, lng: 9.78 });
        assert.strictEqual(beat3.status, 200);
        assert.strictEqual(presenceOf(beat3).lastSeenAt, iso(t0 + BEAT_MS + 10 * 1000), 'a beat 2 s after the last write is acknowledged, not written');
        assert.deepStrictEqual(await repoP.findPresence('rider_1'), written, 'the stored row is untouched');

        clock.advance(3 * 1000);
        const beat4 = await p('POST', '/driver/presence/heartbeat', RIDER, { lat: 4.07, lng: 9.78 });
        assert.strictEqual(presenceOf(beat4).lastSeenAt, iso(t0 + BEAT_MS + 15 * 1000), 'five seconds after the last write it is written again');
        assert.deepStrictEqual(presenceOf(beat4).location, { lat: 4.07, lng: 9.78, accuracyM: null });

        const beforeBurst = await repoP.findPresence('rider_1');
        const burst = await Promise.all(Array.from({ length: 8 }, () => p('POST', '/driver/presence/heartbeat', RIDER, { lat: 4.08, lng: 9.79 })));
        assert.deepStrictEqual(burst.map((r) => r.status), Array(8).fill(200), 'a client that loops is answered every time');
        assert.deepStrictEqual(await repoP.findPresence('rider_1'), beforeBurst, 'and costs a read, not eight writes');

        // ---- a heartbeat never raises anyone
        const beatOffline = await p('POST', '/driver/presence/heartbeat', RIDER2, { ...NEAR });
        assert.strictEqual(beatOffline.status, 200);
        assert.strictEqual(presenceOf(beatOffline).status, 'offline', 'an offline rider who beats is told they are offline');
        assert.strictEqual(presenceOf(beatOffline).available, false);
        const rider2Row = await repoP.findPresence('rider_2');
        assert.ok(!rider2Row || (rider2Row.status === 'offline' && rider2Row.latitude === null), 'and nothing was stored: no status, no position');

        // ---- pause and resume
        const paused = await p('POST', '/driver/presence/pause', RIDER, {});
        assert.strictEqual(paused.status, 200, JSON.stringify(paused.body));
        assert.strictEqual(presenceOf(paused).status, 'paused');
        assert.strictEqual(presenceOf(paused).available, false);
        assert.strictEqual(presenceOf(paused).reason, 'paused');
        assert.strictEqual(presenceOf(paused).location, null, 'a rider on a break shares no position');
        assert.strictEqual((await repoP.findPresence('rider_1')).status, 'paused');
        assert.deepStrictEqual((await p('GET', '/drivers', SELLER)).body.data, { drivers: [], summary: { registered: 3, available: 0 } }, 'a paused rider is not on the seller\'s list');

        const dlv = await newDelivery();
        assertRefused(await p('POST', `/${dlv}/assign`, SELLER, { driverId: 'rider_1' }), 409, 'RIDER_UNAVAILABLE', 'paused', 'assigning a paused rider');
        assertRefused(await p('POST', `/${dlv}/auto-assign`, SELLER, {}), 409, 'NO_RIDER_AVAILABLE', null, 'auto-assign with nobody available');
        assert.strictEqual((await repoP.findById(dlv)).status, 'pending_assignment', 'neither refusal moved the delivery');

        const beatPaused = await p('POST', '/driver/presence/heartbeat', RIDER, { ...NEAR });
        assert.strictEqual(presenceOf(beatPaused).status, 'paused', 'a heartbeat does not end a break');
        assert.strictEqual((await repoP.findPresence('rider_1')).status, 'paused');
        assert.strictEqual(presenceOf(await p('POST', '/driver/presence/pause', RIDER, {})).status, 'paused', 'pausing twice is fine');
        assertRefused(await p('POST', '/driver/presence/resume', RIDER2, {}), 409, 'RIDER_UNAVAILABLE', 'offline', 'resuming without being on a break');

        clock.advance(20 * 1000);
        const resumed = await p('POST', '/driver/presence/resume', RIDER, {});
        assert.strictEqual(resumed.status, 200, JSON.stringify(resumed.body));
        assert.strictEqual(presenceOf(resumed).status, 'online');
        assert.strictEqual(presenceOf(resumed).available, true);
        assert.strictEqual(presenceOf(resumed).lastSeenAt, iso(clock.now()), 'coming back counts as being heard from');
        assert.strictEqual(presenceOf(await p('POST', '/driver/presence/resume', RIDER, {})).status, 'online', 'resuming twice is fine');

        // ---- dispatch only chooses riders who are available
        const auto = await p('POST', `/${dlv}/auto-assign`, SELLER, {});
        assert.strictEqual(auto.status, 200, JSON.stringify(auto.body));
        assert.strictEqual(auto.body.data.delivery.driver.id, 'rider_1', 'three riders are registered; the only one who is online is the one picked');
        assertRefused(await p('POST', `/${dlv}/assign`, SELLER, { driverId: 'rider_2' }), 409, 'RIDER_UNAVAILABLE', 'offline', 'assigning an offline rider');
        const stillHeld = await repoP.findById(dlv);
        assert.deepStrictEqual([stillHeld.status, stillHeld.driverId], ['assigned', 'rider_1'], 'the refused re-assignment left the offer where it was');

        // ---- going offline with an offer nobody answered takes it back to the seller
        const wentOffline = await p('POST', '/driver/presence/offline', RIDER, {});
        assert.strictEqual(wentOffline.status, 200, JSON.stringify(wentOffline.body));
        assert.strictEqual(presenceOf(wentOffline).status, 'offline');
        assert.strictEqual(presenceOf(wentOffline).available, false);
        assert.strictEqual(presenceOf(wentOffline).expiresAt, null);
        assert.strictEqual(presenceOf(wentOffline).location, null);
        const taken = await repoP.findById(dlv);
        assert.deepStrictEqual([taken.status, taken.driverId], ['pending_assignment', null], 'the delivery is back with the seller');
        const why = await lastEvent(dlv);
        assert.deepStrictEqual(
          [why.status, why.previousStatus, why.actorId, why.note],
          ['pending_assignment', 'assigned', 'presence', 'Rider went offline'],
          'the timeline says why, and the actor is the system, not the rider'
        );
        const overview = await p('GET', '/driver/me', RIDER);
        assert.strictEqual(overview.status, 200, 'an offline rider is still a rider');
        assert.deepStrictEqual(overview.body.data.deliveries, []);
        assert.strictEqual(overview.body.data.presence.status, 'offline');
        assert.strictEqual((await p('GET', `/${dlv}`, RIDER)).status, 404, 'the offer is no longer theirs to see');
        assert.strictEqual((await p('POST', `/${dlv}/accept`, RIDER)).status, 404, 'and no longer theirs to accept');
        assert.deepStrictEqual((await p('GET', '/drivers', SELLER)).body.data.summary, { registered: 3, available: 0 });

        // They did not decline anything: back online, they are offerable for the very same delivery.
        assert.strictEqual((await goOnline(RIDER)).status, 200);
        const history = (await p('GET', `/drivers?deliveryId=${dlv}`, SELLER)).body.data.drivers;
        assert.deepStrictEqual(history.map((r) => [r.id, r.declined]), [['rider_1', false]], 'going offline is not declining');
        assert.strictEqual((await p('POST', `/${dlv}/assign`, SELLER, { driverId: 'rider_1' })).status, 200);

        // ---- silence: fresh 1 ms before the window ends, stale at exactly the window
        const heardAt = presenceOf(await p('GET', '/driver/presence', RIDER)).lastSeenAt;
        assert.strictEqual(heardAt, iso(clock.now()));
        clock.advance(PRESENCE_TTL_MS - 1);
        const almost = presenceOf(await p('GET', '/driver/presence', RIDER));
        assert.deepStrictEqual([almost.status, almost.available, almost.reason], ['online', true, null], '1 ms before the window ends the rider is still online');
        clock.advance(1);
        const silent = presenceOf(await p('GET', '/driver/presence', RIDER));
        assert.deepStrictEqual([silent.status, silent.available, silent.reason, silent.expiresAt], ['offline', false, 'expired', null], 'at exactly the window they are not');
        assert.deepStrictEqual((await p('GET', '/drivers', SELLER)).body.data.summary, { registered: 3, available: 0 }, 'a silent rider is not on the seller\'s list');

        // A silent rider cannot accept the offer they were holding, and the refusal changes nothing.
        assertRefused(await p('POST', `/${dlv}/accept`, RIDER), 409, 'RIDER_UNAVAILABLE', 'expired', 'accepting after going silent');
        const heldOffer = await repoP.findById(dlv);
        assert.deepStrictEqual([heldOffer.status, heldOffer.driverId], ['assigned', 'rider_1'], 'the offer is still theirs');
        assert.notStrictEqual((await repoP.findPresence('rider_1')).status, 'busy', 'a refused claim did not make them busy');
        const dlv2 = await newDelivery();
        assertRefused(await p('POST', `/${dlv2}/assign`, SELLER, { driverId: 'rider_1' }), 409, 'RIDER_UNAVAILABLE', 'expired', 'assigning a silent rider');

        // Their next heartbeat finds them stale: set offline, offers back, and NOT revived.
        const lateBeat = await p('POST', '/driver/presence/heartbeat', RIDER, { ...NEAR });
        assert.strictEqual(lateBeat.status, 200);
        assert.strictEqual(presenceOf(lateBeat).status, 'offline', 'a beat after the window does not bring them back');
        assert.strictEqual((await repoP.findPresence('rider_1')).status, 'offline');
        const lapsed = await repoP.findById(dlv);
        assert.deepStrictEqual([lapsed.status, lapsed.driverId], ['pending_assignment', null], 'their unanswered offer went back to the seller');
        const lapseNote = await lastEvent(dlv);
        assert.deepStrictEqual([lapseNote.actorId, lapseNote.note], ['presence', 'Rider stopped responding and was set offline']);
        assert.strictEqual(presenceOf(await p('POST', '/driver/presence/heartbeat', RIDER, {})).status, 'offline', 'and a second beat still does not');
        assert.strictEqual(presenceOf(await goOnline(RIDER)).status, 'online', 'only going online again does');

        // ---- busy: accepted work. Going offline or pausing is refused, dispatch skips them, silence does not expire them.
        assert.strictEqual((await p('POST', `/${dlv}/assign`, SELLER, { driverId: 'rider_1' })).status, 200);
        assert.strictEqual((await p('POST', `/${dlv}/accept`, RIDER)).status, 200);
        const busy = presenceOf(await p('GET', '/driver/presence', RIDER));
        assert.deepStrictEqual([busy.status, busy.available, busy.reason], ['busy', false, 'busy'], 'accepting: online -> busy');
        assertRefused(await p('POST', '/driver/presence/offline', RIDER, {}), 409, 'RIDER_BUSY', 'busy', 'going offline with a parcel');
        assertRefused(await p('POST', '/driver/presence/pause', RIDER, {}), 409, 'RIDER_BUSY', 'busy', 'pausing with a parcel');
        assert.strictEqual(await statusOf(RIDER), 'busy', 'both refusals left them busy');
        assert.strictEqual((await repoP.findById(dlv)).status, 'accepted');
        assertRefused(await p('POST', `/${dlv2}/assign`, SELLER, { driverId: 'rider_1' }), 409, 'RIDER_BUSY', 'busy', 'assigning a busy rider');

        // Dispatch goes around the busy rider to the next one who is available.
        assert.strictEqual((await goOnline(RIDER2)).status, 200);
        const around = await p('POST', `/${dlv2}/auto-assign`, SELLER, {});
        assert.strictEqual(around.status, 200, JSON.stringify(around.body));
        assert.strictEqual(around.body.data.delivery.driver.id, 'rider_2', 'rider_1 is busy and rider_3 is offline: rider_2 it is');
        assert.strictEqual((await p('POST', `/${dlv2}/decline`, RIDER2)).status, 200);

        // The delivery GPS trail and presence are separate things.
        const seenWhileBusy = presenceOf(await p('GET', '/driver/presence', RIDER)).lastSeenAt;
        clock.advance(20 * 1000);
        const ping = await p('POST', `/${dlv}/location`, RIDER, { ...NEAR });
        assert.strictEqual(ping.status, 200, JSON.stringify(ping.body));
        assert.strictEqual(ping.body.data.accepted, true);
        assert.strictEqual(presenceOf(await p('GET', '/driver/presence', RIDER)).lastSeenAt, seenWhileBusy, 'a delivery location ping is not a heartbeat');
        const trailBefore = (await repoP.listLocations(dlv)).length;
        assert.strictEqual(trailBefore, 1);
        clock.advance(10 * 1000);
        const busyBeat = await p('POST', '/driver/presence/heartbeat', RIDER, { ...NEAR });
        assert.strictEqual(presenceOf(busyBeat).status, 'busy', 'a heartbeat keeps a busy rider busy');
        assert.strictEqual(presenceOf(busyBeat).lastSeenAt, iso(clock.now()), 'and refreshes when they were heard from');
        assert.strictEqual((await repoP.listLocations(dlv)).length, trailBefore, 'a heartbeat is not a delivery GPS point');

        clock.advance(3 * PRESENCE_TTL_MS);
        assert.strictEqual(await statusOf(RIDER), 'busy', 'a rider carrying a parcel does not expire however quiet their app is');
        assert.strictEqual((await p('GET', '/drivers', SELLER)).body.data.drivers.some((r) => r.id === 'rider_1'), false);

        // ---- the delivery ends: busy -> online, and they can be offered work again
        assert.strictEqual((await p('POST', '/driver/presence/heartbeat', RIDER, {})).status, 200);
        clock.advance(5000);
        assert.strictEqual((await p('POST', `/${dlv}/location`, RIDER, { ...NEAR })).status, 200);
        clock.advance(5000);
        assert.strictEqual((await p('POST', `/${dlv}/status`, RIDER, { status: 'picked_up' })).status, 200);
        assert.strictEqual((await p('POST', `/${dlv}/status`, RIDER, { status: 'arrived' })).status, 200);
        const handover = (await p('GET', `/${dlv}/code`, BUYER)).body.data.code;
        assert.strictEqual(await statusOf(RIDER), 'busy', 'still busy until the parcel is handed over');
        assert.strictEqual((await p('POST', `/${dlv}/complete`, RIDER, { code: handover })).status, 200);
        const free = presenceOf(await p('GET', '/driver/presence', RIDER));
        assert.deepStrictEqual([free.status, free.available], ['online', true], 'handed over: busy -> online');
        assert.ok((await p('GET', '/drivers', SELLER)).body.data.drivers.some((r) => r.id === 'rider_1'), 'and on the seller\'s list again');

        // ---- simultaneous requests
        // (1) One rider, two offers, both accepted at the same instant: exactly one wins.
        {
          await goOnline(RIDER);
          const dX = await newDelivery();
          const dY = await newDelivery();
          assert.strictEqual((await p('POST', `/${dX}/assign`, SELLER, { driverId: 'rider_1' })).status, 200);
          assert.strictEqual((await p('POST', `/${dY}/assign`, SELLER, { driverId: 'rider_1' })).status, 200, 'offers may stack until one is accepted');
          const [ax, ay] = await Promise.all([p('POST', `/${dX}/accept`, RIDER), p('POST', `/${dY}/accept`, RIDER)]);
          assert.strictEqual([ax, ay].filter((r) => r.status === 200).length, 1, `exactly one accept wins (got ${ax.status} and ${ay.status})`);
          const lost = ax.status === 200 ? ay : ax;
          assert.ok([404, 409].includes(lost.status), `the other is refused (got ${lost.status})`);
          if (lost.status === 409) assert.strictEqual(lost.body.error.code, 'RIDER_BUSY');
          const won = ax.status === 200 ? dX : dY;
          const lostId = ax.status === 200 ? dY : dX;
          assert.deepStrictEqual((await repoP.findOpenByDriver('rider_1')).map((d) => [d.id, d.status]), [[won, 'accepted']], 'the rider holds one delivery, not two');
          const loserRow = await repoP.findById(lostId);
          assert.deepStrictEqual([loserRow.status, loserRow.driverId], ['pending_assignment', null], 'the other went back to its seller');
          assert.strictEqual(await statusOf(RIDER), 'busy');
          // Releasing the accepted one gives the rider back.
          assert.strictEqual((await p('POST', `/${won}/decline`, RIDER)).status, 200);
          assert.strictEqual(await statusOf(RIDER), 'online', 'released: busy -> online');
        }

        // (2) Two deliveries dispatched at once, two free riders: one each, not both on the same rider.
        {
          await goOnline(RIDER);
          await goOnline(RIDER2);
          const dP = await newDelivery();
          const dQ = await newDelivery();
          const [ap, aq] = await Promise.all([p('POST', `/${dP}/auto-assign`, SELLER, {}), p('POST', `/${dQ}/auto-assign`, SELLER, {})]);
          assert.deepStrictEqual([ap.status, aq.status], [200, 200], JSON.stringify([ap.body, aq.body]));
          assert.deepStrictEqual(
            [ap, aq].map((r) => r.body.data.delivery.driver.id).sort(),
            ['rider_1', 'rider_2'],
            'two simultaneous assignments went to two different riders'
          );
          for (const rider of [RIDER, RIDER2]) {
            for (const d of (await p('GET', '/driver/me', rider)).body.data.deliveries) {
              assert.strictEqual((await p('POST', `/${d.id}/decline`, rider)).status, 200);
            }
          }
        }

        // (3) A rider goes offline at the very moment they accept. Both requests are in flight at
        // once; one of the two is held back for 15 ms so that BOTH orders happen, three rounds each
        // (otherwise the first request to arrive always wins and only one order is ever exercised).
        // Whichever lands first the outcome is coherent: never offline AND carrying a parcel, never
        // busy AND without it.
        {
          const realAccept = serviceP.acceptDelivery;
          const realOffline = serviceP.riderGoOffline;
          const held = (fn) => async (...args) => { await sleep(15); return fn.apply(serviceP, args); };
          const won = { accept: 0, offline: 0 };
          try {
            for (let i = 0; i < 6; i += 1) {
              const offlineFirst = i % 2 === 1;
              await goOnline(RIDER);
              const dZ = await newDelivery();
              assert.strictEqual((await p('POST', `/${dZ}/assign`, SELLER, { driverId: 'rider_1' })).status, 200);
              if (offlineFirst) serviceP.acceptDelivery = held(realAccept); else serviceP.riderGoOffline = held(realOffline);
              let accept;
              let offline;
              try {
                [accept, offline] = await Promise.all([p('POST', `/${dZ}/accept`, RIDER), p('POST', '/driver/presence/offline', RIDER, {})]);
              } finally {
                serviceP.acceptDelivery = realAccept;
                serviceP.riderGoOffline = realOffline;
              }
              const row = await repoP.findById(dZ);
              const now = await statusOf(RIDER);
              assert.strictEqual(accept.status === 200, row.status === 'accepted', `round ${i}: the accept succeeded exactly when the delivery was accepted (${accept.status}, ${row.status})`);
              if (row.status === 'accepted') {
                won.accept += 1;
                assert.strictEqual(offlineFirst, false, `round ${i}: the held-back accept cannot have won`);
                assert.strictEqual(now, 'busy', `round ${i}: a rider holding the accepted delivery is busy, not offline`);
                assert.strictEqual(offline.status, 409, `round ${i}: their going offline was refused`);
                assert.strictEqual(offline.body.error.code, 'RIDER_BUSY');
                assert.strictEqual((await p('POST', `/${dZ}/decline`, RIDER)).status, 200);
              } else {
                won.offline += 1;
                assert.strictEqual(offlineFirst, true, `round ${i}: the held-back offline cannot have won`);
                assert.deepStrictEqual([row.status, row.driverId], ['pending_assignment', null], `round ${i}: the offer went back to the seller`);
                assert.strictEqual(now, 'offline', `round ${i}: they are offline and hold nothing`);
                assert.strictEqual(offline.status, 200);
                assert.strictEqual(accept.status, 404, `round ${i}: the late accept finds the offer gone`);
              }
            }
          } finally {
            serviceP.acceptDelivery = realAccept;
            serviceP.riderGoOffline = realOffline;
          }
          assert.deepStrictEqual(won, { accept: 3, offline: 3 }, 'both orders were exercised');
        }

        // ---- suspension: no presence, forced offline, and reactivation does not bring them back
        assert.strictEqual((await goOnline(RIDER3)).status, 200);
        assert.ok((await p('GET', '/drivers', SELLER)).body.data.drivers.some((r) => r.id === 'rider_3'), 'online, they are on the list');
        const suspended = await p('POST', '/drivers/rider_3', ADMIN, { name: 'Chris', phone: '+237600000003', status: 'suspended' });
        assert.strictEqual(suspended.body.data.driver.status, 'suspended');
        for (const [method, path] of PRESENCE_CALLS) {
          const res = await p(method, path, RIDER3, method === 'POST' ? {} : undefined);
          assertRefused(res, 403, 'PERMISSION_DENIED', null, `a suspended rider: ${method} ${path}`);
          assert.strictEqual(res.body.error.message, 'Your rider account is not active.');
        }
        assert.strictEqual((await repoP.findPresence('rider_3')).status, 'offline', 'the suspension forced the stored row offline');
        assert.strictEqual((await p('GET', '/drivers', SELLER)).body.data.drivers.some((r) => r.id === 'rider_3'), false, 'a suspended rider is not offered');
        const dS = await newDelivery();
        assert.strictEqual((await p('POST', `/${dS}/assign`, SELLER, { driverId: 'rider_3' })).status, 400, 'and cannot be assigned');

        assert.strictEqual((await p('GET', '/drivers?status=all', SELLER)).status, 403, 'only an administrator reads the full roster');
        const roster = (await p('GET', '/drivers?status=all', ADMIN)).body.data.drivers;
        const row3 = roster.find((r) => r.id === 'rider_3');
        assert.strictEqual(row3.presence, 'suspended', 'the roster says suspended');
        assert.deepStrictEqual(Object.keys(row3).sort(), ['id', 'lastSeenAt', 'name', 'openDeliveries', 'phone', 'presence', 'status'], 'the roster carries presence and last seen, never a position');
        assert.strictEqual(roster.find((r) => r.id === 'rider_2').presence, 'online');

        assert.strictEqual((await p('POST', '/drivers/rider_3', ADMIN, { name: 'Chris', phone: '+237600000003', status: 'active' })).body.data.driver.status, 'active');
        assert.strictEqual(await statusOf(RIDER3), 'offline', 'reactivated, they are still offline');
        assert.strictEqual((await p('GET', '/drivers', SELLER)).body.data.drivers.some((r) => r.id === 'rider_3'), false, 'and are not offered anything yet');
        assert.strictEqual((await p('GET', '/drivers?status=all', ADMIN)).body.data.drivers.find((r) => r.id === 'rider_3').presence, 'offline');
        assert.strictEqual(presenceOf(await goOnline(RIDER3)).status, 'online', 'they go online themselves');
        assert.ok((await p('GET', '/drivers', SELLER)).body.data.drivers.some((r) => r.id === 'rider_3'));
      } finally {
        if (serverP.closeAllConnections) serverP.closeAllConnections();
        await new Promise((resolve) => serverP.close(resolve));
      }
    }

    console.log('    ✓ Delivery routes: wiring, validation, status codes, rider presence and the live stream hold.');
  } finally {
    NotificationService.create = originalCreate;
    if (!hadSecret) config.supabase.jwtSecret = hadSecret;
    for (const st of openStreams) closeStream(st);
    if (server.closeAllConnections) server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
}

async function run() {
  console.log('  Testing Delivery routes and stream...');
  await main();
}

module.exports = { run };
