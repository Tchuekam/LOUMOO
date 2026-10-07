/**
 * LOUMOO — Rider presence over HTTP
 * ---------------------------------------------------------------------------
 * The six presence endpoints (docs/DELIVERY_API.md, "Rider presence") through the
 * real delivery router, the real express stack and the real error handler, over a
 * real HTTP socket, on top of a real DeliveryService with in-memory repositories and
 * a fake clock. No database, no credentials, no timers.
 *
 *   GET  /driver/presence             the signed-in rider's own presence
 *   POST /driver/presence/online      go online (or come back)
 *   POST /driver/presence/offline     go offline
 *   POST /driver/presence/pause       take a break
 *   POST /driver/presence/resume      back from a break
 *   POST /driver/presence/heartbeat   "I am still here"
 *
 * The subject of this suite is WHO MAY CHANGE WHAT. Presence decides who is offered
 * a delivery, so nobody may make a rider available except that rider, deliberately:
 *
 *   - no session: 401 from the PRODUCTION router (the real requireAuth), whatever
 *     else the request carries (forged tokens, the test header, a different scheme);
 *   - a session that is not a registered rider (customer, seller, administrator): 403
 *     on all six, and nothing is written;
 *   - a SUSPENDED rider: 403 on all six, and they never become available, whatever
 *     the stored row says;
 *   - the request surface names no rider and no status: the paths have no parameter
 *     and the bodies are strict, so "make rider B online" or "set me to online"
 *     cannot even be asked, and a rider cannot touch another rider's row;
 *   - a heartbeat keeps a rider alive; it never raises one;
 *   - a rider's position is theirs: sellers, buyers and administrators never get it;
 *   - silence, and a rider who changes state while the sweep or a late beat is deciding,
 *     are judged against what is stored when the write happens (section 15), and a rider
 *     who carries a parcel never loses it to silence: only unanswered offers go back.
 *
 * Authentication is replaced by a header-driven stand-in so the suite needs no
 * identity provider (the production router is exercised separately, for the 401s).
 * Presence is read back through the repository only to look at what was STORED;
 * every change is made through an endpoint.
 */

require('../setup');

const assert = require('assert');
const crypto = require('crypto');
const http = require('http');
const express = require('express');
const config = require('../../server/config/env');

const errorHandler = require('../../server/shared/middleware/errorHandler');
const { AuthenticationError } = require('../../server/shared/errors/AppError');
const { requireAuth } = require('../../server/modules/identity/presentation/guards/authGuard');
const SessionToken = require('../../server/modules/identity/infrastructure/SessionToken');
const productionRouter = require('../../server/modules/delivery/presentation/routes/deliveryRoutes');
const { createDeliveryRouter } = productionRouter;
const { DeliveryService, getSharedDeliveryService } = require('../../server/modules/delivery/application/DeliveryService');
const { DeliveryRepository } = require('../../server/modules/delivery/infrastructure/DeliveryRepository');
const { DeliveryEvents } = require('../../server/modules/delivery/infrastructure/DeliveryEvents');
const { OrderRepository } = require('../../server/modules/commerce/infrastructure/OrderRepository');
const { Order, FULFILLMENT_STATUS, DELIVERY_METHOD, PAYMENT_STATUS } = require('../../server/modules/commerce/domain/Order');

const BUYER = 'buyer_1|customer';
const SELLER = 'seller_1|seller';
const ADMIN = 'admin_1|admin';
const STRANGER = 'stranger_1|customer';
const RIDER_A = 'rider_a|customer';
const RIDER_B = 'rider_b|customer';
const RIDER_C = 'rider_c|customer';
const RIDER_S = 'rider_s|customer';
// Riders of the "what happens to a delivery when its rider's availability changes" scenarios (section 15).
const RIDER_D = 'rider_d|customer';
const RIDER_E = 'rider_e|customer';
const RIDER_F = 'rider_f|customer';
const RIDER_G = 'rider_g|customer';
const RIDER_H = 'rider_h|customer';
const RIDER_I = 'rider_i|customer';
const RIDER_J = 'rider_j|customer';
const RIDER_K = 'rider_k|customer';
const RIDER_L = 'rider_l|customer';
// Riders of section 15j2: a wrong row, silence, and a pause that races the sweep.
const RIDER_M = 'rider_m|customer';
const RIDER_N = 'rider_n|customer';
const RIDER_O = 'rider_o|customer';
// An administrator who is ALSO a registered rider: their rank gives them no say over anybody else's presence.
const ADMIN_RIDER = 'admin_2|admin';

const NEAR = { lat: 4.0511, lng: 9.7679 };
// A rider's availability position: distinct from every other coordinate in the suite, so that
// finding it in a response (and a response that must not carry it) is unambiguous.
const PRIVATE = { lat: 3.848, lng: 11.5021, accuracyM: 7.25 };
const PRIVATE_TEXT = ['3.848', '11.5021', '7.25'];

const TTL_MS = 2 * 60 * 1000;
const BEAT_MS = 30 * 1000;
const PRESENCE_KEYS = ['available', 'expiresAt', 'heartbeatIntervalMs', 'lastSeenAt', 'location', 'reason', 'status', 'ttlSeconds', 'updatedAt'];
const PRESENCE_CALLS = [
  ['GET', '/driver/presence'],
  ['POST', '/driver/presence/online'],
  ['POST', '/driver/presence/offline'],
  ['POST', '/driver/presence/pause'],
  ['POST', '/driver/presence/resume'],
  ['POST', '/driver/presence/heartbeat']
];

// Header-driven stand-in for requireAuth: "x-test-user: <id>|<role>".
function fakeAuth(req, res, next) {
  const header = req.headers['x-test-user'];
  if (!header) return next(new AuthenticationError('Authentication required.'));
  const [id, role = 'customer'] = String(header).split('|');
  req.principal = { id, primaryRole: role };
  req.userId = id;
  return next();
}

/** A JWT in the shape the platform issues, signed with `secret`. */
function forgedJwt(secret, subject) {
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const body = `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({
    sub: subject, iss: SessionToken.ISSUER, aud: SessionToken.AUDIENCE, exp: Math.floor(Date.now() / 1000) + 3600
  })}`;
  return `${body}.${crypto.createHmac('sha256', secret).update(body).digest('base64url')}`;
}

async function main() {
  let t = Date.parse('2026-10-03T10:00:00.000Z');
  const clock = { now: () => t, advance: (ms) => { t += ms; } };
  const iso = (ms) => new Date(ms).toISOString();

  const orders = new OrderRepository({ db: null });
  const repo = new DeliveryRepository({ db: null });
  const events = new DeliveryEvents();
  const service = new DeliveryService({ repository: repo, orderRepository: orders, events, now: clock.now, presenceTtlMs: TTL_MS });

  const app = express();
  app.use(express.json());
  app.use('/api/v1/deliveries', createDeliveryRouter({ service, authenticate: fakeAuth, events }));
  app.use(errorHandler);
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;

  // The production router, with the real requireAuth in front of every route.
  const prodApp = express();
  prodApp.use(express.json());
  prodApp.use('/api/v1/deliveries', productionRouter);
  prodApp.use(errorHandler);
  const prodServer = http.createServer(prodApp);
  await new Promise((resolve) => prodServer.listen(0, '127.0.0.1', resolve));
  const prodBase = `http://127.0.0.1:${prodServer.address().port}`;

  /** `(method, path, user, body)` against the router; a timeout so a hung response fails the test. */
  async function request(origin, method, path, { user, headers = {}, body, rawBody } = {}) {
    const res = await fetch(origin + path, {
      method,
      headers: { ...(user ? { 'x-test-user': user } : {}), 'content-type': 'application/json', ...headers },
      body: rawBody !== undefined ? rawBody : (body === undefined ? undefined : JSON.stringify(body)),
      signal: AbortSignal.timeout(8000)
    });
    let json = null;
    try { json = await res.json(); } catch (e) { /* not JSON (an unmatched route is express's own 404) */ }
    return { status: res.status, body: json, contentType: res.headers.get('content-type') || '' };
  }
  const api = (method, path, user, body) => request(base, method, `/api/v1/deliveries${path}`, { user, body });
  const apiRaw = (method, path, user, rawBody) => request(base, method, `/api/v1/deliveries${path}`, { user, rawBody });

  /** The answer is a refusal: this status, this error code and, when given, this reason. */
  function assertRefused(res, status, errorCode, reason, what) {
    assert.strictEqual(res.status, status, `${what}: status (${JSON.stringify(res.body)})`);
    assert.ok(res.body, `${what}: a JSON body`);
    assert.strictEqual(res.body.success, false, `${what}: not a success`);
    assert.strictEqual(res.body.error.code, errorCode, `${what}: error code (${JSON.stringify(res.body.error)})`);
    assert.strictEqual(typeof res.body.error.message, 'string', `${what}: a message`);
    assert.ok(res.body.error.message.length > 0, `${what}: a message`);
    if (reason !== null && reason !== undefined) assert.strictEqual(res.body.error.details && res.body.error.details.reason, reason, `${what}: details.reason`);
  }

  /** A 200 in the documented envelope; returns the presence object. */
  function assertPresenceResponse(res, what) {
    assert.strictEqual(res.status, 200, `${what}: ${JSON.stringify(res.body)}`);
    assert.ok(/^application\/json/.test(res.contentType), `${what}: JSON content type (${res.contentType})`);
    assert.deepStrictEqual(Object.keys(res.body).sort(), ['data', 'status', 'success'], `${what}: the envelope has success, status and data only`);
    assert.strictEqual(res.body.success, true, `${what}: success`);
    assert.strictEqual(res.body.status, 'success', `${what}: status`);
    assert.deepStrictEqual(Object.keys(res.body.data), ['presence'], `${what}: data holds the presence and nothing else`);
    assert.deepStrictEqual(Object.keys(res.body.data.presence).sort(), PRESENCE_KEYS, `${what}: the presence has exactly the documented fields`);
    return res.body.data.presence;
  }

  const presenceOf = (res) => res.body.data.presence;
  const statusOf = async (user) => presenceOf(await api('GET', '/driver/presence', user)).status;
  const storedOf = (id) => repo.findPresence(id);
  const goOnline = (user, body = {}) => api('POST', '/driver/presence/online', user, body);
  const bodyFor = (method) => (method === 'POST' ? {} : undefined);

  async function placeOrder() {
    return orders.saveOrder(new Order({
      buyerId: 'buyer_1',
      sellerId: 'seller_1',
      items: [{ listingId: 'lst_1', title: 'Phone', unitPriceXaf: 50000, quantity: 1, sellerId: 'seller_1', storeName: 'Tech Shop' }],
      shippingAddress: { fullName: 'Awa Njoya', phone: '+237622222222', street: 'Rue 1', neighbourhood: 'Bonanjo', city: 'Douala' },
      deliveryMethod: DELIVERY_METHOD.HOME_DELIVERY,
      paymentStatus: PAYMENT_STATUS.PAID,
      fulfillmentStatus: FULFILLMENT_STATUS.PROCESSING
    }));
  }
  async function newDelivery() {
    const order = await placeOrder();
    const created = await api('POST', '/', SELLER, { orderId: order.id, dropoffLocation: { lat: 4.0601, lng: 9.7679 } });
    assert.strictEqual(created.status, 201, JSON.stringify(created.body));
    return created.body.data.delivery.id;
  }

  // Nothing here may reach a real notifications table; who was told what is recorded instead.
  const NotificationService = require('../../server/modules/identity/application/NotificationService');
  const originalCreate = NotificationService.create;
  const notified = [];
  NotificationService.create = async (userId, note) => { notified.push({ userId, title: note && note.title }); return null; };
  // requireAuth verifies tokens against this secret; with none configured it refuses everything.
  const hadSecret = config.supabase.jwtSecret;
  if (!hadSecret) config.supabase.jwtSecret = 'unit-test-presence-secret-0123456789abcdef';

  try {
    // ======================================================================= 1. the route table
    {
      const routes = productionRouter.stack.filter((l) => l.route);
      const order = routes.map((l) => l.route.path);
      for (const [method, path] of PRESENCE_CALLS) {
        const layers = routes.filter((l) => l.route.path === path);
        assert.strictEqual(layers.length, 1, `${path} is registered exactly once`);
        assert.deepStrictEqual(Object.keys(layers[0].route.methods), [method.toLowerCase()], `${path} answers ${method} and nothing else`);
        assert.strictEqual(layers[0].route.stack[0].handle, requireAuth, `${method} ${path} starts with the real requireAuth`);
        assert.ok(!path.includes(':'), `${path} has no path parameter: it cannot name a rider`);
        for (const param of ['/:id', '/:id/code', '/:id/stream', '/:id/accept', '/:id/location']) {
          assert.ok(order.indexOf(path) < order.indexOf(param), `${path} is registered before ${param}, so no delivery route can swallow it`);
        }
      }
      assert.strictEqual(routes.filter((l) => /presence/.test(l.route.path)).length, 6, 'and there are exactly six presence routes');
    }

    // ======================================================================= 2. no session: 401, from the real router
    {
      const shared = getSharedDeliveryService();
      const sharedBefore = JSON.stringify(await shared.repo.listPresence());
      const forged = forgedJwt('some-other-secret-0123456789abcdef-xxxx', 'rider_a');
      const credentials = [
        ['no credentials at all', {}],
        ['the test-suite header (it means nothing here)', { 'x-test-user': RIDER_A }],
        ['a bearer token that is not a token', { authorization: 'Bearer not.a.jwt' }],
        ['a well-formed token signed with somebody else\'s secret', { authorization: `Bearer ${forged}` }],
        ['the test-harness token with the wrong secret', { authorization: 'Bearer loumoo_test:wrong-secret:rider_a' }],
        ['a different authorization scheme', { authorization: 'Basic cmlkZXJfYTpwYXNzd29yZA==' }],
        ['a bearer scheme with nothing after it', { authorization: 'Bearer' }]
      ];
      for (const [method, path] of PRESENCE_CALLS) {
        for (const [label, headers] of credentials) {
          const res = await request(prodBase, method, `/api/v1/deliveries${path}`, { headers, body: bodyFor(method) });
          assertRefused(res, 401, 'UNAUTHENTICATED', null, `${method} ${path} with ${label}`);
        }
      }
      assert.strictEqual(JSON.stringify(await shared.repo.listPresence()), sharedBefore, 'no unauthenticated call wrote a presence row anywhere');
    }

    // ======================================================================= 3. the same refusal from the fake-auth router
    for (const [method, path] of PRESENCE_CALLS) {
      const res = await request(base, method, `/api/v1/deliveries${path}`, { body: bodyFor(method) });
      assertRefused(res, 401, 'UNAUTHENTICATED', null, `${method} ${path} without a session`);
    }

    // ======================================================================= 4. riders are registered by an administrator, and only by one
    for (const [id, name, phone] of [['rider_a', 'Alain', '+237600000001'], ['rider_b', 'Bruno', '+237600000002'], ['rider_c', 'Cyrille', '+237600000003'], ['rider_s', 'Serge', '+237600000004'], ['admin_2', 'Dana', '+237600000005']]) {
      assert.strictEqual((await api('POST', `/drivers/${id}`, ADMIN, { name, phone })).status, 200, `${name} is registered`);
    }
    assert.strictEqual((await api('POST', '/drivers/rider_a', RIDER_A, { name: 'Alain', phone: '+237600000001' })).status, 403, 'a rider cannot register themselves again');
    assert.strictEqual((await api('POST', '/drivers/stranger_1', STRANGER, { name: 'Sly', phone: '+237600000009' })).status, 403, 'and an account cannot make itself a rider');
    assert.strictEqual(await repo.findDriver('stranger_1'), null);

    // ======================================================================= 5. an account that is not a rider has no presence
    for (const [who, label] of [[STRANGER, 'a customer who is not a rider'], [BUYER, 'a buyer'], [SELLER, 'a seller'], [ADMIN, 'an administrator']]) {
      for (const [method, path] of PRESENCE_CALLS) {
        const res = await api(method, path, who, bodyFor(method));
        assertRefused(res, 403, 'PERMISSION_DENIED', null, `${label}: ${method} ${path}`);
        assert.strictEqual(res.body.error.message, 'You are not a registered rider.', `${label}: ${method} ${path} says why`);
      }
      // A valid position does not turn a refusal into a write.
      for (const path of ['/driver/presence/online', '/driver/presence/resume', '/driver/presence/heartbeat']) {
        assertRefused(await api('POST', path, who, NEAR), 403, 'PERMISSION_DENIED', null, `${label}: ${path} with a position`);
      }
    }
    for (const id of ['stranger_1', 'buyer_1', 'seller_1', 'admin_1']) {
      assert.strictEqual(await storedOf(id), null, `no presence row was created for ${id}`);
    }
    assert.strictEqual((await api('GET', '/driver/me', ADMIN)).status, 403, 'and none of that made an administrator a rider');
    assert.strictEqual(await repo.findDriver('admin_1'), null);

    // ======================================================================= 6. happy path: every endpoint, in the documented envelope
    {
      // A rider who never opened the app: registered is not available.
      const never = assertPresenceResponse(await api('GET', '/driver/presence', RIDER_A), 'GET presence of a rider who never went online');
      assert.deepStrictEqual(never, {
        status: 'offline', available: false, reason: 'offline', lastSeenAt: null, expiresAt: null,
        ttlSeconds: 120, heartbeatIntervalMs: 30000, location: null, updatedAt: null
      }, 'a registered rider who never went online is offline, unavailable, and has no heartbeat');
      assert.strictEqual(await storedOf('rider_a'), null, 'reading presence creates nothing');

      const t0 = clock.now();
      const online = assertPresenceResponse(await api('POST', '/driver/presence/online', RIDER_A), 'POST online with no body at all');
      assert.deepStrictEqual(online, {
        status: 'online', available: true, reason: null, lastSeenAt: iso(t0), expiresAt: iso(t0 + TTL_MS),
        ttlSeconds: 120, heartbeatIntervalMs: 30000, location: null, updatedAt: iso(t0)
      }, 'online: heard from now, expires one window later, no position shared');
      const row = await storedOf('rider_a');
      assert.deepStrictEqual([row.status, row.latitude, row.longitude, row.accuracy, row.lastSeenAt], ['online', null, null, null, iso(t0)], 'and that is what was stored');

      const withPosition = assertPresenceResponse(await api('POST', '/driver/presence/online', RIDER_A, { ...NEAR, accuracyM: 12 }), 'POST online again, with a position');
      assert.strictEqual(withPosition.status, 'online', 'going online twice is fine');
      assert.deepStrictEqual(withPosition.location, { ...NEAR, accuracyM: 12 }, 'the rider sees the position they sent');
      const rowWithPosition = await storedOf('rider_a');
      assert.deepStrictEqual([rowWithPosition.latitude, rowWithPosition.longitude, rowWithPosition.accuracy], [NEAR.lat, NEAR.lng, 12], 'the position is stored on the presence row');
      assert.deepStrictEqual(await repo.listLocations('rider_a'), [], 'and it is not a delivery GPS point');

      clock.advance(BEAT_MS);
      const beat = assertPresenceResponse(await api('POST', '/driver/presence/heartbeat', RIDER_A, { lat: 4.06, lng: 9.77 }), 'POST heartbeat');
      assert.strictEqual(beat.status, 'online');
      assert.strictEqual(beat.lastSeenAt, iso(t0 + BEAT_MS), 'a beat moves lastSeenAt to now');
      assert.strictEqual(beat.expiresAt, iso(t0 + BEAT_MS + TTL_MS), 'and the expiry with it');
      assert.deepStrictEqual(beat.location, { lat: 4.06, lng: 9.77, accuracyM: null });
      assert.deepStrictEqual(assertPresenceResponse(await api('GET', '/driver/presence', RIDER_A), 'GET presence after a beat'), beat, 'GET reads back exactly what the beat answered');

      const paused = assertPresenceResponse(await api('POST', '/driver/presence/pause', RIDER_A), 'POST pause');
      assert.deepStrictEqual([paused.status, paused.available, paused.reason, paused.expiresAt, paused.location], ['paused', false, 'paused', null, null], 'paused: not available, no expiry, no position');
      assert.strictEqual((await storedOf('rider_a')).latitude, null, 'a rider on a break shares no position');

      clock.advance(5 * 1000);
      const resumed = assertPresenceResponse(await api('POST', '/driver/presence/resume', RIDER_A), 'POST resume');
      assert.deepStrictEqual([resumed.status, resumed.available, resumed.reason], ['online', true, null], 'resumed: online and available');
      assert.strictEqual(resumed.lastSeenAt, iso(clock.now()), 'coming back counts as being heard from');
      assert.strictEqual(assertPresenceResponse(await api('POST', '/driver/presence/resume', RIDER_A), 'POST resume twice').status, 'online', 'resuming when already online is fine');

      const offline = assertPresenceResponse(await api('POST', '/driver/presence/offline', RIDER_A), 'POST offline');
      assert.deepStrictEqual([offline.status, offline.available, offline.reason, offline.expiresAt, offline.location], ['offline', false, 'offline', null, null]);
      assert.strictEqual((await storedOf('rider_a')).status, 'offline');
      assert.strictEqual(assertPresenceResponse(await api('POST', '/driver/presence/offline', RIDER_A), 'POST offline twice').status, 'offline', 'going offline twice is fine');

      // An empty JSON object is the same as no body, on every POST. And a state change that does not
      // fit the state the rider is in is a 409 with the reason, not a quiet success.
      assertRefused(await api('POST', '/driver/presence/pause', RIDER_A, {}), 409, 'RIDER_UNAVAILABLE', 'offline', 'pausing while offline');
      assertRefused(await api('POST', '/driver/presence/resume', RIDER_A, {}), 409, 'RIDER_UNAVAILABLE', 'offline', 'resuming without being on a break');
      assert.strictEqual(presenceOf(await api('POST', '/driver/presence/heartbeat', RIDER_A, {})).status, 'offline', 'a heartbeat with {} while offline: told so');
      assert.strictEqual(presenceOf(await api('POST', '/driver/presence/online', RIDER_A, {})).status, 'online', 'online with {}');
      assert.strictEqual(presenceOf(await api('POST', '/driver/presence/heartbeat', RIDER_A, {})).status, 'online', 'a heartbeat with {} while online');
      assert.strictEqual(presenceOf(await api('POST', '/driver/presence/offline', RIDER_A, {})).status, 'offline', 'offline with {}');
      assert.strictEqual((await storedOf('rider_a')).status, 'offline', 'and the rider is offline again after that round');
    }

    // ======================================================================= 7. what is not a route
    {
      const rowA = await storedOf('rider_a');
      const rowB = await storedOf('rider_b');
      const direct = presenceOf(await api('GET', '/driver/presence', RIDER_A));
      // GET /driver/presence is the presence endpoint, not "the delivery called driver/presence".
      const read = await api('GET', '/driver/presence', RIDER_A);
      assert.deepStrictEqual(Object.keys(read.body.data), ['presence'], 'it answers with a presence, not a delivery');
      assert.strictEqual((await api('GET', '/driver/presence', STRANGER)).body.error.code, 'PERMISSION_DENIED', 'and a stranger is refused as a rider, not told there is no such delivery (404)');

      // A query string carries no rider and no status: it is ignored, and the answer is the caller's own.
      assert.deepStrictEqual(presenceOf(await api('GET', '/driver/presence?riderId=rider_b&driverId=rider_b&status=online', RIDER_A)), direct, 'a query string naming rider_b still reads rider_a\'s own presence');

      // Verbs and shapes that are not presence routes. None is 200, and none changes anything.
      const attempts = [
        ['GET', '/driver/presence/online'], ['GET', '/driver/presence/offline'], ['GET', '/driver/presence/heartbeat'],
        ['PUT', '/driver/presence/online'], ['PUT', '/driver/presence'], ['PATCH', '/driver/presence'], ['DELETE', '/driver/presence'],
        ['POST', '/driver/presence'], ['POST', '/driver/presence/busy'], ['POST', '/driver/presence/suspend'], ['POST', '/driver/presence/status'],
        ['POST', '/driver/presence/online/rider_b'], ['POST', '/driver/presence/rider_b/offline'], ['GET', '/driver/presence/rider_b'],
        ['POST', '/driver/rider_b/presence/online'], ['POST', '/driver/rider_b/presence/offline'], ['GET', '/driver/rider_b/presence'],
        ['GET', '/drivers/rider_b/presence'], ['POST', '/drivers/rider_b/presence'], ['POST', '/drivers/rider_b/presence/offline'],
        ['PUT', '/drivers/rider_b/presence'], ['PATCH', '/drivers/rider_b'], ['DELETE', '/drivers/rider_b'],
        ['POST', '/rider_b/presence'], ['GET', '/rider_b/presence'], ['POST', '/presence/rider_b']
      ];
      for (const user of [RIDER_A, ADMIN]) {
        for (const [method, path] of attempts) {
          const res = await api(method, path, user, ['POST', 'PUT', 'PATCH'].includes(method) ? { status: 'offline' } : undefined);
          assert.strictEqual(res.status, 404, `${method} ${path} as ${user.split('|')[1]} is not a route (got ${res.status})`);
        }
      }
      assert.deepStrictEqual(await storedOf('rider_a'), rowA, 'rider_a\'s stored presence is exactly as it was');
      assert.deepStrictEqual(await storedOf('rider_b'), rowB, 'and so is rider_b\'s');

      // A single-segment path is a delivery id: that is the route /:id, and it is not a presence route.
      assert.strictEqual((await api('GET', '/presence', RIDER_A)).status, 404, 'GET /presence is "the delivery called presence", which does not exist');
    }

    // ======================================================================= 8. the body carries a position and nothing else
    {
      const SMUGGLE = [
        { status: 'online' }, { online: true }, { riderId: 'rider_b' }, { driverId: 'rider_b' }, { profileId: 'rider_b' },
        { status: 'busy' }, { available: true }, { userId: 'rider_b' }, { id: 'rider_b' }, { role: 'admin' },
        { ...NEAR, status: 'online' }, { ...NEAR, riderId: 'rider_b' }
      ];
      const BAD_POSITIONS = [
        [{ lat: 4.05 }, 'a latitude without a longitude'],
        [{ lng: 9.76 }, 'a longitude without a latitude'],
        [{ lat: 91, lng: 0 }, 'latitude 91'], [{ lat: -91, lng: 0 }, 'latitude -91'],
        [{ lat: 0, lng: 181 }, 'longitude 181'], [{ lat: 0, lng: -181 }, 'longitude -181'],
        [{ lat: 'north', lng: 9.7 }, 'a text latitude'], [{ lat: 4.05, lng: 'east' }, 'a text longitude'],
        [{ lat: '', lng: '' }, 'empty text coordinates'], [{ lat: null, lng: 9.7 }, 'a null latitude beside a real longitude'],
        [{ lat: 4.05, lng: null }, 'a real latitude beside a null longitude'],
        [{ lat: true, lng: false }, 'boolean coordinates'], [{ lat: [4], lng: [9] }, 'array coordinates'], [{ lat: {}, lng: {} }, 'object coordinates'],
        [{ ...NEAR, accuracyM: -1 }, 'a negative accuracy'], [{ ...NEAR, accuracyM: 'low' }, 'a text accuracy'],
        [{ ...NEAR, accuracyM: 1000001 }, 'an accuracy beyond a million metres'],
        // An accuracy describes a position. Without one there is nothing for it to describe, and a value
        // refused beside a position must not be quietly dropped (and answered 200) when sent alone.
        [{ accuracyM: 5 }, 'an accuracy and no position at all'], [{ accuracyM: -5 }, 'a negative accuracy and no position'],
        [{ accuracyM: 'low' }, 'a text accuracy and no position'], [{ accuracyM: 99999999 }, 'a huge accuracy and no position']
      ];
      const GOING = ['online', 'resume', 'heartbeat'];

      for (const phase of ['offline', 'online']) {
        if (phase === 'online') assert.strictEqual((await goOnline(RIDER_A, { ...NEAR, accuracyM: 12 })).status, 200);
        const before = await storedOf('rider_a');
        assert.strictEqual(before.status, phase, `rider_a is ${phase} for this round`);

        for (const action of GOING) {
          for (const body of SMUGGLE) {
            assertRefused(await api('POST', `/driver/presence/${action}`, RIDER_A, body), 400, 'VALIDATION_ERROR', null, `${phase}: ${action} with ${JSON.stringify(body)}`);
          }
          for (const [body, what] of BAD_POSITIONS) {
            assertRefused(await api('POST', `/driver/presence/${action}`, RIDER_A, body), 400, 'VALIDATION_ERROR', null, `${phase}: ${action} with ${what}`);
          }
        }
        // offline and pause take NO body: any key at all is refused.
        for (const action of ['offline', 'pause']) {
          for (const body of [...SMUGGLE, { reason: 'lunch' }, { x: 1 }, NEAR, { lat: 1 }, { accuracyM: 5 }]) {
            assertRefused(await api('POST', `/driver/presence/${action}`, RIDER_A, body), 400, 'VALIDATION_ERROR', null, `${phase}: ${action} with ${JSON.stringify(body)}`);
          }
        }
        // Bodies that are not an object.
        for (const action of ['online', 'offline', 'pause', 'resume', 'heartbeat']) {
          for (const raw of ['[]', '[{"status":"online"}]', '"online"', 'true', 'null', '{bad json', '42']) {
            const res = await apiRaw('POST', `/driver/presence/${action}`, RIDER_A, raw);
            assert.strictEqual(res.status, 400, `${phase}: ${action} with the body ${raw} is refused (got ${res.status})`);
            assert.strictEqual(res.body.success, false);
          }
        }
        assert.deepStrictEqual(await storedOf('rider_a'), before, `${phase}: not one of those refused calls changed the stored row`);
        assert.strictEqual(await statusOf(RIDER_A), phase, `${phase}: and rider_a is still ${phase}`);
      }

      // The accepted shapes, for contrast: the refusals above are about the body, not the endpoint.
      clock.advance(6 * 1000);
      const ok1 = await api('POST', '/driver/presence/heartbeat', RIDER_A, { lat: '4.05', lng: '9.76' });
      assert.strictEqual(ok1.status, 200, `numeric strings are accepted as coordinates (${JSON.stringify(ok1.body)})`);
      assert.deepStrictEqual(presenceOf(ok1).location, { lat: 4.05, lng: 9.76, accuracyM: null }, 'and are stored as numbers');
      clock.advance(6 * 1000);
      const ok2 = await api('POST', '/driver/presence/heartbeat', RIDER_A, { lat: null, lng: null });
      assert.strictEqual(ok2.status, 200, 'null coordinates are accepted');
      assert.strictEqual(presenceOf(ok2).location, null, 'and mean "no position"');
      clock.advance(6 * 1000);
      const ok3 = await api('POST', '/driver/presence/heartbeat', RIDER_A, { lat: 90, lng: 180, accuracyM: 0 });
      assert.strictEqual(ok3.status, 200, 'the edge of the globe is a position');
      assert.deepStrictEqual(presenceOf(ok3).location, { lat: 90, lng: 180, accuracyM: 0 });
      clock.advance(6 * 1000);
      const ok4 = await api('POST', '/driver/presence/heartbeat', RIDER_A, { ...NEAR, accuracyM: 1000000 });
      assert.strictEqual(ok4.status, 200, 'a million metres is the largest accuracy accepted');
      assert.deepStrictEqual(presenceOf(ok4).location, { ...NEAR, accuracyM: 1000000 });
      assert.strictEqual(await statusOf(RIDER_A), 'online');
    }

    // ======================================================================= 9. a heartbeat keeps a rider alive; it never raises one
    {
      assert.strictEqual((await api('POST', '/driver/presence/offline', RIDER_A, {})).status, 200);
      const offlineRow = await storedOf('rider_a');
      clock.advance(10 * 1000);
      const beatOffline = await api('POST', '/driver/presence/heartbeat', RIDER_A, { ...NEAR, accuracyM: 5 });
      assert.strictEqual(beatOffline.status, 200, 'a heartbeat from an offline rider is answered, not refused');
      assert.deepStrictEqual([presenceOf(beatOffline).status, presenceOf(beatOffline).available, presenceOf(beatOffline).location], ['offline', false, null], 'they are told they are offline; nothing raised them, and no position was kept');
      assert.deepStrictEqual(await storedOf('rider_a'), offlineRow, 'and the stored row is untouched: no status, no position, no heartbeat');
      assert.strictEqual(await statusOf(RIDER_A), 'offline');

      // A beat that was in flight when the rider tapped "go offline" cannot undo it.
      assert.strictEqual((await goOnline(RIDER_A)).status, 200);
      clock.advance(6 * 1000);
      const racing = await Promise.all([
        api('POST', '/driver/presence/offline', RIDER_A, {}),
        api('POST', '/driver/presence/heartbeat', RIDER_A, { ...NEAR }),
        api('POST', '/driver/presence/heartbeat', RIDER_A, { ...NEAR })
      ]);
      assert.deepStrictEqual(racing.map((r) => r.status), [200, 200, 200]);
      clock.advance(6 * 1000);
      assert.strictEqual((await api('POST', '/driver/presence/heartbeat', RIDER_A, { ...NEAR })).status, 200);
      assert.strictEqual((await storedOf('rider_a')).status, 'offline', 'a beat arriving after "go offline" leaves the rider offline');
      assert.strictEqual((await storedOf('rider_a')).latitude, null, 'and keeps no position for them');

      // The same on a break.
      assert.strictEqual((await goOnline(RIDER_A)).status, 200);
      assert.strictEqual((await api('POST', '/driver/presence/pause', RIDER_A, {})).status, 200);
      const pausedRow = await storedOf('rider_a');
      clock.advance(10 * 1000);
      const beatPaused = await api('POST', '/driver/presence/heartbeat', RIDER_A, { ...NEAR });
      assert.strictEqual(presenceOf(beatPaused).status, 'paused', 'a heartbeat does not end a break');
      assert.deepStrictEqual(await storedOf('rider_a'), pausedRow, 'and writes nothing');
      assert.strictEqual((await api('POST', '/driver/presence/resume', RIDER_A, {})).status, 200);

      // Silence: online one millisecond before the window ends, offline at exactly the window, and a late beat does not revive.
      const heard = presenceOf(await api('GET', '/driver/presence', RIDER_A)).lastSeenAt;
      assert.strictEqual(heard, iso(clock.now()));
      clock.advance(TTL_MS - 1);
      const almost = presenceOf(await api('GET', '/driver/presence', RIDER_A));
      assert.deepStrictEqual([almost.status, almost.available], ['online', true], '1 ms before the window ends the rider is still online');
      clock.advance(1);
      const silent = presenceOf(await api('GET', '/driver/presence', RIDER_A));
      assert.deepStrictEqual([silent.status, silent.available, silent.reason, silent.expiresAt], ['offline', false, 'expired', null], 'at exactly the window they are offline');
      const late = await api('POST', '/driver/presence/heartbeat', RIDER_A, { ...NEAR });
      assert.strictEqual(late.status, 200);
      assert.strictEqual(presenceOf(late).status, 'offline', 'a beat after the window does not bring them back');
      assert.strictEqual((await storedOf('rider_a')).status, 'offline', 'the late beat set the stored row offline');
      assert.strictEqual(presenceOf(await api('POST', '/driver/presence/heartbeat', RIDER_A, { ...NEAR })).status, 'offline', 'and neither does the next one');
      assert.strictEqual(await statusOf(RIDER_A), 'offline');
    }

    // ======================================================================= 10. one rider cannot touch another
    {
      assert.strictEqual((await goOnline(RIDER_B, { lat: 5.0, lng: 10.0, accuracyM: 20 })).status, 200);
      const bRow = await storedOf('rider_b');
      assert.strictEqual(bRow.status, 'online');
      const bAnswer = presenceOf(await api('GET', '/driver/presence', RIDER_B));

      // rider_a runs their whole day; rider_b's row never moves.
      const steps = [
        ['POST', '/driver/presence/online', { ...NEAR }, 'online'],
        ['POST', '/driver/presence/heartbeat', { lat: 4.06, lng: 9.77 }, 'online'],
        ['POST', '/driver/presence/pause', {}, 'paused'],
        ['POST', '/driver/presence/resume', {}, 'online'],
        ['POST', '/driver/presence/offline', {}, 'offline'],
        ['POST', '/driver/presence/online', {}, 'online']
      ];
      for (const [method, path, body, expected] of steps) {
        clock.advance(6 * 1000);
        const res = await api(method, path, RIDER_A, body);
        assert.strictEqual(res.status, 200, `${path}: ${JSON.stringify(res.body)}`);
        assert.strictEqual(presenceOf(res).status, expected, `rider_a ${path} -> ${expected}`);
        assert.strictEqual((await storedOf('rider_a')).status, expected, `${path} changed rider_a's own row`);
        assert.deepStrictEqual(await storedOf('rider_b'), bRow, `${path}: rider_b's stored row is exactly as it was`);
      }
      assert.deepStrictEqual(presenceOf(await api('GET', '/driver/presence', RIDER_B)), bAnswer, 'and rider_b reads the same presence as before');

      // rider_a names rider_b in every way the request allows. None of them is accepted.
      for (const [path, body] of [
        ['/driver/presence/online', { riderId: 'rider_b' }], ['/driver/presence/online', { driverId: 'rider_b' }],
        ['/driver/presence/heartbeat', { riderId: 'rider_b', ...NEAR }], ['/driver/presence/resume', { profileId: 'rider_b' }],
        ['/driver/presence/offline', { riderId: 'rider_b' }], ['/driver/presence/offline', { driverId: 'rider_b' }],
        ['/driver/presence/pause', { profileId: 'rider_b' }], ['/driver/presence/offline', { userId: 'rider_b', status: 'offline' }]
      ]) {
        assertRefused(await api('POST', path, RIDER_A, body), 400, 'VALIDATION_ERROR', null, `rider_a, ${path} naming rider_b: ${JSON.stringify(body)}`);
      }
      assert.deepStrictEqual(await storedOf('rider_b'), bRow, 'rider_b is untouched by every one of them');

      // A query string is not a way to name a rider either: this is rider_a going offline, as ever.
      const aimed = await api('POST', '/driver/presence/offline?riderId=rider_b&driverId=rider_b', RIDER_A, {});
      assert.strictEqual(aimed.status, 200);
      assert.strictEqual(presenceOf(aimed).status, 'offline', 'it was rider_a who went offline');
      assert.strictEqual((await storedOf('rider_a')).status, 'offline');
      assert.deepStrictEqual(await storedOf('rider_b'), bRow, 'and rider_b did not');
      assert.strictEqual((await goOnline(RIDER_A, { ...NEAR })).status, 200);

      // Registering and suspending is an administrator's act: a rider cannot suspend a colleague.
      for (const [user, label] of [[RIDER_A, 'a rider'], [SELLER, 'a seller']]) {
        assertRefused(await api('POST', '/drivers/rider_b', user, { name: 'Bruno', phone: '+237600000002', status: 'suspended' }), 403, 'PERMISSION_DENIED', null, `${label} suspending rider_b`);
      }
      // And not even an administrator can write a presence status through the registration route.
      for (const status of ['online', 'busy', 'paused', 'offline']) {
        assertRefused(await api('POST', '/drivers/rider_b', ADMIN, { name: 'Bruno', phone: '+237600000002', status }), 400, 'VALIDATION_ERROR', null, `an administrator registering rider_b with status "${status}"`);
      }
      assert.strictEqual((await api('POST', '/drivers/rider_b', ADMIN, { name: 'Bruno', phone: '+237600000002', presence: 'online' })).status, 400, 'there is no presence key on the registration body either');
      assert.deepStrictEqual(await storedOf('rider_b'), bRow, 'rider_b is still untouched');

      // An administrator who is also a rider moves only their own presence.
      const adminBefore = await storedOf('admin_2');
      assert.strictEqual(adminBefore, null, 'the administrator-rider has never been online');
      assert.strictEqual(presenceOf(await goOnline(ADMIN_RIDER)).status, 'online', 'as a rider they can go online');
      assert.strictEqual((await storedOf('admin_2')).status, 'online');
      assertRefused(await api('POST', '/driver/presence/offline', ADMIN_RIDER, { riderId: 'rider_b' }), 400, 'VALIDATION_ERROR', null, 'an administrator naming rider_b');
      const adminOffline = await api('POST', '/driver/presence/offline', ADMIN_RIDER, {});
      assert.strictEqual(presenceOf(adminOffline).status, 'offline');
      assert.deepStrictEqual(await storedOf('rider_b'), bRow, 'administrator rank gives them no say over rider_b');
      assert.strictEqual((await storedOf('rider_a')).status, 'online', 'or over rider_a');

      // Many at once, each their own.
      const crowd = await Promise.all([
        api('POST', '/driver/presence/heartbeat', RIDER_A, { ...NEAR }),
        api('POST', '/driver/presence/heartbeat', RIDER_B, { lat: 5.0, lng: 10.0 }),
        api('POST', '/driver/presence/pause', RIDER_B, {}),
        api('GET', '/driver/presence', RIDER_A)
      ]);
      assert.deepStrictEqual(crowd.map((r) => r.status), [200, 200, 200, 200]);
      assert.strictEqual((await storedOf('rider_b')).status, 'paused', 'rider_b paused themselves');
      assert.strictEqual((await storedOf('rider_a')).status, 'online', 'and rider_a was not paused with them');
      assert.strictEqual((await api('POST', '/driver/presence/resume', RIDER_B, { lat: 5.0, lng: 10.0 })).status, 200);
      assert.strictEqual(await statusOf(RIDER_B), 'online');
    }

    // ======================================================================= 11. a rider's position is theirs
    {
      const deliveryId = await newDelivery();
      clock.advance(6 * 1000);
      assert.strictEqual((await api('POST', '/driver/presence/heartbeat', RIDER_A, PRIVATE)).status, 200);
      const ownView = presenceOf(await api('GET', '/driver/presence', RIDER_A));
      assert.deepStrictEqual(ownView.location, PRIVATE, 'the rider sees their own position');
      const stored = await storedOf('rider_a');
      assert.deepStrictEqual([stored.latitude, stored.longitude, stored.accuracy], [PRIVATE.lat, PRIVATE.lng, PRIVATE.accuracyM]);
      assert.deepStrictEqual(await repo.listLocations('rider_a'), [], 'a heartbeat leaves no delivery GPS point');
      assert.deepStrictEqual(presenceOf(await api('GET', '/driver/presence', RIDER_B)).location, { lat: 5, lng: 10, accuracyM: null }, 'a colleague reads their own position, never this one');
      assert.notDeepStrictEqual(presenceOf(await api('GET', '/driver/presence', RIDER_B)).location, ownView.location);

      assert.strictEqual((await api('POST', `/${deliveryId}/assign`, SELLER, { driverId: 'rider_a' })).status, 200);
      assert.strictEqual((await api('POST', `/${deliveryId}/accept`, RIDER_A)).status, 200);
      assert.strictEqual(await statusOf(RIDER_A), 'busy', 'a rider carrying a delivery is busy');
      assert.deepStrictEqual(presenceOf(await api('GET', '/driver/presence', RIDER_A)).location, PRIVATE, 'busy, they still see their own position');

      // The delivery's GPS trail and the rider's presence are two different things.
      const heardAt = presenceOf(await api('GET', '/driver/presence', RIDER_A)).lastSeenAt;
      clock.advance(10 * 1000);
      const ping = await api('POST', `/${deliveryId}/location`, RIDER_A, { lat: 4.02, lng: 9.77 });
      assert.strictEqual(ping.status, 200, JSON.stringify(ping.body));
      assert.strictEqual(ping.body.data.accepted, true, 'the GPS ping was recorded');
      const afterPing = presenceOf(await api('GET', '/driver/presence', RIDER_A));
      assert.strictEqual(afterPing.lastSeenAt, heardAt, 'a delivery GPS ping does not count as a heartbeat');
      assert.deepStrictEqual(afterPing.location, PRIVATE, 'and does not move the rider\'s availability position');
      const trail = await repo.listLocations(deliveryId);
      assert.deepStrictEqual(trail.map((p) => [p.lat, p.lng]), [[4.02, 9.77]], 'the trail holds only the GPS ping');
      clock.advance(6 * 1000);
      assert.strictEqual((await api('POST', '/driver/presence/heartbeat', RIDER_A, PRIVATE)).status, 200);
      assert.strictEqual((await repo.listLocations(deliveryId)).length, 1, 'and a heartbeat added nothing to it');

      // Nobody else is ever given it: not in a list, a delivery, the dispatch board or the roster.
      const seen = {
        'seller: GET /drivers': await api('GET', `/drivers?deliveryId=${deliveryId}`, SELLER),
        'seller: GET /drivers (plain)': await api('GET', '/drivers', SELLER),
        'seller: GET delivery': await api('GET', `/${deliveryId}`, SELLER),
        'seller: dispatch board': await api('GET', '/dispatch', SELLER),
        'buyer: GET delivery': await api('GET', `/${deliveryId}`, BUYER),
        'admin: GET delivery': await api('GET', `/${deliveryId}`, ADMIN),
        'admin: roster': await api('GET', '/drivers?status=all', ADMIN),
        'admin: active roster': await api('GET', '/drivers?status=active', ADMIN),
        'rider_b: own presence': await api('GET', '/driver/presence', RIDER_B),
        'rider_b: overview': await api('GET', '/driver/me', RIDER_B)
      };
      for (const [what, res] of Object.entries(seen)) {
        assert.strictEqual(res.status, 200, `${what}: ${JSON.stringify(res.body)}`);
        const text = JSON.stringify(res.body);
        for (const needle of PRIVATE_TEXT) assert.ok(!text.includes(needle), `${what} does not contain rider_a's availability position (${needle})`);
        assert.ok(!/"latitude"|"longitude"/.test(text), `${what} has no latitude/longitude fields`);
      }
      const roster = seen['admin: roster'].body.data.drivers;
      for (const row of roster) {
        assert.deepStrictEqual(Object.keys(row).sort(), ['id', 'lastSeenAt', 'name', 'openDeliveries', 'phone', 'presence', 'status'], `roster row ${row.id}: presence and last seen, never a position`);
      }
      assert.strictEqual(roster.find((r) => r.id === 'rider_a').presence, 'busy');
      for (const d of seen['seller: GET /drivers (plain)'].body.data.drivers) {
        assert.deepStrictEqual(Object.keys(d).sort(), ['id', 'name', 'openDeliveries', 'phone'], 'a seller picks from names and workload');
      }
      // The rider's own overview (not anybody else's) is where it shows.
      assert.deepStrictEqual((await api('GET', '/driver/me', RIDER_A)).body.data.presence.location, PRIVATE, 'rider_a\'s own overview carries their own presence');

      // Releasing the delivery puts them back to online, not busy.
      assert.strictEqual((await api('POST', `/${deliveryId}/decline`, RIDER_A)).status, 200);
      assert.strictEqual(await statusOf(RIDER_A), 'online', 'a rider who released their delivery is free again');
    }

    // ======================================================================= 12. a suspended rider has no presence, ever
    {
      assert.strictEqual((await goOnline(RIDER_S, { ...NEAR })).status, 200, 'rider_s is online before they are suspended');
      assert.ok((await api('GET', '/drivers', SELLER)).body.data.drivers.some((d) => d.id === 'rider_s'), 'and on the seller\'s list');

      const suspended = await api('POST', '/drivers/rider_s', ADMIN, { name: 'Serge', phone: '+237600000004', status: 'suspended' });
      assert.strictEqual(suspended.body.data.driver.status, 'suspended');
      assert.strictEqual((await storedOf('rider_s')).status, 'offline', 'suspending forced the stored row offline');
      assert.deepStrictEqual([(await storedOf('rider_s')).latitude, (await storedOf('rider_s')).longitude], [null, null], 'and cleared their position');

      for (const [method, path] of PRESENCE_CALLS) {
        const res = await api(method, path, RIDER_S, bodyFor(method));
        assertRefused(res, 403, 'PERMISSION_DENIED', null, `a suspended rider: ${method} ${path}`);
        assert.strictEqual(res.body.error.message, 'Your rider account is not active.', `${method} ${path} says why`);
      }
      for (const path of ['/driver/presence/online', '/driver/presence/resume', '/driver/presence/heartbeat']) {
        assertRefused(await api('POST', path, RIDER_S, NEAR), 403, 'PERMISSION_DENIED', null, `a suspended rider: ${path} with a position`);
      }
      assert.strictEqual((await storedOf('rider_s')).status, 'offline', 'none of that brought them back');
      assert.strictEqual((await api('GET', '/driver/me', RIDER_S)).status, 403, 'a suspended rider has no overview either');
      assert.strictEqual((await api('GET', '/drivers', SELLER)).body.data.drivers.some((d) => d.id === 'rider_s'), false, 'a suspended rider is not offered');

      // Reactivated, they are still offline until they go online themselves.
      assert.strictEqual((await api('POST', '/drivers/rider_s', ADMIN, { name: 'Serge', phone: '+237600000004', status: 'active' })).body.data.driver.status, 'active');
      assert.strictEqual(await statusOf(RIDER_S), 'offline', 'reactivated, they are offline: reactivation does not make a rider available');
      assert.strictEqual((await api('GET', '/drivers', SELLER)).body.data.drivers.some((d) => d.id === 'rider_s'), false, 'and are not offered anything yet');
      assert.strictEqual((await api('POST', '/drivers/rider_s', ADMIN, { name: 'Serge', phone: '+237600000004', status: 'suspended' })).body.data.driver.status, 'suspended');

      // Whatever the stored row says: suspended beats it. A row written online and fresh (by a bug, a
      // restore from backup, a hand-edit) does not make a suspended rider available.
      await repo.transitionPresence('rider_s', ['offline'], { status: 'online', lastSeenAt: iso(clock.now()), updatedAt: iso(clock.now()), latitude: NEAR.lat, longitude: NEAR.lng, accuracy: 5 });
      const tampered = await storedOf('rider_s');
      assert.strictEqual(tampered.status, 'online', 'the stored row says online and fresh');
      assert.strictEqual((await api('GET', '/drivers', SELLER)).body.data.drivers.some((d) => d.id === 'rider_s'), false, 'but a suspended rider is not on the list');
      const deliveryId = await newDelivery();
      assertRefused(await api('POST', `/${deliveryId}/assign`, SELLER, { driverId: 'rider_s' }), 400, 'VALIDATION_ERROR', null, 'assigning a suspended rider whose row says online');
      assert.deepStrictEqual([(await repo.findById(deliveryId)).status, (await repo.findById(deliveryId)).driverId], ['pending_assignment', null], 'and the delivery did not move');
      const roster = (await api('GET', '/drivers?status=all', ADMIN)).body.data.drivers.find((r) => r.id === 'rider_s');
      assert.strictEqual(roster.presence, 'suspended', 'the administrator\'s roster says suspended, not online');
      for (const [method, path] of PRESENCE_CALLS) {
        assertRefused(await api(method, path, RIDER_S, bodyFor(method)), 403, 'PERMISSION_DENIED', null, `a suspended rider with a tampered row: ${method} ${path}`);
      }
      assert.deepStrictEqual(await storedOf('rider_s'), tampered, 'and the refused calls did not touch the row (not even "go offline")');
      // Nobody else can do it for them either.
      assertRefused(await api('POST', '/driver/presence/online', RIDER_A, { riderId: 'rider_s' }), 400, 'VALIDATION_ERROR', null, 'rider_a naming the suspended rider');
      await repo.transitionPresence('rider_s', ['online'], { status: 'offline', updatedAt: iso(clock.now()), latitude: null, longitude: null, accuracy: null });
    }

    // ======================================================================= 13. what the seller and the administrator are told
    {
      // Put each rider in a known state. rider_a online and fresh, rider_b paused, rider_c never online, admin_2 offline.
      assert.strictEqual((await goOnline(RIDER_A, { ...NEAR })).status, 200);
      assert.strictEqual((await goOnline(RIDER_B)).status, 200);
      assert.strictEqual((await api('POST', '/driver/presence/pause', RIDER_B, {})).status, 200);
      assert.strictEqual(await storedOf('rider_c'), null, 'rider_c has never been online');

      const list = await api('GET', '/drivers', SELLER);
      assert.strictEqual(list.status, 200);
      assert.deepStrictEqual(Object.keys(list.body.data).sort(), ['drivers', 'summary'], 'the list answers with the riders and a summary');
      assert.deepStrictEqual(list.body.data.drivers.map((d) => d.id), ['rider_a'], 'only the rider who is online and free is on the list');
      assert.deepStrictEqual(list.body.data.summary, { registered: 4, available: 1 }, 'four active riders are registered (the suspended one is not counted) and one is available');
      assert.strictEqual((await api('GET', '/drivers', ADMIN)).body.data.summary.available, 1, 'an administrator gets the same list');
      assertRefused(await api('GET', '/drivers', BUYER), 403, 'PERMISSION_DENIED', null, 'a customer listing riders');
      assertRefused(await api('GET', '/drivers', RIDER_A), 403, 'PERMISSION_DENIED', null, 'a rider listing riders');

      const roster = await api('GET', '/drivers?status=all', ADMIN);
      assert.strictEqual(roster.status, 200);
      const byId = Object.fromEntries(roster.body.data.drivers.map((r) => [r.id, r]));
      assert.deepStrictEqual(Object.fromEntries(Object.entries(byId).map(([id, r]) => [id, r.presence])),
        { rider_a: 'online', rider_b: 'paused', rider_c: 'offline', rider_s: 'suspended', admin_2: 'offline' },
        'the roster says what each rider is (a suspended rider is suspended, whatever their row says)');
      assert.deepStrictEqual(roster.body.data.drivers.map((r) => r.id), ['rider_a', 'rider_b', 'rider_c', 'admin_2', 'rider_s'],
        'active riders first, by name (Alain, Bruno, Cyrille, Dana), then the suspended one (Serge)');
      assert.strictEqual(typeof byId.rider_a.lastSeenAt, 'string', 'an online rider has a last-seen time');
      assert.strictEqual(byId.rider_c.lastSeenAt, null, 'a rider who never went online has none');
      for (const row of roster.body.data.drivers) {
        assert.deepStrictEqual(Object.keys(row).sort(), ['id', 'lastSeenAt', 'name', 'openDeliveries', 'phone', 'presence', 'status'], `roster row ${row.id}`);
      }
      assert.deepStrictEqual((await api('GET', '/drivers?status=suspended', ADMIN)).body.data.drivers.map((r) => [r.id, r.presence]), [['rider_s', 'suspended']]);
      assert.ok(!(await api('GET', '/drivers?status=active', ADMIN)).body.data.drivers.some((r) => r.id === 'rider_s'), 'the active roster leaves the suspended rider out');
      assertRefused(await api('GET', '/drivers?status=all', SELLER), 403, 'PERMISSION_DENIED', null, 'a seller reading the full roster');
      assertRefused(await api('GET', '/drivers?status=all', RIDER_A), 403, 'PERMISSION_DENIED', null, 'a rider reading the full roster');
      assertRefused(await api('GET', '/drivers?status=online', ADMIN), 400, 'VALIDATION_ERROR', null, 'a roster filter that is not a rider status');

      const overview = await api('GET', '/driver/me', RIDER_A);
      assert.strictEqual(overview.status, 200);
      assert.strictEqual(overview.body.data.presence.status, 'online', 'GET /driver/me carries the rider\'s own presence');
      assert.deepStrictEqual(Object.keys(overview.body.data.presence).sort(), PRESENCE_KEYS);
    }

    // ======================================================================= 14. dispatch over HTTP: the refusals say why
    {
      // rider_c comes online and is offered a delivery; going offline during the offer takes it back.
      assert.strictEqual((await goOnline(RIDER_C)).status, 200);
      const d1 = await newDelivery();
      assert.strictEqual((await api('POST', `/${d1}/assign`, SELLER, { driverId: 'rider_c' })).status, 200);
      assert.deepStrictEqual([(await repo.findById(d1)).status, (await repo.findById(d1)).driverId], ['assigned', 'rider_c']);
      assert.strictEqual(presenceOf(await api('POST', '/driver/presence/offline', RIDER_C, {})).status, 'offline');
      assert.deepStrictEqual([(await repo.findById(d1)).status, (await repo.findById(d1)).driverId], ['pending_assignment', null], 'going offline during an offer gave it back to the seller');
      assert.strictEqual((await api('GET', `/${d1}`, RIDER_C)).status, 404, 'it is no longer rider_c\'s to see');
      assert.strictEqual((await api('POST', `/${d1}/accept`, RIDER_C)).status, 404, 'or to accept');
      assert.strictEqual(await statusOf(RIDER_C), 'offline', 'and the refused accept did not bring them back');

      // Manual assignment to someone who is not available is a 409 with the reason; the delivery does not move.
      for (const [rider, reason, why] of [['rider_c', 'offline', 'an offline rider'], ['rider_b', 'paused', 'a rider on a break'], ['admin_2', 'offline', 'an administrator-rider who never went online']]) {
        const res = await api('POST', `/${d1}/assign`, SELLER, { driverId: rider });
        assertRefused(res, 409, 'RIDER_UNAVAILABLE', reason, `assigning ${why}`);
        assert.deepStrictEqual([(await repo.findById(d1)).status, (await repo.findById(d1)).driverId], ['pending_assignment', null], `${why}: the delivery did not move`);
      }
      assertRefused(await api('POST', `/${d1}/assign`, SELLER, { driverId: 'rider_s' }), 400, 'VALIDATION_ERROR', null, 'assigning a suspended rider');

      // An offer the rider cannot take: the offer is still theirs, the accept is refused with the reason, nothing changes.
      assert.strictEqual((await goOnline(RIDER_C)).status, 200);
      assert.strictEqual((await api('POST', `/${d1}/assign`, SELLER, { driverId: 'rider_c' })).status, 200);
      // (Presence changed behind the offer's back, as when taking the offer back failed: the accept still refuses.)
      await repo.transitionPresence('rider_c', ['online'], { status: 'offline', updatedAt: iso(clock.now()), latitude: null, longitude: null, accuracy: null });
      assertRefused(await api('POST', `/${d1}/accept`, RIDER_C), 409, 'RIDER_UNAVAILABLE', 'offline', 'accepting while offline');
      await repo.transitionPresence('rider_c', ['offline'], { status: 'paused', updatedAt: iso(clock.now()) });
      assertRefused(await api('POST', `/${d1}/accept`, RIDER_C), 409, 'RIDER_UNAVAILABLE', 'paused', 'accepting while paused');
      assert.deepStrictEqual([(await repo.findById(d1)).status, (await repo.findById(d1)).driverId], ['assigned', 'rider_c'], 'the offer is still rider_c\'s');
      assert.strictEqual((await storedOf('rider_c')).status, 'paused', 'and a refused accept did not make them busy or online');
      assert.strictEqual((await goOnline(RIDER_C)).status, 200, 'rider_c goes online properly');
      assert.strictEqual(presenceOf(await api('POST', '/driver/presence/heartbeat', RIDER_C, {})).status, 'online');

      const accepted = await api('POST', `/${d1}/accept`, RIDER_C);
      assert.strictEqual(accepted.status, 200, JSON.stringify(accepted.body));
      assert.strictEqual(await statusOf(RIDER_C), 'busy', 'accepting makes the rider busy');
      assert.strictEqual((await storedOf('rider_c')).status, 'busy');

      // Busy: not offered new work, not allowed to walk away from the parcel.
      const d2 = await newDelivery();
      assertRefused(await api('POST', `/${d2}/assign`, SELLER, { driverId: 'rider_c' }), 409, 'RIDER_BUSY', 'busy', 'assigning a busy rider');
      assert.deepStrictEqual([(await repo.findById(d2)).status, (await repo.findById(d2)).driverId], ['pending_assignment', null]);
      assert.ok(!(await api('GET', '/drivers', SELLER)).body.data.drivers.some((d) => d.id === 'rider_c'), 'a busy rider is not on the list');
      assertRefused(await api('POST', '/driver/presence/offline', RIDER_C, {}), 409, 'RIDER_BUSY', 'busy', 'a busy rider going offline');
      assertRefused(await api('POST', '/driver/presence/pause', RIDER_C, {}), 409, 'RIDER_BUSY', 'busy', 'a busy rider pausing');
      assert.strictEqual(await statusOf(RIDER_C), 'busy', 'they are still busy');
      assert.strictEqual(presenceOf(await api('POST', '/driver/presence/heartbeat', RIDER_C, {})).status, 'busy', 'a busy rider\'s heartbeat keeps them busy');
      assert.strictEqual(presenceOf(await goOnline(RIDER_C)).status, 'busy', 'and "go online" does not make a busy rider offerable');

      // Two deliveries racing for one rider: the second offer lands after the first was accepted.
      const landed = await repo.updateWhere(d2, { status: 'pending_assignment' }, { status: 'assigned', driverId: 'rider_c', assignedAt: iso(clock.now()) });
      assert.ok(landed, 'the late offer landed');
      assertRefused(await api('POST', `/${d2}/accept`, RIDER_C), 409, 'RIDER_BUSY', 'busy', 'accepting a second delivery while busy');
      assert.deepStrictEqual([(await repo.findById(d1)).status, (await repo.findById(d1)).driverId], ['accepted', 'rider_c'], 'the first delivery is still theirs');
      assert.strictEqual((await repo.findById(d2)).status, 'assigned', 'the second is still only an offer');
      assert.strictEqual(await statusOf(RIDER_C), 'busy');

      // Releasing the accepted delivery puts them back to online.
      assert.strictEqual((await api('POST', `/${d1}/decline`, RIDER_C)).status, 200);
      assert.strictEqual(await statusOf(RIDER_C), 'online', 'busy goes back to online when the delivery ends');
      assert.strictEqual((await api('POST', `/${d2}/decline`, RIDER_C)).status, 200);

      // Silence: a rider who stopped answering cannot be assigned or accept, and the reason says so.
      assert.strictEqual((await api('POST', `/${d1}/assign`, SELLER, { driverId: 'rider_c' })).status, 200);
      clock.advance(TTL_MS);
      assertRefused(await api('POST', `/${d1}/accept`, RIDER_C), 409, 'RIDER_UNAVAILABLE', 'expired', 'accepting after going silent');
      assertRefused(await api('POST', `/${d2}/assign`, SELLER, { driverId: 'rider_c' }), 409, 'RIDER_UNAVAILABLE', 'expired', 'assigning a silent rider');
      assertRefused(await api('POST', `/${d2}/assign`, SELLER, { driverId: 'rider_a' }), 409, 'RIDER_UNAVAILABLE', 'expired', 'assigning rider_a who has been silent as long');
      assertRefused(await api('POST', `/${d2}/auto-assign`, SELLER, {}), 409, 'NO_RIDER_AVAILABLE', null, 'auto-assign with nobody available');
      assert.strictEqual((await repo.findById(d2)).status, 'pending_assignment', 'none of the refusals moved the delivery');
      assert.deepStrictEqual((await api('GET', '/drivers', SELLER)).body.data.summary, { registered: 4, available: 0 }, 'nobody is available');
    }

    // ======================================================================= 15. busy riders, taken-back offers and races, as the HTTP caller sees them
    {
      for (const [id, name, phone] of [
        ['rider_d', 'Aaa Dina', '+237600000011'], ['rider_e', 'Aaa Elie', '+237600000012'], ['rider_f', 'Aaa Fanny', '+237600000013'],
        ['rider_g', 'Aaa Gael', '+237600000014'], ['rider_h', 'Aaa Hugo', '+237600000015'], ['rider_i', 'Aab Ines', '+237600000016'],
        ['rider_j', 'Aaa Jules', '+237600000017'], ['rider_k', 'Aaa Karim', '+237600000018'], ['rider_l', 'Aaa Lola', '+237600000019']
      ]) {
        assert.strictEqual((await api('POST', `/drivers/${id}`, ADMIN, { name, phone })).status, 200, `${name} is registered`);
      }
      /** `fn` is run once, right after the next write that hands `riderId` an offer (the gap between "is available?" and "has the offer"). */
      const afterOfferTo = (riderId, fn) => {
        const original = repo.updateWhere; // the prototype's: assigning shadows it, `delete` puts it back
        let armed = true;
        repo.updateWhere = async function (...args) {
          const result = await original.apply(this, args);
          if (armed && result && result.status === 'assigned' && result.driverId === riderId) {
            armed = false;
            await fn();
          }
          return result;
        };
        return () => { delete repo.updateWhere; };
      };
      const lastEvent = async (id) => (await repo.listEvents(id)).pop();
      const eventTrail = async (id) => (await repo.listEvents(id)).map((e) => `${e.previousStatus || '-'}>${e.status} by ${e.actorId}: ${e.note}`);

      // ----- 15a. a busy rider is on no clock, and finishing a delivery hands them back FRESH
      {
        assert.strictEqual((await goOnline(RIDER_D, { ...NEAR })).status, 200);
        const d1 = await newDelivery();
        assert.strictEqual((await api('POST', `/${d1}/assign`, SELLER, { driverId: 'rider_d' })).status, 200);
        clock.advance(20 * 1000); // still inside the window, but not the instant they went online
        assert.strictEqual((await api('POST', `/${d1}/accept`, RIDER_D)).status, 200);
        const busy = assertPresenceResponse(await api('GET', '/driver/presence', RIDER_D), 'GET presence of a busy rider');
        assert.deepStrictEqual([busy.status, busy.available, busy.reason, busy.expiresAt], ['busy', false, 'busy', null],
          'a busy rider is not available, and has no heartbeat deadline (nothing to expire)');
        assert.strictEqual(busy.lastSeenAt, iso(clock.now()), 'accepting is an authenticated act of the rider, so it counts as being heard from');
        assert.deepStrictEqual(busy.location, { lat: NEAR.lat, lng: NEAR.lng, accuracyM: null }, 'and still sees their own position');

        clock.advance(BEAT_MS);
        const beat = presenceOf(await api('POST', '/driver/presence/heartbeat', RIDER_D, { lat: 4.07, lng: 9.78 }));
        assert.deepStrictEqual([beat.status, beat.expiresAt, beat.lastSeenAt], ['busy', null, iso(clock.now())], 'a busy rider\'s heartbeat is taken, and still shows no deadline');

        // Far longer silence than the window: they are carrying a parcel, so nothing expires them.
        clock.advance(5 * 60 * 1000);
        const silent = presenceOf(await api('GET', '/driver/presence', RIDER_D));
        assert.deepStrictEqual([silent.status, silent.reason, silent.expiresAt], ['busy', 'busy', null], 'five minutes of silence (the window is two) does not expire a rider carrying a parcel');
        assert.strictEqual((await storedOf('rider_d')).status, 'busy');
        assert.strictEqual(presenceOf(await api('POST', '/driver/presence/heartbeat', RIDER_D, {})).status, 'busy', 'a late beat from a busy rider does not set them offline');
        assert.strictEqual((await storedOf('rider_d')).status, 'busy', 'the stored row is still busy');

        // Silent again, then the rider reports and finishes. Finishing is THEIR act: it proves they are here.
        clock.advance(5 * 60 * 1000);
        assert.strictEqual((await api('POST', `/${d1}/status`, RIDER_D, { status: 'picked_up' })).status, 200);
        assert.strictEqual((await api('POST', `/${d1}/status`, RIDER_D, { status: 'arrived' })).status, 200);
        assert.strictEqual(await statusOf(RIDER_D), 'busy', 'still busy until the handover');
        const code = (await api('GET', `/${d1}/code`, BUYER)).body.data.code;
        const done = await api('POST', `/${d1}/complete`, RIDER_D, { code });
        assert.strictEqual(done.status, 200, JSON.stringify(done.body));
        const back = assertPresenceResponse(await api('GET', '/driver/presence', RIDER_D), 'GET presence after the handover');
        assert.deepStrictEqual([back.status, back.available, back.reason, back.lastSeenAt, back.expiresAt], ['online', true, null, iso(clock.now()), iso(clock.now() + TTL_MS)],
          'after the handover the rider is online and heard from now, not "expired" for the minutes they spent on the road');
        assert.ok((await api('GET', '/drivers', SELLER)).body.data.drivers.some((d) => d.id === 'rider_d'), 'and they are offered work again');
      }

      // ----- 15b. what the rider CARRIES decides busy, not what a row says
      {
        const d2 = await newDelivery();
        clock.advance(6 * 1000);
        assert.strictEqual((await api('POST', `/${d2}/assign`, SELLER, { driverId: 'rider_d' })).status, 200);
        assert.strictEqual((await api('POST', `/${d2}/accept`, RIDER_D)).status, 200);
        assert.strictEqual(await statusOf(RIDER_D), 'busy');
        // The presence write after an accept is best-effort. Put the row back to online and fresh, as if it had been lost.
        const lost = await repo.transitionPresence('rider_d', ['busy'], { status: 'online', lastSeenAt: iso(clock.now()), updatedAt: iso(clock.now()) });
        assert.strictEqual(lost.status, 'online', 'the row now says online and fresh');
        const row = await storedOf('rider_d');

        const carrying = assertPresenceResponse(await api('GET', '/driver/presence', RIDER_D), 'GET presence of a rider whose row is wrong');
        assert.deepStrictEqual([carrying.status, carrying.available, carrying.reason, carrying.expiresAt], ['busy', false, 'busy', null], 'a rider holding an accepted delivery is busy whatever the row says');
        assertRefused(await api('POST', '/driver/presence/offline', RIDER_D, {}), 409, 'RIDER_BUSY', 'busy', 'going offline with a parcel the row does not show');
        assertRefused(await api('POST', '/driver/presence/pause', RIDER_D, {}), 409, 'RIDER_BUSY', 'busy', 'pausing with a parcel the row does not show');
        assert.deepStrictEqual(await storedOf('rider_d'), row, 'neither refused call wrote anything');
        const d3 = await newDelivery();
        assertRefused(await api('POST', `/${d3}/assign`, SELLER, { driverId: 'rider_d' }), 409, 'RIDER_BUSY', 'busy', 'assigning a rider who carries a parcel');
        assert.deepStrictEqual([(await repo.findById(d3)).status, (await repo.findById(d3)).driverId], ['pending_assignment', null]);
        assert.ok(!(await api('GET', '/drivers', SELLER)).body.data.drivers.some((d) => d.id === 'rider_d'), 'and they are not on the seller\'s list');
        const roster = (await api('GET', '/drivers?status=all', ADMIN)).body.data.drivers.find((r) => r.id === 'rider_d');
        assert.strictEqual(roster.presence, 'busy', 'the administrator\'s roster says busy too');
        assert.strictEqual(roster.openDeliveries, 1);

        assert.strictEqual((await api('POST', `/${d2}/decline`, RIDER_D)).status, 200);
        assert.strictEqual(await statusOf(RIDER_D), 'online', 'releasing the parcel frees them');
      }

      // ----- 15c. a claim made seconds ago is not overwritten by "go online"; a leaked one is put right
      {
        assert.strictEqual((await goOnline(RIDER_E, { ...NEAR })).status, 200);
        const at = iso(clock.now());
        // What an accept's claim looks like in the moment before its delivery is written.
        assert.ok(await repo.transitionPresence('rider_e', ['online'], { status: 'busy', lastSeenAt: at, updatedAt: at }), 'the claim landed');
        const inFlight = presenceOf(await api('GET', '/driver/presence', RIDER_E));
        assert.deepStrictEqual([inFlight.status, inFlight.available, inFlight.expiresAt], ['busy', false, null], 'a row stored busy IS busy, until it is put right');
        assert.ok(!(await api('GET', '/drivers', SELLER)).body.data.drivers.some((d) => d.id === 'rider_e'), 'and the rider is not offered work');
        const rowE = await storedOf('rider_e');
        clock.advance(10 * 1000);
        assert.strictEqual(presenceOf(await goOnline(RIDER_E)).status, 'busy', 'going online does not overwrite a claim made seconds ago (its delivery is still being written)');
        assert.deepStrictEqual(await storedOf('rider_e'), rowE, 'and writes nothing');
        clock.advance(25 * 1000);
        const healed = presenceOf(await goOnline(RIDER_E));
        assert.deepStrictEqual([healed.status, healed.available], ['online', true], 'once the row is older than the claim grace and nothing is carried, going online puts the rider right');
        assert.strictEqual((await storedOf('rider_e')).status, 'online');
      }

      // ----- 15d. offers stack; availability changes take them back, and say why
      {
        assert.strictEqual((await goOnline(RIDER_F, { ...NEAR })).status, 200);
        const x1 = await newDelivery();
        const x2 = await newDelivery();
        for (const id of [x1, x2]) assert.strictEqual((await api('POST', `/${id}/assign`, SELLER, { driverId: 'rider_f' })).status, 200);
        const stacked = (await api('GET', '/drivers', SELLER)).body.data.drivers.find((d) => d.id === 'rider_f');
        assert.strictEqual(stacked && stacked.openDeliveries, 2, 'a rider holding only unanswered offers is still offered more: offers stack, they do not make a rider busy');
        // The administrator's roster tells the same story: two offers are workload, not a parcel in hand.
        const stackedOnRoster = (await api('GET', '/drivers?status=all', ADMIN)).body.data.drivers.find((r) => r.id === 'rider_f');
        assert.deepStrictEqual([stackedOnRoster.presence, stackedOnRoster.openDeliveries], ['online', 2],
          'the roster says online (not busy) for a rider who holds two offers and has accepted none');
        assert.deepStrictEqual([presenceOf(await api('GET', '/driver/presence', RIDER_F)).status, presenceOf(await api('GET', '/driver/presence', RIDER_F)).available], ['online', true],
          'and the rider sees themselves online and available');

        notified.length = 0;
        assert.strictEqual(presenceOf(await api('POST', '/driver/presence/pause', RIDER_F, {})).status, 'paused');
        for (const id of [x1, x2]) {
          const d = await repo.findById(id);
          assert.deepStrictEqual([d.status, d.driverId], ['pending_assignment', null], `pausing gave the offer on ${id} back to the seller`);
          const last = await lastEvent(id);
          assert.deepStrictEqual([last.previousStatus, last.status, last.actorId, last.note], ['assigned', 'pending_assignment', 'presence', 'Rider paused availability'],
            'the timeline says why, and the actor is the system, not the rider');
        }
        assert.strictEqual(notified.filter((n) => n.userId === 'seller_1' && n.title === 'A rider is no longer available').length, 2, 'the seller was told, once per offer');

        // A rider on a break has declined nothing: back from it, they can be offered the same delivery again.
        assert.strictEqual((await api('POST', '/driver/presence/resume', RIDER_F, {})).status, 200);
        const hint = (await api('GET', `/drivers?deliveryId=${x1}`, SELLER)).body.data.drivers.find((d) => d.id === 'rider_f');
        assert.strictEqual(hint && hint.declined, false, 'taking an offer back is not a decline: the rider is not marked as having passed on it');
        assert.strictEqual((await api('POST', `/${x1}/assign`, SELLER, { driverId: 'rider_f' })).status, 200, 'and may be offered it again');

        // Silence takes it back too: the beat that finds the rider silent.
        clock.advance(TTL_MS);
        const expired = presenceOf(await api('POST', '/driver/presence/heartbeat', RIDER_F, {}));
        assert.deepStrictEqual([expired.status, expired.available], ['offline', false], 'a beat after the window finds them offline');
        assert.strictEqual((await storedOf('rider_f')).status, 'offline', 'and sets the stored row offline');
        const gone = await repo.findById(x1);
        assert.deepStrictEqual([gone.status, gone.driverId], ['pending_assignment', null], 'and the offer they never answered went back to the seller');
        assert.strictEqual((await lastEvent(x1)).note, 'Rider stopped responding and was set offline');

        // Accepting one delivery gives the rider's other offers back: nobody does two at once.
        assert.strictEqual((await goOnline(RIDER_F, { ...NEAR })).status, 200);
        for (const id of [x1, x2]) assert.strictEqual((await api('POST', `/${id}/assign`, SELLER, { driverId: 'rider_f' })).status, 200);
        assert.strictEqual((await api('POST', `/${x1}/accept`, RIDER_F)).status, 200);
        const other = await repo.findById(x2);
        assert.deepStrictEqual([other.status, other.driverId], ['pending_assignment', null], 'accepting one delivery gave the rider\'s other offer back');
        assert.deepStrictEqual([(await lastEvent(x2)).actorId, (await lastEvent(x2)).note], ['presence', 'Rider accepted another delivery']);
        assert.strictEqual((await repo.findById(x1)).status, 'accepted', 'and the one they accepted is theirs');
        assert.strictEqual(await statusOf(RIDER_F), 'busy');
        assert.strictEqual((await api('POST', `/${x1}/decline`, RIDER_F)).status, 200);
        assert.strictEqual(await statusOf(RIDER_F), 'online');
      }

      // ----- 15e. the seller's refusal comes before any write; a rider lost in the gap is handed back; auto-assign moves on
      {
        const y1 = await newDelivery();
        const eventsBefore = (await repo.listEvents(y1)).length;
        assertRefused(await api('POST', `/${y1}/assign`, SELLER, { driverId: 'rider_g' }), 409, 'RIDER_UNAVAILABLE', 'offline', 'assigning a rider who never went online');
        assert.strictEqual((await repo.listEvents(y1)).length, eventsBefore, 'the refusal came BEFORE anything was written: no offer and no hand-back on the timeline');

        // The rider goes offline in the gap between "is available?" and "holds the offer".
        const goOfflineBehindTheOffer = (riderId) => () => repo.transitionPresence(riderId, ['online'],
          { status: 'offline', updatedAt: iso(clock.now()), latitude: null, longitude: null, accuracy: null });
        assert.strictEqual((await goOnline(RIDER_H, { ...NEAR })).status, 200);
        let undo = afterOfferTo('rider_h', goOfflineBehindTheOffer('rider_h'));
        try {
          assertRefused(await api('POST', `/${y1}/assign`, SELLER, { driverId: 'rider_h' }), 409, 'RIDER_UNAVAILABLE', 'offline', 'assigning a rider who went offline while the offer was written');
        } finally { undo(); }
        const dy1 = await repo.findById(y1);
        assert.deepStrictEqual([dy1.status, dy1.driverId], ['pending_assignment', null], 'the offer written in that gap was taken back at once: nobody is left holding an offer while offline');
        const gap = await lastEvent(y1);
        assert.deepStrictEqual([gap.previousStatus, gap.status, gap.actorId, gap.note], ['assigned', 'pending_assignment', 'presence', 'Rider went offline']);

        // "That one offer": the rider found unavailable in the gap has the offer just written taken back, and
        // only that one. An offer they already held is theirs until they answer it or go offline themselves.
        assert.strictEqual((await goOnline(RIDER_H, { ...NEAR })).status, 200);
        const heldOffer = await newDelivery();
        assert.strictEqual((await api('POST', `/${heldOffer}/assign`, SELLER, { driverId: 'rider_h' })).status, 200, 'rider_h already holds one offer');
        const newOffer = await newDelivery();
        undo = afterOfferTo('rider_h', goOfflineBehindTheOffer('rider_h'));
        try {
          assertRefused(await api('POST', `/${newOffer}/assign`, SELLER, { driverId: 'rider_h' }), 409, 'RIDER_UNAVAILABLE', 'offline', 'offering a second delivery to a rider who vanished in the gap');
        } finally { undo(); }
        assert.deepStrictEqual([(await repo.findById(newOffer)).status, (await repo.findById(newOffer)).driverId], ['pending_assignment', null], 'the offer written in the gap was taken back');
        assert.deepStrictEqual([(await repo.findById(heldOffer)).status, (await repo.findById(heldOffer)).driverId], ['assigned', 'rider_h'], 'but the offer they already held was left alone: only "that one" is taken back');
        assert.strictEqual((await lastEvent(newOffer)).note, 'Rider went offline');
        assert.strictEqual((await lastEvent(heldOffer)).status, 'assigned', 'and nothing was written to the other offer\'s timeline');
        // Tidy up the way a rider would: back online, then offline again, which hands the held offer back.
        assert.strictEqual((await goOnline(RIDER_H, { ...NEAR })).status, 200);
        assert.strictEqual(presenceOf(await api('POST', '/driver/presence/offline', RIDER_H, {})).status, 'offline');
        assert.strictEqual((await repo.findById(heldOffer)).status, 'pending_assignment', 'going offline gave the held offer back');

        // Auto-assign: take everyone else off the list first, so the two candidates are the whole ranking.
        for (const user of [RIDER_A, RIDER_B, RIDER_C, RIDER_D, RIDER_E, RIDER_F, RIDER_J, ADMIN_RIDER]) {
          const res = await api('POST', '/driver/presence/offline', user, {});
          assert.ok([200, 409].includes(res.status), `${user} goes offline (or is busy): ${res.status}`);
        }
        assert.strictEqual((await goOnline(RIDER_H, { ...NEAR })).status, 200);
        assert.strictEqual((await goOnline(RIDER_I, { ...NEAR })).status, 200);
        const y2 = await newDelivery();
        assert.deepStrictEqual((await api('GET', '/drivers', SELLER)).body.data.drivers.map((d) => d.id), ['rider_h', 'rider_i'], 'by name rider_h is the first choice, rider_i the second');
        undo = afterOfferTo('rider_h', goOfflineBehindTheOffer('rider_h'));
        let auto;
        try { auto = await api('POST', `/${y2}/auto-assign`, SELLER, {}); } finally { undo(); }
        assert.strictEqual(auto.status, 200, JSON.stringify(auto.body));
        const dy2 = await repo.findById(y2);
        assert.deepStrictEqual([dy2.status, dy2.driverId], ['assigned', 'rider_i'], 'rider_h vanished between the ranking and the offer: the next rider got it, and the seller saw no error');
        assert.ok((await eventTrail(y2)).includes('assigned>pending_assignment by presence: Rider went offline'), 'rider_h\'s offer was taken back and says why');

        // When every candidate turns out to be gone, only then is the seller told nobody is free.
        const y3 = await newDelivery();
        undo = afterOfferTo('rider_i', goOfflineBehindTheOffer('rider_i'));
        try {
          assertRefused(await api('POST', `/${y3}/auto-assign`, SELLER, {}), 409, 'NO_RIDER_AVAILABLE', null, 'auto-assign when the last candidate vanishes too');
        } finally { undo(); }
        assert.deepStrictEqual([(await repo.findById(y3)).status, (await repo.findById(y3)).driverId], ['pending_assignment', null], 'and the delivery is left with the seller');
        // rider_i went offline behind the back of the offer on y2; the next "go offline" from them hands it back.
        assert.strictEqual(presenceOf(await api('POST', '/driver/presence/offline', RIDER_I, {})).status, 'offline');
        assert.strictEqual((await repo.findById(y2)).status, 'pending_assignment', 'going offline gives back whatever offer they still held');

        // Auto-assign moves on past a rider who turned out to be unavailable, and ONLY past that: any other
        // failure is the seller's to see (409 CONFLICT here), not "nobody is free", and is not retried on the next rider.
        assert.strictEqual((await goOnline(RIDER_H, { ...NEAR })).status, 200);
        assert.strictEqual((await goOnline(RIDER_I, { ...NEAR })).status, 200);
        const y4 = await newDelivery();
        assert.deepStrictEqual((await api('GET', '/drivers', SELLER)).body.data.drivers.map((d) => d.id), ['rider_h', 'rider_i'], 'two riders are free to be tried');
        const writeAssignment = repo.updateWhere;
        let tried = 0;
        repo.updateWhere = async function (id, expected, patch) {
          if (patch && patch.status === 'assigned') { tried += 1; return null; } // somebody else changed the delivery first
          return writeAssignment.call(this, id, expected, patch);
        };
        let clash;
        try { clash = await api('POST', `/${y4}/auto-assign`, SELLER, {}); } finally { delete repo.updateWhere; }
        assertRefused(clash, 409, 'CONFLICT', null, 'auto-assign when the delivery was changed by someone else');
        assert.strictEqual(tried, 1, 'the assignment was attempted once: a conflict is not a reason to offer the same delivery to the next rider');
        assert.strictEqual((await repo.findById(y4)).status, 'pending_assignment', 'and the delivery is still with the seller');
        for (const user of [RIDER_H, RIDER_I]) assert.strictEqual(presenceOf(await api('POST', '/driver/presence/offline', user, {})).status, 'offline');
      }

      // ----- 15f. a seller or administrator ending a delivery proves nothing about the rider
      {
        assert.strictEqual((await goOnline(RIDER_J, { ...NEAR })).status, 200);
        const z1 = await newDelivery();
        assert.strictEqual((await api('POST', `/${z1}/assign`, SELLER, { driverId: 'rider_j' })).status, 200);
        assert.strictEqual((await api('POST', `/${z1}/accept`, RIDER_J)).status, 200);
        const heardAt = presenceOf(await api('GET', '/driver/presence', RIDER_J)).lastSeenAt;
        clock.advance(5 * 60 * 1000);
        assert.strictEqual((await api('POST', `/${z1}/cancel`, SELLER, { reason: 'The customer changed their mind' })).status, 200);
        const after = presenceOf(await api('GET', '/driver/presence', RIDER_J));
        assert.deepStrictEqual([after.status, after.available, after.reason, after.lastSeenAt], ['offline', false, 'expired', heardAt],
          'the seller cancelling is not a sign of life: the rider is free again but was last heard from before the silence, so they are offline until they come back');
        assert.strictEqual(presenceOf(await goOnline(RIDER_J, { ...NEAR })).status, 'online', 'and they come back by going online themselves');

        // The rider's own act is different: releasing a delivery, or reporting it failed, is proof of life.
        const z2 = await newDelivery();
        assert.strictEqual((await api('POST', `/${z2}/assign`, SELLER, { driverId: 'rider_j' })).status, 200);
        assert.strictEqual((await api('POST', `/${z2}/accept`, RIDER_J)).status, 200);
        clock.advance(5 * 60 * 1000);
        assert.strictEqual((await api('POST', `/${z2}/decline`, RIDER_J)).status, 200);
        const released = presenceOf(await api('GET', '/driver/presence', RIDER_J));
        assert.deepStrictEqual([released.status, released.lastSeenAt], ['online', iso(clock.now())], 'a rider who releases a delivery after minutes of silence is online and heard from now');

        const z3 = await newDelivery();
        assert.strictEqual((await api('POST', `/${z3}/assign`, SELLER, { driverId: 'rider_j' })).status, 200);
        assert.strictEqual((await api('POST', `/${z3}/accept`, RIDER_J)).status, 200);
        assert.strictEqual((await api('POST', `/${z3}/status`, RIDER_J, { status: 'picked_up' })).status, 200);
        clock.advance(5 * 60 * 1000);
        assert.strictEqual((await api('POST', `/${z3}/status`, RIDER_J, { status: 'failed', note: 'The customer cannot be reached' })).status, 200);
        const failed = presenceOf(await api('GET', '/driver/presence', RIDER_J));
        assert.deepStrictEqual([failed.status, failed.lastSeenAt], ['online', iso(clock.now())], 'and so does one who reports a delivery failed');
      }

      // ----- 15g. beats less than five seconds apart are acknowledged, not written
      {
        clock.advance(6 * 1000);
        const first = presenceOf(await api('POST', '/driver/presence/heartbeat', RIDER_J, { lat: 4.1, lng: 9.8 }));
        assert.deepStrictEqual(first.location, { lat: 4.1, lng: 9.8, accuracyM: null });
        const written = await storedOf('rider_j');
        clock.advance(1000);
        const quick = await api('POST', '/driver/presence/heartbeat', RIDER_J, { lat: 4.2, lng: 9.9 });
        assert.strictEqual(quick.status, 200, 'a beat one second after the last is answered');
        assert.deepStrictEqual(presenceOf(quick).location, { lat: 4.1, lng: 9.8, accuracyM: null }, 'with what is stored');
        assert.deepStrictEqual(await storedOf('rider_j'), written, 'and writes nothing');
        clock.advance(4 * 1000);
        const slow = presenceOf(await api('POST', '/driver/presence/heartbeat', RIDER_J, { lat: 4.3, lng: 9.7 }));
        assert.deepStrictEqual(slow.location, { lat: 4.3, lng: 9.7, accuracyM: null }, 'a beat five seconds after the last write is taken');
        assert.deepStrictEqual([(await storedOf('rider_j')).latitude, (await storedOf('rider_j')).longitude], [4.3, 9.7]);
      }

      // ----- 15h. silence is judged against the beat that is there when the write happens
      {
        // The sweep reads a silent rider; the rider taps "go online" before the sweep writes: they stay online.
        clock.advance(TTL_MS);
        const findStale = repo.findStalePresence;
        let armed = true;
        repo.findStalePresence = async function (...args) {
          const rows = await findStale.apply(this, args);
          if (armed && rows.some((r) => r.riderId === 'rider_j')) {
            armed = false;
            assert.strictEqual((await goOnline(RIDER_J, { ...NEAR })).status, 200);
          }
          return rows;
        };
        try { await service.expireStalePresence({ limit: 50 }); } finally { delete repo.findStalePresence; }
        assert.strictEqual(armed, false, 'the sweep did read rider_j as silent');
        assert.deepStrictEqual([(await storedOf('rider_j')).status, await statusOf(RIDER_J)], ['online', 'online'], 'a rider who came back while the sweep was deciding is not set offline by it');

        // The same for a late heartbeat: it read the rider silent, "go online" landed, and the beat must not undo it.
        clock.advance(TTL_MS);
        const findOne = repo.findPresence;
        armed = true;
        repo.findPresence = async function (id) {
          const found = await findOne.call(this, id);
          if (armed && id === 'rider_j') {
            armed = false;
            assert.strictEqual((await goOnline(RIDER_J, { ...NEAR })).status, 200);
          }
          return found;
        };
        let late;
        try { late = await api('POST', '/driver/presence/heartbeat', RIDER_J, {}); } finally { delete repo.findPresence; }
        assert.strictEqual(armed, false, 'the heartbeat did read rider_j as silent');
        assert.strictEqual(presenceOf(late).status, 'online', 'a late beat that raced "go online" answers online');
        assert.strictEqual((await storedOf('rider_j')).status, 'online', 'and did not set the rider offline');
      }

      // ----- 15i. an accept whose delivery write loses a race hands the rider back
      {
        const w1 = await newDelivery();
        assert.strictEqual((await api('POST', `/${w1}/assign`, SELLER, { driverId: 'rider_j' })).status, 200);
        const update = repo.updateWhere;
        repo.updateWhere = async function (id, expected, patch) {
          if (patch && patch.status === 'accepted') return null; // somebody else changed the delivery first
          return update.call(this, id, expected, patch);
        };
        let lost;
        try { lost = await api('POST', `/${w1}/accept`, RIDER_J); } finally { delete repo.updateWhere; }
        assert.strictEqual(lost.status, 409, JSON.stringify(lost.body));
        assert.deepStrictEqual([(await repo.findById(w1)).status, (await repo.findById(w1)).driverId], ['assigned', 'rider_j'], 'the delivery did not move');
        assert.strictEqual(await statusOf(RIDER_J), 'online', 'and the rider was not left busy by a claim whose delivery never came');
        assert.strictEqual((await storedOf('rider_j')).status, 'online');
        assert.strictEqual((await api('POST', `/${w1}/accept`, RIDER_J)).status, 200, 'they can try again');
        assert.strictEqual(await statusOf(RIDER_J), 'busy');
      }

      // ----- 15j. an accept that lands between "are you free?" and the write is not overwritten
      for (const [action, riderId, rider, what] of [['offline', 'rider_k', RIDER_K, 'going offline'], ['pause', 'rider_l', RIDER_L, 'pausing']]) {
        assert.strictEqual((await goOnline(rider, { ...NEAR })).status, 200);
        const v1 = await newDelivery();
        assert.strictEqual((await api('POST', `/${v1}/assign`, SELLER, { driverId: riderId })).status, 200);
        const readPresence = repo.findPresence;
        let armed = true;
        repo.findPresence = async function (id) {
          const row = await readPresence.call(this, id); // the rider is free when this is read...
          if (armed && id === riderId) {
            armed = false;
            assert.strictEqual((await api('POST', `/${v1}/accept`, rider)).status, 200, 'and their accept lands before the write');
          }
          return row;
        };
        let res;
        try { res = await api('POST', `/driver/presence/${action}`, rider, {}); } finally { delete repo.findPresence; }
        assert.strictEqual(armed, false, `${what}: the accept did land in the gap`);
        assertRefused(res, 409, 'RIDER_BUSY', 'busy', `${what} while an accept lands`);
        assert.deepStrictEqual([(await repo.findById(v1)).status, (await repo.findById(v1)).driverId], ['accepted', riderId], `${what}: the delivery is theirs`);
        assert.strictEqual((await storedOf(riderId)).status, 'busy', `${what} did not overwrite the busy the accept wrote`);
        assert.strictEqual(await statusOf(rider), 'busy');
      }

      // ----- 15j2. silence, a wrong row and a rider who pauses: what the sweep and a late beat may and may NOT do
      {
        for (const [id, name, phone] of [['rider_m', 'Zzz Max', '+237600000021'], ['rider_n', 'Zzz Nina', '+237600000022'], ['rider_o', 'Zzz Omar', '+237600000023']]) {
          assert.strictEqual((await api('POST', `/drivers/${id}`, ADMIN, { name, phone })).status, 200, `${name} is registered`);
        }
        const stored = async (id) => { const r = await storedOf(id); return [r.status, r.latitude, r.longitude, r.accuracy]; };
        /** `fn` with the clock `ms` behind: a request served by an instance whose clock lags, as when two servers race. */
        const warped = async (ms, fn) => { clock.advance(-ms); try { return await fn(); } finally { clock.advance(ms); } };
        // Start from a clean slate: everybody who was online in the sections above is long silent now.
        clock.advance(TTL_MS + 1000);
        await service.expireStalePresence({ limit: 500 });

        // A rider who goes offline leaves no position behind (this is the position the roster must never show either).
        assert.strictEqual((await goOnline(RIDER_O, { ...PRIVATE })).status, 200);
        assert.deepStrictEqual(await stored('rider_o'), ['online', PRIVATE.lat, PRIVATE.lng, PRIVATE.accuracyM], 'rider_o is online and shares a position');
        assert.strictEqual(presenceOf(await api('POST', '/driver/presence/offline', RIDER_O, {})).status, 'offline');
        assert.deepStrictEqual(await stored('rider_o'), ['offline', null, null, null], 'going offline cleared it');

        // So does silence, whether it is the sweep or a late beat that finds it.
        assert.strictEqual((await goOnline(RIDER_O, { ...PRIVATE })).status, 200);
        clock.advance(TTL_MS);
        const swept = await service.expireStalePresence({ limit: 500 });
        assert.strictEqual(swept.expired, 1, 'the sweep set the one silent rider offline');
        assert.deepStrictEqual(await stored('rider_o'), ['offline', null, null, null], 'and cleared their position');
        assert.strictEqual((await goOnline(RIDER_O, { ...PRIVATE })).status, 200);
        clock.advance(TTL_MS);
        assert.strictEqual(presenceOf(await api('POST', '/driver/presence/heartbeat', RIDER_O, { ...PRIVATE })).status, 'offline', 'a beat after the window finds them offline');
        assert.deepStrictEqual(await stored('rider_o'), ['offline', null, null, null], 'and keeps no position, not even the one that very beat carried');

        // A rider who PAUSES while the sweep is deciding is not set offline over their break.
        assert.strictEqual((await goOnline(RIDER_O, { ...NEAR })).status, 200);
        clock.advance(TTL_MS);
        const findStale = repo.findStalePresence;
        let armed = true;
        repo.findStalePresence = async function (...args) {
          const rows = await findStale.apply(this, args);
          if (armed && rows.some((r) => r.riderId === 'rider_o')) {
            armed = false;
            // The pause was served a second before the window closed.
            assert.strictEqual(presenceOf(await warped(1000, () => api('POST', '/driver/presence/pause', RIDER_O, {}))).status, 'paused');
          }
          return rows;
        };
        let sweep;
        try { sweep = await service.expireStalePresence({ limit: 500 }); } finally { delete repo.findStalePresence; }
        assert.strictEqual(armed, false, 'the sweep did read rider_o as silent');
        assert.strictEqual(sweep.expired, 0, 'and set nobody offline: the rider it read had paused since');
        assert.strictEqual((await storedOf('rider_o')).status, 'paused', 'rider_o is still on their break');
        assert.strictEqual(await statusOf(RIDER_O), 'paused');

        // The same for a late beat: it read the rider as silent, the pause landed, and the beat must not end the break.
        assert.strictEqual(presenceOf(await api('POST', '/driver/presence/resume', RIDER_O, {})).status, 'online');
        clock.advance(TTL_MS);
        const readRow = repo.findPresence;
        armed = true;
        repo.findPresence = async function (id) {
          const row = await readRow.call(this, id);
          if (armed && id === 'rider_o') {
            armed = false;
            assert.strictEqual(presenceOf(await warped(1000, () => api('POST', '/driver/presence/pause', RIDER_O, {}))).status, 'paused');
          }
          return row;
        };
        let beat;
        try { beat = await api('POST', '/driver/presence/heartbeat', RIDER_O, {}); } finally { delete repo.findPresence; }
        assert.strictEqual(armed, false, 'the beat did read rider_o as silent');
        assert.strictEqual(presenceOf(beat).status, 'paused', 'a late beat that raced a pause answers paused');
        assert.strictEqual((await storedOf('rider_o')).status, 'paused', 'and did not set the rider offline over their break');
        assert.strictEqual(presenceOf(await api('POST', '/driver/presence/offline', RIDER_O, {})).status, 'offline', 'rider_o ends their day');

        // The sweep takes a silent rider's unanswered offer back, exactly as a late beat does, and the seller hears of it.
        assert.strictEqual((await goOnline(RIDER_O, { ...NEAR })).status, 200);
        const offered = await newDelivery();
        assert.strictEqual((await api('POST', `/${offered}/assign`, SELLER, { driverId: 'rider_o' })).status, 200, 'rider_o holds an offer');
        notified.length = 0;
        clock.advance(TTL_MS);
        const silentSweep = await service.expireStalePresence({ limit: 500 });
        assert.deepStrictEqual(silentSweep, { expired: 1, healed: 0 }, 'one silent rider was set offline, and nothing needed healing');
        const returned = await repo.findById(offered);
        assert.deepStrictEqual([returned.status, returned.driverId], ['pending_assignment', null], 'the sweep gave the offer back to the seller');
        const returnedNote = await lastEvent(offered);
        assert.deepStrictEqual([returnedNote.previousStatus, returnedNote.status, returnedNote.actorId, returnedNote.note],
          ['assigned', 'pending_assignment', 'presence', 'Rider stopped responding and was set offline'], 'and the timeline says why');
        assert.strictEqual(notified.filter((n) => n.userId === 'seller_1' && n.title === 'A rider is no longer available').length, 1, 'the seller was told');

        // It also puts right a busy row that nothing backs up, but only once it is older than the claim grace: a
        // claim made a moment ago may still be writing its delivery.
        assert.strictEqual((await goOnline(RIDER_O, { ...NEAR })).status, 200);
        const leaked = await repo.transitionPresence('rider_o', ['online'], { status: 'busy', updatedAt: iso(clock.now()) });
        assert.strictEqual(leaked.status, 'busy', 'rider_o is stored busy with no parcel behind it (a lost write)');
        clock.advance(29 * 1000);
        assert.deepStrictEqual(await service.expireStalePresence({ limit: 500 }), { expired: 0, healed: 0 }, 'a claim 29 seconds old may still be in flight: left alone');
        assert.strictEqual((await storedOf('rider_o')).status, 'busy');
        clock.advance(2 * 1000);
        assert.deepStrictEqual(await service.expireStalePresence({ limit: 500 }), { expired: 0, healed: 1 }, 'older than the grace and nothing carried: put right, and counted');
        assert.strictEqual((await storedOf('rider_o')).status, 'online', 'the leaked row is online again');
        assert.strictEqual(await statusOf(RIDER_O), 'online', 'and the rider can be offered work again');
        assert.strictEqual(presenceOf(await api('POST', '/driver/presence/offline', RIDER_O, {})).status, 'offline', 'rider_o ends their day again');

        // A rider whose row is wrong (online) but who carries a parcel, and then goes silent: silence puts the ROW
        // right (offline), it never takes the parcel from them. Only offers go back.
        for (const [how, riderId, rider] of [['a late beat', 'rider_m', RIDER_M], ['the sweep', 'rider_n', RIDER_N]]) {
          assert.strictEqual((await goOnline(rider, { ...NEAR })).status, 200, `${riderId} is online`);
          const parcel = await newDelivery();
          assert.strictEqual((await api('POST', `/${parcel}/assign`, SELLER, { driverId: riderId })).status, 200);
          assert.strictEqual((await api('POST', `/${parcel}/accept`, rider)).status, 200);
          // The presence write after an accept is best-effort. Put the row back to online and fresh, as if it had been lost.
          await repo.transitionPresence(riderId, ['busy'], { status: 'online', lastSeenAt: iso(clock.now()), updatedAt: iso(clock.now()) });
          clock.advance(TTL_MS + 1000);
          let answer;
          if (how === 'a late beat') {
            answer = presenceOf(await api('POST', '/driver/presence/heartbeat', rider, {}));
          } else {
            assert.strictEqual((await service.expireStalePresence({ limit: 500 })).expired, 1, `${how}: the silent row is the one thing swept`);
            answer = presenceOf(await api('GET', '/driver/presence', rider));
          }
          assert.strictEqual((await storedOf(riderId)).status, 'offline', `${how}: the row, which said online and went silent, is set offline`);
          assert.deepStrictEqual([(await repo.findById(parcel)).status, (await repo.findById(parcel)).driverId], ['accepted', riderId],
            `${how}: but the parcel is still theirs: only offers are taken back`);
          assert.strictEqual((await lastEvent(parcel)).status, 'accepted', `${how}: and nothing was written to its timeline`);
          assert.deepStrictEqual([answer.status, answer.available, answer.reason], ['busy', false, 'busy'], `${how}: and the rider, who carries it, is told busy`);
          assert.strictEqual((await api('POST', `/${parcel}/decline`, rider)).status, 200, `${riderId} hands the parcel back`);
          assert.strictEqual((await storedOf(riderId)).status, 'offline');
        }
      }

      // ----- 15k. when presence cannot be read: the roster still loads, the seller's list fails loudly
      {
        const unreadable = () => { throw new Error('the presence table is unavailable'); };
        // The service logs these on purpose; keep the gate's output free of a scary-looking, expected error.
        const logger = require('../../server/shared/logging/logger');
        const quiet = { error: logger.error, warn: logger.warn };
        logger.error = () => {};
        logger.warn = () => {};
        try {
          const listPresence = repo.listPresence;
          repo.listPresence = async () => unreadable();
          let roster;
          try { roster = await api('GET', '/drivers?status=all', ADMIN); } finally { delete repo.listPresence; }
          assert.strictEqual(roster.status, 200, `the roster is how an administrator reaches riders to manage them: ${JSON.stringify(roster.body)}`);
          assert.ok(roster.body.data.drivers.length >= 9, 'with every rider on it');
          for (const row of roster.body.data.drivers) {
            assert.deepStrictEqual([row.presence, row.lastSeenAt], [null, null], `${row.id}: presence is unknown (null), not guessed`);
            assert.ok(row.name && row.phone && row.status, `${row.id}: the rest of the row is intact`);
          }
          assert.strictEqual(typeof listPresence, 'function');

          // The list a seller picks from decides who is offered work: a failed read must not look like "nobody is online".
          const listFresh = repo.listFreshOnlinePresence;
          repo.listFreshOnlinePresence = async () => unreadable();
          let list;
          try { list = await api('GET', '/drivers', SELLER); } finally { delete repo.listFreshOnlinePresence; }
          assert.ok(list.status >= 500, `a failed read is an error (${list.status}), not an empty list of riders: ${JSON.stringify(list.body)}`);
          assert.strictEqual(list.body.success, false);
          assert.strictEqual(typeof listFresh, 'function');
          assert.strictEqual((await api('GET', '/drivers', SELLER)).status, 200, 'and the list works again once it can be read');
        } finally {
          logger.error = quiet.error;
          logger.warn = quiet.warn;
        }
      }
    }

    console.log('    ✓ Rider presence routes: authorisation, strict bodies, isolation between riders, privacy of position, suspension, dispatch refusals, busy riders and taken-back offers hold.');
  } finally {
    NotificationService.create = originalCreate;
    if (!hadSecret) config.supabase.jwtSecret = hadSecret;
    if (server.closeAllConnections) server.closeAllConnections();
    if (prodServer.closeAllConnections) prodServer.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
    await new Promise((resolve) => prodServer.close(resolve));
  }
}

async function run() {
  console.log('  Testing Rider presence routes...');
  await main();
}

module.exports = { run };
