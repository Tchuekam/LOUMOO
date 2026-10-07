/**
 * LOUMOO Unit Tests - Drop-off geocoding, so a delivery has an ETA
 * ---------------------------------------------------------------------------
 * The checkout collects an address but no coordinates and the seller's screen sends
 * none, so before this a delivery had no ETA and no distance at all. The service now
 * resolves the address itself when it creates the delivery. Pinned here:
 *
 *   - the geocoder: parsing, caching, one request at a time at the polite rate,
 *     time-outs, the off switch, the identifying User-Agent, and that it never throws;
 *   - the service: the ETA really appears once the rider is moving; coordinates the
 *     seller supplied are never overwritten; a geocoder that fails, hangs or lies
 *     never stops a delivery being created, and a refused request never reaches it.
 *
 * No network: the geocoder's `fetch` is a fake.
 */

require('../setup');
const assert = require('assert');
const config = require('../../server/config/env');

const { createGeocoder, getDefaultGeocoder, toPoint } = require('../../server/modules/delivery/infrastructure/Geocoder');
const { DeliveryService } = require('../../server/modules/delivery/application/DeliveryService');
const { DeliveryRepository } = require('../../server/modules/delivery/infrastructure/DeliveryRepository');
const { DeliveryEvents } = require('../../server/modules/delivery/infrastructure/DeliveryEvents');
const { OrderRepository } = require('../../server/modules/commerce/infrastructure/OrderRepository');
const { Order, FULFILLMENT_STATUS, DELIVERY_METHOD, PAYMENT_STATUS } = require('../../server/modules/commerce/domain/Order');

const SELLER = { userId: 'seller_1', userRole: 'seller' };
const ADMIN = { userId: 'admin_1', userRole: 'admin' };
const RIDER = { userId: 'rider_1', userRole: 'customer' };

/** A fake fetch that records its calls and answers from `reply`. */
function fakeFetch(reply) {
  const calls = [];
  const f = async (url, init) => {
    calls.push({ url: String(url), headers: (init && init.headers) || {} });
    return reply(String(url), calls.length);
  };
  f.calls = calls;
  return f;
}
const ok = (body) => ({ ok: true, json: async () => body });
const found = (lat, lon) => ok([{ lat: String(lat), lon: String(lon) }]);

async function testGeocoder() {
  // Parsing: a usable point, rounded; anything else is null.
  assert.deepStrictEqual(toPoint({ lat: '4.0511234567', lon: '9.7679' }), { lat: 4.051123, lng: 9.7679 });
  assert.deepStrictEqual(toPoint({ lat: 4.05, lng: 9.7 }), { lat: 4.05, lng: 9.7 }, 'accepts lng as well as lon');
  for (const bad of [null, undefined, {}, { lat: 'x', lon: '9' }, { lat: '91', lon: '9' }, { lat: '4', lon: '181' }, { lat: '0', lon: '0' }, { lat: '', lon: '' }]) {
    assert.strictEqual(toPoint(bad), null, `not a point: ${JSON.stringify(bad)}`);
  }

  // The request: the polite headers, the country restriction, the address as the query.
  {
    const f = fakeFetch(() => found(4.0511, 9.7679));
    const g = createGeocoder({ fetchImpl: f, minIntervalMs: 0, url: 'https://geo.example/search' });
    assert.strictEqual(g.enabled, true);
    assert.deepStrictEqual(await g.geocode('Rue 1, Bonanjo, Douala'), { lat: 4.0511, lng: 9.7679 });
    const url = new URL(f.calls[0].url);
    assert.strictEqual(url.origin + url.pathname, 'https://geo.example/search');
    assert.strictEqual(url.searchParams.get('q'), 'Rue 1, Bonanjo, Douala');
    assert.strictEqual(url.searchParams.get('countrycodes'), 'cm', 'results are restricted to Cameroon');
    assert.strictEqual(url.searchParams.get('limit'), '1');
    assert.ok(/LOUMOO/.test(f.calls[0].headers['User-Agent']), 'it identifies itself, as Nominatim\'s policy requires');
  }

  // A URL that already has a query string is extended, not broken.
  {
    const f = fakeFetch(() => found(4, 9));
    await createGeocoder({ fetchImpl: f, minIntervalMs: 0, url: 'https://geo.example/search?key=abc' }).geocode('Akwa, Douala');
    assert.ok(/search\?key=abc&q=/.test(f.calls[0].url));
  }

  // Caching: the same address, spelled slightly differently, is asked once.
  {
    const f = fakeFetch(() => found(4.0511, 9.7679));
    const g = createGeocoder({ fetchImpl: f, minIntervalMs: 0 });
    await g.geocode('Rue 1, Bonanjo');
    await g.geocode('  rue 1,   BONANJO ');
    assert.strictEqual(f.calls.length, 1);
  }

  // "Not found" is remembered briefly; a failure is not (the next try may work).
  {
    const f = fakeFetch(() => ok([]));
    const g = createGeocoder({ fetchImpl: f, minIntervalMs: 0 });
    assert.strictEqual(await g.geocode('Nowhere at all'), null);
    assert.strictEqual(await g.geocode('Nowhere at all'), null);
    assert.strictEqual(f.calls.length, 1, 'an address that was not found is not asked again');

    let n = 0;
    const flaky = fakeFetch(() => (++n === 1 ? { ok: false, status: 503 } : found(4.1, 9.8)));
    const g2 = createGeocoder({ fetchImpl: flaky, minIntervalMs: 0 });
    assert.strictEqual(await g2.geocode('Rue 2, Akwa'), null, 'a 503 is a quiet null');
    assert.deepStrictEqual(await g2.geocode('Rue 2, Akwa'), { lat: 4.1, lng: 9.8 }, 'and is not remembered as "not found"');
  }

  // It never throws, whatever goes wrong.
  {
    for (const reply of [() => { throw new Error('boom'); }, () => ({ ok: true, json: async () => { throw new Error('not json'); } }), () => ok({ not: 'an array' }), () => ok([{ lat: 'x' }])]) {
      const g = createGeocoder({ fetchImpl: fakeFetch(reply), minIntervalMs: 0 });
      assert.strictEqual(await g.geocode('Rue 3, Douala'), null);
    }
    assert.strictEqual(await createGeocoder({ fetchImpl: fakeFetch(() => found(4, 9)), minIntervalMs: 0 }).geocode(''), null, 'an empty address is not looked up');
    assert.strictEqual(await createGeocoder({ fetchImpl: fakeFetch(() => found(4, 9)), minIntervalMs: 0 }).geocode('ab'), null, 'nor is a scrap');
  }

  // A fetch that never answers is cut off, and the caller is not held past the ceiling.
  {
    const hang = () => new Promise(() => {});
    const g = createGeocoder({ fetchImpl: hang, minIntervalMs: 0, timeoutMs: 30 });
    const started = Date.now();
    assert.strictEqual(await g.geocode('Rue 4, Douala'), null);
    assert.ok(Date.now() - started < 1500, 'the caller waits for the ceiling, not forever');
  }

  // Politeness: one request at a time, at least minIntervalMs apart; no stampede.
  {
    let clock = 10_000;
    const slept = [];
    const f = fakeFetch(() => found(4, 9));
    const g = createGeocoder({ fetchImpl: f, minIntervalMs: 1100, timeoutMs: 5000, now: () => clock, sleep: async (ms) => { slept.push(ms); clock += ms; } });
    await g.geocode('Rue A, Douala');
    clock += 100;
    await g.geocode('Rue B, Douala');
    assert.strictEqual(f.calls.length, 2);
    assert.ok(slept.some((ms) => ms >= 900 && ms <= 1100), `the second request waited out the rest of the interval (waited ${slept})`);
  }

  // A request that would have to wait longer than it is worth is skipped, not queued.
  {
    let clock = 5_000;
    const f = fakeFetch(() => found(4, 9));
    const g = createGeocoder({ fetchImpl: f, minIntervalMs: 60_000, timeoutMs: 100, now: () => clock, sleep: async (ms) => { clock += ms; } });
    assert.ok(await g.geocode('Rue A, Douala'));
    assert.strictEqual(await g.geocode('Rue B, Douala'), null, 'a wait of a minute is refused');
    assert.strictEqual(f.calls.length, 1);
  }

  // The off switch, and no fetch to use.
  for (const off of ['off', 'OFF', 'false', '0', 'disabled']) {
    const f = fakeFetch(() => found(4, 9));
    const g = createGeocoder({ fetchImpl: f, url: off });
    assert.strictEqual(g.enabled, false, `"${off}" switches it off`);
    assert.strictEqual(await g.geocode('Rue 1, Douala'), null);
    assert.strictEqual(f.calls.length, 0, 'and nothing is sent anywhere');
  }
  // Left unconfigured it is on (the public Nominatim service), which is what a deployment gets.
  assert.strictEqual(createGeocoder({ fetchImpl: fakeFetch(() => found(4, 9)), env: {} }).enabled, true);

  // Under test the process-wide default never touches the network.
  assert.strictEqual(getDefaultGeocoder().enabled, false);
}

function listing(over = {}) {
  return new Order({
    buyerId: 'buyer_1', sellerId: 'seller_1',
    items: [{ listingId: 'lst_1', title: 'Phone', unitPriceXaf: 50000, quantity: 1, sellerId: 'seller_1', storeName: 'Tech Shop' }],
    shippingAddress: { fullName: 'Awa Njoya', phone: '+237622222222', street: 'Rue 1', neighbourhood: 'Bonanjo', city: 'Douala' },
    deliveryMethod: DELIVERY_METHOD.HOME_DELIVERY, paymentStatus: PAYMENT_STATUS.PAID, fulfillmentStatus: FULFILLMENT_STATUS.PROCESSING, ...over
  });
}

async function world(geocoder) {
  let t = Date.parse('2026-10-03T10:00:00.000Z');
  const clock = { now: () => t, advance: (ms) => { t += ms; } };
  const orders = new OrderRepository({ db: null });
  const repo = new DeliveryRepository({ db: null });
  // Nothing here is about heartbeats: an hour keeps the rider "here" however the clock moves.
  const service = new DeliveryService({ repository: repo, orderRepository: orders, events: new DeliveryEvents(), now: clock.now, geocoder, presenceTtlMs: 60 * 60 * 1000 });
  await service.registerDriver('rider_1', { name: 'Alain', phone: '+237600000001' }, ADMIN);
  await service.riderGoOnline(RIDER); // a rider can only be offered a delivery once they are online
  return { clock, orders, repo, service, order: await orders.saveOrder(listing()) };
}

async function testService() {
  const NotificationService = require('../../server/modules/identity/application/NotificationService');
  const originalCreate = NotificationService.create;
  NotificationService.create = async () => null;
  try {
    // The address is resolved at creation, and the ETA then appears once the rider is moving.
    {
      const asked = [];
      const geocoder = { enabled: true, geocode: async (address) => { asked.push(address); return { lat: 4.0601, lng: 9.7679 }; } };
      const w = await world(geocoder);
      const created = await w.service.createDelivery(w.order.id, SELLER, {});
      assert.deepStrictEqual(asked, ['Rue 1, Bonanjo, Douala'], 'it asks for the address the rider will be sent to');
      assert.deepStrictEqual((await w.repo.findById(created.id)).dropoff.location, { lat: 4.0601, lng: 9.7679 }, 'and the point is stored on the delivery');

      await w.service.assignDriver(created.id, 'rider_1', SELLER);
      await w.service.acceptDelivery(created.id, RIDER);
      assert.strictEqual((await w.service.recordLocation(created.id, { lat: 4.0511, lng: 9.7679 }, RIDER)).accepted, true);
      w.clock.advance(5000);
      const picked = await w.service.updateStatus(created.id, 'picked_up', null, RIDER);
      assert.ok(picked.etaMinutes > 0 && picked.etaMinutes < 60, `an ETA exists now: ${picked.etaMinutes} min`);
      assert.ok(picked.distanceKm > 0, 'and a distance');
      w.clock.advance(5000); // pings closer than 3 s are throttled
      const ping = await w.service.recordLocation(created.id, { lat: 4.0560, lng: 9.7679 }, RIDER);
      assert.ok(ping.etaMinutes != null && ping.distanceKm != null, 'every ping keeps it current');
    }

    // Coordinates the seller supplied win: the geocoder is not even asked.
    {
      let calls = 0;
      const w = await world({ enabled: true, geocode: async () => { calls += 1; return { lat: 1, lng: 1 }; } });
      const created = await w.service.createDelivery(w.order.id, SELLER, { dropoffLocation: { lat: 4.07, lng: 9.71 } });
      assert.strictEqual(calls, 0);
      assert.deepStrictEqual((await w.repo.findById(created.id)).dropoff.location, { lat: 4.07, lng: 9.71 });
    }

    // A geocoder that fails, throws or hangs never stops the delivery.
    for (const geocoder of [
      { enabled: true, geocode: async () => null },
      { enabled: true, geocode: async () => { throw new Error('geocoder down'); } },
      undefined
    ]) {
      const w = await world(geocoder);
      const created = await w.service.createDelivery(w.order.id, SELLER, {});
      assert.ok(created.id, 'the delivery is created');
      assert.strictEqual((await w.repo.findById(created.id)).dropoff.location, null, 'without coordinates, exactly as before');
    }

    // A disabled geocoder is not called.
    {
      let calls = 0;
      const w = await world({ enabled: false, geocode: async () => { calls += 1; return { lat: 4, lng: 9 }; } });
      await w.service.createDelivery(w.order.id, SELLER, {});
      assert.strictEqual(calls, 0);
    }

    // A request that is refused never reaches the geocoder (no address leaves for nothing).
    {
      let calls = 0;
      const w = await world({ enabled: true, geocode: async () => { calls += 1; return { lat: 4, lng: 9 }; } });
      await w.service.createDelivery(w.order.id, SELLER, {});
      assert.strictEqual(calls, 1);
      let error = null;
      try { await w.service.createDelivery(w.order.id, SELLER, {}); } catch (e) { error = e; }
      assert.ok(error && error.statusCode === 409, 'a second delivery for the same order is refused');
      assert.strictEqual(calls, 1, 'and costs no lookup');
      error = null;
      try { await w.service.createDelivery(w.order.id, { userId: 'seller_2', userRole: 'seller' }, {}); } catch (e) { error = e; }
      assert.ok(error && error.statusCode === 404, 'someone else\'s order is refused');
      assert.strictEqual(calls, 1);
    }

    // A pickup order has no delivery at all, so nothing is looked up.
    {
      let calls = 0;
      const w = await world({ enabled: true, geocode: async () => { calls += 1; return null; } });
      const pickup = await w.orders.saveOrder(listing({ deliveryMethod: DELIVERY_METHOD.STORE_PICKUP }));
      let error = null;
      try { await w.service.createDelivery(pickup.id, SELLER, {}); } catch (e) { error = e; }
      assert.ok(error);
      assert.strictEqual(calls, 0);
    }
  } finally {
    NotificationService.create = originalCreate;
  }
}

async function run() {
  console.log('  Testing drop-off geocoding and the ETA it enables...');
  const hadSecret = config.supabase.jwtSecret;
  if (!hadSecret) config.supabase.jwtSecret = 'unit-test-delivery-secret-0123456789abcdef';
  try {
    await testGeocoder();
    await testService();
    console.log('    ✓ Geocoding: a delivery now has an ETA; it is polite, bounded, private, and never blocks a delivery.');
  } finally {
    if (!hadSecret) config.supabase.jwtSecret = hadSecret;
  }
}

module.exports = { run };
