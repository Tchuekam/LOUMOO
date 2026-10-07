/**
 * LOUMOO — Rider presence: the races, pinned
 * ---------------------------------------------------------------------------
 * Each section here pins a race or defect that was found in rider presence and fixed.
 * They are forced, not hoped for: a repository method is wrapped so that a SECOND
 * operation runs at an exact await point of the first (between a check and the write
 * that depends on it), and the outcome is asserted. No sleeps, no random seeds, no real
 * timers; the clock is fake and every case is deterministic.
 *
 * Every section states the behaviour it replaces and would fail against it:
 *
 *   1  go offline / pause racing an accept   the write used to cover a row stored busy, so a
 *                                            rider could end up offline or paused while
 *                                            carrying a delivery they had just accepted
 *   2  go online racing a claim              going online overwrote a fresh busy claim with
 *                                            online, so a second accept got through (one
 *                                            rider, two accepted deliveries); a leaked busy
 *                                            row is put right only once it is older than 30 s
 *   3  an offer racing the rider leaving     availability was checked BEFORE the offer was
 *                                            written, so a rider who left in the gap held an
 *                                            offer nothing ever took back; auto-assign failed
 *                                            instead of trying the next rider
 *   4  a busy rider who went quiet           finished by the rider themselves they came back
 *                                            already expired; finished by someone else they
 *                                            must not be revived by an act that proves nothing
 *   5  account standing                      claim() and availableRiderIds() trusted the caller
 *                                            to have filtered out a suspended rider
 *   6  expiresAt                             a busy rider was shown a heartbeat deadline
 *   7  the sweeper                           a failing offer-expiry query skipped the presence
 *                                            sweep and the reminders in the same tick
 *   8  roster and job list                   presence that cannot be read failed the whole
 *                                            admin roster / the rider's own job list
 *   9  the heartbeat                         every beat re-read the rider's presence and open
 *                                            deliveries after writing
 *
 * Every section runs even when an earlier one fails; the failures are reported together at
 * the end, each under its section's name.
 */

require('../setup');

const assert = require('assert');
const config = require('../../server/config/env');
const logger = require('../../server/shared/logging/logger');

const { DeliveryService } = require('../../server/modules/delivery/application/DeliveryService');
const { DeliveryRepository } = require('../../server/modules/delivery/infrastructure/DeliveryRepository');
const { DeliveryEvents } = require('../../server/modules/delivery/infrastructure/DeliveryEvents');
const { startOfferSweeper } = require('../../server/modules/delivery/infrastructure/OfferSweeper');
const { PRESENCE_CLAIM_GRACE_MS, PRESENCE_MIN_WRITE_INTERVAL_MS, RiderUnavailableError } = require('../../server/modules/delivery/domain/RiderPresence');
const { OrderRepository } = require('../../server/modules/commerce/infrastructure/OrderRepository');
const { Order, FULFILLMENT_STATUS, DELIVERY_METHOD, PAYMENT_STATUS } = require('../../server/modules/commerce/domain/Order');

const SECOND = 1000;
const MIN = 60 * SECOND;
const OFFER_TTL_MS = 15 * MIN;
const LONG_PRESENCE_MS = 60 * MIN; // the longest the service allows: nobody expires unless a case is about expiry

const BUYER = { userId: 'buyer_1', userRole: 'customer' };
const SELLER = { userId: 'seller_1', userRole: 'seller' };
const ADMIN = { userId: 'admin_1', userRole: 'admin' };
const as = (id, role = 'customer') => ({ userId: id, userRole: role });
const RIDER = as('rider_1');

// What the contract says each timeline note reads. Literal on purpose: a reworded note is a contract change.
const NOTE = {
  offline: 'Rider went offline',
  paused: 'Rider paused availability',
  expired: 'Rider stopped responding and was set offline',
  busy: 'Rider accepted another delivery'
};

// ------------------------------------------------------------------- scaffolding

const notifications = [];
const sentTo = (userId, title) => notifications.filter((n) => n.userId === userId && n.title === title);
const logged = { warn: [], error: [] };

async function caught(promise) {
  try {
    await promise;
    return null;
  } catch (e) {
    return e;
  }
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
    items: [{ listingId: `lst_pr${orderSeq}`, title: 'Phone', unitPriceXaf: 50000, quantity: 1, sellerId, storeName: 'Tech Shop' }],
    shippingAddress: { fullName: 'Awa Njoya', phone: '+237622222222', street: 'Rue 1', city: 'Douala' },
    deliveryMethod: DELIVERY_METHOD.HOME_DELIVERY,
    paymentStatus: PAYMENT_STATUS.PAID,
    fulfillmentStatus: FULFILLMENT_STATUS.PROCESSING,
    ...overrides
  }));
}

/** A delivery for a fresh order, optionally already offered to a rider by the seller. */
async function newDelivery(world, { assignTo = null } = {}) {
  const order = await placeOrder(world, { sellerId: SELLER.userId });
  const created = await world.service.createDelivery(order.id, SELLER, {});
  if (assignTo) await world.service.assignDriver(created.id, assignTo, SELLER);
  return { order, id: created.id };
}

let phoneSeq = 0;
/** An administrator registers a rider; unless `online: false` the rider then opens the app and goes online. */
async function registerRider(world, id, name, { online = true } = {}) {
  phoneSeq += 1;
  await world.service.registerDriver(id, { name, phone: `+23760002${String(phoneSeq).padStart(4, '0')}` }, ADMIN);
  if (online) await world.service.riderGoOnline(as(id));
}

const ALAIN_AND_BRUNO = [['rider_1', 'Alain'], ['rider_2', 'Bruno']];
async function registerRiders(world, riders = ALAIN_AND_BRUNO) {
  for (const [id, name] of riders) await registerRider(world, id, name);
}

/** A delivery offered to the rider and accepted: the rider is now busy. */
async function acceptedJob(world, riderId) {
  const d = await newDelivery(world, { assignTo: riderId });
  await world.service.acceptDelivery(d.id, as(riderId));
  return d;
}

const stored = (w, deliveryId) => w.repo.findById(deliveryId);
const presenceOf = (w, riderId) => w.service.getRiderPresence(as(riderId));
const listedIds = async (w) => (await w.service.listDrivers(SELLER)).map((r) => r.id);

/** A delivery's timeline as `{ status, previousStatus, actorId, note }`, oldest first. */
async function timeline(w, deliveryId) {
  return (await w.repo.listEvents(deliveryId)).map((e) => ({ status: e.status, previousStatus: e.previousStatus, actorId: e.actorId, note: e.note }));
}

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
}

/**
 * Wraps `target[method]` so that, the first `times` calls for which `when(args)` is true, `before(args)`
 * is awaited BEFORE the real call runs: another operation lands at that exact await point. Calls the hook
 * itself makes pass straight through (the count is taken before the hook runs). `fired` says how many
 * times it ran, so a case can assert that its interleaving was really reached instead of passing vacuously.
 */
function interleave(target, method, { when = () => true, before = null, times = 1 } = {}) {
  const had = Object.prototype.hasOwnProperty.call(target, method);
  const original = target[method];
  const race = {
    fired: 0,
    restore() { if (had) target[method] = original; else delete target[method]; }
  };
  target[method] = async function interleaved(...args) {
    if (race.fired < times && when(args)) {
      race.fired += 1;
      if (before) await before(args);
    }
    return original.apply(this, args);
  };
  return race;
}

/** `interleave`, restored when `body` finishes (or throws). Returns the race, for its `fired` count. */
async function withRace(target, method, options, body) {
  const race = interleave(target, method, options);
  try {
    await body(race);
  } finally {
    race.restore();
  }
  return race;
}

/** Counts every call made to the repository's methods, by name. */
function countCalls(repo) {
  const counts = {};
  const proto = Object.getPrototypeOf(repo);
  for (const name of Object.getOwnPropertyNames(proto)) {
    const descriptor = Object.getOwnPropertyDescriptor(proto, name);
    if (name === 'constructor' || !descriptor || typeof descriptor.value !== 'function') continue;
    const original = repo[name];
    repo[name] = function counted(...args) {
      counts[name] = (counts[name] || 0) + 1;
      return original.apply(this, args);
    };
  }
  return { counts, reset() { for (const k of Object.keys(counts)) delete counts[k]; } };
}

/** A fake timer API, so the real sweeper runs with no real timer. */
function fakeTimers() {
  return {
    setIntervalFn: (fn, ms) => ({ fn, ms, unref() {} }),
    clearIntervalFn: () => {}
  };
}

// ===================================================================================
// 1. A RIDER LEAVES WHILE AN ACCEPT LANDS
// ===================================================================================

/**
 * `act` is the rider going offline / pausing. The rider has an offer, and their accept lands AFTER the
 * service decided they carry nothing and BEFORE its write: the write must not apply.
 */
async function leavingRacingAnAccept({ label, writes, act }) {
  // Control: with no accept in the way the same call works, and takes the unanswered offer back. Without
  // this the refusal below could be a general refusal rather than the race.
  {
    const w = makeWorld();
    await registerRiders(w, [['rider_1', 'Alain']]);
    const offer = await newDelivery(w, { assignTo: 'rider_1' });
    const p = await act(w);
    assert.strictEqual(p.status, writes, `${label} control: with no accept in the way the rider is ${writes}`);
    assert.strictEqual((await w.repo.findPresence('rider_1')).status, writes, `${label} control: and so is the stored row`);
    assert.strictEqual((await stored(w, offer.id)).status, 'pending_assignment', `${label} control: and the offer they had not answered went back to the seller`);
  }

  const w = makeWorld();
  await registerRiders(w, [['rider_1', 'Alain']]);
  const offer = await newDelivery(w, { assignTo: 'rider_1' });
  w.clock.advance(10 * SECOND);
  notifications.length = 0;

  const race = await withRace(w.repo, 'transitionPresence', {
    when: ([, , patch]) => patch.status === writes,                 // the write that would take them out of availability
    before: () => w.service.acceptDelivery(offer.id, RIDER)         // ... and the accept lands first
  }, async () => {
    await assertRefused(`${label} racing an accept`, act(w), unavailable('busy'));
  });
  assert.strictEqual(race.fired, 1, `${label}: the accept really landed between the busy check and the write`);

  const row = await w.repo.findPresence('rider_1');
  assert.strictEqual(row.status, 'busy', `${label}: the stored row is still busy: the ${writes} write did not apply over the claim`);
  const delivery = await stored(w, offer.id);
  assert.strictEqual(delivery.status, 'accepted', `${label}: the delivery stays accepted`);
  assert.strictEqual(delivery.driverId, 'rider_1', `${label}: and with the rider`);
  const p = await presenceOf(w, 'rider_1');
  assert.strictEqual(p.status, 'busy', `${label}: the rider reads busy`);
  assert.strictEqual(p.available, false);
  assert.deepStrictEqual((await timeline(w, offer.id)).map((e) => e.note), ['Delivery created', 'Assigned to Alain', 'Rider accepted'],
    `${label}: nothing was withdrawn: the timeline is the offer and the accept, with no "${NOTE[writes]}" row`);
  assert.strictEqual(sentTo('seller_1', 'A rider is no longer available').length, 0, `${label}: and the seller was not told a rider left`);

  // The proof that it was not merely read as busy: when the rider hands the parcel back they are an online
  // rider again. A row left stored offline / paused (the `writes` status) would stay that way (nothing
  // raises it), and they would be out of work with no way to know why.
  await w.service.declineDelivery(offer.id, RIDER);
  await assertOfferableAgain(w, 'rider_1', `${label}: after releasing the parcel`);
}

async function goOfflineRacingAnAccept() {
  await leavingRacingAnAccept({ label: 'go offline', writes: 'offline', act: (w) => w.service.riderGoOffline(RIDER) });
}

async function pauseRacingAnAccept() {
  await leavingRacingAnAccept({ label: 'pause', writes: 'paused', act: (w) => w.service.riderPause(RIDER) });
}

// ===================================================================================
// 2. GO ONLINE RACING A CLAIM
// ===================================================================================

const goesOnline = ([, , patch]) => patch.status === 'online';

async function goOnlineRacingAWholeAccept() {
  // A whole accept lands between going online's busy read and its write.
  const w = makeWorld();
  await registerRiders(w, [['rider_1', 'Alain']]);
  const first = await newDelivery(w, { assignTo: 'rider_1' });
  const race = await withRace(w.repo, 'transitionPresence', {
    when: goesOnline,
    before: () => w.service.acceptDelivery(first.id, RIDER)
  }, async () => {
    const p = await w.service.riderGoOnline(RIDER);
    assert.strictEqual(p.status, 'busy', 'going online while an accept lands reports busy');
    assert.strictEqual(p.available, false);
  });
  assert.strictEqual(race.fired, 1, 'the accept landed between the busy read and the write');
  assert.strictEqual((await stored(w, first.id)).status, 'accepted');
  assert.strictEqual((await w.repo.findPresence('rider_1')).status, 'busy',
    'the stored row is still busy: going online did not overwrite the claim with online');
  await assertRefused('a second claim', w.service.presence.claim('rider_1'), unavailable('busy'));
  const accepted = (await w.repo.findOpenByDriver('rider_1')).filter((d) => d.status === 'accepted');
  assert.strictEqual(accepted.length, 1, 'the rider holds exactly one accepted delivery');
}

async function goOnlineRacingAClaimInFlight() {
  // The claim has landed but its delivery has not been written yet: the window a second accept needs.
  const w = makeWorld();
  await registerRiders(w, [['rider_1', 'Alain']]);
  const x = await newDelivery(w, { assignTo: 'rider_1' });
  const y = await newDelivery(w, { assignTo: 'rider_1' }); // offers stack: the rider holds two
  const race = await withRace(w.repo, 'transitionPresence', {
    when: goesOnline,
    // The accept of X: its claim lands. Its delivery write (and the withdrawal of Y) come after.
    before: () => w.service.presence.claim('rider_1')
  }, async () => {
    const p = await w.service.riderGoOnline(RIDER);
    assert.strictEqual(p.status, 'busy', 'the rider whose claim is in flight is busy, not put back online');
    assert.strictEqual(p.reason, 'busy');
    assert.strictEqual(p.available, false, 'and cannot be offered work');
  });
  assert.strictEqual(race.fired, 1, 'the claim landed between the busy read and the write');
  assert.strictEqual((await w.repo.findPresence('rider_1')).status, 'busy', 'the stored row is still busy');
  // The second accept, while the first is still in flight, is refused.
  await assertRefused('a second accept', w.service.acceptDelivery(y.id, RIDER), unavailable('busy'));
  assert.strictEqual((await stored(w, y.id)).status, 'assigned', 'the second delivery was not accepted');
  // The first accept's delivery write now lands.
  const moved = await w.repo.updateWhere(x.id, { status: 'assigned', driverId: 'rider_1' }, { status: 'accepted', acceptedAt: w.clock.iso() });
  assert.ok(moved, 'the first delivery could be accepted');
  const accepted = (await w.repo.findOpenByDriver('rider_1')).filter((d) => d.status === 'accepted');
  assert.deepStrictEqual(accepted.map((d) => d.id), [x.id], 'the rider never holds two accepted deliveries');
  assert.strictEqual((await presenceOf(w, 'rider_1')).status, 'busy');
}

async function goOnlineHealsALeakedBusyRowOnlyWhenOld() {
  assert.strictEqual(PRESENCE_CLAIM_GRACE_MS, 30 * SECOND, 'the grace is 30 seconds');

  // A busy row nothing backs up: a claim whose delivery never got written (a crash between the two).
  const w = makeWorld();
  await registerRiders(w, [['rider_1', 'Alain']]);
  await w.service.presence.claim('rider_1');
  const claimed = await w.repo.findPresence('rider_1');
  assert.strictEqual(claimed.status, 'busy', 'precondition: the claim was made');
  assert.deepStrictEqual(await w.repo.findOpenByDriver('rider_1'), [], 'precondition: and no delivery stands behind it');

  w.clock.advance(PRESENCE_CLAIM_GRACE_MS - 1);
  let p = await w.service.riderGoOnline(RIDER);
  assert.strictEqual(p.status, 'busy', 'younger than 30 s it may be a claim in flight: going online leaves them busy');
  assert.strictEqual(p.available, false);
  assert.deepStrictEqual(await w.repo.findPresence('rider_1'), claimed, 'and the row is not written to at all');

  w.clock.advance(2); // now one millisecond older than the grace
  p = await w.service.riderGoOnline(RIDER);
  assert.strictEqual(p.status, 'online', 'older than 30 s with nothing carried it is a leak: going online puts them right');
  assert.strictEqual(p.reason, null);
  assert.strictEqual(p.available, true);
  const row = await w.repo.findPresence('rider_1');
  assert.strictEqual(row.status, 'online', 'the stored row says online');
  assert.strictEqual(row.lastSeenAt, w.clock.iso(), 'and their last-seen time is now');
  assert.ok((await listedIds(w)).includes('rider_1'), 'and they can be offered work again');
}

async function goOnlineNeverHealsARowADeliveryBacksUp() {
  // A row that IS backed up by an accepted delivery is never put right, however old it is.
  const w = makeWorld();
  await registerRiders(w, [['rider_1', 'Alain']]);
  const job = await acceptedJob(w, 'rider_1');
  w.clock.advance(5 * MIN);
  const p = await w.service.riderGoOnline(RIDER);
  assert.strictEqual(p.status, 'busy', 'a rider who really carries a parcel is still busy five minutes on');
  assert.strictEqual((await w.repo.findPresence('rider_1')).status, 'busy');
  assert.strictEqual((await stored(w, job.id)).status, 'accepted');
}

// ===================================================================================
// 3. AN OFFER RACING THE RIDER LEAVING
// ===================================================================================

/** The write that makes `riderId` the holder of an offer. */
const offerWriteFor = (riderId) => ([, , patch]) => patch.status === 'assigned' && patch.driverId === riderId;

/** What the rider did in the gap, and what the contract says happens to the offer. */
const WHAT_HAPPENED_IN_THE_GAP = [
  {
    name: 'goes offline',
    reason: 'offline',
    note: NOTE.offline,
    act: (w) => w.service.riderGoOffline(RIDER),
    check: async (w) => { assert.strictEqual((await presenceOf(w, 'rider_1')).status, 'offline'); }
  },
  {
    name: 'pauses',
    reason: 'paused',
    note: NOTE.paused,
    act: (w) => w.service.riderPause(RIDER),
    check: async (w) => { assert.strictEqual((await presenceOf(w, 'rider_1')).status, 'paused'); }
  },
  {
    name: 'accepts another delivery',
    reason: 'busy',
    note: NOTE.busy,
    // The rider is holding an offer (and so is the other rider, which keeps the ranking tied for auto-assign).
    setup: async (w) => ({
      other: await newDelivery(w, { assignTo: 'rider_1' }),
      filler: await newDelivery(w, { assignTo: 'rider_2' })
    }),
    act: (w, ctx) => w.service.acceptDelivery(ctx.other.id, RIDER),
    check: async (w, ctx) => {
      assert.strictEqual((await presenceOf(w, 'rider_1')).status, 'busy');
      assert.strictEqual((await stored(w, ctx.other.id)).status, 'accepted', 'the delivery they accepted stays theirs');
      assert.deepStrictEqual((await w.repo.findOpenByDriver('rider_1')).map((d) => d.id), [ctx.other.id], 'and it is the only thing they hold');
    }
  }
];

async function assignDriverRacingTheRiderLeaving(gap) {
  const label = `assignDriver, rider ${gap.name} in the gap`;
  const w = makeWorld();
  await registerRiders(w);
  const ctx = gap.setup ? await gap.setup(w) : {};
  const d = await newDelivery(w);
  notifications.length = 0;

  const race = await withRace(w.repo, 'updateWhere', {
    when: offerWriteFor('rider_1'),   // after the availability check, before the offer is written
    before: () => gap.act(w, ctx)
  }, async () => {
    await assertRefused(label, w.service.assignDriver(d.id, 'rider_1', SELLER), unavailable(gap.reason));
  });
  assert.strictEqual(race.fired, 1, `${label}: the rider really acted between the check and the write`);
  await gap.check(w, ctx);

  const row = await stored(w, d.id);
  assert.strictEqual(row.status, 'pending_assignment', `${label}: the delivery is back with the seller`);
  assert.strictEqual(row.driverId, null, `${label}: with no rider on it`);
  assert.strictEqual(row.assignedAt, null, `${label}: and no offer window running`);
  assert.deepStrictEqual(await timeline(w, d.id), [
    { status: 'pending_assignment', previousStatus: null, actorId: 'seller_1', note: 'Delivery created' },
    { status: 'assigned', previousStatus: 'pending_assignment', actorId: 'seller_1', note: 'Assigned to Alain' },
    { status: 'pending_assignment', previousStatus: 'assigned', actorId: 'presence', note: gap.note }
  ], `${label}: the timeline carries the offer and its withdrawal, by the system and with the reason`);
  assert.strictEqual(sentTo('rider_1', 'New delivery assigned').length, 0, `${label}: the rider was never told about an offer that was taken back`);
  assert.strictEqual(sentTo('seller_1', 'A rider is no longer available').length, 1, `${label}: the seller is told the rider is no longer available`);
  assert.ok(!(await w.repo.findOpenByDriver('rider_1')).some((o) => o.id === d.id), `${label}: the rider is not left holding the offer`);
}

async function offerToARiderWhoWentSilentInTheGap() {
  // Same window, closed by the clock: the rider's last beat becomes older than the window between the check
  // and the write. They also hold an EARLIER offer, which only the sweep takes back: one offer is taken back, not all.
  const w = makeWorld({ presenceTtlMs: 2 * MIN });
  await registerRiders(w, [['rider_1', 'Alain']]);
  const earlier = await newDelivery(w, { assignTo: 'rider_1' });
  const late = await newDelivery(w);
  w.clock.advance(100 * SECOND);
  await w.service.riderHeartbeat(RIDER); // heard from at +100 s: good until +220 s
  notifications.length = 0;

  const race = await withRace(w.repo, 'updateWhere', {
    when: offerWriteFor('rider_1'),
    before: () => w.clock.advance(121 * SECOND) // the beat is now 121 s old: past the 120 s window
  }, async () => {
    await assertRefused('assignDriver, rider silent in the gap', w.service.assignDriver(late.id, 'rider_1', SELLER), unavailable('expired'));
  });
  assert.strictEqual(race.fired, 1, 'the window really closed between the check and the write');

  const row = await stored(w, late.id);
  assert.strictEqual(row.status, 'pending_assignment');
  assert.strictEqual(row.driverId, null);
  assert.deepStrictEqual((await timeline(w, late.id)).slice(-1), [
    { status: 'pending_assignment', previousStatus: 'assigned', actorId: 'presence', note: NOTE.expired }
  ], 'the new offer was taken back, for the real reason');
  assert.strictEqual(sentTo('rider_1', 'New delivery assigned').length, 0);
  const kept = await stored(w, earlier.id);
  assert.strictEqual(kept.status, 'assigned', 'the earlier offer was NOT taken back by this check: only the one just written is');
  assert.strictEqual(kept.driverId, 'rider_1');
  const p = await presenceOf(w, 'rider_1');
  assert.strictEqual(p.status, 'offline');
  assert.strictEqual(p.reason, 'expired');

  // The sweep is what takes the rest back, with the same reason.
  assert.deepStrictEqual(await w.service.expireStalePresence(), { expired: 1, healed: 0 });
  const swept = await stored(w, earlier.id);
  assert.strictEqual(swept.status, 'pending_assignment', 'the sweep takes the earlier offer back');
  assert.strictEqual((await timeline(w, earlier.id)).slice(-1)[0].note, NOTE.expired);
}

async function autoAssignRacingTheRiderLeaving(gap) {
  const label = `autoAssignDriver, rider_1 ${gap.name} in the gap`;
  const w = makeWorld();
  await registerRiders(w); // Alain ranks before Bruno
  const ctx = gap.setup ? await gap.setup(w) : {};
  const d = await newDelivery(w);
  notifications.length = 0;

  let result;
  const race = await withRace(w.repo, 'updateWhere', {
    when: offerWriteFor('rider_1'),
    before: () => gap.act(w, ctx)
  }, async () => {
    result = await w.service.autoAssignDriver(d.id, SELLER);
  });
  assert.strictEqual(race.fired, 1, `${label}: the first candidate really left between being ranked and being offered`);
  assert.strictEqual(result.driver.id, 'rider_2', `${label}: the job went to the next ranked rider instead of failing`);

  const row = await stored(w, d.id);
  assert.strictEqual(row.status, 'assigned');
  assert.strictEqual(row.driverId, 'rider_2');
  assert.deepStrictEqual(await timeline(w, d.id), [
    { status: 'pending_assignment', previousStatus: null, actorId: 'seller_1', note: 'Delivery created' },
    { status: 'assigned', previousStatus: 'pending_assignment', actorId: 'seller_1', note: 'Auto-assigned to Alain' },
    { status: 'pending_assignment', previousStatus: 'assigned', actorId: 'presence', note: gap.note },
    { status: 'assigned', previousStatus: 'pending_assignment', actorId: 'seller_1', note: 'Auto-assigned to Bruno' }
  ], `${label}: the timeline is the first offer, its withdrawal with the reason, then the second offer`);
  assert.strictEqual(sentTo('rider_1', 'New delivery assigned').length, 0, `${label}: rider_1 was never told about it`);
  assert.strictEqual(sentTo('rider_2', 'New delivery assigned').length, 1, `${label}: rider_2 was told once`);
  await gap.check(w, ctx);
}

const SEVEN_RIDERS = [
  ['rider_1', 'Alain'], ['rider_2', 'Bruno'], ['rider_3', 'Chantal'], ['rider_4', 'Dora'],
  ['rider_5', 'Elise'], ['rider_6', 'Fanny'], ['rider_7', 'Gaston']
];

/**
 * Auto-assign over `riders` (ranked in order, by name), where each rider in `vanish` goes offline the moment
 * they are offered the job. Returns what auto-assign did and which riders it tried.
 */
async function autoAssignWhereTheyVanish(riders, vanish) {
  const w = makeWorld();
  await registerRiders(w, riders);
  const d = await newDelivery(w);
  notifications.length = 0;
  const tried = [];
  let outcome = null;
  let result = null;
  await withRace(w.repo, 'updateWhere', {
    when: ([, , patch]) => patch.status === 'assigned',
    times: Infinity,
    before: ([, , patch]) => {
      tried.push(patch.driverId);
      return vanish.includes(patch.driverId) ? w.service.riderGoOffline(as(patch.driverId)) : null;
    }
  }, async () => {
    try {
      result = await w.service.autoAssignDriver(d.id, SELLER);
    } catch (e) {
      outcome = e;
    }
  });
  return { w, d, tried, outcome, result };
}

async function autoAssignEveryCandidateGone() {
  // Three riders, every one of them gone by the time they are offered the job: only now is nobody available.
  const { w, d, tried, outcome, result } = await autoAssignWhereTheyVanish(SEVEN_RIDERS.slice(0, 3), ['rider_1', 'rider_2', 'rider_3']);
  assert.strictEqual(result, null, 'every candidate vanished: nothing was assigned');
  assert.ok(outcome, 'every candidate vanished: auto-assign failed');
  assert.strictEqual(outcome.statusCode, 409);
  assert.strictEqual(outcome.code, 'NO_RIDER_AVAILABLE', 'with the answer for "nobody is free", not a rider-specific refusal');
  assert.deepStrictEqual(tried, ['rider_1', 'rider_2', 'rider_3'], 'it offered the job to each of them in rank order, once');
  const row = await stored(w, d.id);
  assert.strictEqual(row.status, 'pending_assignment', 'the delivery waits for the seller');
  assert.strictEqual(row.driverId, null);
  assert.strictEqual(sentTo('rider_1', 'New delivery assigned').length + sentTo('rider_2', 'New delivery assigned').length + sentTo('rider_3', 'New delivery assigned').length, 0,
    'and nobody was told about an offer');
  assert.deepStrictEqual((await timeline(w, d.id)).filter((e) => e.actorId === 'presence').map((e) => e.note), [NOTE.offline, NOTE.offline, NOTE.offline],
    'each of the three offers was taken back, with the reason');
}

async function autoAssignTheFifthCandidateIsStillThere() {
  // The first four vanish, the fifth is still there: the job goes to the fifth.
  const { w, d, tried, outcome, result } = await autoAssignWhereTheyVanish(SEVEN_RIDERS, ['rider_1', 'rider_2', 'rider_3', 'rider_4']);
  assert.strictEqual(outcome, null, 'the fifth candidate was still there: no failure');
  assert.strictEqual(result.driver.id, 'rider_5', 'so the job goes to the fifth');
  assert.deepStrictEqual(tried, ['rider_1', 'rider_2', 'rider_3', 'rider_4', 'rider_5']);
  assert.strictEqual((await stored(w, d.id)).driverId, 'rider_5');
}

async function autoAssignTriesNoSixthCandidate() {
  // The first five vanish while a sixth and a seventh are online: at most five are tried, so it fails.
  const { w, d, tried, outcome, result } = await autoAssignWhereTheyVanish(SEVEN_RIDERS, ['rider_1', 'rider_2', 'rider_3', 'rider_4', 'rider_5']);
  assert.strictEqual(result, null, 'five candidates vanished: nothing was assigned');
  assert.ok(outcome, 'five candidates vanished: auto-assign failed');
  assert.strictEqual(outcome.code, 'NO_RIDER_AVAILABLE');
  assert.deepStrictEqual(tried, ['rider_1', 'rider_2', 'rider_3', 'rider_4', 'rider_5'], 'at most five candidates are tried: the sixth and seventh are not');
  assert.deepStrictEqual(await listedIds(w), ['rider_6', 'rider_7'], 'they are still online and available, never offered anything');
  const row = await stored(w, d.id);
  assert.strictEqual(row.status, 'pending_assignment');
  assert.strictEqual(row.driverId, null);
}

// ===================================================================================
// 4. A BUSY RIDER WHO WENT QUIET, AND WHO ENDS THE DELIVERY
// ===================================================================================

const SILENT_TTL_MS = 2 * MIN;

/**
 * A rider carrying a delivery (taken as far as `upTo`) who then sends nothing for ten minutes: five heartbeat
 * windows. The steps up to `upTo` happen while they are still heard from, so the ONLY request the rider makes
 * after the silence is the act under test.
 */
async function silentCarrier(upTo) {
  const w = makeWorld({ presenceTtlMs: SILENT_TTL_MS });
  await registerRiders(w, [['rider_1', 'Alain']]);
  const d = await acceptedJob(w, 'rider_1');
  if (upTo !== 'accepted') await w.service.updateStatus(d.id, 'picked_up', null, RIDER);
  if (upTo === 'arrived') await w.service.updateStatus(d.id, 'arrived', null, RIDER);
  const lastHeard = w.clock.iso();
  w.clock.advance(10 * MIN);
  const p = await presenceOf(w, 'rider_1');
  assert.strictEqual(p.status, 'busy', 'precondition: a rider carrying a parcel is not timed out');
  assert.strictEqual(p.lastSeenAt, lastHeard, 'precondition: and nothing has been heard from them since');
  return { w, d, lastHeard };
}

/** The rider ended it themselves: they are an online rider, and have just been heard from. */
async function assertBackOnlineAndHeard(w, label) {
  const now = w.clock.iso();
  const p = await presenceOf(w, 'rider_1');
  assert.strictEqual(p.status, 'online', `${label}: they come back online, not ${p.status}`);
  assert.strictEqual(p.reason, null, `${label}: with no reason (not expired)`);
  assert.strictEqual(p.available, true, `${label}: and available`);
  assert.strictEqual(p.lastSeenAt, now, `${label}: their last-seen time is refreshed to now`);
  assert.strictEqual(p.expiresAt, new Date(w.clock.now() + SILENT_TTL_MS).toISOString(), `${label}: and the window starts from it`);
  const row = await w.repo.findPresence('rider_1');
  assert.strictEqual(row.status, 'online', `${label}: the stored row is online`);
  assert.strictEqual(row.lastSeenAt, now, `${label}: and carries the refreshed time`);
  assert.ok((await listedIds(w)).includes('rider_1'), `${label}: and the rider is offered work again`);
}

/** Somebody else ended it: the rider is NOT revived, and reads as silent for the reason they are. */
async function assertStillSilent(w, lastHeard, label) {
  const p = await presenceOf(w, 'rider_1');
  assert.strictEqual(p.status, 'offline', `${label}: past the window they read offline`);
  assert.strictEqual(p.reason, 'expired', `${label}: because they stopped responding`);
  assert.strictEqual(p.available, false);
  assert.strictEqual(p.lastSeenAt, lastHeard, `${label}: their last-seen time was not refreshed by an act that proves nothing about them`);
  assert.strictEqual((await w.repo.findPresence('rider_1')).lastSeenAt, lastHeard, `${label}: in the stored row either`);
  assert.deepStrictEqual(await listedIds(w), [], `${label}: and they are not offered work`);
  const next = await newDelivery(w);
  await assertRefused(`${label}: offering them a delivery`, w.service.assignDriver(next.id, 'rider_1', SELLER), unavailable('expired'));
}

/** What the rider does that ends their delivery, and how far they had taken it while they were still heard from. */
const THE_RIDER_ENDS_IT = [
  {
    name: 'completing the delivery',
    upTo: 'arrived',
    act: async (w, d) => {
      const handover = await w.service.getHandoverCode(d.id, BUYER);
      await w.service.completeDelivery(d.id, handover.code, RIDER);
      assert.strictEqual((await stored(w, d.id)).status, 'delivered');
    }
  },
  {
    name: 'reporting the delivery failed',
    upTo: 'picked_up',
    act: async (w, d) => {
      await w.service.updateStatus(d.id, 'failed', 'Customer unreachable', RIDER);
      assert.strictEqual((await stored(w, d.id)).status, 'failed');
    }
  },
  {
    name: 'releasing the delivery',
    upTo: 'accepted',
    act: async (w, d) => {
      await w.service.declineDelivery(d.id, RIDER);
      assert.strictEqual((await stored(w, d.id)).status, 'pending_assignment');
    }
  }
];

/** What somebody else does that ends it. */
const SOMEBODY_ELSE_ENDS_IT = [
  {
    name: 'the seller cancels it',
    upTo: 'accepted',
    act: async (w, d) => {
      await w.service.cancelDelivery(d.id, 'Customer changed their mind', SELLER);
      assert.strictEqual((await stored(w, d.id)).status, 'cancelled');
    }
  },
  {
    name: 'an administrator fails it',
    upTo: 'picked_up',
    act: async (w, d) => {
      await w.service.resolveDelivery(d.id, { action: 'fail', note: 'Rider unreachable' }, ADMIN);
      assert.strictEqual((await stored(w, d.id)).status, 'failed');
    }
  },
  {
    name: 'the order is cancelled',
    upTo: 'accepted',
    act: async (w, d) => {
      assert.strictEqual((await w.service.cancelForOrder(d.order.id)).status, 'cancelled', 'the order cancellation cancelled the delivery');
    }
  }
];

async function silentRiderEndsItThemselves(ending) {
  const { w, d } = await silentCarrier(ending.upTo);
  await ending.act(w, d);
  await assertBackOnlineAndHeard(w, ending.name);
}

async function silentRiderWhoseDeliveryIsEndedBySomeoneElse(ending) {
  const { w, d, lastHeard } = await silentCarrier(ending.upTo);
  await ending.act(w, d);
  await assertStillSilent(w, lastHeard, ending.name);
}

// ===================================================================================
// 5. ACCOUNT STANDING IS CHECKED WHERE IT MATTERS
// ===================================================================================

/** Four riders; rider_1 is suspended straight in the table, so their presence row still says online and fresh. */
async function worldWithASuspendedRiderWhoseRowSaysOnline() {
  const w = makeWorld();
  await registerRiders(w, [['rider_1', 'Alain'], ['rider_2', 'Bruno'], ['rider_3', 'Chantal'], ['rider_4', 'Dora']]);
  await acceptedJob(w, 'rider_3');
  await w.service.riderPause(as('rider_4'));
  await w.repo.upsertDriver({ profileId: 'rider_1', name: 'Alain', phone: '+237600029999', status: 'suspended' });
  const row = await w.repo.findPresence('rider_1');
  assert.strictEqual(row.status, 'online', 'precondition: the suspended rider\'s row still says online');
  assert.strictEqual((await presenceOf(w, 'rider_2')).status, 'online', 'precondition: another rider is a normal online rider');
  return { w, row };
}

async function claimRefusesASuspendedRider() {
  const { w, row } = await worldWithASuspendedRiderWhoseRowSaysOnline();

  const refused = await assertRefused('claim, the record looked up', w.service.presence.claim('rider_1'), unavailable('suspended'));
  assert.ok(refused instanceof RiderUnavailableError, 'the refusal is a RiderUnavailableError');
  assert.strictEqual(refused.message, 'Your rider account is not active.', 'it tells the rider so');
  assert.deepStrictEqual(await w.repo.findPresence('rider_1'), row, 'and the row is unchanged: it was not made busy');
  const record = await w.repo.findDriver('rider_1');
  assert.strictEqual(record.status, 'suspended');
  await assertRefused('claim, handed the suspended record', w.service.presence.claim('rider_1', record), unavailable('suspended'));
  assert.deepStrictEqual(await w.repo.findPresence('rider_1'), row, 'row still unchanged');
  await assertRefused('claim, a stranger', w.service.presence.claim('nobody_1'), unavailable('not_a_rider'));
  assert.strictEqual(await w.repo.findPresence('nobody_1'), null, 'no row appears for a stranger');
  // Control: the check is about standing, not a blanket refusal.
  const claimed = await w.service.presence.claim('rider_2');
  assert.strictEqual(claimed.status, 'busy', 'an active, online rider\'s claim works');
}

async function availableListDropsASuspendedRider() {
  const { w } = await worldWithASuspendedRiderWhoseRowSaysOnline();
  const everyone = await w.repo.listDrivers({ status: null });
  assert.deepStrictEqual(everyone.map((d) => d.id).sort(), ['rider_1', 'rider_2', 'rider_3', 'rider_4'], 'precondition: the suspended driver IS in the list handed over');
  const available = await w.service.presence.availableRiderIds(everyone);
  assert.deepStrictEqual([...available], ['rider_2'],
    'only the online, free, active rider is available: not the suspended one (row says online), the busy one, or the paused one');
}

// ===================================================================================
// 6. expiresAt: ONLY AN ONLINE RIDER EXPIRES
// ===================================================================================

async function expiresAtOnlyForOnline() {
  const w = makeWorld({ presenceTtlMs: SILENT_TTL_MS });
  await registerRiders(w, [['rider_1', 'Alain'], ['rider_2', 'Bruno'], ['rider_3', 'Chantal'], ['rider_4', 'Dora']]);
  await registerRider(w, 'rider_5', 'Elise', { online: false });
  await acceptedJob(w, 'rider_4');
  await w.service.riderPause(as('rider_2'));
  await w.service.riderGoOffline(as('rider_3'));
  w.clock.advance(10 * SECOND);
  const beat = await w.service.riderHeartbeat(as('rider_1'));
  const busyBeat = await w.service.riderHeartbeat(as('rider_4'));

  // ---- online: a deadline, exactly the last beat plus the window
  const online = [
    ['the heartbeat answer', beat],
    ['GET presence', await presenceOf(w, 'rider_1')],
    ['GET /driver/me', (await w.service.getRiderOverview(as('rider_1'))).presence]
  ];
  for (const [where, p] of online) {
    assert.strictEqual(p.status, 'online', `online, ${where}`);
    assert.strictEqual(p.expiresAt, new Date(w.clock.now() + SILENT_TTL_MS).toISOString(), `online, ${where}: expires one window after the last beat`);
  }
  const again = await w.service.riderGoOnline(as('rider_1'));
  assert.strictEqual(again.expiresAt, new Date(Date.parse(again.lastSeenAt) + SILENT_TTL_MS).toISOString(), 'online, going online again: the same rule');

  // ---- every other state: no deadline
  assert.strictEqual(busyBeat.status, 'busy');
  assert.strictEqual(busyBeat.expiresAt, null, 'busy, the heartbeat answer: no deadline');
  assert.strictEqual((await presenceOf(w, 'rider_4')).expiresAt, null, 'busy, GET presence: no deadline');
  assert.strictEqual((await presenceOf(w, 'rider_2')).status, 'paused');
  assert.strictEqual((await presenceOf(w, 'rider_2')).expiresAt, null, 'paused: no deadline');
  assert.strictEqual((await presenceOf(w, 'rider_3')).status, 'offline');
  assert.strictEqual((await presenceOf(w, 'rider_3')).expiresAt, null, 'offline: no deadline');
  assert.strictEqual((await presenceOf(w, 'rider_5')).expiresAt, null, 'never online: no deadline');

  // ---- ten minutes of silence: five windows
  w.clock.advance(10 * MIN);
  const silentBusy = await presenceOf(w, 'rider_4');
  assert.strictEqual(silentBusy.status, 'busy', 'a busy rider is still busy after a long silence');
  assert.strictEqual(silentBusy.expiresAt, null, 'busy after a long silence: still no deadline, so a client cannot call them expired');
  const silentBeat = await w.service.riderHeartbeat(as('rider_4'));
  assert.strictEqual(silentBeat.status, 'busy');
  assert.strictEqual(silentBeat.expiresAt, null, 'busy, a beat after a long silence: no deadline');
  assert.strictEqual((await w.service.getRiderOverview(as('rider_4'))).presence.expiresAt, null, 'busy, GET /driver/me: no deadline');
  const expired = await presenceOf(w, 'rider_1');
  assert.strictEqual(expired.status, 'offline', 'the free rider who went silent is offline');
  assert.strictEqual(expired.reason, 'expired');
  assert.strictEqual(expired.expiresAt, null, 'and has no deadline left to show');
}

// ===================================================================================
// 7. THE SWEEPER: ITS JOBS DO NOT HIDE EACH OTHER
// ===================================================================================

/** A service double for the sweeper: each job records that it ran, and succeeds or throws as told. */
function sweepDouble({ offers, nudge, presence }) {
  const ran = [];
  const job = (name, spec, value) => async () => {
    ran.push(name);
    if (spec === 'throws') throw new Error(`${name} failed`);
    return value;
  };
  return {
    ran,
    service: {
      offerTtlMs: OFFER_TTL_MS,
      nudgeEnabled: true,
      expireStaleOffers: job('offers', offers, { expired: 2 }),
      nudgeUndispatched: job('nudge', nudge, { sellers: 1, admins: 0, overdue: 0 }),
      expireStalePresence: job('presence', presence, { expired: 3, healed: 1 })
    }
  };
}

const NUDGED = { sellers: 1, admins: 0, overdue: 0 };
const SWEPT = { expired: 3, healed: 1 };
const SWEEPER_CASES = [
  { name: 'all three succeed', spec: {}, want: { expired: 2, nudged: NUDGED, presence: SWEPT } },
  { name: 'offer expiry throws', spec: { offers: 'throws' }, want: { expired: 0, failed: true, nudged: NUDGED, presence: SWEPT } },
  { name: 'the reminders throw', spec: { nudge: 'throws' }, want: { expired: 2, nudgeFailed: true, presence: SWEPT } },
  { name: 'the presence sweep throws', spec: { presence: 'throws' }, want: { expired: 2, nudged: NUDGED, presenceFailed: true } },
  { name: 'offer expiry and the presence sweep throw', spec: { offers: 'throws', presence: 'throws' }, want: { expired: 0, failed: true, nudged: NUDGED, presenceFailed: true } },
  { name: 'the reminders and the presence sweep throw', spec: { nudge: 'throws', presence: 'throws' }, want: { expired: 2, nudgeFailed: true, presenceFailed: true } },
  { name: 'all three throw', spec: { offers: 'throws', nudge: 'throws', presence: 'throws' }, want: { expired: 0, failed: true, nudgeFailed: true, presenceFailed: true } }
];

async function sweeperJobsDoNotHideEachOther({ name, spec, want }) {
  const { ran, service } = sweepDouble(spec);
  const sweeper = startOfferSweeper({ service, ...fakeTimers() });
  const result = await sweeper.tick();
  sweeper.stop();
  assert.deepStrictEqual(ran, ['offers', 'nudge', 'presence'], `${name}: every job ran this tick, whatever the others did`);
  assert.deepStrictEqual(result, want, `${name}: the result says which jobs failed and what the others did`);
}

async function sweeperPresenceSurvivesAFailingOffersQuery() {
  // The offers query fails; the rider who went silent is still set offline and their offer goes back.
  {
    const w = makeWorld({ presenceTtlMs: 2 * MIN });
    await registerRiders(w, [['rider_1', 'Alain']]);
    const offer = await newDelivery(w, { assignTo: 'rider_1' });
    w.clock.advance(3 * MIN); // past the 2 minute presence window, well inside the 15 minute offer window
    notifications.length = 0;
    const race = interleave(w.repo, 'findStaleOffers', { before: () => { throw new Error('deliveries query failed'); } });
    let result;
    try {
      const sweeper = startOfferSweeper({ service: w.service, ...fakeTimers() });
      result = await sweeper.tick();
      sweeper.stop();
    } finally {
      race.restore();
    }
    assert.strictEqual(race.fired, 1, 'the offers query was reached, and failed');
    assert.strictEqual(result.failed, true, 'the tick says offer expiry failed');
    assert.strictEqual(result.expired, 0);
    assert.deepStrictEqual(result.presence, { expired: 1, healed: 0 }, 'but the presence sweep still ran and set the silent rider offline');
    assert.deepStrictEqual(result.nudged, { sellers: 0, admins: 0, overdue: 0 }, 'and so did the reminders');
    assert.strictEqual((await w.repo.findPresence('rider_1')).status, 'offline', 'the rider is stored offline');
    const row = await stored(w, offer.id);
    assert.strictEqual(row.status, 'pending_assignment', 'their unanswered offer went back to the seller');
    assert.strictEqual((await timeline(w, offer.id)).slice(-1)[0].note, NOTE.expired);
    assert.strictEqual(sentTo('seller_1', 'A rider is no longer available').length, 1, 'and the seller was told');
  }

}

async function sweeperOffersSurviveAFailingPresenceQuery() {
  // The presence query fails; a lapsed offer is still returned to its seller.
  {
    const w = makeWorld({ offerTtlMs: 15 * MIN, presenceTtlMs: LONG_PRESENCE_MS });
    await registerRiders(w, [['rider_1', 'Alain']]);
    const offer = await newDelivery(w, { assignTo: 'rider_1' });
    w.clock.advance(16 * MIN); // the offer lapsed; the rider is still heard from within the hour
    const race = interleave(w.repo, 'findStalePresence', { before: () => { throw new Error('presence query failed'); } });
    let result;
    try {
      const sweeper = startOfferSweeper({ service: w.service, ...fakeTimers() });
      result = await sweeper.tick();
      sweeper.stop();
    } finally {
      race.restore();
    }
    assert.strictEqual(race.fired, 1, 'the presence query was reached, and failed');
    assert.strictEqual(result.presenceFailed, true, 'the tick says the presence sweep failed');
    assert.strictEqual(result.expired, 1, 'but the lapsed offer was returned');
    assert.strictEqual((await stored(w, offer.id)).status, 'pending_assignment');
    assert.strictEqual((await timeline(w, offer.id)).slice(-1)[0].note, 'Offer expired: no response from the rider');
  }
}

// ===================================================================================
// 8. PRESENCE THAT CANNOT BE READ MUST NOT TAKE A SCREEN DOWN
// ===================================================================================

async function rosterStillLoadsWithoutPresence() {
  const w = makeWorld();
  await registerRiders(w, [['rider_1', 'Alain'], ['rider_2', 'Bruno']]);
  await acceptedJob(w, 'rider_2');
  await w.service.registerDriver('rider_3', { name: 'Chantal', phone: '+237600039999', status: 'suspended' }, ADMIN);
  await registerRider(w, 'rider_4', 'Dora', { online: false });

  const control = await w.service.listRiderRoster(ADMIN);
  assert.deepStrictEqual(control.map((r) => [r.id, r.presence]), [['rider_1', 'online'], ['rider_2', 'busy'], ['rider_4', 'offline'], ['rider_3', 'suspended']],
    'control: with presence readable every rider shows it');
  assert.strictEqual(control[0].lastSeenAt, w.clock.iso(), 'control: and when they were last heard from');

  logged.warn.length = 0;
  const race = interleave(w.repo, 'listPresence', { before: () => { throw new Error('relation "rider_presence" does not exist'); } });
  let roster;
  let active;
  try {
    roster = await w.service.listRiderRoster(ADMIN);
    active = await w.service.listRiderRoster(ADMIN, { status: 'active' });
  } finally {
    race.restore();
  }
  assert.strictEqual(race.fired, 1, 'the presence read was reached, and failed');
  assert.strictEqual(roster.length, 4, 'the roster still lists every rider');
  assert.deepStrictEqual(roster.map((r) => r.id), control.map((r) => r.id), 'in the same order');
  for (const r of roster) {
    assert.strictEqual(r.presence, null, `${r.id}: presence is unknown, not guessed`);
    assert.strictEqual(r.lastSeenAt, null, `${r.id}: and so is when they were last heard from`);
  }
  assert.deepStrictEqual(
    roster.map((r) => ({ ...r, presence: null, lastSeenAt: null })),
    control.map((r) => ({ ...r, presence: null, lastSeenAt: null })),
    'everything else about every rider is exactly what it was: name, phone, status, workload'
  );
  assert.deepStrictEqual(active.map((r) => r.id), ['rider_1', 'rider_2', 'rider_4'], 'a status filter works too');
  assert.ok(logged.warn.some((m) => /presence/i.test(m) && /roster/i.test(m)), `and the failure is logged, not swallowed silently (saw: ${JSON.stringify(logged.warn)})`);
}

async function riderJobListStillLoadsWithoutPresence() {
  const w = makeWorld();
  await registerRiders(w, [['rider_1', 'Alain']]);
  const job = await acceptedJob(w, 'rider_1');

  const control = await w.service.getRiderOverview(RIDER);
  assert.strictEqual(control.presence.status, 'busy', 'control: with presence readable it rides along');
  assert.deepStrictEqual(control.deliveries.map((d) => d.id), [job.id]);

  logged.warn.length = 0;
  const race = interleave(w.repo, 'findPresence', { before: () => { throw new Error('relation "rider_presence" does not exist'); } });
  let overview;
  try {
    overview = await w.service.getRiderOverview(RIDER);
  } finally {
    race.restore();
  }
  assert.strictEqual(race.fired, 1, 'the presence read was reached, and failed');
  assert.deepStrictEqual(overview.deliveries.map((d) => d.id), [job.id], 'the rider still sees the delivery they have to finish');
  assert.strictEqual(overview.presence, null, 'with presence unknown (null), not an error');
  assert.strictEqual(overview.driver.id, 'rider_1');
  assert.ok(logged.warn.some((m) => /presence/i.test(m)), 'and the failure is logged');
}

// ===================================================================================
// 9. THE HEARTBEAT IS LEAN, AND STILL TELLS THE TRUTH
// ===================================================================================
// A free rider's beat reads their deliveries once (an indexed read) so it never reports "online"
// for someone carrying a parcel; a rider stored busy needs no such read.

async function leanWorld() {
  assert.strictEqual(PRESENCE_MIN_WRITE_INTERVAL_MS, 5 * SECOND, 'beats closer together than 5 seconds are not written');
  const w = makeWorld({ presenceTtlMs: SILENT_TTL_MS });
  await registerRiders(w, [['rider_1', 'Alain']]);
  return { w, spy: countCalls(w.repo) };
}

async function oneBeatCostsFourCalls() {
  // Ten seconds after the rider went online: one read of the rider, one of the row, one write, and
  // one read of their deliveries (nothing else: no count over every rider, no second read of the row).
  const { w, spy } = await leanWorld();
  w.clock.advance(10 * SECOND);
  spy.reset();
  const beat = await w.service.riderHeartbeat(RIDER);
  assert.deepStrictEqual(spy.counts, { findDriver: 1, findPresence: 1, transitionPresence: 1, findOpenByDriver: 1 },
    'one beat on a free rider: one findDriver, one findPresence, one transitionPresence, one findOpenByDriver, nothing else');
  assert.strictEqual(beat.status, 'online');
  assert.strictEqual(beat.lastSeenAt, w.clock.iso(), 'the answer carries the beat just written');
  assert.strictEqual(beat.expiresAt, new Date(w.clock.now() + SILENT_TTL_MS).toISOString());
  assert.strictEqual((await w.repo.findPresence('rider_1')).lastSeenAt, w.clock.iso(), 'and it was written');
}

async function aThrottledBeatWritesNothing() {
  const { w, spy } = await leanWorld();
  w.clock.advance(10 * SECOND);
  await w.service.riderHeartbeat(RIDER); // written
  const written = await w.repo.findPresence('rider_1');
  w.clock.advance(PRESENCE_MIN_WRITE_INTERVAL_MS - 1);
  spy.reset();
  const throttled = await w.service.riderHeartbeat(RIDER);
  assert.deepStrictEqual(spy.counts, { findDriver: 1, findPresence: 1, findOpenByDriver: 1 }, 'a beat 4.999 s after the last write reads the rider, the row and their deliveries, and writes nothing');
  assert.strictEqual(throttled.status, 'online', 'it is still answered');
  assert.strictEqual(throttled.lastSeenAt, written.lastSeenAt, 'with the time of the beat that was written');
  assert.deepStrictEqual(await w.repo.findPresence('rider_1'), written, 'the stored row is exactly what it was');
}

async function aBeatFiveSecondsAfterTheLastWriteIsWritten() {
  const { w, spy } = await leanWorld();
  w.clock.advance(10 * SECOND);
  await w.service.riderHeartbeat(RIDER);
  w.clock.advance(PRESENCE_MIN_WRITE_INTERVAL_MS);
  spy.reset();
  await w.service.riderHeartbeat(RIDER);
  assert.deepStrictEqual(spy.counts, { findDriver: 1, findPresence: 1, transitionPresence: 1, findOpenByDriver: 1 }, 'five seconds after the last write the beat is written');
  assert.strictEqual((await w.repo.findPresence('rider_1')).lastSeenAt, w.clock.iso());
}

async function aBeatInTheSameInstantAsGoingOnlineWritesNothing() {
  const { w, spy } = await leanWorld();
  spy.reset();
  await w.service.riderHeartbeat(RIDER);
  assert.deepStrictEqual(spy.counts, { findDriver: 1, findPresence: 1, findOpenByDriver: 1 }, 'a beat in the same second as going online writes nothing');
}

async function aBusyRidersBeatCostsTheSame() {
  // The delivery list is not read to answer it.
  const { w, spy } = await leanWorld();
  await acceptedJob(w, 'rider_1');
  w.clock.advance(10 * SECOND);
  spy.reset();
  const busy = await w.service.riderHeartbeat(RIDER);
  assert.deepStrictEqual(spy.counts, { findDriver: 1, findPresence: 1, transitionPresence: 1 }, 'a beat on a busy rider: the same three calls, no findOpenByDriver or countOpenByDriver');
  assert.strictEqual(busy.status, 'busy', 'and the answer says busy');
  assert.strictEqual(busy.lastSeenAt, w.clock.iso());
}

async function aBeatOnACarrierWhoseRowSaysOnlineIsAnsweredBusyAndPutRight() {
  // The presence write after an accept can be lost (it is best-effort: the delivery already moved). The
  // rider then holds an accepted parcel while the row still says online. The beat must not tell them (and
  // the client) that they are free, must agree with GET /driver/presence, and must put the row right.
  const { w } = await leanWorld();
  await acceptedJob(w, 'rider_1');
  assert.ok(await w.repo.transitionPresence('rider_1', ['busy'], { status: 'online' }), 'precondition: the accept left the row stored online');
  w.clock.advance(10 * SECOND);

  const beat = await w.service.riderHeartbeat(RIDER);
  const own = await w.service.getRiderPresence(RIDER);
  assert.strictEqual(beat.status, 'busy', 'the beat says busy');
  assert.strictEqual(beat.available, false);
  assert.strictEqual(beat.status, own.status, 'and agrees with GET /driver/presence');
  assert.strictEqual(beat.expiresAt, null, 'a busy rider has no deadline');
  assert.strictEqual((await w.repo.findPresence('rider_1')).status, 'busy', 'and the stored row was put right on the way past');
  assert.strictEqual(beat.lastSeenAt, w.clock.iso(), 'the beat itself was still recorded');
}

// ===================================================================================

async function run() {
  console.log('  Testing Rider presence races...');

  const hadSecret = config.supabase.jwtSecret;
  if (!hadSecret) config.supabase.jwtSecret = 'unit-test-delivery-secret-0123456789abcdef';

  // Keep the suite pure: no notification rows, whatever the machine's credentials; and a captured log.
  const NotificationService = require('../../server/modules/identity/application/NotificationService');
  const originalCreate = NotificationService.create;
  NotificationService.create = async (userId, payload) => { notifications.push({ userId, ...payload }); return null; };
  const originals = { info: logger.info, warn: logger.warn, error: logger.error };
  logger.info = () => {};
  logger.warn = (message) => { logged.warn.push(String(message)); };
  logger.error = (message) => { logged.error.push(String(message)); };

  const failures = [];
  const section = async (title, fn) => {
    notifications.length = 0;
    logged.warn.length = 0;
    logged.error.length = 0;
    try {
      await fn();
    } catch (err) {
      failures.push({ title, err });
    }
  };

  try {
    await section('1. go offline racing an accept leaves the rider busy', goOfflineRacingAnAccept);
    await section('1. pause racing an accept leaves the rider busy', pauseRacingAnAccept);
    await section('2. go online racing a whole accept never overwrites the claim', goOnlineRacingAWholeAccept);
    await section('2. go online racing a claim in flight never overwrites it', goOnlineRacingAClaimInFlight);
    await section('2. go online heals a leaked busy row only once it is older than 30 s', goOnlineHealsALeakedBusyRowOnlyWhenOld);
    await section('2. go online never heals a busy row a delivery backs up', goOnlineNeverHealsARowADeliveryBacksUp);
    for (const gap of WHAT_HAPPENED_IN_THE_GAP) {
      await section(`3. assignDriver, the rider ${gap.name} in the gap, takes the offer back`, () => assignDriverRacingTheRiderLeaving(gap));
    }
    await section('3. assignDriver, the rider goes silent in the gap, takes back that offer alone', offerToARiderWhoWentSilentInTheGap);
    for (const gap of WHAT_HAPPENED_IN_THE_GAP) {
      await section(`3. auto-assign, the first rider ${gap.name} in the gap, offers the next rider`, () => autoAssignRacingTheRiderLeaving(gap));
    }
    await section('3. auto-assign, every candidate gone, answers NO_RIDER_AVAILABLE', autoAssignEveryCandidateGone);
    await section('3. auto-assign, the fifth candidate still there, gets the job', autoAssignTheFifthCandidateIsStillThere);
    await section('3. auto-assign, five candidates gone, tries no sixth', autoAssignTriesNoSixthCandidate);
    for (const ending of THE_RIDER_ENDS_IT) {
      await section(`4. a silent busy rider ${ending.name} is online and heard from`, () => silentRiderEndsItThemselves(ending));
    }
    for (const ending of SOMEBODY_ELSE_ENDS_IT) {
      await section(`4. a silent busy rider whose delivery ends when ${ending.name} is not revived`, () => silentRiderWhoseDeliveryIsEndedBySomeoneElse(ending));
    }
    await section('5. claim refuses a suspended rider whose row says online', claimRefusesASuspendedRider);
    await section('5. the available list drops a suspended rider whose row says online', availableListDropsASuspendedRider);
    await section('6. only an online rider has an expiresAt', expiresAtOnlyForOnline);
    for (const sweeperCase of SWEEPER_CASES) {
      await section(`7. the sweeper with doubles, ${sweeperCase.name}`, () => sweeperJobsDoNotHideEachOther(sweeperCase));
    }
    await section('7. the sweeper with the real service, a failing offers query hides nothing', sweeperPresenceSurvivesAFailingOffersQuery);
    await section('7. the sweeper with the real service, a failing presence query hides nothing', sweeperOffersSurviveAFailingPresenceQuery);
    await section('8. the roster still loads when presence cannot be read', rosterStillLoadsWithoutPresence);
    await section('8. the rider job list still loads when presence cannot be read', riderJobListStillLoadsWithoutPresence);
    await section('9. one beat costs four repository calls', oneBeatCostsFourCalls);
    await section('9. a throttled beat writes nothing', aThrottledBeatWritesNothing);
    await section('9. a beat five seconds after the last write is written', aBeatFiveSecondsAfterTheLastWriteIsWritten);
    await section('9. a beat in the same instant as going online writes nothing', aBeatInTheSameInstantAsGoingOnlineWritesNothing);
    await section('9. a busy rider beat costs the same three calls', aBusyRidersBeatCostsTheSame);
    await section('9. a beat on a carrier whose row says online is answered busy and the row put right', aBeatOnACarrierWhoseRowSaysOnlineIsAnsweredBusyAndPutRight);
  } finally {
    NotificationService.create = originalCreate;
    logger.info = originals.info;
    logger.warn = originals.warn;
    logger.error = originals.error;
    if (!hadSecret) config.supabase.jwtSecret = hadSecret;
  }

  if (failures.length > 0) {
    for (const { title, err } of failures) console.error(`    ✗ ${title}\n${err && err.stack ? err.stack : err}`);
    throw new Error(`rider_presence_races: ${failures.length} section(s) failed:\n${failures.map(({ title, err }) => `  - ${title}: ${String(err && err.message).split('\n')[0]}`).join('\n')}`);
  }
  console.log('    ✓ Rider presence races: leaving vs accepting, going online vs claiming, offers vs leaving, silent carriers, standing, expiry, the sweeper, resilience and the lean heartbeat hold.');
}

module.exports = { run };
