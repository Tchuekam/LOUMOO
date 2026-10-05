/**
 * LOUMOO — Rider presence in dispatch and delivery
 * ---------------------------------------------------------------------------
 * What presence does to the DELIVERY side, driven through DeliveryService over the
 * in-memory backends with a fake clock: no database, no HTTP. The presence rules on
 * their own (go online, pause, the heartbeat, the claim) are rider_presence_service
 * and rider_presence_domain; the HTTP wire is the routes suite's. Here the question is the one the feature exists
 * for: is a delivery ever offered to, or left sitting with, a rider who is not here?
 *
 *   1  eligibility      who dispatch may choose from, and what a refusal looks like
 *   2  lifecycle        accept -> busy, and every way a delivery ends -> online again
 *   3  simultaneity     one rider, many deliveries, many sellers, all at once
 *   4  going offline    the rider leaves while holding offers
 *   5  expiry           the heartbeat window, the boundary, the sweep
 *   6  GPS vs presence  two separate things, stored separately
 *   7  the sweeper      the real OfferSweeper, and its jobs not hiding each other
 *   8  suspension       suspended and deleted riders
 *   9  authority        only the rider can touch their own presence
 *
 * Every section runs even when an earlier one fails, and the failures are reported
 * together at the end, each under its section's name.
 *
 * The world's presence window is an hour unless a case is about expiry, because the
 * offer-window cases move the clock by the 15-minute offer TTL again and again.
 */

require('../setup');

const assert = require('assert');
const config = require('../../server/config/env');
const logger = require('../../server/shared/logging/logger');

const { DeliveryService } = require('../../server/modules/delivery/application/DeliveryService');
const { DeliveryRepository } = require('../../server/modules/delivery/infrastructure/DeliveryRepository');
const { DeliveryEvents } = require('../../server/modules/delivery/infrastructure/DeliveryEvents');
const { startOfferSweeper, DEFAULT_INTERVAL_MS } = require('../../server/modules/delivery/infrastructure/OfferSweeper');
const { MAX_HANDOVER_ATTEMPTS } = require('../../server/modules/delivery/domain/Delivery');
const { OrderRepository } = require('../../server/modules/commerce/infrastructure/OrderRepository');
const { Order, FULFILLMENT_STATUS, DELIVERY_METHOD, PAYMENT_STATUS } = require('../../server/modules/commerce/domain/Order');

const SECOND = 1000;
const MIN = 60 * SECOND;
const OFFER_TTL_MS = 15 * MIN;
const LONG_PRESENCE_MS = 60 * MIN; // the longest the service allows

const BUYER = { userId: 'buyer_1', userRole: 'customer' };
const SELLER = { userId: 'seller_1', userRole: 'seller' };
const OTHER_SELLER = { userId: 'seller_2', userRole: 'seller' };
const ADMIN = { userId: 'admin_1', userRole: 'admin' };
const as = (id, role = 'customer') => ({ userId: id, userRole: role });
const RIDER = as('rider_1');
const RIDER2 = as('rider_2');

// ------------------------------------------------------------------- scaffolding

const notifications = [];
const sentTo = (userId, title) => notifications.filter((n) => n.userId === userId && n.title === title);
const titled = (title) => notifications.filter((n) => n.title === title);

async function caught(promise) {
  try {
    await promise;
    return null;
  } catch (e) {
    return e;
  }
}

/** `CODE` or `CODE:reason` of a refusal, or 'OK': says WHY a call was turned down. */
async function outcome(promise) {
  const e = await caught(promise);
  if (!e) return 'OK';
  return `${e.code || e.name || 'ERROR'}${e.details && e.details.reason ? `:${e.details.reason}` : ''}`;
}

/** The call must be refused with exactly this status, code and (when given) reason. */
async function assertRefused(label, promise, { statusCode, code, reason }) {
  const e = await caught(promise);
  assert.ok(e, `${label}: expected a refusal, but the call succeeded`);
  assert.strictEqual(e.statusCode, statusCode, `${label}: status was ${e.statusCode} (${e.code}: ${e.message}), wanted ${statusCode}`);
  assert.strictEqual(e.code, code, `${label}: code was ${e.code} (${e.message}), wanted ${code}`);
  if (reason !== undefined) {
    assert.strictEqual(e.details && e.details.reason, reason, `${label}: reason was ${JSON.stringify(e.details)}, wanted ${reason}`);
  }
  return e;
}

/** 409: the rider cannot take work now. RIDER_BUSY when carrying a parcel, RIDER_UNAVAILABLE otherwise. */
const unavailable = (reason) => ({ statusCode: 409, code: reason === 'busy' ? 'RIDER_BUSY' : 'RIDER_UNAVAILABLE', reason });

function makeWorld({ offerTtlMs = OFFER_TTL_MS, presenceTtlMs = LONG_PRESENCE_MS } = {}) {
  let t = Date.parse('2026-10-03T10:00:00.000Z');
  const clock = {
    now: () => t,
    advance: (ms) => { t += ms; },
    iso: (offsetMs = 0) => new Date(t + offsetMs).toISOString()
  };
  const orders = new OrderRepository({ db: null });
  const repo = new DeliveryRepository({ db: null });
  const events = new DeliveryEvents();
  const service = new DeliveryService({ repository: repo, orderRepository: orders, events, now: clock.now, offerTtlMs, presenceTtlMs });
  return { clock, orders, repo, events, service };
}

let orderSeq = 0;
async function placeOrder(world, overrides = {}) {
  orderSeq += 1;
  const sellerId = overrides.sellerId || 'seller_1';
  return world.orders.saveOrder(new Order({
    buyerId: 'buyer_1',
    sellerId,
    items: [{ listingId: `lst_pd${orderSeq}`, title: 'Phone', unitPriceXaf: 50000, quantity: 1, sellerId, storeName: 'Tech Shop' }],
    shippingAddress: { fullName: 'Awa Njoya', phone: '+237622222222', street: 'Rue 1', city: 'Douala' },
    deliveryMethod: DELIVERY_METHOD.HOME_DELIVERY,
    paymentStatus: PAYMENT_STATUS.PAID,
    fulfillmentStatus: FULFILLMENT_STATUS.PROCESSING,
    ...overrides
  }));
}

/** A delivery for a fresh order, optionally already offered to a rider. `seller` is who creates (and offers) it. */
async function newDelivery(world, { assignTo = null, seller = SELLER } = {}) {
  const order = await placeOrder(world, { sellerId: seller.userId });
  const created = await world.service.createDelivery(order.id, seller, {});
  if (assignTo) await world.service.assignDriver(created.id, assignTo, seller);
  return { order, id: created.id };
}

let phoneSeq = 0;
/** An administrator registers a rider; unless `online: false` the rider then opens the app and goes online. */
async function registerRider(world, id, name, { online = true, role = 'customer' } = {}) {
  phoneSeq += 1;
  await world.service.registerDriver(id, { name, phone: `+23760001${String(phoneSeq).padStart(4, '0')}` }, ADMIN);
  const caller = as(id, role);
  if (online) await world.service.riderGoOnline(caller);
  return caller;
}

async function registerRiders(world, riders = [['rider_1', 'Alain'], ['rider_2', 'Bruno']]) {
  for (const [id, name] of riders) await registerRider(world, id, name);
}

/** A delivery offered to the rider and accepted: the rider is now busy. */
async function acceptedJob(world, riderId, opts = {}) {
  const d = await newDelivery(world, { assignTo: riderId, ...opts });
  await world.service.acceptDelivery(d.id, as(riderId));
  return d;
}

/** Takes an accepted delivery to the end: picked up, arrived, handed over with the buyer's code. */
async function finishDelivery(world, deliveryId, rider) {
  await world.service.updateStatus(deliveryId, 'picked_up', null, rider);
  await world.service.updateStatus(deliveryId, 'arrived', null, rider);
  const handover = await world.service.getHandoverCode(deliveryId, BUYER);
  return world.service.completeDelivery(deliveryId, handover.code, rider);
}

const stored = (w, deliveryId) => w.repo.findById(deliveryId);
const presenceOf = async (w, riderId) => (await w.service.getRiderPresence(as(riderId)));
const listedIds = async (w, caller = SELLER, opts) => (await w.service.listDrivers(caller, opts)).map((r) => r.id);
async function lastEvent(w, deliveryId) {
  const events = await w.repo.listEvents(deliveryId);
  return events[events.length - 1];
}
const rosterById = async (w) => Object.fromEntries((await w.service.listRiderRoster(ADMIN)).map((r) => [r.id, r]));

/**
 * After a delivery ended, the rider is a free, online rider again: the service says so, the stored
 * row says so, they are on the seller's list, and a delivery can really be offered to them (the offer
 * is cancelled again, which touches nothing of theirs).
 */
async function assertOfferableAgain(w, riderId, label) {
  const p = await presenceOf(w, riderId);
  assert.strictEqual(p.status, 'online', `${label}: the rider is online again, not ${p.status}`);
  assert.strictEqual(p.available, true, `${label}: and available`);
  assert.strictEqual((await w.repo.findPresence(riderId)).status, 'online', `${label}: the stored row says online too`);
  assert.ok((await listedIds(w)).includes(riderId), `${label}: the rider is on the seller's list again`);
  const next = await newDelivery(w, { assignTo: riderId }); // would be RIDER_BUSY if they were still busy
  assert.strictEqual((await stored(w, next.id)).driverId, riderId, `${label}: and a new delivery can be offered to them`);
  await w.service.cancelDelivery(next.id, 'offer withdrawn by the test', SELLER);
  assert.strictEqual((await presenceOf(w, riderId)).status, 'online', `${label}: cancelling an offer leaves them online`);
}

/**
 * Makes every named repository call yield a few event-loop turns first, a different number each
 * time (a fixed pseudo-random sequence per `seed`), so that two concurrent requests interleave in
 * a different way for every seed. Deterministic: the same seed is the same interleaving.
 */
function jitter(repo, seed, names = ['findById', 'findDriver', 'findPresence', 'findOpenByDriver', 'updateWhere', 'transitionPresence', 'insertEvent', 'listEvents', 'countOpenByDriver']) {
  let state = (seed * 2654435761) >>> 0;
  for (const name of names) {
    const original = repo[name].bind(repo);
    repo[name] = async (...args) => {
      state = (Math.imul(state, 1103515245) + 12345) >>> 0;
      for (let i = (state >>> 16) % 5; i > 0; i -= 1) await null;
      return original(...args);
    };
  }
}

/** A fake timer API recording what the sweeper schedules (the real sweeper, no real timers). */
function fakeTimers() {
  const t = { scheduled: [], cleared: [], unrefCalled: false };
  t.setIntervalFn = (fn, ms) => {
    const handle = { fn, ms, unref() { t.unrefCalled = true; } };
    t.scheduled.push(handle);
    return handle;
  };
  t.clearIntervalFn = (h) => t.cleared.push(h);
  return t;
}

// ===================================================================================
// 1. ELIGIBILITY
// ===================================================================================

async function eligibility() {
  // Registered is not available. Only rider_ok is online, heard from lately and free. He sorts LAST by
  // name, so being the only pick proves the others were filtered out, not outranked.
  const w = makeWorld({ presenceTtlMs: 5 * MIN });
  await registerRider(w, 'rider_ok', 'Zed');
  await registerRider(w, 'rider_off', 'Alain');
  await registerRider(w, 'rider_paused', 'Bruno');
  await registerRider(w, 'rider_susp', 'Chantal');
  await registerRider(w, 'rider_busy', 'Dora');
  await registerRider(w, 'rider_silent', 'Elise');
  await registerRider(w, 'rider_never', 'Fanny', { online: false });

  await w.service.riderGoOffline(as('rider_off'));
  await w.service.riderPause(as('rider_paused'));
  await w.service.registerDriver('rider_susp', { name: 'Chantal', phone: '+237600019999', status: 'suspended' }, ADMIN);
  const carried = await acceptedJob(w, 'rider_busy');
  w.clock.advance(4 * MIN);
  await w.service.riderHeartbeat(as('rider_ok'));
  await w.service.riderHeartbeat(as('rider_busy'));
  const lastBeat = w.clock.iso();
  w.clock.advance(2 * MIN); // rider_silent last spoke 6 minutes ago, past the 5-minute window; the two above 2 minutes ago

  assert.deepStrictEqual(await listedIds(w), ['rider_ok'], 'offline, paused, suspended, busy, silent and never-online riders are not listed');
  assert.deepStrictEqual(await listedIds(w, ADMIN), ['rider_ok'], 'an administrator is shown the same list');
  assert.deepStrictEqual((await w.service.listDrivers(SELLER, { withSummary: true })).summary, { registered: 6, available: 1 },
    'six active riders exist, one is available; the suspended one is not counted as registered');

  // ---- naming an unavailable rider by hand: refused with the reason, and nothing changes
  const target = await newDelivery(w);
  const refusals = [
    ['rider_off', unavailable('offline')],
    ['rider_paused', unavailable('paused')],
    ['rider_busy', unavailable('busy')],
    ['rider_silent', unavailable('expired')],
    ['rider_never', unavailable('offline')],
    ['rider_susp', { statusCode: 400, code: 'VALIDATION_ERROR' }] // a suspended rider keeps the validation error it always had
  ];
  for (const [riderId, expected] of refusals) {
    notifications.length = 0;
    await assertRefused(`assignDriver -> ${riderId}`, w.service.assignDriver(target.id, riderId, SELLER), expected);
    await assertRefused(`as an administrator -> ${riderId}`, w.service.assignDriver(target.id, riderId, ADMIN), expected);
    const d = await stored(w, target.id);
    assert.strictEqual(d.status, 'pending_assignment', `${riderId}: the refused offer left the delivery unassigned`);
    assert.strictEqual(d.driverId, null, `${riderId}: with no rider on it`);
    assert.strictEqual((await w.repo.listEvents(target.id)).length, 1, `${riderId}: and wrote nothing to the timeline but "Delivery created"`);
    assert.strictEqual(sentTo(riderId, 'New delivery assigned').length, 0, `${riderId}: and told the rider nothing`);
  }
  assert.strictEqual(await outcome(w.service.assignDriver(target.id, 'rider_ok', SELLER)), 'OK', 'while the available rider is accepted');
  assert.strictEqual((await stored(w, target.id)).driverId, 'rider_ok');

  // ---- auto-assign never picks them, whatever they rank
  const a = await newDelivery(w);
  const b = await newDelivery(w);
  assert.strictEqual((await w.service.autoAssignDriver(a.id, SELLER)).driver.id, 'rider_ok', 'auto-assign picks the only available rider');
  assert.strictEqual((await w.service.autoAssignDriver(b.id, SELLER)).driver.id, 'rider_ok', 'and again: offers stack on a rider who has only been offered work');
  for (const id of [a.id, b.id]) {
    for (const riderId of ['rider_off', 'rider_paused', 'rider_susp', 'rider_busy', 'rider_silent', 'rider_never']) {
      assert.notStrictEqual((await stored(w, id)).driverId, riderId, `${riderId} was not auto-assigned`);
    }
  }

  // ---- the admin roster tells them apart, and lists the suspended one too
  const roster = await w.service.listRiderRoster(ADMIN);
  assert.deepStrictEqual(roster.map((r) => r.id), ['rider_off', 'rider_paused', 'rider_busy', 'rider_silent', 'rider_never', 'rider_ok', 'rider_susp'],
    'active riders by name, then the suspended one');
  const by = Object.fromEntries(roster.map((r) => [r.id, r]));
  assert.deepStrictEqual(Object.fromEntries(roster.map((r) => [r.id, r.presence])), {
    rider_off: 'offline', rider_paused: 'paused', rider_busy: 'busy', rider_silent: 'offline', rider_never: 'offline', rider_ok: 'online', rider_susp: 'suspended'
  }, 'every rider shows what they are: offline, paused, busy, expired (offline), never online, online, suspended');
  assert.strictEqual(by.rider_ok.lastSeenAt, lastBeat, 'an online rider shows when they were last heard from');
  assert.strictEqual(by.rider_busy.lastSeenAt, lastBeat, 'and so does a busy one');
  assert.strictEqual(by.rider_silent.lastSeenAt, '2026-10-03T10:00:00.000Z', 'the silent one shows the last time they were heard from');
  assert.strictEqual(by.rider_never.lastSeenAt, null, 'a rider who never opened the app has no last-seen time');
  assert.strictEqual(by.rider_susp.status, 'suspended', 'the suspended rider is in the roster as suspended');
  assert.strictEqual(by.rider_susp.lastSeenAt, '2026-10-03T10:00:00.000Z', 'with the last time they were heard from kept for the administrator');
  assert.strictEqual(by.rider_busy.openDeliveries, 1);
  // What a seller or administrator is given never includes a position or the raw row.
  assert.deepStrictEqual(Object.keys(roster[0]).sort(), ['id', 'lastSeenAt', 'name', 'openDeliveries', 'phone', 'presence', 'status'], 'roster rows carry presence and lastSeenAt, never a position');
  assert.deepStrictEqual(Object.keys((await w.service.listDrivers(SELLER))[0]).sort(), ['id', 'name', 'openDeliveries', 'phone'], 'the seller list is unchanged: id, name, phone, workload');

  // ---- nobody here: auto-assign says so, and "nobody online" is told apart from "nobody registered"
  await w.service.riderGoOffline(as('rider_ok')); // takes the two stacked offers back to their sellers
  for (const id of [target.id, a.id, b.id]) {
    const d = await stored(w, id);
    assert.strictEqual(d.status, 'pending_assignment', 'an offer to the rider who went offline came back');
    assert.strictEqual(d.driverId, null);
  }
  assert.deepStrictEqual(await listedIds(w), [], 'nobody is listed');
  assert.deepStrictEqual((await w.service.listDrivers(SELLER, { withSummary: true })).summary, { registered: 6, available: 0 }, 'six registered, none available');
  assert.deepStrictEqual((await w.service.listDrivers(SELLER, { withSummary: true })).drivers, [], 'with no drivers listed');
  await assertRefused('autoAssign with nobody available', w.service.autoAssignDriver(a.id, SELLER), { statusCode: 409, code: 'NO_RIDER_AVAILABLE' });
  assert.strictEqual((await stored(w, a.id)).status, 'pending_assignment', 'the delivery waits for the seller, unassigned');
  assert.strictEqual((await stored(w, carried.id)).status, 'accepted', 'and the busy rider still holds the parcel they accepted');

  // ---- no riders registered at all
  const empty = makeWorld();
  assert.deepStrictEqual((await empty.service.listDrivers(SELLER, { withSummary: true })).summary, { registered: 0, available: 0 });
  const lonely = await newDelivery(empty);
  await assertRefused('autoAssign with no riders registered', empty.service.autoAssignDriver(lonely.id, SELLER), { statusCode: 409, code: 'NO_RIDER_AVAILABLE' });

  // ---- without the flag the list is the plain array it always was
  assert.ok(Array.isArray(await w.service.listDrivers(SELLER)), 'listDrivers without withSummary still returns an array');
}

async function eligibilityStacking() {
  // A rider who holds only OFFERS is still available: offers stack, and ranking still prefers the least loaded.
  const w = makeWorld();
  await registerRiders(w, [['rider_1', 'Alain'], ['rider_2', 'Bruno']]);
  const first = await newDelivery(w, { assignTo: 'rider_1' });
  assert.strictEqual((await presenceOf(w, 'rider_1')).status, 'online', 'holding an offer does not make a rider busy');
  assert.strictEqual((await presenceOf(w, 'rider_1')).available, true);
  assert.deepStrictEqual((await w.service.listDrivers(SELLER)).map((r) => [r.id, r.openDeliveries]), [['rider_2', 0], ['rider_1', 1]],
    'the rider holding an offer is still listed, behind the idle one');

  assert.strictEqual(await outcome(newDelivery(w, { assignTo: 'rider_1' })), 'OK', 'a second offer to the same rider is allowed (manual)');
  assert.strictEqual((await presenceOf(w, 'rider_1')).status, 'online', 'two offers: still online');

  const picks = [];
  for (let i = 0; i < 3; i += 1) {
    const d = await newDelivery(w);
    picks.push((await w.service.autoAssignDriver(d.id, SELLER)).driver.id);
  }
  // rider_1 carries 2 offers, rider_2 none: rider_2, rider_2 (1 vs 2), then 2 vs 2 falls to the name.
  assert.deepStrictEqual(picks, ['rider_2', 'rider_2', 'rider_1'], 'ranking still prefers the least loaded: the loaded rider is picked only on a tie');
  assert.deepStrictEqual((await w.service.listDrivers(SELLER)).map((r) => [r.id, r.openDeliveries]), [['rider_2', 2], ['rider_1', 3]],
    'three offers on one rider, two on the other: both still listed, the lighter one first');

  // Once the stacked offers are answered the rider is busy and drops off the list: stacking is not busy-ness.
  await w.service.acceptDelivery(first.id, RIDER);
  assert.deepStrictEqual(await listedIds(w), ['rider_2'], 'accepting the first of the stacked offers is what makes the rider busy');
}

async function busyIsReadFromTheDeliveries() {
  // Busy is a fact about the deliveries a rider holds, not only about what their row says, so a row left behind
  // by a crash can never make a loaded rider look free, nor a free rider look loaded for good.
  const w = makeWorld();
  await registerRiders(w, [['rider_1', 'Alain'], ['rider_2', 'Bruno'], ['rider_3', 'Chantal']]);
  const target = await newDelivery(w);

  // rider_1: the row still says "online", but they hold an accepted delivery (set up by hand).
  const held = await newDelivery(w);
  await w.repo.updateWhere(held.id, {}, { status: 'accepted', driverId: 'rider_1', assignedAt: w.clock.iso(), acceptedAt: w.clock.iso() });
  assert.strictEqual((await w.repo.findPresence('rider_1')).status, 'online', 'precondition: the stored row says online');
  assert.strictEqual((await presenceOf(w, 'rider_1')).status, 'busy', 'but the rider is busy: they hold an accepted delivery');
  assert.strictEqual((await rosterById(w)).rider_1.presence, 'busy');
  assert.deepStrictEqual(await listedIds(w), ['rider_2', 'rider_3'], 'and is not offered another');
  await assertRefused('assign to a rider holding an accepted delivery', w.service.assignDriver(target.id, 'rider_1', SELLER), unavailable('busy'));
  assert.notStrictEqual((await w.service.autoAssignDriver(target.id, SELLER)).driver.id, 'rider_1', 'auto-assign does not pick them');
  await w.service.cancelDelivery(target.id, 'test', SELLER);

  // rider_2: the row says busy and nothing is behind it (the claim was written, the delivery change never was).
  await w.repo.transitionPresence('rider_2', ['online'], { status: 'busy', updatedAt: w.clock.iso() });
  assert.strictEqual((await presenceOf(w, 'rider_2')).status, 'busy', 'a rider stored busy is busy until it is put right: the claim is written before the delivery');
  assert.deepStrictEqual(await listedIds(w), ['rider_3'], 'so they are not offered work');
  const next = await newDelivery(w);
  await assertRefused('assign to a rider stored busy', w.service.assignDriver(next.id, 'rider_2', SELLER), unavailable('busy'));
  assert.deepStrictEqual(await w.service.expireStalePresence(), { expired: 0, healed: 0 }, 'the sweep leaves a young busy row alone: it may be a claim in flight');
  w.clock.advance(31 * SECOND); // past the 30 s grace; the hour-long presence window means nobody has expired
  assert.deepStrictEqual(await w.service.expireStalePresence(), { expired: 0, healed: 1 }, 'an old one with nothing behind it is put right (not rider_1, who really holds a delivery)');
  assert.strictEqual((await presenceOf(w, 'rider_2')).status, 'online', 'and the rider is offerable again');
  assert.strictEqual(await outcome(w.service.assignDriver(next.id, 'rider_2', SELLER)), 'OK');
  assert.strictEqual((await presenceOf(w, 'rider_1')).status, 'busy', 'while rider_1 is still, rightly, busy');
}

// ===================================================================================
// 2. ACCEPT / BUSY / ONLINE LIFECYCLE
// ===================================================================================

async function acceptMakesBusy() {
  const w = makeWorld();
  await registerRiders(w);
  const d = await newDelivery(w, { assignTo: 'rider_1' });
  const before = await presenceOf(w, 'rider_1');
  assert.strictEqual(before.status, 'online', 'holding only an offer: online');

  await w.service.acceptDelivery(d.id, RIDER);
  const p = await presenceOf(w, 'rider_1');
  assert.strictEqual(p.status, 'busy', 'accepting makes the rider busy');
  assert.strictEqual(p.available, false);
  assert.strictEqual(p.reason, 'busy');
  const overview = await w.service.getRiderOverview(RIDER);
  assert.strictEqual(overview.presence.status, 'busy', "GET /driver/me carries the same presence");
  assert.strictEqual(overview.presence.available, false);
  assert.strictEqual(overview.deliveries.length, 1);
  assert.strictEqual(overview.deliveries[0].status, 'accepted');
  assert.strictEqual((await w.repo.findPresence('rider_1')).status, 'busy', 'and the stored row says busy');
  assert.strictEqual((await rosterById(w)).rider_1.presence, 'busy', 'the roster too');
  assert.deepStrictEqual(await listedIds(w), ['rider_2'], 'a busy rider is not offered anything');

  const next = await newDelivery(w);
  await assertRefused('assign to a busy rider', w.service.assignDriver(next.id, 'rider_1', SELLER), unavailable('busy'));
  assert.strictEqual((await stored(w, next.id)).status, 'pending_assignment', 'and the refused offer changed nothing');

  // Busy covers the whole trip, not just the moment of accepting.
  await w.service.updateStatus(d.id, 'picked_up', null, RIDER);
  assert.strictEqual((await presenceOf(w, 'rider_1')).status, 'busy', 'picked up: still busy');
  await assertRefused('assign to a rider on the road', w.service.assignDriver(next.id, 'rider_1', SELLER), unavailable('busy'));
  await w.service.updateStatus(d.id, 'arrived', null, RIDER);
  assert.strictEqual((await presenceOf(w, 'rider_1')).status, 'busy', 'arrived: still busy');
  assert.deepStrictEqual(await listedIds(w), ['rider_2']);
}

async function acceptRefusedUnlessHere() {
  // The offer is open (15 minutes) but the rider is not here: the accept is refused with the reason, the
  // delivery stays offered, and the refused claim did not make them busy. The states are reached by writing
  // the row directly: it is what a rider going offline on another device between the tap and the claim looks like.
  const cases = [
    ['offline', async (w) => w.repo.transitionPresence('rider_1', ['online'], { status: 'offline', updatedAt: w.clock.iso() }), 'offline', unavailable('offline')],
    ['paused', async (w) => w.repo.transitionPresence('rider_1', ['online'], { status: 'paused', updatedAt: w.clock.iso() }), 'paused', unavailable('paused')],
    ['stale', async (w) => { w.clock.advance(3 * MIN); }, 'online', unavailable('expired')]
  ];
  for (const [label, makeUnavailable, storedAfter, expected] of cases) {
    const w = makeWorld({ presenceTtlMs: 2 * MIN });
    await registerRiders(w);
    const d = await newDelivery(w, { assignTo: 'rider_1' });
    await makeUnavailable(w);
    notifications.length = 0;
    await assertRefused(`accept while ${label}`, w.service.acceptDelivery(d.id, RIDER), expected);
    const held = await stored(w, d.id);
    assert.strictEqual(held.status, 'assigned', `${label}: the delivery stays offered`);
    assert.strictEqual(held.driverId, 'rider_1', `${label}: still to this rider`);
    assert.strictEqual((await w.repo.findPresence('rider_1')).status, storedAfter, `${label}: the refused accept did not change the rider's presence`);
    assert.strictEqual((await w.repo.listEvents(d.id)).length, 2, `${label}: and wrote nothing to the timeline (created, assigned)`);
    assert.strictEqual(titled('A rider accepted your delivery').length + titled('A rider accepted the delivery').length, 0, `${label}: nobody was told it was accepted`);
    assert.strictEqual(await outcome(w.service.getDelivery(d.id, RIDER)), 'OK', `${label}: and the rider can still see the offer`);
  }

  // A suspended holder is told their account is not active (the existing rule), and the offer stays put.
  const w = makeWorld();
  await registerRiders(w);
  const d = await newDelivery(w, { assignTo: 'rider_1' });
  await w.repo.upsertDriver({ profileId: 'rider_1', name: 'Alain', phone: '+237600000001', status: 'suspended' });
  await assertRefused('accept while suspended', w.service.acceptDelivery(d.id, RIDER), { statusCode: 403, code: 'PERMISSION_DENIED' });
  assert.strictEqual((await stored(w, d.id)).status, 'assigned');
  assert.strictEqual((await w.repo.findPresence('rider_1')).status, 'online', 'and nothing was claimed');
}

async function endingADeliveryFreesTheRider() {
  // ---- delivered
  {
    const w = makeWorld();
    await registerRiders(w);
    const d = await acceptedJob(w, 'rider_1');
    assert.strictEqual((await presenceOf(w, 'rider_1')).status, 'busy');
    await finishDelivery(w, d.id, RIDER);
    assert.strictEqual((await stored(w, d.id)).status, 'delivered');
    assert.strictEqual((await w.service.getRiderOverview(RIDER)).presence.status, 'online', 'delivered: busy -> online (also in GET /driver/me)');
    assert.deepStrictEqual((await w.service.getRiderOverview(RIDER)).deliveries, []);
    await assertOfferableAgain(w, 'rider_1', 'delivered');
  }
  // ---- the rider reports a failed attempt, from the road and from the door
  for (const from of ['picked_up', 'arrived']) {
    const w = makeWorld();
    await registerRiders(w);
    const d = await acceptedJob(w, 'rider_1');
    await w.service.updateStatus(d.id, 'picked_up', null, RIDER);
    if (from === 'arrived') await w.service.updateStatus(d.id, 'arrived', null, RIDER);
    assert.strictEqual((await presenceOf(w, 'rider_1')).status, 'busy', `${from}: busy until it ends`);
    await w.service.updateStatus(d.id, 'failed', 'Customer unreachable', RIDER);
    assert.strictEqual((await stored(w, d.id)).status, 'failed');
    await assertOfferableAgain(w, 'rider_1', `failed from ${from}`);
    // The seller can send the same rider again: the failed job waits for a decision, it does not keep the rider.
    assert.strictEqual(await outcome(w.service.assignDriver(d.id, 'rider_1', SELLER)), 'OK', `failed from ${from}: the seller can re-offer the failed delivery to the same rider`);
  }
  // ---- the rider hands an accepted job back
  {
    const w = makeWorld();
    await registerRiders(w);
    const d = await acceptedJob(w, 'rider_1');
    await w.service.declineDelivery(d.id, RIDER);
    const released = await stored(w, d.id);
    assert.strictEqual(released.status, 'pending_assignment');
    assert.strictEqual(released.driverId, null);
    assert.strictEqual((await lastEvent(w, d.id)).note, 'Rider released the delivery');
    await assertOfferableAgain(w, 'rider_1', 'released');
  }
  // ---- declining a plain offer changes nothing about presence
  {
    const w = makeWorld();
    await registerRiders(w);
    const d = await newDelivery(w, { assignTo: 'rider_1' });
    await w.service.declineDelivery(d.id, RIDER);
    assert.strictEqual((await presenceOf(w, 'rider_1')).status, 'online', 'declining an offer: online before, online after');
    assert.strictEqual((await w.repo.findPresence('rider_1')).status, 'online');
  }
  // ---- the seller cancels
  {
    const w = makeWorld();
    await registerRiders(w);
    const d = await acceptedJob(w, 'rider_1');
    await w.service.cancelDelivery(d.id, 'Customer changed their mind', SELLER);
    assert.strictEqual((await stored(w, d.id)).status, 'cancelled');
    await assertOfferableAgain(w, 'rider_1', 'cancelled by the seller');
  }
  // ---- the order is cancelled
  {
    const w = makeWorld();
    await registerRiders(w);
    const d = await acceptedJob(w, 'rider_1');
    const cancelled = await w.service.cancelForOrder(d.order.id);
    assert.strictEqual(cancelled.status, 'cancelled', 'the order cancellation cancelled the delivery');
    await assertOfferableAgain(w, 'rider_1', 'order cancelled');
  }
  {
    // An order cancelled after pickup cannot take the parcel back from the rider: they stay busy.
    const w = makeWorld();
    await registerRiders(w);
    const d = await acceptedJob(w, 'rider_1');
    await w.service.updateStatus(d.id, 'picked_up', null, RIDER);
    assert.strictEqual(await w.service.cancelForOrder(d.order.id), null, 'a delivery on the road is not cancelled');
    assert.strictEqual((await presenceOf(w, 'rider_1')).status, 'busy', 'so the rider is still busy');
    assert.strictEqual((await stored(w, d.id)).status, 'picked_up');
  }
  // ---- an administrator fails it
  {
    const w = makeWorld();
    await registerRiders(w);
    const d = await acceptedJob(w, 'rider_1');
    await w.service.updateStatus(d.id, 'picked_up', null, RIDER);
    await w.service.resolveDelivery(d.id, { action: 'fail', note: 'Rider unreachable' }, ADMIN);
    assert.strictEqual((await stored(w, d.id)).status, 'failed');
    await assertOfferableAgain(w, 'rider_1', "an administrator's fail");
  }
  {
    // 'unlock' does not end the delivery: the rider stays busy with it.
    const w = makeWorld();
    await registerRiders(w);
    const d = await acceptedJob(w, 'rider_1');
    await w.service.updateStatus(d.id, 'picked_up', null, RIDER);
    await w.service.updateStatus(d.id, 'arrived', null, RIDER);
    await w.repo.updateWhere(d.id, {}, { codeAttempts: MAX_HANDOVER_ATTEMPTS });
    await w.service.resolveDelivery(d.id, { action: 'unlock' }, ADMIN);
    assert.strictEqual((await stored(w, d.id)).status, 'arrived');
    assert.strictEqual((await presenceOf(w, 'rider_1')).status, 'busy', 'unlocking a handover leaves the rider busy');
  }
  // ---- the rider's other deliveries do not free them: two jobs in hand (set up by hand), one ends
  {
    const w = makeWorld();
    await registerRiders(w);
    const first = await acceptedJob(w, 'rider_1');
    const second = await newDelivery(w);
    await w.repo.updateWhere(second.id, {}, { status: 'accepted', driverId: 'rider_1', assignedAt: w.clock.iso(), acceptedAt: w.clock.iso() });
    await finishDelivery(w, first.id, RIDER);
    assert.strictEqual((await presenceOf(w, 'rider_1')).status, 'busy', 'one delivery ended but another accepted one is still in hand: still busy');
    await w.service.declineDelivery(second.id, RIDER);
    await assertOfferableAgain(w, 'rider_1', 'the last accepted delivery handed back');
  }
}

async function silentWhileBusy() {
  const w = makeWorld({ presenceTtlMs: 2 * MIN });
  await registerRiders(w);
  const d = await acceptedJob(w, 'rider_1');
  w.clock.advance(10 * MIN); // nobody beats for ten minutes: five windows

  const p = await presenceOf(w, 'rider_1');
  assert.strictEqual(p.status, 'busy', 'a rider carrying a parcel is not timed out');
  assert.strictEqual((await presenceOf(w, 'rider_2')).status, 'offline', 'while the idle rider who went quiet is offline');
  assert.strictEqual((await presenceOf(w, 'rider_2')).reason, 'expired');
  assert.strictEqual((await rosterById(w)).rider_1.presence, 'busy');
  assert.deepStrictEqual(await w.service.expireStalePresence(), { expired: 1, healed: 0 }, 'the sweep sets only the idle rider offline, and does not call a real busy row "leaked"');
  assert.strictEqual((await w.repo.findPresence('rider_1')).status, 'busy', 'the busy row is untouched');
  assert.strictEqual((await stored(w, d.id)).status, 'accepted', 'and so is the delivery');

  // The app comes back: a heartbeat keeps the busy rider busy and refreshes when they were last heard from.
  const beat = await w.service.riderHeartbeat(RIDER);
  assert.strictEqual(beat.status, 'busy', 'a heartbeat from a busy rider leaves them busy');
  assert.strictEqual(beat.lastSeenAt, w.clock.iso(), 'and records that they are here');
  assert.strictEqual((await w.repo.findPresence('rider_1')).status, 'busy');

  // They finish and are offerable again right after.
  await finishDelivery(w, d.id, RIDER);
  await assertOfferableAgain(w, 'rider_1', 'a busy rider who went quiet and came back');
}

// ===================================================================================
// 3. SIMULTANEOUS ASSIGNMENT
// ===================================================================================

/** The invariants of one rider holding `ids` as offers while several accepts race. */
async function assertOneCarried(w, riderId, ids, results, label) {
  const winners = results.filter((r) => r === 'OK');
  assert.strictEqual(winners.length, 1, `${label}: exactly one accept won, got ${results.join(', ')}`);
  for (const r of results.filter((x) => x !== 'OK')) {
    assert.ok(['RIDER_BUSY:busy', 'NOT_FOUND'].includes(r), `${label}: a loser is refused as busy or finds the offer already withdrawn, not ${r} (${results.join(', ')})`);
  }
  const rows = await Promise.all(ids.map((id) => stored(w, id)));
  assert.deepStrictEqual(rows.map((d) => d.status).sort(), ['accepted', ...Array(ids.length - 1).fill('pending_assignment')].sort(),
    `${label}: one accepted, the rest handed back to their sellers (${rows.map((d) => d.status).join(', ')})`);
  const open = await w.repo.findOpenByDriver(riderId);
  assert.strictEqual(open.filter((d) => ['accepted', 'picked_up', 'arrived'].includes(d.status)).length, 1, `${label}: the rider never holds two accepted deliveries`);
  assert.strictEqual(open.length, 1, `${label}: and holds nothing else`);
  assert.strictEqual((await presenceOf(w, riderId)).status, 'busy', `${label}: presence is busy`);
  assert.strictEqual((await w.repo.findPresence(riderId)).status, 'busy', `${label}: and the stored row is busy`);
  for (const d of rows.filter((x) => x.status === 'pending_assignment')) {
    assert.strictEqual(d.driverId, null, `${label}: a handed-back delivery has no rider`);
    assert.strictEqual((await lastEvent(w, d.id)).note, 'Rider accepted another delivery', `${label}: and says why`);
  }
}

async function simultaneousAccepts() {
  // (a) two deliveries stacked on one rider, accepted at the same instant, under many interleavings
  for (let seed = 1; seed <= 40; seed += 1) {
    const w = makeWorld();
    await registerRiders(w);
    const a = await newDelivery(w, { assignTo: 'rider_1' });
    const b = await newDelivery(w, { assignTo: 'rider_1' });
    jitter(w.repo, seed);
    const order = seed % 2 ? [a, b] : [b, a];
    const results = await Promise.all(order.map((d) => outcome(w.service.acceptDelivery(d.id, RIDER))));
    await assertOneCarried(w, 'rider_1', [a.id, b.id], results, `two accepts, seed ${seed}`);
  }
  // (c) many at once: five offers, one rider
  for (let seed = 1; seed <= 25; seed += 1) {
    const w = makeWorld();
    await registerRiders(w);
    const jobs = [];
    for (let i = 0; i < 5; i += 1) jobs.push(await newDelivery(w, { assignTo: 'rider_1' }));
    jitter(w.repo, seed + 100);
    const results = await Promise.all(jobs.map((d) => outcome(w.service.acceptDelivery(d.id, RIDER))));
    await assertOneCarried(w, 'rider_1', jobs.map((d) => d.id), results, `five accepts, seed ${seed}`);
    const accepted = (await Promise.all(jobs.map((d) => stored(w, d.id)))).filter((d) => d.status === 'accepted');
    assert.strictEqual(accepted.length, 1);
    assert.strictEqual(accepted[0].driverId, 'rider_1');
  }
  // The same race, plain (no jitter): the winner is deterministic, so say who loses and why.
  {
    const w = makeWorld();
    await registerRiders(w);
    const a = await newDelivery(w, { assignTo: 'rider_1' });
    const b = await newDelivery(w, { assignTo: 'rider_1' });
    const results = await Promise.all([outcome(w.service.acceptDelivery(a.id, RIDER)), outcome(w.service.acceptDelivery(b.id, RIDER))]);
    assert.deepStrictEqual(results, ['OK', 'RIDER_BUSY:busy'], 'with no interleaving the first tap wins and the second is a clean 409 RIDER_BUSY');
  }
}

async function simultaneousAssignments() {
  // (b1) two sellers auto-assign at the same moment; one rider online, one offline
  for (let seed = 1; seed <= 25; seed += 1) {
    const w = makeWorld();
    await registerRider(w, 'rider_on', 'Zed'); // sorts last: Alain would win a tie if he were a candidate
    await registerRider(w, 'rider_off', 'Alain');
    await w.service.riderGoOffline(as('rider_off'));
    const one = await newDelivery(w, { seller: SELLER });
    const two = await newDelivery(w, { seller: OTHER_SELLER });
    jitter(w.repo, seed);
    const [r1, r2] = await Promise.all([w.service.autoAssignDriver(one.id, SELLER), w.service.autoAssignDriver(two.id, OTHER_SELLER)]);
    assert.strictEqual(r1.driver.id, 'rider_on', `seed ${seed}: the first seller's delivery went to the rider who is online`);
    assert.strictEqual(r2.driver.id, 'rider_on', `seed ${seed}: so did the second's (offers stack on the only available rider)`);
    assert.strictEqual((await w.repo.findOpenByDriver('rider_off')).length, 0, `seed ${seed}: the offline rider was offered nothing`);
    assert.strictEqual((await w.repo.findPresence('rider_off')).status, 'offline', `seed ${seed}: and is still offline`);
    assert.strictEqual(sentTo('rider_off', 'New delivery assigned').length, 0, `seed ${seed}: and was told nothing`);
  }
  // (b2) the same with two riders online: the picks see each other and spread, never touching the offline one
  for (let seed = 1; seed <= 25; seed += 1) {
    const w = makeWorld();
    await registerRider(w, 'rider_b', 'Bruno');
    await registerRider(w, 'rider_c', 'Chantal');
    await registerRider(w, 'rider_off', 'Alain');
    await w.service.riderGoOffline(as('rider_off'));
    const one = await newDelivery(w, { seller: SELLER });
    const two = await newDelivery(w, { seller: OTHER_SELLER });
    jitter(w.repo, seed + 200);
    const results = await Promise.all([w.service.autoAssignDriver(one.id, SELLER), w.service.autoAssignDriver(two.id, OTHER_SELLER)]);
    assert.deepStrictEqual(results.map((r) => r.driver.id).sort(), ['rider_b', 'rider_c'], `seed ${seed}: one each, and the offline rider (first by name) got none`);
    assert.strictEqual((await w.repo.findOpenByDriver('rider_off')).length, 0, `seed ${seed}: nothing is held by the offline rider`);
  }
  // (b3) the only rider is offline: every concurrent call is refused cleanly, none crashes, nothing is offered
  {
    const w = makeWorld();
    await registerRider(w, 'rider_off', 'Alain');
    await w.service.riderGoOffline(as('rider_off'));
    const jobs = [await newDelivery(w, { seller: SELLER }), await newDelivery(w, { seller: OTHER_SELLER }), await newDelivery(w, { seller: SELLER })];
    const results = await Promise.all(jobs.map((d, i) => outcome(w.service.autoAssignDriver(d.id, i === 1 ? OTHER_SELLER : SELLER))));
    assert.deepStrictEqual(results, ['NO_RIDER_AVAILABLE', 'NO_RIDER_AVAILABLE', 'NO_RIDER_AVAILABLE'], 'three sellers at once, nobody here: three clean 409s');
    for (const d of jobs) assert.strictEqual((await stored(w, d.id)).status, 'pending_assignment', 'and every delivery is left for its seller');
  }
}

async function acceptLosesToTheSeller() {
  // The seller hands the offer to someone else (or cancels it) between the rider's claim and the delivery
  // change. The accept fails, and the claim is GIVEN BACK: the rider is not left "busy" with nothing to do.
  for (const [label, interfere, expectedStatus, expectedHolder] of [
    ['reassigned', (w, d) => w.service.assignDriver(d.id, 'rider_2', SELLER), 'assigned', 'rider_2'],
    ['cancelled', (w, d) => w.service.cancelDelivery(d.id, 'Changed my mind', SELLER), 'cancelled', 'rider_1']
  ]) {
    const w = makeWorld();
    await registerRiders(w);
    const d = await newDelivery(w, { assignTo: 'rider_1' });
    const claim = w.service.presence.claim.bind(w.service.presence);
    w.service.presence.claim = async (id) => {
      const claimed = await claim(id);
      assert.strictEqual(claimed.status, 'busy', 'setup: the claim itself succeeded');
      await interfere(w, d);
      return claimed;
    };
    await assertRefused(`accept that lost to the seller (${label})`, w.service.acceptDelivery(d.id, RIDER), { statusCode: 409, code: 'CONFLICT' });
    delete w.service.presence.claim;
    const after = await stored(w, d.id);
    assert.strictEqual(after.status, expectedStatus, `${label}: the seller's change stands, the delivery was not accepted`);
    assert.strictEqual(after.driverId, expectedHolder, `${label}: and is with ${expectedHolder}`);
    assert.strictEqual((await w.repo.findPresence('rider_1')).status, 'online', `${label}: the claim was given back: the rider is online, not stuck busy`);
    assert.strictEqual((await presenceOf(w, 'rider_1')).available, true);
    assert.ok((await listedIds(w)).includes('rider_1'), `${label}: and can be offered work`);
  }
}

async function acceptRacesGoingOffline() {
  // Accept and "go offline" at the same moment. Whichever way it falls, the rider never ends up holding an
  // accepted delivery while looking available, and there is no half state: offline with nothing, or busy with it.
  const seen = new Set();
  for (let seed = 1; seed <= 40; seed += 1) {
    const w = makeWorld();
    await registerRiders(w);
    const d = await newDelivery(w, { assignTo: 'rider_1' });
    jitter(w.repo, seed + 300);
    const [accepted, wentOffline] = await Promise.all([outcome(w.service.acceptDelivery(d.id, RIDER)), outcome(w.service.riderGoOffline(RIDER))]);
    const row = await stored(w, d.id);
    const p = await presenceOf(w, 'rider_1');
    seen.add(`${accepted}/${wentOffline}`);
    if (row.status === 'accepted') {
      assert.strictEqual(accepted, 'OK', `seed ${seed}: an accepted delivery means the accept succeeded`);
      assert.strictEqual(p.status, 'busy', `seed ${seed}: a rider holding an accepted delivery is busy whatever the row says (${accepted}/${wentOffline})`);
      assert.strictEqual(p.available, false);
    } else {
      assert.strictEqual(row.status, 'pending_assignment', `seed ${seed}: otherwise the offer went back to the seller (${accepted}/${wentOffline})`);
      assert.strictEqual(row.driverId, null);
      assert.strictEqual(wentOffline, 'OK', `seed ${seed}: the delivery only went back because the rider went offline`);
      assert.strictEqual(p.status, 'offline', `seed ${seed}: and they are offline`);
      assert.notStrictEqual(accepted, 'OK', `seed ${seed}: so the accept cannot also have succeeded`);
    }
    assert.ok(!(wentOffline === 'OK' && accepted === 'OK' && p.status === 'online'), `seed ${seed}: never both "went offline" and "accepted" and online`);
  }
  // The seeds must have exercised both orders, or the loop above proved nothing about the race.
  const outcomes = [...seen];
  assert.ok(outcomes.some((o) => o.startsWith('OK/')), `some interleaving let the accept win (saw ${outcomes.join(', ')})`);
  assert.ok(outcomes.some((o) => !o.startsWith('OK/')), `and some let going offline win (saw ${outcomes.join(', ')})`);
}

async function assignRacesGoingOffline() {
  // The seller offers a delivery to a rider at the very moment the rider goes offline. An offer must never be
  // left sitting on a rider who is offline: they cannot accept it, nothing takes it back, and the seller waits
  // out the whole offer window for nobody. Forced here deterministically: the rider goes offline after the
  // seller's availability check and before the offer is written.
  const left = [];
  for (const [label, assign] of [
    ['assignDriver', (w, d) => w.service.assignDriver(d.id, 'rider_1', SELLER)],
    ['autoAssignDriver', (w, d) => w.service.autoAssignDriver(d.id, SELLER)]
  ]) {
    const w = makeWorld();
    await registerRiders(w, [['rider_1', 'Alain']]);
    const d = await newDelivery(w);
    const apply = w.service._applyAssignment.bind(w.service);
    w.service._applyAssignment = async (...args) => {
      await w.service.riderGoOffline(RIDER);
      return apply(...args);
    };
    await caught(assign(w, d));
    delete w.service._applyAssignment;
    const row = await stored(w, d.id);
    const p = await w.service.presence.resolve('rider_1');
    assert.strictEqual(p.status, 'offline', `${label}: the rider did go offline`);
    if (row.status === 'assigned' && row.driverId === 'rider_1') left.push(`${label}: delivery ${row.status} and held by ${row.driverId} while the rider is ${p.status}`);
  }

  // The same window, closed from the other side: the rider ACCEPTS another delivery after the seller's availability
  // check and before the new offer is written. A busy rider must not be left holding an offer: accepting withdrew
  // the offers they held, and this one was not written yet, so nothing will.
  const busyLeft = [];
  for (const [label, assign] of [
    ['assignDriver', (w, d) => w.service.assignDriver(d.id, 'rider_1', SELLER)],
    ['autoAssignDriver', (w, d) => w.service.autoAssignDriver(d.id, SELLER)]
  ]) {
    const w = makeWorld();
    await registerRiders(w, [['rider_1', 'Alain']]);
    const mine = await newDelivery(w, { assignTo: 'rider_1' });
    const late = await newDelivery(w);
    const apply = w.service._applyAssignment.bind(w.service);
    w.service._applyAssignment = async (...args) => {
      await w.service.acceptDelivery(mine.id, RIDER);
      return apply(...args);
    };
    await caught(assign(w, late));
    delete w.service._applyAssignment;
    const row = await stored(w, late.id);
    assert.strictEqual((await presenceOf(w, 'rider_1')).status, 'busy', `${label}: the rider did accept the other delivery`);
    if (row.status === 'assigned' && row.driverId === 'rider_1') busyLeft.push(`${label}: delivery ${row.status} and held by ${row.driverId} while the rider is busy`);
  }
  assert.deepStrictEqual({ offline: left, busy: busyLeft }, { offline: [], busy: [] },
    'an offer must never be left on a rider who is offline (cannot accept it, nothing takes it back before it lapses) or busy (cannot accept it until they finish, and it lapses against them)');
}

// ===================================================================================
// 4. THE RIDER GOES OFFLINE (OR PAUSES) DURING AN OFFER
// ===================================================================================

async function goingOfflineWithAnOffer() {
  for (const { label, act, note, status, back } of [
    {
      label: 'offline', act: (w) => w.service.riderGoOffline(RIDER), note: 'Rider went offline', status: 'offline',
      back: (w) => w.service.riderGoOnline(RIDER)
    },
    {
      label: 'paused', act: (w) => w.service.riderPause(RIDER), note: 'Rider paused availability', status: 'paused',
      back: (w) => w.service.riderResume(RIDER)
    }
  ]) {
    const w = makeWorld();
    await registerRiders(w);
    const d = await newDelivery(w, { assignTo: 'rider_1' });
    const offeredAt = (await stored(w, d.id)).assignedAt;
    assert.ok(offeredAt, 'setup: the offer carries its start time');
    notifications.length = 0;
    w.clock.advance(MIN);

    const result = await act(w);
    assert.strictEqual(result.status, status, `${label}: the call answers with the new presence`);
    assert.strictEqual(result.available, false);

    // The offer went back to the seller, exactly like a decline would, but by the system.
    const row = await stored(w, d.id);
    assert.strictEqual(row.status, 'pending_assignment', `${label}: the offer went back to the seller`);
    assert.strictEqual(row.driverId, null, `${label}: with no rider on it`);
    assert.strictEqual(row.assignedAt, null, `${label}: and no offer clock running`);
    const seller = await w.service.getDelivery(d.id, SELLER);
    assert.strictEqual(seller.status, 'pending_assignment');
    assert.strictEqual(seller.driver, null);
    assert.strictEqual(seller.offerExpiresAt, null);
    const last = await lastEvent(w, d.id);
    assert.strictEqual(last.note, note, `${label}: the timeline says why`);
    assert.strictEqual(last.actorId, 'presence', `${label}: and the actor is the system, not the rider`);
    assert.strictEqual(last.status, 'pending_assignment');
    assert.strictEqual(last.previousStatus, 'assigned');
    assert.strictEqual(sentTo('seller_1', 'A rider is no longer available').length, 1, `${label}: the seller is told, once`);
    assert.strictEqual(sentTo('rider_1', 'A delivery offer expired').length, 0, `${label}: and it is not reported as a lapsed offer`);

    // The rider has not declined anything.
    assert.strictEqual(await outcome(w.service.getDelivery(d.id, RIDER)), 'NOT_FOUND', `${label}: the rider no longer has a stake in it`);
    await back(w);
    const flags = Object.fromEntries((await w.service.listDrivers(SELLER, { deliveryId: d.id })).map((r) => [r.id, r.declined]));
    assert.deepStrictEqual(flags, { rider_1: false, rider_2: false }, `${label}: the rider is not flagged as having declined this delivery`);
    const control = await newDelivery(w, { assignTo: 'rider_1' });
    await w.service.declineDelivery(control.id, RIDER);
    assert.strictEqual(Object.fromEntries((await w.service.listDrivers(SELLER, { deliveryId: control.id })).map((r) => [r.id, r.declined])).rider_1, true,
      `${label}: control: a genuine decline is flagged, so the flag above could have been set`);
  }
}

async function acceptAfterTheOfferWasTakenBack() {
  for (const [label, act, back] of [
    ['offline', (w) => w.service.riderGoOffline(RIDER), (w) => w.service.riderGoOnline(RIDER)],
    ['paused', (w) => w.service.riderPause(RIDER), (w) => w.service.riderResume(RIDER)]
  ]) {
    const w = makeWorld();
    await registerRiders(w);
    const d = await newDelivery(w, { assignTo: 'rider_1' });
    await act(w);

    // Still unavailable: the offer is gone (404), and the failed accept changes nothing.
    const eventsBefore = (await w.repo.listEvents(d.id)).length;
    await assertRefused(`accept after ${label}`, w.service.acceptDelivery(d.id, RIDER), { statusCode: 404, code: 'NOT_FOUND' });
    const row = await stored(w, d.id);
    assert.strictEqual(row.status, 'pending_assignment', `${label}: the delivery is unchanged`);
    assert.strictEqual(row.driverId, null);
    assert.strictEqual((await w.repo.listEvents(d.id)).length, eventsBefore, `${label}: and no timeline row was written`);
    assert.strictEqual((await w.repo.findPresence('rider_1')).status, label, `${label}: the refused accept did not make the rider busy`);

    // The seller cannot offer it to a rider who is not here, but can once they are back.
    await assertRefused(`assign while ${label}`, w.service.assignDriver(d.id, 'rider_1', SELLER), unavailable(label));
    assert.strictEqual((await stored(w, d.id)).status, 'pending_assignment');
    await back(w);
    const again = await w.service.assignDriver(d.id, 'rider_1', SELLER);
    assert.strictEqual(again.status, 'assigned', `${label}: once they are back the seller can offer the same delivery again`);
    assert.strictEqual(again.driver.id, 'rider_1');
    assert.strictEqual(await outcome(w.service.acceptDelivery(d.id, RIDER)), 'OK', `${label}: and the rider can accept it`);
    assert.strictEqual((await presenceOf(w, 'rider_1')).status, 'busy');
  }
  // Auto-assign may pick the same rider again too: going offline was not a decline.
  {
    const w = makeWorld();
    await registerRiders(w, [['rider_1', 'Alain']]);
    const d = await newDelivery(w, { assignTo: 'rider_1' });
    await w.service.riderGoOffline(RIDER);
    await w.service.riderGoOnline(RIDER);
    assert.strictEqual((await w.service.autoAssignDriver(d.id, SELLER)).driver.id, 'rider_1', 'auto-assign offers it to the same rider again: they never passed on it');
    // Control: after a real decline the same call has nobody to offer it to.
    await w.service.declineDelivery(d.id, RIDER);
    await assertRefused('auto-assign after a real decline', w.service.autoAssignDriver(d.id, SELLER), { statusCode: 409, code: 'NO_RIDER_AVAILABLE' });
  }
}

async function everyOfferIsTakenBack() {
  // Three offers from two sellers: all of them go back, each with its own row and its own notification.
  const w = makeWorld();
  await registerRiders(w);
  const a = await newDelivery(w, { assignTo: 'rider_1', seller: SELLER });
  const b = await newDelivery(w, { assignTo: 'rider_1', seller: SELLER });
  const c = await newDelivery(w, { assignTo: 'rider_1', seller: OTHER_SELLER });
  const other = await newDelivery(w, { assignTo: 'rider_2' });
  notifications.length = 0;
  await w.service.riderGoOffline(RIDER);
  for (const d of [a, b, c]) {
    const row = await stored(w, d.id);
    assert.strictEqual(row.status, 'pending_assignment');
    assert.strictEqual(row.driverId, null);
    assert.strictEqual((await lastEvent(w, d.id)).note, 'Rider went offline');
  }
  assert.strictEqual(sentTo('seller_1', 'A rider is no longer available').length, 2, 'seller_1 is told about each of their two offers');
  assert.strictEqual(sentTo('seller_2', 'A rider is no longer available').length, 1, 'and seller_2 about theirs');
  const untouched = await stored(w, other.id);
  assert.strictEqual(untouched.status, 'assigned', "another rider's offer is not touched");
  assert.strictEqual(untouched.driverId, 'rider_2');
  assert.strictEqual((await presenceOf(w, 'rider_2')).status, 'online');

  // Going offline again, with nothing held, is quiet.
  notifications.length = 0;
  assert.strictEqual((await w.service.riderGoOffline(RIDER)).status, 'offline', 'going offline twice is not an error');
  assert.strictEqual(notifications.length, 0, 'and tells nobody anything');
}

async function offlineWhileBusy() {
  for (const [label, act] of [
    ['offline', (w) => w.service.riderGoOffline(RIDER)],
    ['pause', (w) => w.service.riderPause(RIDER)]
  ]) {
    const w = makeWorld();
    await registerRiders(w);
    const d = await acceptedJob(w, 'rider_1');
    // An unanswered offer that reached a busy rider by some other path (set up by hand) must not be taken back by a refused call.
    const extra = await newDelivery(w);
    await w.repo.updateWhere(extra.id, { status: 'pending_assignment' }, { status: 'assigned', driverId: 'rider_1', assignedAt: w.clock.iso() });
    const eventsBefore = (await w.repo.listEvents(d.id)).length;
    notifications.length = 0;

    await assertRefused(`${label} while busy`, act(w), { statusCode: 409, code: 'RIDER_BUSY', reason: 'busy' });
    const held = await stored(w, d.id);
    assert.strictEqual(held.status, 'accepted', `${label}: the accepted delivery is untouched`);
    assert.strictEqual(held.driverId, 'rider_1');
    assert.strictEqual((await w.repo.listEvents(d.id)).length, eventsBefore, `${label}: nothing was written to its timeline`);
    assert.strictEqual((await presenceOf(w, 'rider_1')).status, 'busy', `${label}: the rider is still busy`);
    assert.strictEqual((await w.repo.findPresence('rider_1')).status, 'busy');
    const offer = await stored(w, extra.id);
    assert.strictEqual(offer.status, 'assigned', `${label}: a refused call takes nothing back: the other offer is still the rider's`);
    assert.strictEqual(offer.driverId, 'rider_1');
    assert.strictEqual(notifications.length, 0, `${label}: and nobody is notified`);
  }
}

async function acceptingWithdrawsTheOthers() {
  const w = makeWorld();
  await registerRiders(w, [['rider_1', 'Alain'], ['rider_2', 'Bruno']]);
  const a = await newDelivery(w, { assignTo: 'rider_1' });
  const b = await newDelivery(w, { assignTo: 'rider_1' });
  const c = await newDelivery(w, { assignTo: 'rider_1', seller: OTHER_SELLER });
  notifications.length = 0;

  await w.service.acceptDelivery(a.id, RIDER);
  assert.strictEqual((await stored(w, a.id)).status, 'accepted');
  for (const d of [b, c]) {
    const row = await stored(w, d.id);
    assert.strictEqual(row.status, 'pending_assignment', 'the other offers went back to their sellers');
    assert.strictEqual(row.driverId, null);
    const last = await lastEvent(w, d.id);
    assert.strictEqual(last.note, 'Rider accepted another delivery');
    assert.strictEqual(last.actorId, 'presence', 'by the system');
    assert.strictEqual(last.previousStatus, 'assigned');
  }
  assert.strictEqual(sentTo('seller_1', 'A rider is no longer available').length, 1, 'the seller whose offer was withdrawn is told');
  assert.strictEqual(sentTo('seller_2', 'A rider is no longer available').length, 1, 'and the other one');
  assert.strictEqual(sentTo('seller_1', 'A rider accepted the delivery').length, 1, 'the accepted delivery announced itself once, as before');

  // It does not count as a lapse: no lapse is recorded, the rider is not flagged, and after the delivery
  // ends they rank as before (a tie by name).
  const since = new Date(w.clock.now() - 60 * MIN).toISOString();
  assert.strictEqual((await w.repo.countRecentLapses(since)).size, 0, 'no lapse was recorded');
  await finishDelivery(w, a.id, RIDER);
  const flagged = (await w.service.listDrivers(SELLER, { deliveryId: b.id })).find((r) => r.id === 'rider_1');
  assert.strictEqual(flagged.declined, false, 'the withdrawn offer is not flagged as declined');
  const fresh = await newDelivery(w);
  assert.strictEqual((await w.service.autoAssignDriver(fresh.id, SELLER)).driver.id, 'rider_1', 'rider_1 still wins a tie by name: the withdrawn offers did not count against them');
  assert.strictEqual((await w.service.autoAssignDriver(b.id, SELLER)).driver.id, 'rider_2', 'and the delivery they were taken off is not forced on them: rider_2 is next (load 0 vs 1)');
}

async function lapseControl() {
  // Control for the case above: an offer that REALLY lapses does push the rider behind one who answered, so
  // "no ranking effect" there is something the ranking could have shown.
  const w = makeWorld();
  await registerRiders(w, [['rider_1', 'Alain'], ['rider_2', 'Bruno']]);
  await newDelivery(w, { assignTo: 'rider_1' });
  w.clock.advance(OFFER_TTL_MS + MIN);
  assert.deepStrictEqual(await w.service.expireStaleOffers(), { expired: 1 }, 'setup: the offer lapsed');
  assert.strictEqual((await w.repo.countRecentLapses(new Date(w.clock.now() - 60 * MIN).toISOString())).get('rider_1'), 1);
  const fresh = await newDelivery(w);
  assert.strictEqual((await w.service.autoAssignDriver(fresh.id, SELLER)).driver.id, 'rider_2', 'the rider who let an offer lapse ranks behind the one who did not');
}

// ===================================================================================
// 5. HEARTBEAT EXPIRY
// ===================================================================================

async function heartbeatExpiry() {
  const TTL = 2 * MIN;
  // ---- the boundary, and no sweep needed
  {
    const w = makeWorld({ presenceTtlMs: TTL });
    await registerRiders(w);
    const d = await newDelivery(w, { assignTo: 'rider_1' });
    w.clock.advance(TTL - 1);
    assert.deepStrictEqual(await listedIds(w), ['rider_2', 'rider_1'], '1 ms before the window closes both riders are still online (rider_1 holds an offer, so ranks second)');
    assert.strictEqual((await presenceOf(w, 'rider_1')).status, 'online');
    w.clock.advance(1);
    assert.deepStrictEqual(await listedIds(w), [], 'at exactly the window they are stale: ranking excludes them with no sweep');
    const p = await presenceOf(w, 'rider_1');
    assert.strictEqual(p.status, 'offline');
    assert.strictEqual(p.available, false);
    assert.strictEqual(p.reason, 'expired');
    assert.strictEqual((await w.repo.findPresence('rider_1')).status, 'online', 'nothing was written: the rows still say online, the clock says otherwise');
    assert.strictEqual((await stored(w, d.id)).status, 'assigned', 'and no sweep has taken the offer back yet');
    const next = await newDelivery(w);
    await assertRefused('assign to a rider whose beat is exactly the window old', w.service.assignDriver(next.id, 'rider_1', SELLER), unavailable('expired'));
    await assertRefused('autoAssign with every rider stale', w.service.autoAssignDriver(next.id, SELLER), { statusCode: 409, code: 'NO_RIDER_AVAILABLE' });
  }
  // ---- the sweep sets them offline and takes the offer back
  {
    const w = makeWorld({ presenceTtlMs: TTL });
    await registerRiders(w);
    const d = await newDelivery(w, { assignTo: 'rider_1' });
    w.clock.advance(TTL - 30 * SECOND);
    await w.service.riderHeartbeat(RIDER2); // Bruno's app keeps beating; Alain's does not
    w.clock.advance(31 * SECOND); // Alain: 121 s of silence, Bruno: 31 s
    notifications.length = 0;
    assert.deepStrictEqual(await w.service.expireStalePresence(), { expired: 1, healed: 0 }, 'exactly one rider went silent');
    assert.strictEqual((await w.repo.findPresence('rider_1')).status, 'offline', 'Alain is now stored offline');
    assert.strictEqual((await w.repo.findPresence('rider_2')).status, 'online', 'Bruno is untouched');
    const row = await stored(w, d.id);
    assert.strictEqual(row.status, 'pending_assignment', 'the unanswered offer is back with the seller');
    assert.strictEqual(row.driverId, null);
    const last = await lastEvent(w, d.id);
    assert.strictEqual(last.note, 'Rider stopped responding and was set offline');
    assert.strictEqual(last.actorId, 'presence', 'by the system, not as a decline');
    assert.strictEqual(sentTo('seller_1', 'A rider is no longer available').length, 1, 'the seller is told once');
    assert.deepStrictEqual(await w.service.expireStalePresence(), { expired: 0, healed: 0 }, 'a second sweep finds nothing');
    assert.strictEqual(sentTo('seller_1', 'A rider is no longer available').length, 1, 'and tells nobody again');
    const flags = Object.fromEntries((await w.service.listDrivers(SELLER, { deliveryId: d.id })).map((r) => [r.id, r.declined]));
    assert.deepStrictEqual(flags, { rider_2: false }, 'only the rider who is here is listed, and nobody is flagged as declining');
    assert.strictEqual((await w.service.autoAssignDriver(d.id, SELLER)).driver.id, 'rider_2', 'the delivery goes to the rider who is still here');
    await assertRefused('Alain tries to accept it late', w.service.acceptDelivery(d.id, RIDER), { statusCode: 404, code: 'NOT_FOUND' });
  }
  // ---- a heartbeat that finds the rider already expired sets them offline and takes the offers back
  {
    const w = makeWorld({ presenceTtlMs: TTL });
    await registerRiders(w);
    const d = await newDelivery(w, { assignTo: 'rider_1' });
    w.clock.advance(TTL - SECOND);
    await w.service.riderHeartbeat(RIDER2); // Bruno's app is beating; Alain's is not
    w.clock.advance(SECOND); // Alain: exactly the window since his last beat, so stale
    notifications.length = 0;
    const answer = await w.service.riderHeartbeat(RIDER);
    assert.strictEqual(answer.status, 'offline', 'the heartbeat answers offline: it does not revive an expired rider');
    assert.strictEqual(answer.available, false);
    assert.strictEqual((await w.repo.findPresence('rider_1')).status, 'offline');
    const row = await stored(w, d.id);
    assert.strictEqual(row.status, 'pending_assignment', 'and the offer they never answered went back');
    assert.strictEqual((await lastEvent(w, d.id)).note, 'Rider stopped responding and was set offline');
    assert.strictEqual(sentTo('seller_1', 'A rider is no longer available').length, 1);
    w.clock.advance(10 * SECOND);
    assert.strictEqual((await w.service.riderHeartbeat(RIDER)).status, 'offline', 'a later heartbeat does not bring them back either');
    assert.deepStrictEqual(await listedIds(w), ['rider_2']);
    await w.service.riderGoOnline(RIDER);
    assert.deepStrictEqual(await listedIds(w), ['rider_1', 'rider_2'], 'only going online again does');
  }
  // ---- the heartbeat's own boundary: 1 ms before the window it keeps the rider, at the window it does not
  {
    const w = makeWorld({ presenceTtlMs: TTL });
    await registerRiders(w, [['rider_1', 'Alain']]);
    w.clock.advance(TTL - 1);
    const kept = await w.service.riderHeartbeat(RIDER);
    assert.strictEqual(kept.status, 'online', '1 ms before the window a heartbeat keeps the rider online');
    assert.strictEqual(kept.expiresAt, new Date(w.clock.now() + TTL).toISOString(), 'and moves their deadline a full window on');
    assert.strictEqual(kept.ttlSeconds, 120);
    w.clock.advance(TTL);
    assert.strictEqual((await w.service.riderHeartbeat(RIDER)).status, 'offline', 'a full window later with no beat: offline');
  }
  // ---- accepting has the same boundary: 1 ms before the window the claim succeeds, at the window it is refused
  {
    const fresh = makeWorld({ presenceTtlMs: TTL });
    await registerRiders(fresh, [['rider_1', 'Alain']]);
    const a = await newDelivery(fresh, { assignTo: 'rider_1' });
    fresh.clock.advance(TTL - 1);
    assert.strictEqual(await outcome(fresh.service.acceptDelivery(a.id, RIDER)), 'OK', '1 ms before the window: the rider can still accept');

    const stale = makeWorld({ presenceTtlMs: TTL });
    await registerRiders(stale, [['rider_1', 'Alain']]);
    const b = await newDelivery(stale, { assignTo: 'rider_1' });
    stale.clock.advance(TTL);
    await assertRefused('accept at exactly the window', stale.service.acceptDelivery(b.id, RIDER), unavailable('expired'));
    assert.strictEqual((await stored(stale, b.id)).status, 'assigned', 'and the offer is untouched');
  }
  // ---- a rider who beats every 30 s for an hour stays online, and can accept an offer that has been open all that time
  {
    const w = makeWorld({ presenceTtlMs: TTL, offerTtlMs: 0 });
    await registerRiders(w);
    const d = await newDelivery(w, { assignTo: 'rider_1' });
    for (let i = 1; i <= 120; i += 1) {
      w.clock.advance(30 * SECOND);
      const p = await w.service.riderHeartbeat(RIDER);
      assert.strictEqual(p.status, 'online', `beat ${i}: still online`);
      assert.strictEqual(p.lastSeenAt, w.clock.iso(), `beat ${i}: and it was recorded`);
      if (i % 24 === 0) assert.deepStrictEqual(await listedIds(w), ['rider_1'], `after ${i / 2} minutes only the rider who is beating is listed`);
    }
    assert.deepStrictEqual(await w.service.expireStalePresence(), { expired: 1, healed: 0 }, 'an hour on, the sweep expires only the rider who never beat');
    assert.strictEqual((await presenceOf(w, 'rider_1')).status, 'online', 'the one who beat is still online');
    assert.strictEqual((await presenceOf(w, 'rider_2')).status, 'offline', 'and the one who did not is not');
    assert.strictEqual((await stored(w, d.id)).status, 'assigned', 'their offer is still theirs after an hour (the offer window is off here)');
    assert.strictEqual(await outcome(w.service.acceptDelivery(d.id, RIDER)), 'OK', 'and they can accept it');
  }
}

async function heartbeatWindowIsConfigurable() {
  // The window comes from the option, else RIDER_PRESENCE_TTL_SECONDS, else two minutes; garbage never switches expiry off.
  const previous = process.env.RIDER_PRESENCE_TTL_SECONDS;
  const ttlSecondsOf = async (env, option) => {
    if (env === undefined) delete process.env.RIDER_PRESENCE_TTL_SECONDS; else process.env.RIDER_PRESENCE_TTL_SECONDS = env;
    const repo = new DeliveryRepository({ db: null });
    const service = new DeliveryService({
      repository: repo, orderRepository: new OrderRepository({ db: null }), events: new DeliveryEvents(), now: () => Date.parse('2026-10-03T10:00:00.000Z'),
      ...(option === undefined ? {} : { presenceTtlMs: option })
    });
    await service.registerDriver('rider_1', { name: 'Alain', phone: '+237600000001' }, ADMIN);
    return (await service.riderGoOnline(RIDER)).ttlSeconds;
  };
  try {
    assert.strictEqual(await ttlSecondsOf(undefined), 120, 'unset: two minutes');
    assert.strictEqual(await ttlSecondsOf('45'), 45, 'the environment sets it');
    assert.strictEqual(await ttlSecondsOf('45', 90 * SECOND), 90, 'an explicit option wins over the environment');
    assert.strictEqual(await ttlSecondsOf('0'), 120, 'zero does not switch expiry off');
    assert.strictEqual(await ttlSecondsOf('soon'), 120, 'nor does text');
    assert.strictEqual(await ttlSecondsOf('1'), 15, 'a window shorter than 15 s is raised to 15 s');
    assert.strictEqual(await ttlSecondsOf('999999'), 3600, 'and one longer than an hour is cut to an hour');
  } finally {
    if (previous === undefined) delete process.env.RIDER_PRESENCE_TTL_SECONDS; else process.env.RIDER_PRESENCE_TTL_SECONDS = previous;
  }
}

// ===================================================================================
// 6. DELIVERY GPS vs RIDER PRESENCE
// ===================================================================================

async function gpsAndPresenceAreSeparate() {
  const w = makeWorld({ presenceTtlMs: 2 * MIN });
  await registerRiders(w);
  const HERE = { lat: 4.051123, lng: 9.767945, accuracyM: 12 }; // the rider's availability position
  const PING = { lat: 4.2, lng: 9.9, speedKmh: 20 };              // a delivery GPS point
  await w.service.riderGoOnline(RIDER, HERE);
  const d = await acceptedJob(w, 'rider_1');
  w.clock.advance(20 * SECOND);

  // ---- a GPS ping does not touch presence
  const rowBefore = await w.repo.findPresence('rider_1');
  assert.deepStrictEqual({ lat: rowBefore.latitude, lng: rowBefore.longitude, accuracyM: rowBefore.accuracy }, HERE, 'setup: presence holds the availability position');
  const ping = await w.service.recordLocation(d.id, PING, RIDER);
  assert.strictEqual(ping.accepted, true, 'setup: the GPS ping was taken');
  assert.deepStrictEqual(await w.repo.findPresence('rider_1'), rowBefore, 'the stored presence row is exactly as it was: status, position, lastSeenAt and updatedAt');
  assert.strictEqual((await presenceOf(w, 'rider_1')).lastSeenAt, rowBefore.lastSeenAt, 'a GPS ping is not "I am here": lastSeenAt did not move');
  assert.deepStrictEqual((await presenceOf(w, 'rider_1')).location, HERE, 'and the position shown is still the availability one, not the ping');
  const afterPing = await stored(w, d.id);
  assert.strictEqual(afterPing.lastLocation.lat, PING.lat, 'the ping went where GPS goes: the delivery');
  assert.strictEqual((await w.repo.listLocations(d.id)).length, 1, 'and its trail');

  // ---- a heartbeat does not touch the delivery
  w.clock.advance(20 * SECOND);
  const deliveryBefore = await stored(w, d.id);
  const trailBefore = await w.repo.listLocations(d.id);
  const eventsBefore = await w.repo.listEvents(d.id);
  const beatAt = { lat: 4.3, lng: 9.95, accuracyM: 8 };
  const beat = await w.service.riderHeartbeat(RIDER, beatAt);
  assert.deepStrictEqual(beat.location, beatAt, 'the heartbeat stored its own position');
  assert.strictEqual(beat.lastSeenAt, w.clock.iso(), 'and recorded that the rider is here');
  assert.deepStrictEqual(await stored(w, d.id), deliveryBefore, 'the delivery is byte-for-byte what it was: lastLocation, updatedAt, ETA');
  assert.deepStrictEqual(await w.repo.listLocations(d.id), trailBefore, 'no point was added to the delivery trail');
  assert.deepStrictEqual(await w.repo.listEvents(d.id), eventsBefore, 'and no timeline row');
  w.clock.advance(20 * SECOND);
  assert.strictEqual((await w.service.riderHeartbeat(RIDER)).location, null, 'a heartbeat without a position clears the availability position...');
  assert.deepStrictEqual(await stored(w, d.id), deliveryBefore, '...and still leaves the delivery alone');

  // ---- the two are separate things: another ping leaves the last heartbeat's row as it was
  w.clock.advance(20 * SECOND);
  const rowAfterBeat = await w.repo.findPresence('rider_1');
  assert.strictEqual((await w.service.recordLocation(d.id, { lat: 4.21, lng: 9.91 }, RIDER)).accepted, true);
  assert.deepStrictEqual(await w.repo.findPresence('rider_1'), rowAfterBeat, 'a second ping, a second time: presence unchanged');
  assert.strictEqual((await w.repo.listLocations(d.id)).length, 2, 'while the delivery trail grew');

  // ---- what a seller, a buyer or an administrator is shown never carries the availability position
  await w.service.riderHeartbeat(RIDER, HERE);
  const seen = JSON.stringify([
    await w.service.getDelivery(d.id, SELLER), await w.service.getDelivery(d.id, BUYER), await w.service.getDelivery(d.id, ADMIN),
    await w.service.listDrivers(SELLER), await w.service.listDrivers(ADMIN, { deliveryId: d.id }), await w.service.listRiderRoster(ADMIN),
    await w.service.getDispatchBoard(SELLER)
  ]);
  assert.ok(!seen.includes('4.051123') && !seen.includes('9.767945'), "no seller, buyer or administrator view contains the rider's availability position");
  assert.ok(JSON.stringify(await w.service.getRiderOverview(RIDER)).includes('4.051123'), "control: the rider's own overview does show it, so the search above could have found it");
}

// ===================================================================================
// 7. THE SWEEPER
// ===================================================================================

async function sweeperRunsThePresenceSweep() {
  const w = makeWorld({ presenceTtlMs: 2 * MIN });
  await registerRiders(w);
  const d = await newDelivery(w, { assignTo: 'rider_1' });
  const timers = fakeTimers();
  const sweeper = startOfferSweeper({ service: w.service, ...timers });
  assert.strictEqual(timers.scheduled.length, 1, 'a real service has a presence sweep, so the timer runs');
  assert.strictEqual(timers.scheduled[0].ms, DEFAULT_INTERVAL_MS);
  assert.strictEqual(timers.unrefCalled, true, 'and never keeps the process alive');

  w.clock.advance(90 * SECOND);
  await w.service.riderHeartbeat(RIDER2); // Bruno keeps beating; Alain does not
  const early = await sweeper.tick();
  assert.deepStrictEqual(early.presence, { expired: 0, healed: 0 }, '90 s of 120 s: nobody is silent yet');
  assert.strictEqual((await stored(w, d.id)).status, 'assigned', 'and the offer is left alone');

  w.clock.advance(90 * SECOND); // Alain: three minutes of silence. The 15-minute offer window has not lapsed.
  notifications.length = 0;
  const late = await timers.scheduled[0].fn(); // exactly what the timer calls
  assert.strictEqual(late.expired, 0, 'no offer lapsed: this is not offer expiry');
  assert.deepStrictEqual(late.presence, { expired: 1, healed: 0 }, 'the tick ran the presence sweep: Alain, not Bruno');
  assert.strictEqual((await w.service.getRiderPresence(RIDER)).status, 'offline');
  assert.strictEqual((await w.service.getRiderPresence(RIDER2)).status, 'online');
  const row = await stored(w, d.id);
  assert.strictEqual(row.status, 'pending_assignment', 'his unanswered offer is back with the seller');
  assert.strictEqual((await lastEvent(w, d.id)).note, 'Rider stopped responding and was set offline');
  assert.strictEqual(sentTo('seller_1', 'A rider is no longer available').length, 1);
  const quiet = await sweeper.tick();
  assert.deepStrictEqual(quiet.presence, { expired: 0, healed: 0 }, 'the next tick finds nothing');
  assert.strictEqual(sentTo('seller_1', 'A rider is no longer available').length, 1, 'and tells nobody again');

  // The same tick also puts a leaked busy row right.
  const w2 = makeWorld({ presenceTtlMs: 2 * MIN });
  await registerRiders(w2, [['rider_1', 'Alain']]);
  await w2.repo.transitionPresence('rider_1', ['online'], { status: 'busy', updatedAt: w2.clock.iso() }); // a claim whose delivery change never happened
  const s2 = startOfferSweeper({ service: w2.service, ...fakeTimers() });
  w2.clock.advance(20 * SECOND);
  assert.deepStrictEqual((await s2.tick()).presence, { expired: 0, healed: 0 }, 'a busy row younger than the grace period may be a claim in flight: left alone');
  w2.clock.advance(20 * SECOND);
  assert.deepStrictEqual((await s2.tick()).presence, { expired: 0, healed: 1 }, 'an older one with nothing behind it is put right');
  assert.strictEqual((await w2.service.getRiderPresence(RIDER)).status, 'online');
  sweeper.stop();
  assert.deepStrictEqual(timers.cleared, [timers.scheduled[0]], 'stop() clears the timer');
}

async function sweeperJobsDoNotHideEachOther() {
  // ---- offer expiry and presence in ONE tick, each doing its own work
  {
    const w = makeWorld({ presenceTtlMs: 2 * MIN });
    await registerRiders(w);
    const toBruno = await newDelivery(w, { assignTo: 'rider_2' }); // offered at minute 0, never answered
    for (let m = 1; m <= 14; m += 1) { // both beat for fourteen minutes, then Alain falls silent
      w.clock.advance(MIN);
      await w.service.riderHeartbeat(RIDER);
      await w.service.riderHeartbeat(RIDER2);
    }
    w.clock.advance(MIN); // minute 15: Alain's last beat was a minute ago, so he can still be offered work
    await w.service.riderHeartbeat(RIDER2);
    const toAlain = await newDelivery(w, { assignTo: 'rider_1' });
    w.clock.advance(90 * SECOND); // minute 16.5: Alain silent for 2.5 min; Bruno's offer is 16.5 min old (lapsed); Alain's is 1.5 min old
    await w.service.riderHeartbeat(RIDER2); // Bruno's last beat was 90 s ago: still inside the window
    const sweeper = startOfferSweeper({ service: w.service, ...fakeTimers() });
    const result = await sweeper.tick();
    assert.strictEqual(result.expired, 1, 'one offer lapsed (Bruno never answered his)');
    assert.deepStrictEqual(result.presence, { expired: 1, healed: 0 }, 'and one rider went silent (Alain): both jobs ran in the same tick');
    assert.strictEqual((await lastEvent(w, toBruno.id)).note, 'Offer expired: no response from the rider');
    assert.strictEqual((await lastEvent(w, toAlain.id)).note, 'Rider stopped responding and was set offline');
    assert.strictEqual((await lastEvent(w, toBruno.id)).actorId, 'rider_2', 'a lapse is the rider\'s own silence');
    assert.strictEqual((await lastEvent(w, toAlain.id)).actorId, 'presence', 'a presence withdrawal is not');
  }
  // ---- a failing presence sweep does not hide offer expiry, and is not lost
  {
    const w = makeWorld({ presenceTtlMs: LONG_PRESENCE_MS });
    await registerRiders(w);
    const lapsing = await newDelivery(w, { assignTo: 'rider_1' });
    w.clock.advance(OFFER_TTL_MS + MIN);
    const errors = [];
    const originalError = logger.error;
    logger.error = (m) => errors.push(String(m));
    const real = w.service.expireStalePresence;
    w.service.expireStalePresence = async () => { throw new Error('rider_presence table down'); };
    let result;
    try {
      result = await startOfferSweeper({ service: w.service, ...fakeTimers() }).tick(); // resolves: a timer has nobody to catch a rejection
    } finally {
      logger.error = originalError;
      w.service.expireStalePresence = real;
    }
    assert.strictEqual(result.expired, 1, 'the offer expiry still reported');
    assert.strictEqual(result.presenceFailed, true, 'the presence failure is flagged');
    assert.strictEqual(result.presence, undefined, 'with no half-result');
    assert.ok(errors.some((m) => /presence sweep failed: rider_presence table down/.test(m)), 'and logged with its reason');
    assert.strictEqual((await stored(w, lapsing.id)).status, 'pending_assignment', 'the lapsed offer really was released');
    assert.strictEqual((await lastEvent(w, lapsing.id)).note, 'Offer expired: no response from the rider');
  }
  // ---- a failing offer-expiry job does not hide the presence sweep either
  {
    const w = makeWorld({ presenceTtlMs: 2 * MIN });
    await registerRiders(w);
    const held = await newDelivery(w, { assignTo: 'rider_1' });
    w.clock.advance(3 * MIN); // Alain is silent; the offer (15 min) has not lapsed
    const errors = [];
    const originalError = logger.error;
    logger.error = (m) => errors.push(String(m));
    const real = w.service.expireStaleOffers;
    w.service.expireStaleOffers = async () => { throw new Error('deliveries query timed out'); };
    const sweeper = startOfferSweeper({ service: w.service, ...fakeTimers() });
    let result;
    try {
      result = await sweeper.tick();
    } finally {
      logger.error = originalError;
      w.service.expireStaleOffers = real;
    }
    assert.ok(errors.some((m) => /deliveries query timed out/.test(m)), 'the offer-expiry failure is logged with its reason');
    assert.strictEqual((await w.repo.findPresence('rider_1')).status, 'offline',
      `a failing offer-expiry job must not stop the presence sweep: Alain is still stored "online" after the tick (${JSON.stringify(result)})`);
    assert.strictEqual((await stored(w, held.id)).status, 'pending_assignment', 'and his offer was taken back');
    // The next tick, with offer expiry working again, runs normally.
    assert.strictEqual((await sweeper.tick()).failed, undefined, 'and the next tick is not wedged');
  }
}

// ===================================================================================
// 8. SUSPENSION AND DELETION
// ===================================================================================

async function suspension() {
  const w = makeWorld();
  await registerRiders(w, [['rider_1', 'Alain'], ['rider_2', 'Bruno'], ['rider_3', 'Chantal'], ['rider_4', 'Dora']]);
  const phone = { rider_1: '+237600000001', rider_2: '+237600000002', rider_3: '+237600000003' };
  const suspend = (id, name) => w.service.registerDriver(id, { name, phone: phone[id], status: 'suspended' }, ADMIN);
  const offered = await newDelivery(w, { assignTo: 'rider_1' });        // rider_1: an unanswered offer
  const accepted = await acceptedJob(w, 'rider_2');                       // rider_2: accepted, not started
  const onTheRoad = await acceptedJob(w, 'rider_3');                      // rider_3: parcel in hand
  await w.service.updateStatus(onTheRoad.id, 'picked_up', null, as('rider_3'));
  notifications.length = 0;

  for (const [id, name] of [['rider_1', 'Alain'], ['rider_2', 'Bruno'], ['rider_3', 'Chantal']]) await suspend(id, name);

  // ---- the row is forced offline, whatever the rider was doing
  for (const id of ['rider_1', 'rider_2', 'rider_3']) {
    assert.strictEqual((await w.repo.findPresence(id)).status, 'offline', `${id}: suspending forced the stored row offline`);
    assert.strictEqual((await w.repo.findPresence(id)).latitude, null, `${id}: and cleared their position`);
    await assertRefused(`${id} presence`, w.service.getRiderPresence(as(id)), { statusCode: 403, code: 'PERMISSION_DENIED' });
    await assertRefused(`${id} go online`, w.service.riderGoOnline(as(id)), { statusCode: 403, code: 'PERMISSION_DENIED' });
    await assertRefused(`${id} heartbeat`, w.service.riderHeartbeat(as(id)), { statusCode: 403, code: 'PERMISSION_DENIED' });
    assert.strictEqual((await rosterById(w))[id].presence, 'suspended', `${id}: the roster shows suspended`);
  }
  assert.deepStrictEqual(await listedIds(w), ['rider_4'], 'only the rider who was not suspended can be offered work');

  // ---- un-started work is released, a parcel in hand is not
  for (const [d, note] of [[offered, 'Rider suspended'], [accepted, 'Rider suspended']]) {
    const row = await stored(w, d.id);
    assert.strictEqual(row.status, 'pending_assignment', 'an un-started delivery went back to its seller');
    assert.strictEqual(row.driverId, null);
    assert.strictEqual((await lastEvent(w, d.id)).note, note);
  }
  assert.strictEqual(sentTo('seller_1', 'A rider is no longer available').length, 2, 'the seller is told about both');
  const road = await stored(w, onTheRoad.id);
  assert.strictEqual(road.status, 'picked_up', 'a parcel already on the road is not quietly reassigned');
  assert.strictEqual(road.driverId, 'rider_3');
  assert.strictEqual(sentTo('seller_1', 'A rider in the middle of a delivery was suspended').length, 1, 'but the seller is told');
  await assertRefused('assign to a suspended rider', w.service.assignDriver(offered.id, 'rider_1', SELLER), { statusCode: 400, code: 'VALIDATION_ERROR' });
  assert.strictEqual((await w.service.autoAssignDriver(offered.id, SELLER)).driver.id, 'rider_4', 'auto-assign goes to the rider who is here');

  // ---- an administrator fails the parcel on the road: the suspended rider is not raised
  await w.service.resolveDelivery(onTheRoad.id, { action: 'fail', note: 'Rider suspended mid-delivery' }, ADMIN);
  assert.strictEqual((await stored(w, onTheRoad.id)).status, 'failed');
  assert.strictEqual((await w.repo.findPresence('rider_3')).status, 'offline', "ending the delivery does not put a suspended rider back online");
  assert.strictEqual((await rosterById(w)).rider_3.presence, 'suspended');

  // ---- reactivation: the administrator's act does not put them online; only the rider can
  await w.service.registerDriver('rider_1', { name: 'Alain', phone: phone.rider_1, status: 'active' }, ADMIN);
  await w.service.registerDriver('rider_2', { name: 'Bruno', phone: phone.rider_2, status: 'active' }, ADMIN);
  for (const id of ['rider_1', 'rider_2']) {
    const p = await presenceOf(w, id);
    assert.strictEqual(p.status, 'offline', `${id}: reactivated, but offline (not online, and not stuck busy)`);
    assert.strictEqual(p.available, false);
    assert.ok(!(await listedIds(w)).includes(id), `${id}: not offerable`);
    assert.strictEqual((await w.service.riderHeartbeat(as(id))).status, 'offline', `${id}: and a heartbeat does not revive them`);
  }
  const next = await newDelivery(w);
  await assertRefused('assign to a reactivated rider who is offline', w.service.assignDriver(next.id, 'rider_2', SELLER), unavailable('offline'));
  assert.strictEqual((await w.service.riderGoOnline(as('rider_2'))).status, 'online', 'they come back by going online themselves');
  assert.ok((await listedIds(w)).includes('rider_2'));
  await assertOfferableAgain(w, 'rider_2', 'reactivated, then online');

  // ---- editing a rider's name or phone does not change their presence
  await w.service.registerDriver('rider_4', { name: 'Dora Ndi', phone: '+237600000004' }, ADMIN);
  assert.strictEqual((await presenceOf(w, 'rider_4')).status, 'online', 'an online rider stays online when an administrator edits their name');
  await w.service.riderGoOffline(as('rider_4'));
  await w.service.registerDriver('rider_4', { name: 'Dora N.', phone: '+237600000004' }, ADMIN);
  assert.strictEqual((await presenceOf(w, 'rider_4')).status, 'offline', 'and an offline one stays offline');

  // ---- suspending a rider who never opened the app, and one suspended straight in the table
  await registerRider(w, 'rider_5', 'Elise', { online: false });
  await w.service.registerDriver('rider_5', { name: 'Elise', phone: '+237600000005', status: 'suspended' }, ADMIN);
  assert.strictEqual((await rosterById(w)).rider_5.presence, 'suspended', 'a rider with no presence row can be suspended');
  await registerRider(w, 'rider_6', 'Fanny');
  await w.repo.upsertDriver({ profileId: 'rider_6', name: 'Fanny', phone: '+237600000006', status: 'suspended' });
  assert.strictEqual((await w.repo.findPresence('rider_6')).status, 'online', 'precondition: the stored row was never touched');
  assert.ok(!(await listedIds(w)).includes('rider_6'), 'a suspension written straight to the table still wins over the row: not listed');
  assert.strictEqual((await rosterById(w)).rider_6.presence, 'suspended');
  const direct = await newDelivery(w);
  await assertRefused('assign to the rider suspended in the table', w.service.assignDriver(direct.id, 'rider_6', SELLER), { statusCode: 400, code: 'VALIDATION_ERROR' });
  assert.strictEqual((await w.service.autoAssignDriver(direct.id, SELLER)).driver.id, 'rider_2',
    'and auto-assign never picks them: it goes to rider_2, the only rider who is online');
}

async function accountDeletion() {
  const w = makeWorld();
  await registerRiders(w, [['rider_1', 'Alain'], ['rider_2', 'Bruno']]);
  const offered = await newDelivery(w, { assignTo: 'rider_1' });
  notifications.length = 0;

  await w.service.onAccountDeleted('rider_1');
  assert.strictEqual((await w.repo.findPresence('rider_1')).status, 'offline', 'the stored row is forced offline');
  assert.strictEqual((await w.repo.findPresence('rider_1')).latitude, null);
  const row = await stored(w, offered.id);
  assert.strictEqual(row.status, 'pending_assignment', 'their un-started delivery went back to the seller');
  assert.strictEqual(row.driverId, null);
  assert.strictEqual((await lastEvent(w, offered.id)).note, 'Rider account deleted');
  assert.strictEqual(sentTo('seller_1', 'A rider is no longer available').length, 1);
  for (const [label, call] of [
    ['presence', () => w.service.getRiderPresence(RIDER)],
    ['go online', () => w.service.riderGoOnline(RIDER)],
    ['resume', () => w.service.riderResume(RIDER)],
    ['heartbeat', () => w.service.riderHeartbeat(RIDER)]
  ]) {
    await assertRefused(`deleted rider: ${label}`, call(), { statusCode: 403, code: 'PERMISSION_DENIED' });
  }
  const roster = await rosterById(w);
  assert.strictEqual(roster.rider_1.presence, 'suspended', 'the deleted rider is suspended in the roster');
  assert.strictEqual(roster.rider_1.name, 'Anonymized Rider', 'and their name is scrubbed');
  assert.deepStrictEqual(await listedIds(w), ['rider_2'], 'and is never offered work');
  await assertRefused('assign to the deleted rider', w.service.assignDriver(offered.id, 'rider_1', SELLER), { statusCode: 400, code: 'VALIDATION_ERROR' });

  // Deleting an account that was busy leaves the row offline, not "busy" for ever.
  const w2 = makeWorld();
  await registerRiders(w2, [['rider_1', 'Alain']]);
  const accepted = await acceptedJob(w2, 'rider_1');
  await w2.service.onAccountDeleted('rider_1');
  assert.strictEqual((await w2.repo.findPresence('rider_1')).status, 'offline', 'a busy rider whose account is deleted is offline');
  assert.strictEqual((await stored(w2, accepted.id)).status, 'pending_assignment', 'and the accepted delivery they had not started went back to the seller');
  // Deleting an account that is not a rider at all does nothing, and creates no presence row.
  await w2.service.onAccountDeleted('stranger_1');
  await w2.service.onAccountDeleted(null);
  assert.strictEqual(await w2.repo.findPresence('stranger_1'), null, 'no presence row appears for a non-rider');
}

// ===================================================================================
// 9. ONLY THE RIDER CAN CHANGE THEIR PRESENCE
// ===================================================================================

async function onlyTheRiderActs() {
  const w = makeWorld();
  await registerRiders(w);
  const stranger = as('nobody_1');
  const calls = [
    ['getRiderPresence', (c) => w.service.getRiderPresence(c)],
    ['riderGoOnline', (c) => w.service.riderGoOnline(c)],
    ['riderGoOffline', (c) => w.service.riderGoOffline(c)],
    ['riderPause', (c) => w.service.riderPause(c)],
    ['riderResume', (c) => w.service.riderResume(c)],
    ['riderHeartbeat', (c) => w.service.riderHeartbeat(c)]
  ];
  // Who is not a rider is refused, whatever else they are: a customer, a seller, an administrator.
  for (const caller of [stranger, BUYER, SELLER, ADMIN, as('someone', 'super_admin')]) {
    for (const [name, call] of calls) {
      const e = await assertRefused(`${name} as ${caller.userId}`, call(caller), { statusCode: 403, code: 'PERMISSION_DENIED' });
      assert.strictEqual(e.message, 'You are not a registered rider.', `${name} as ${caller.userId}: says so`);
    }
    assert.strictEqual(await w.repo.findPresence(caller.userId), null, `${caller.userId}: and no presence row was created for them`);
  }
  // No identity at all is refused too.
  for (const [name, call] of calls) {
    await assertRefused(`${name} with no identity`, call({ userRole: 'customer' }), { statusCode: 403, code: 'PERMISSION_DENIED' });
  }

  // A request cannot name another rider or a status: the call acts on the caller and nothing else.
  const rider2Before = await w.repo.findPresence('rider_2');
  await w.service.riderGoOffline(RIDER);
  await w.service.riderGoOnline(RIDER, { riderId: 'rider_2', driverId: 'rider_2', status: 'offline', lat: 4.05, lng: 9.76 });
  await w.service.riderHeartbeat(RIDER, { riderId: 'rider_2', status: 'offline' });
  await w.service.riderPause(RIDER);
  await w.service.riderResume(RIDER, { riderId: 'rider_2', status: 'offline' });
  assert.deepStrictEqual(await w.repo.findPresence('rider_2'), rider2Before, "none of rider_1's calls changed rider_2's row");
  assert.strictEqual((await presenceOf(w, 'rider_2')).status, 'online');
  assert.strictEqual((await presenceOf(w, 'rider_1')).status, 'online', 'and each acted on rider_1, as the caller');

  // A rider cannot answer someone else's offer, nor use it to become busy.
  const d = await newDelivery(w, { assignTo: 'rider_2' });
  await assertRefused('rider_1 accepts an offer made to rider_2', w.service.acceptDelivery(d.id, RIDER), { statusCode: 404, code: 'NOT_FOUND' });
  const row = await stored(w, d.id);
  assert.strictEqual(row.status, 'assigned');
  assert.strictEqual(row.driverId, 'rider_2');
  assert.strictEqual((await presenceOf(w, 'rider_1')).status, 'online', 'the failed accept did not make rider_1 busy');
  assert.strictEqual((await presenceOf(w, 'rider_2')).status, 'online', "and did not touch rider_2's presence");
  await assertRefused('rider_1 declines it', w.service.declineDelivery(d.id, RIDER), { statusCode: 404, code: 'NOT_FOUND' });
  assert.strictEqual((await stored(w, d.id)).driverId, 'rider_2', 'the offer is still rider_2\'s');

}

// ===================================================================================

async function run() {
  console.log('  Testing Rider presence in dispatch...');

  const hadSecret = config.supabase.jwtSecret;
  if (!hadSecret) config.supabase.jwtSecret = 'unit-test-delivery-secret-0123456789abcdef';

  // Keep the suite pure: no notification rows, whatever the machine's credentials; and a quiet log.
  const NotificationService = require('../../server/modules/identity/application/NotificationService');
  const originalCreate = NotificationService.create;
  NotificationService.create = async (userId, payload) => { notifications.push({ userId, ...payload }); return null; };
  const originals = { info: logger.info, warn: logger.warn, error: logger.error };
  logger.info = () => {};
  logger.warn = () => {};
  logger.error = () => {};

  const failures = [];
  const section = async (title, fn) => {
    notifications.length = 0;
    try {
      await fn();
    } catch (err) {
      failures.push({ title, err });
    }
  };

  try {
    await section('1. eligibility: who dispatch may choose from', eligibility);
    await section('1. eligibility: offers stack, ranking prefers the least loaded', eligibilityStacking);
    await section('1. busy is read from the deliveries, not only from the row', busyIsReadFromTheDeliveries);
    await section('2. accepting makes the rider busy, for the whole trip', acceptMakesBusy);
    await section('2. accept is refused unless the rider is here', acceptRefusedUnlessHere);
    await section('2. every way a delivery ends frees the rider', endingADeliveryFreesTheRider);
    await section('2. a busy rider who goes quiet is not timed out', silentWhileBusy);
    await section('3. simultaneous accepts: one rider, one carried delivery', simultaneousAccepts);
    await section('3. simultaneous assignments never reach an offline rider', simultaneousAssignments);
    await section('3. an accept that loses to the seller gives the claim back', acceptLosesToTheSeller);
    await section('3. accept racing go-offline never leaves a half state', acceptRacesGoingOffline);
    await section('3. an offer racing go-offline is not left on the offline rider', assignRacesGoingOffline);
    await section('4. a rider going offline or pausing with offers', goingOfflineWithAnOffer);
    await section('4. accepting after the offer was taken back; offering again after', acceptAfterTheOfferWasTakenBack);
    await section('4. every offer is taken back, each with its notification', everyOfferIsTakenBack);
    await section('4. offline or pause while busy is refused and touches nothing', offlineWhileBusy);
    await section('4. accepting one offer withdraws the others without a lapse', acceptingWithdrawsTheOthers);
    await section('4. control: a real lapse does push a rider down the ranking', lapseControl);
    await section('5. heartbeat expiry: boundary, sweep, heartbeat, an hour of beats', heartbeatExpiry);
    await section('5. the heartbeat window is configurable', heartbeatWindowIsConfigurable);
    await section('6. GPS and presence are stored and shown separately', gpsAndPresenceAreSeparate);
    await section('7. the sweeper runs the presence sweep', sweeperRunsThePresenceSweep);
    await section('7. the sweeper jobs do not hide each other', sweeperJobsDoNotHideEachOther);
    await section('8. suspension', suspension);
    await section('8. account deletion', accountDeletion);
    await section('9. only the rider acts on their own presence', onlyTheRiderActs);
  } finally {
    NotificationService.create = originalCreate;
    logger.info = originals.info;
    logger.warn = originals.warn;
    logger.error = originals.error;
    if (!hadSecret) config.supabase.jwtSecret = hadSecret;
  }

  if (failures.length > 0) {
    for (const { title, err } of failures) console.error(`    ✗ ${title}\n${err && err.stack ? err.stack : err}`);
    throw new Error(`rider_presence_dispatch: ${failures.length} section(s) failed:\n${failures.map(({ title, err }) => `  - ${title}: ${String(err && err.message).split('\n')[0]}`).join('\n')}`);
  }
  console.log('    ✓ Rider presence in dispatch: eligibility, lifecycle, races, offline offers, expiry, GPS, sweeper, suspension and authority hold.');
}

module.exports = { run };
