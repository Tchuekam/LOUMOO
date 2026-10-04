/**
 * LOUMOO — The whole delivery circuit, end to end, with no database
 * ---------------------------------------------------------------------------
 * One order walks through every party using the REAL pieces: the order service
 * (priced and validated by the server), the delivery service behind its real HTTP
 * router and error handler, the real notification feeds, and the browser-side
 * circuit module that tells each person where the order is. Orders and deliveries
 * live in memory, and one order repository is shared by order creation and
 * delivery (as the database is in production), so what the buyer places is what
 * the seller dispatches and the rider delivers.
 *
 * It answers the question the unit suites cannot: when a buyer places an order,
 * does the seller hear about it, can they arrange the delivery, does the rider get
 * the job, does the buyer see it arrive, and does every one of them read the same
 * story from their own point of view?
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
const { OrderCreationService } = require('../../server/modules/commerce/application/OrderCreationService');
const { codeFor } = require('../../server/modules/delivery/domain/HandoverCode');
const Circuit = require('../../src/services/deliveryCircuit');

const BUYER = 'buyer_1|customer';
const SELLER = 'seller_1|seller';
const OTHER_SELLER = 'seller_2|seller';
const ADMIN = 'admin_1|admin';
const RIDER = 'rider_1|customer';
const STRANGER = 'stranger_1|customer';
const NEAR = { lat: 4.0511, lng: 9.7679 };
const DROP = { lat: 4.0601, lng: 9.7679 };

// Header-driven stand-in for requireAuth: "x-test-user: <id>|<role>".
function fakeAuth(req, res, next) {
  const header = req.headers['x-test-user'];
  if (!header) return next(new AuthenticationError('Authentication required.'));
  const [id, role = 'customer'] = String(header).split('|');
  req.principal = { id, primaryRole: role };
  req.userId = id;
  return next();
}

function listing(id, sellerId, storeName, price) {
  return {
    id, title: `Item ${id}`, status: 'PUBLISHED', visibility: 'PUBLIC', deletedAt: null, storeStatus: 'ACTIVE',
    basePriceMinor: price, salePriceMinor: null, sku: null, sellerId, storeId: `store_${sellerId}`, storeName, storePhone: '+237611111111'
  };
}

async function run() {
  console.log('  Testing the whole delivery circuit end to end...');
  const hadSecret = config.supabase.jwtSecret;
  if (!hadSecret) config.supabase.jwtSecret = 'unit-test-delivery-secret-0123456789abcdef';

  // The real notification service, in memory (no credentials): what each user's feed holds.
  const NotificationService = require('../../server/modules/identity/application/NotificationService');
  const feed = async (userId) => (await NotificationService.list(userId, { limit: 50 })).reverse(); // oldest first
  const titles = (list) => list.map((n) => n.title);
  const find = (list, re) => list.find((n) => re.test(n.title));

  let t = Date.parse('2026-10-03T10:00:00.000Z');
  const clock = { now: () => t, advance: (ms) => { t += ms; } };

  const orders = new OrderRepository({ db: null });
  orders._inMemoryListings.set('l1', listing('l1', 'seller_1', 'Tech Shop', 50000));
  orders._inMemoryListings.set('l2', listing('l2', 'seller_1', 'Tech Shop', 3000));
  orders._inMemoryListings.set('l3', listing('l3', 'seller_2', 'Books Corner', 4000));
  for (const id of ['l1', 'l2', 'l3']) orders._inMemoryInventory.set(`${id}:null`, { onHand: 10, reserved: 0, trackInventory: true });
  const creation = new OrderCreationService(orders);

  const repo = new DeliveryRepository({ db: null });
  repo._adminIds = ['admin_1'];
  const service = new DeliveryService({ repository: repo, orderRepository: orders, events: new DeliveryEvents(), now: clock.now });

  const app = express();
  app.use(express.json());
  app.use('/api/v1/deliveries', createDeliveryRouter({ service, authenticate: fakeAuth, streamSupported: false }));
  app.use(errorHandler);
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;

  async function api(method, path, user, body) {
    const res = await fetch(`${base}/api/v1/deliveries${path}`, {
      method,
      headers: { ...(user ? { 'x-test-user': user } : {}), 'content-type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(8000)
    });
    let json = null;
    try { json = await res.json(); } catch (e) { /* no body */ }
    return { status: res.status, data: json && json.data, error: json && json.error };
  }

  /** Every party's reading of the same delivery, via the API, as the screens would get it. */
  async function everyoneSees(deliveryId, parties) {
    const out = {};
    for (const [name, user] of Object.entries(parties)) {
      const r = await api('GET', `/${deliveryId}`, user);
      out[name] = r.status === 200 ? r.data.delivery : null;
    }
    return out;
  }

  try {
    // ============================ 1. the buyer places an order (one store at a time)
    const bag = [
      { id: 'l1', name: 'Phone', priceXaf: 50000, qty: 1, store: 'Tech Shop' },
      { id: 'l2', name: 'Case', priceXaf: 3000, qty: 2, store: 'Tech Shop' },
      { id: 'l3', name: 'Novel', priceXaf: 4000, qty: 1, store: 'Books Corner' }
    ];
    const address = { name: 'Awa Njoya', phone: '+237622222222', street: 'Rue 1, Bonanjo', city: 'Douala' };

    let refused = null;
    try { await creation.createOrder('buyer_1', Circuit.toOrderPayload(bag, address)); } catch (e) { refused = e; }
    assert.ok(refused && refused.details[0].code === 'MULTI_SELLER_ORDER', 'the whole bag in one order is refused: stores deliver separately');

    const groups = Circuit.groupByStore(bag);
    assert.strictEqual(groups.length, 2, 'the checkout therefore splits the bag in two');
    const placed = [];
    for (const g of groups) placed.push(await creation.createOrder('buyer_1', Circuit.toOrderPayload(g.items, address)));
    const [techOrder, bookOrder] = placed;
    assert.strictEqual(techOrder.sellerId, 'seller_1');
    assert.strictEqual(bookOrder.sellerId, 'seller_2');
    assert.strictEqual(techOrder.totalAmountXaf, 50000 + 6000 + techOrder.shippingFeeXaf, 'the server priced it: items plus its own delivery fee');
    const shown = Circuit.orderFromServer(techOrder.toJSON ? techOrder.toJSON() : techOrder, { paymentMethod: 'Pay on delivery' });
    assert.strictEqual(shown.id, techOrder.id, 'the buyer\'s screens use the server\'s order id');
    assert.strictEqual(shown.orderNumber, techOrder.orderNumber);

    // ============================ 2. both sides of each order are contacted
    const buyerFeed1 = await feed('buyer_1');
    assert.strictEqual(buyerFeed1.filter((n) => /placed/.test(n.title)).length, 2, 'the buyer is told about both orders');
    const sellerFeed1 = await feed('seller_1');
    const newOrder = find(sellerFeed1, /New order .* to deliver/);
    assert.ok(newOrder, 'THE SELLER IS TOLD: this is what starts the circuit');
    assert.strictEqual(newOrder.metadata.action, 'open_dispatch');
    assert.strictEqual(newOrder.metadata.orderId, techOrder.id);
    const otherFeed = await feed('seller_2');
    assert.ok(find(otherFeed, /New order .* to deliver/) && otherFeed.length === 1, 'the other store is told about its own order, and only that');
    assert.ok(!(await feed('seller_1')).some((n) => n.metadata.orderId === bookOrder.id), 'and the first store never hears about the other store\'s order');

    // ============================ 3. before any delivery: the normal first state
    const none = await api('GET', `/by-order/${techOrder.id}`, BUYER);
    assert.strictEqual(none.status, 404, 'no delivery yet is a 404 the screens treat as "waiting for the seller"');
    for (const [role, expectMove] of [['buyer', false], ['seller', true], ['admin', false], ['rider', false]]) {
      const m = Circuit.model(null, role);
      assert.strictEqual(m.yourMove, expectMove, `with no delivery, it is${expectMove ? '' : ' not'} the ${role}'s move`);
    }
    const board = await api('GET', '/dispatch', SELLER);
    assert.strictEqual(board.status, 200);
    const row = board.data.items.find((i) => i.order.id === techOrder.id);
    assert.ok(row, 'the order is on the seller\'s dispatch board');
    assert.strictEqual(row.delivery, null, 'with no delivery yet: "Arrange delivery"');
    assert.ok(!board.data.items.some((i) => i.order.id === bookOrder.id), 'the other store\'s order is not on this board');
    assert.strictEqual((await api('GET', '/dispatch', STRANGER)).status, 403, 'a customer has no board');

    // ============================ 4. an admin registers a rider, who is told
    const reg = await api('POST', '/drivers/rider_1', ADMIN, { name: 'Alain', phone: '+237600000001' });
    assert.strictEqual(reg.status, 200);
    assert.ok(find(await feed('rider_1'), /now a LOUMOO rider/), 'the rider hears they were registered');
    assert.strictEqual((await api('POST', '/drivers/rider_2', SELLER, { name: 'X', phone: '+237600000009' })).status, 403, 'only an admin registers riders');

    // ============================ 5. the seller arranges the delivery
    const created = await api('POST', '/', SELLER, { orderId: techOrder.id, dropoffLocation: DROP });
    assert.strictEqual(created.status, 201, JSON.stringify(created.error));
    const deliveryId = created.data.delivery.id;
    assert.ok(find(await feed('buyer_1'), /Delivery being arranged/), 'the buyer hears a rider is being found');
    assert.strictEqual((await api('POST', '/', OTHER_SELLER, { orderId: techOrder.id })).status, 404, 'another seller cannot dispatch this order');

    const drivers = await api('GET', `/drivers?deliveryId=${deliveryId}`, SELLER);
    assert.deepStrictEqual(drivers.data.drivers.map((d) => d.id), ['rider_1'], 'the seller can see who to offer it to');
    const offered = await api('POST', `/${deliveryId}/auto-assign`, SELLER);
    assert.strictEqual(offered.status, 200, JSON.stringify(offered.error));
    assert.strictEqual(offered.data.delivery.status, 'assigned');

    const offer = find(await feed('rider_1'), /New delivery assigned/);
    assert.ok(offer, 'THE RIDER IS TOLD they have an offer');
    assert.strictEqual(offer.metadata.action, 'open_rider_hub');
    assert.strictEqual(offer.metadata.deliveryId, deliveryId);

    // ============================ 6. the rider's side: offer, then the job, in order
    const mine = await api('GET', '/driver/me', RIDER);
    assert.strictEqual(mine.status, 200);
    assert.strictEqual(mine.data.deliveries.length, 1, 'the rider sees their one offer');
    const offerView = mine.data.deliveries[0];
    assert.strictEqual(offerView.viewerRole, 'driver', 'and knows it is theirs');
    assert.ok(!offerView.dropoff.address && !offerView.dropoff.contactPhone, 'before accepting, the rider sees no customer address or phone');
    assert.ok(offerView.dropoff.area, 'only the area');
    assert.strictEqual((await api('GET', `/${deliveryId}`, STRANGER)).status, 404, 'a stranger cannot see the delivery');
    assert.strictEqual((await api('GET', `/${deliveryId}/code`, SELLER)).status, 403, 'the seller never gets the handover code');
    assert.strictEqual((await api('GET', `/${deliveryId}/code`, RIDER)).status, 403, 'nor does the rider');

    const parties = { buyer: BUYER, seller: SELLER, rider: RIDER, admin: ADMIN };

    // ---- one step at a time, every party reads the same story from where they stand
    const stepChecks = [];
    async function checkStory(label, expectStatus, expectMovers) {
      const seen = await everyoneSees(deliveryId, parties);
      for (const [name, d] of Object.entries(seen)) {
        assert.ok(d, `${label}: the ${name} can see the delivery`);
        assert.strictEqual(d.status, expectStatus, `${label}: the ${name} sees ${expectStatus}`);
        // The role the API puts on the delivery (the rider's is "driver") is the role
        // the circuit module reads when a screen does not name one.
        assert.strictEqual(Circuit.model(d).role, name, `${label}: the ${name}'s own view says they are the ${name}`);
      }
      for (const name of Object.keys(parties)) {
        const m = Circuit.model(seen[name], name);
        assert.strictEqual(m.yourMove, expectMovers.includes(name), `${label}: it is${expectMovers.includes(name) ? '' : ' not'} the ${name}'s move`);
        assert.ok(m.headline, `${label}: the ${name} is told something`);
      }
      stepChecks.push(label);
    }

    await checkStory('offered', 'assigned', ['rider']);

    // ============================ 7. accept -> pickup -> on the way -> at the door -> handover
    assert.strictEqual((await api('POST', `/${deliveryId}/accept`, RIDER)).status, 200);
    assert.ok(find(await feed('buyer_1'), /rider accepted/i), 'the buyer is told someone is coming');
    assert.ok(find(await feed('seller_1'), /rider accepted/i), 'the seller is told to have the parcel ready');
    await checkStory('accepted', 'accepted', ['rider']);
    const afterAccept = (await api('GET', `/${deliveryId}`, RIDER)).data.delivery;
    assert.ok(afterAccept.dropoff.address, 'once accepted, the rider gets the customer\'s address');

    // The buyer can now read their code; nobody else can.
    const codeRes = await api('GET', `/${deliveryId}/code`, BUYER);
    assert.strictEqual(codeRes.status, 200);
    assert.strictEqual(codeRes.data.code, codeFor(deliveryId, 1), 'the buyer\'s code is the one the rider will be asked for');

    assert.strictEqual((await api('POST', `/${deliveryId}/location`, RIDER, { ...NEAR })).data.accepted, true);
    clock.advance(5000);
    assert.strictEqual((await api('POST', `/${deliveryId}/status`, RIDER, { status: 'picked_up' })).status, 200);
    assert.strictEqual((await orders.findOrderById(techOrder.id)).fulfillmentStatus, 'in_transit', 'the order itself moves to in transit');
    assert.ok(find(await feed('seller_1'), /collected the parcel/i), 'the seller is told the parcel left');
    assert.ok(find(await feed('buyer_1'), /on its way/i));
    await checkStory('on the way', 'picked_up', ['rider']);

    // The buyer follows the rider only once the parcel is moving.
    const buyerView = (await api('GET', `/${deliveryId}`, BUYER)).data.delivery;
    assert.ok(buyerView.lastLocation && buyerView.etaMinutes != null, 'the buyer sees the rider\'s position and ETA once it is on its way');

    assert.strictEqual((await api('POST', `/${deliveryId}/status`, RIDER, { status: 'arrived' })).status, 200);
    assert.ok(find(await feed('buyer_1'), /rider has arrived/i));
    await checkStory('at the door', 'arrived', ['buyer', 'rider']);

    // A wrong code does not complete it; the right one does.
    const wrong = codeFor(deliveryId, 1) === '0000' ? '1111' : '0000';
    assert.strictEqual((await api('POST', `/${deliveryId}/complete`, RIDER, { code: wrong })).status, 400);
    const done = await api('POST', `/${deliveryId}/complete`, RIDER, { code: codeFor(deliveryId, 1) });
    assert.strictEqual(done.status, 200, JSON.stringify(done.error));
    assert.strictEqual((await orders.findOrderById(techOrder.id)).fulfillmentStatus, 'delivered', 'the order is delivered');
    await checkStory('delivered', 'delivered', []);

    // ============================ 8. who heard what, over the whole journey
    const buyerFeed = await feed('buyer_1');
    const sellerFeed = await feed('seller_1');
    const riderFeed = await feed('rider_1');
    const adminFeed = await feed('admin_1');
    assert.ok(find(buyerFeed, /Order delivered/) && find(sellerFeed, /Order delivered/), 'buyer and seller are told it was delivered');
    assert.strictEqual(adminFeed.length, 0, 'a delivery that went right never bothers an administrator');

    // Every notification names its audience, which screen it opens, and is addressed to the right person.
    for (const [who, list, audience] of [['buyer', buyerFeed, 'buyer'], ['seller', sellerFeed, 'seller'], ['rider', riderFeed, 'rider']]) {
      assert.ok(list.length >= 2, `the ${who} was told things`);
      for (const n of list) {
        assert.strictEqual(n.metadata.audience, audience, `"${n.title}" (to the ${who}) is written for the ${audience}`);
        assert.ok(n.metadata.action, `"${n.title}" opens a screen`);
      }
    }
    const everything = [...buyerFeed, ...sellerFeed, ...riderFeed].map((n) => `${n.title} ${n.body}`).join(' | ');
    assert.ok(!/622222222|Rue 1|Awa/.test(everything), 'no notification carries the customer\'s phone, street or name');

    // The other order was never touched by any of this.
    assert.strictEqual((await orders.findOrderById(bookOrder.id)).fulfillmentStatus, 'processing');
    assert.strictEqual((await feed('seller_2')).length, 1);

    // The journey took every step we meant it to.
    assert.deepStrictEqual(stepChecks, ['offered', 'accepted', 'on the way', 'at the door', 'delivered']);
    assert.ok(titles(buyerFeed).length >= 6, 'the buyer heard from every stage');

    console.log('    ✓ One order: placed -> seller told -> delivery arranged -> rider told -> collected -> handed over; every party contacted, in their own role.');
  } finally {
    await new Promise((resolve) => server.close(resolve));
    if (!hadSecret) config.supabase.jwtSecret = hadSecret;
  }
}

module.exports = { run };
