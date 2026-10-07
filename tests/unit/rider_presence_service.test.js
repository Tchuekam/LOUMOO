/**
 * LOUMOO — Rider presence service
 * ---------------------------------------------------------------------------
 * The rules for a rider's availability, driven through RiderPresenceService
 * alone: an in-memory DeliveryRepository (no database), a fake clock, riders
 * created straight on the repository. No DeliveryService is involved, so what is
 * proved here is the presence rules themselves, not the delivery wiring:
 *
 *   go online / offline, pause / resume, the heartbeat and its expiry, the claim a
 *   rider makes by accepting (and two claims at once), reconcile (busy <-> online),
 *   the janitor for a leaked busy row, the sweep that sets silent riders offline,
 *   the reads dispatch chooses riders from, and the repository's compare-and-swap
 *   guards (seenSince / staleAt / updatedBefore) the service relies on.
 *
 * Races are exercised by interposing on the repository: the interleaving a real
 * database could produce is forced here, deterministically, and the outcome asserted.
 */

require('../setup');

const assert = require('assert');

const { DeliveryRepository } = require('../../server/modules/delivery/infrastructure/DeliveryRepository');
const { RiderPresenceService } = require('../../server/modules/delivery/application/RiderPresenceService');
const {
  RiderUnavailableError,
  PRESENCE_CLAIM_GRACE_MS,
  PRESENCE_MIN_WRITE_INTERVAL_MS
} = require('../../server/modules/delivery/domain/RiderPresence');
const { DELIVERY_STATUS: S, DRIVER_STATUS } = require('../../server/modules/delivery/domain/Delivery');
const { AuthorizationError } = require('../../server/shared/errors/AppError');

const SECOND = 1000;
const TTL = 120 * SECOND;
const T0 = Date.parse('2026-10-03T10:00:00.000Z');
const at = (offsetMs) => new Date(T0 + offsetMs).toISOString();

// ------------------------------------------------------------------- scaffolding

function makeWorld({ ttlMs = TTL } = {}) {
  const clock = { t: T0 };
  const repo = new DeliveryRepository({ db: null });
  const svc = new RiderPresenceService({ repository: repo, now: () => clock.t, ttlMs });
  let seq = 0;
  return {
    clock,
    repo,
    svc,
    /** The fake clock as ISO time, plus an offset. */
    iso: (offsetMs = 0) => new Date(clock.t + offsetMs).toISOString(),
    advance(ms) { clock.t += ms; },
    rider(id, over = {}) {
      return repo.upsertDriver({ profileId: id, name: `Rider ${id}`, phone: '+237600000000', ...over });
    },
    /** A delivery the rider holds in `status` (accepted by default: that is what makes a rider busy). */
    hold(riderId, status = S.ACCEPTED) {
      seq += 1;
      const stamp = new Date(clock.t).toISOString();
      return repo.insertDelivery({
        id: `dlv_${seq}`,
        orderId: `ord_${seq}`,
        buyerId: 'buyer_1',
        sellerId: 'seller_1',
        driverId: riderId,
        status,
        pickup: {},
        dropoff: {},
        handoverNonce: 1,
        codeAttempts: 0,
        createdAt: stamp,
        updatedAt: stamp
      });
    },
    /** Moves a delivery to another status, as the delivery service would. */
    async move(delivery, to) {
      const moved = await repo.updateWhere(delivery.id, {}, { status: to, updatedAt: new Date(clock.t).toISOString() });
      assert.ok(moved, `delivery ${delivery.id} could be moved to ${to}`);
      return moved;
    },
    stored: (id) => repo.findPresence(id)
  };
}

/** Replaces `obj[name]` with `make(original)`; the returned function puts it back. */
function interpose(obj, name, make) {
  const had = Object.prototype.hasOwnProperty.call(obj, name);
  const original = obj[name];
  obj[name] = make(original.bind(obj));
  return () => { if (had) obj[name] = original; else delete obj[name]; };
}

/** Counts calls to `obj[name]` without changing them. */
function spyOn(obj, name) {
  const calls = [];
  const restore = interpose(obj, name, (original) => (...args) => { calls.push(args); return original(...args); });
  return { calls, restore };
}

async function expectError(label, fn, want) {
  let caught = null;
  try { await fn(); } catch (err) { caught = err; }
  assert.ok(caught, `${label}: expected an error, but the call succeeded`);
  for (const [key, value] of Object.entries(want)) {
    if (key === 'type') {
      assert.ok(caught instanceof value, `${label}: expected a ${value.name}, got ${caught && caught.constructor && caught.constructor.name}: ${caught && caught.message}`);
    } else if (key === 'reason') {
      assert.strictEqual(caught.details && caught.details.reason, value, `${label}: reason was ${JSON.stringify(caught.details)}, wanted ${value}`);
    } else {
      assert.strictEqual(caught[key], value, `${label}: ${key} was ${JSON.stringify(caught[key])}, wanted ${JSON.stringify(value)}`);
    }
  }
  return caught;
}

const NOT_A_RIDER = { type: AuthorizationError, statusCode: 403, code: 'PERMISSION_DENIED', message: 'You are not a registered rider.' };
const NOT_ACTIVE = { type: AuthorizationError, statusCode: 403, code: 'PERMISSION_DENIED', message: 'Your rider account is not active.' };
const unavailable = (reason, message) => ({
  type: RiderUnavailableError,
  statusCode: 409,
  code: reason === 'busy' ? 'RIDER_BUSY' : 'RIDER_UNAVAILABLE',
  reason,
  ...(message ? { message } : {})
});

/** Asserts a presence object (or a stored row) field by field, so a failure names the field. */
function expectFields(label, got, want) {
  assert.ok(got, `${label}: got ${got}`);
  for (const [key, value] of Object.entries(want)) {
    assert.deepStrictEqual(got[key], value, `${label}: ${key} was ${JSON.stringify(got[key])}, wanted ${JSON.stringify(value)}`);
  }
}

const HERE = { lat: 4.0511, lng: 9.7679, accuracyM: 12 };
const THERE = { lat: 3.848, lng: 11.5021, accuracyM: 7 };

async function run() {
  console.log('  Testing Rider presence service...');

  // ------------------------------------------------------------------ construction
  {
    const repo = new DeliveryRepository({ db: null });
    assert.throws(() => new RiderPresenceService({}), TypeError, 'a repository is required');
    assert.throws(() => new RiderPresenceService(), TypeError, 'a repository is required (no options at all)');
    const ttlOf = (opts) => new RiderPresenceService({ repository: repo, ...opts }).ttlMs;

    assert.strictEqual(ttlOf({ ttlMs: 90000 }), 90000, 'the option is used as given');
    assert.strictEqual(ttlOf({ ttlMs: 5000 }), 15000, 'below the floor is raised to 15 s');
    assert.strictEqual(ttlOf({ ttlMs: 99999999 }), 3600000, 'above the ceiling is cut to 1 h');
    for (const unusable of [0, -5, NaN]) {
      assert.strictEqual(ttlOf({ ttlMs: unusable }), 120000, `ttlMs ${unusable} falls back to 120 s; it can never switch expiry off`);
    }

    const saved = process.env.RIDER_PRESENCE_TTL_SECONDS;
    try {
      delete process.env.RIDER_PRESENCE_TTL_SECONDS;
      assert.strictEqual(ttlOf({}), 120000, 'no option and no environment: the default');
      process.env.RIDER_PRESENCE_TTL_SECONDS = '45';
      assert.strictEqual(ttlOf({}), 45000, 'RIDER_PRESENCE_TTL_SECONDS is read in seconds');
      assert.strictEqual(ttlOf({ ttlMs: 90000 }), 90000, 'the option wins over the environment');
      process.env.RIDER_PRESENCE_TTL_SECONDS = 'junk';
      assert.strictEqual(ttlOf({}), 120000, 'a garbage environment value falls back to the default');
      process.env.RIDER_PRESENCE_TTL_SECONDS = '0';
      assert.strictEqual(ttlOf({}), 120000, 'zero in the environment does not disable expiry');
      process.env.RIDER_PRESENCE_TTL_SECONDS = '5';
      assert.strictEqual(ttlOf({}), 15000, 'the environment value is clamped too');
    } finally {
      if (saved === undefined) delete process.env.RIDER_PRESENCE_TTL_SECONDS;
      else process.env.RIDER_PRESENCE_TTL_SECONDS = saved;
    }

    const real = new RiderPresenceService({ repository: repo });
    assert.ok(Math.abs(real.now() - Date.now()) < 5000, 'without a clock option the real clock is used');
  }

  // --------------------------------------------------------------- not a registered rider
  {
    const w = makeWorld();
    await w.rider('someone_else');
    const acts = {
      getOwn: (id) => w.svc.getOwn(id),
      goOnline: (id) => w.svc.goOnline(id, HERE),
      goOffline: (id) => w.svc.goOffline(id),
      pause: (id) => w.svc.pause(id),
      resume: (id) => w.svc.resume(id, HERE),
      heartbeat: (id) => w.svc.heartbeat(id, HERE)
    };
    for (const id of ['ghost', '', null, undefined]) {
      for (const [name, act] of Object.entries(acts)) {
        await expectError(`${name}(${JSON.stringify(id)})`, () => act(id), NOT_A_RIDER);
      }
    }
    assert.strictEqual((await w.repo.listPresence()).length, 0, 'refused calls create no presence row for anyone');

    const resolved = await w.svc.resolve('ghost');
    expectFields('resolve(ghost)', resolved, { status: 'offline', available: false, reason: 'not_a_rider' });
    await expectError('claim(ghost)', () => w.svc.claim('ghost'), { ...unavailable('not_a_rider', 'You are not a registered rider.') });
    assert.strictEqual(await w.svc.reconcile('ghost'), null, 'reconcile of a stranger does nothing');
    assert.strictEqual(await w.svc.forceOffline('ghost'), null, 'forceOffline of a stranger does nothing');
    await expectError('assertAvailable(ghost)', () => w.svc.assertAvailable('ghost'), unavailable('not_a_rider', 'That account is not a rider.'));
    await expectError('assertAvailable(x, null)', () => w.svc.assertAvailable('someone_else', null), unavailable('not_a_rider'));
    assert.deepStrictEqual(await w.svc.expireStale(), [], 'nothing to expire');
    assert.strictEqual(await w.svc.healStaleBusy(), 0, 'nothing to heal');
    assert.strictEqual((await w.repo.listPresence()).length, 0, 'still no rows');
  }

  // -------------------------------------------------- only the caller's own presence moves
  {
    const w = makeWorld();
    await w.rider('rider_a');
    await w.rider('rider_b');
    // Whatever else the input says, it is rider_a's presence that moves, and only to what the
    // service decides: there is no way to name another rider or to hand the service a status.
    const out = await w.svc.goOnline('rider_a', { ...HERE, status: 'busy', riderId: 'rider_b', driverId: 'rider_b', available: false });
    expectFields('rider_a', out, { status: 'online', available: true, location: HERE });
    assert.strictEqual(await w.stored('rider_b'), null, 'rider_b has no row: nothing in the input could address them');
    assert.strictEqual((await w.stored('rider_a')).status, 'online');
    const beat = await w.svc.heartbeat('rider_a', { ...HERE, status: 'offline', riderId: 'rider_b' });
    assert.strictEqual(beat.presence.status, 'online', 'a heartbeat cannot carry a status');
    assert.strictEqual(await w.stored('rider_b'), null, 'a heartbeat cannot carry a rider id');
    // rider_b is untouched by anything rider_a does.
    await w.svc.goOnline('rider_b');
    await w.svc.pause('rider_a');
    assert.strictEqual((await w.stored('rider_b')).status, 'online', 'rider_a pausing does not touch rider_b');
    await w.svc.goOffline('rider_b');
    assert.strictEqual((await w.stored('rider_a')).status, 'paused', 'rider_b going offline does not touch rider_a');
  }

  // ------------------------------------------------------------------------ goOnline
  {
    const w = makeWorld();
    await w.rider('r1');

    // First time ever: no row yet.
    assert.strictEqual(await w.stored('r1'), null, 'a registered rider has no presence row until they act');
    const first = await w.svc.goOnline('r1');
    assert.deepStrictEqual(first, {
      status: 'online',
      available: true,
      reason: null,
      lastSeenAt: at(0),
      expiresAt: at(TTL),
      ttlSeconds: 120,
      heartbeatIntervalMs: 30000,
      location: null,
      updatedAt: at(0)
    }, 'the presence returned by the first go-online');
    expectFields('stored row', await w.stored('r1'), {
      riderId: 'r1', status: 'online', latitude: null, longitude: null, accuracy: null, lastSeenAt: at(0), updatedAt: at(0)
    });

    // With a position.
    w.advance(10 * SECOND);
    const located = await w.svc.goOnline('r1', HERE);
    expectFields('with a location', located, { status: 'online', location: HERE, lastSeenAt: at(10 * SECOND) });
    expectFields('stored with a location', await w.stored('r1'), { latitude: 4.0511, longitude: 9.7679, accuracy: 12 });

    // Idempotent: going online again is fine, refreshes the beat, and does not make a second row.
    w.advance(10 * SECOND);
    const again = await w.svc.goOnline('r1', HERE);
    expectFields('already online', again, { status: 'online', available: true, lastSeenAt: at(20 * SECOND), expiresAt: at(20 * SECOND + TTL) });
    assert.strictEqual((await w.repo.listPresence()).length, 1, 'one row per rider however often they go online');

    // Without a position: the old one is cleared, not kept.
    w.advance(10 * SECOND);
    const blind = await w.svc.goOnline('r1');
    assert.strictEqual(blind.location, null, 'no position given: no position shown');
    expectFields('stored without a location', await w.stored('r1'), { latitude: null, longitude: null, accuracy: null, status: 'online' });

    // A position with no accuracy.
    const noAccuracy = await w.svc.goOnline('r1', { lat: 4.05, lng: 9.76 });
    assert.deepStrictEqual(noAccuracy.location, { lat: 4.05, lng: 9.76, accuracyM: null }, 'accuracy is optional');
    expectFields('stored without accuracy', await w.stored('r1'), { latitude: 4.05, longitude: 9.76, accuracy: null });

    // From offline.
    await w.svc.goOffline('r1');
    assert.strictEqual((await w.svc.getOwn('r1')).status, 'offline');
    w.advance(SECOND);
    expectFields('offline -> online', await w.svc.goOnline('r1'), { status: 'online', available: true, reason: null });

    // From paused.
    await w.svc.pause('r1');
    assert.strictEqual((await w.svc.getOwn('r1')).status, 'paused');
    w.advance(SECOND);
    expectFields('paused -> online', await w.svc.goOnline('r1'), { status: 'online', available: true, reason: null });
    assert.strictEqual((await w.stored('r1')).status, 'online');

    // From expired (online row, silent past the window): a deliberate go-online revives them.
    w.advance(TTL);
    assert.strictEqual((await w.svc.getOwn('r1')).status, 'offline', 'silent past the window they read as offline');
    expectFields('expired -> online', await w.svc.goOnline('r1'), { status: 'online', available: true });
  }

  // goOnline for a rider who still carries a delivery: busy, never online.
  {
    const w = makeWorld();
    for (const [status, expected] of [
      [S.ACCEPTED, 'busy'], [S.PICKED_UP, 'busy'], [S.ARRIVED, 'busy'],
      [S.ASSIGNED, 'online'],  // an offer is not a commitment
      [S.FAILED, 'online']     // waiting on the seller, not on the rider
    ]) {
      const id = `rider_${status}`;
      await w.rider(id);
      await w.hold(id, status);
      const out = await w.svc.goOnline(id);
      assert.strictEqual(out.status, expected, `going online while holding a ${status} delivery gives ${expected}`);
      assert.strictEqual(out.available, expected === 'online', `...and available only when online (${status})`);
      assert.strictEqual((await w.stored(id)).status, expected, `the stored row says ${expected} too (${status})`);
      if (expected === 'busy') assert.strictEqual(out.reason, 'busy');
    }
  }

  // Two first go-online calls at once leave one row, online.
  {
    const w = makeWorld();
    await w.rider('r1');
    const [a, b] = await Promise.all([w.svc.goOnline('r1', HERE), w.svc.goOnline('r1')]);
    assert.strictEqual(a.status, 'online');
    assert.strictEqual(b.status, 'online');
    const rows = await w.repo.listPresence();
    assert.strictEqual(rows.length, 1, 'one row');
    assert.strictEqual(rows[0].status, 'online');
  }

  // ----------------------------------------------------------------------- goOffline
  {
    const w = makeWorld();
    await w.rider('r1');
    await w.svc.goOnline('r1', HERE);
    w.advance(20 * SECOND);
    const out = await w.svc.goOffline('r1');
    expectFields('went offline', out, {
      status: 'offline', available: false, reason: 'offline', location: null, expiresAt: null, lastSeenAt: at(0), updatedAt: at(20 * SECOND)
    });
    expectFields('stored after going offline', await w.stored('r1'), {
      status: 'offline', latitude: null, longitude: null, accuracy: null, lastSeenAt: at(0), updatedAt: at(20 * SECOND)
    });

    // Idempotent.
    w.advance(SECOND);
    expectFields('offline again', await w.svc.goOffline('r1'), { status: 'offline', available: false, location: null });
    assert.strictEqual((await w.stored('r1')).status, 'offline');

    // From paused.
    await w.svc.goOnline('r1');
    await w.svc.pause('r1');
    expectFields('paused -> offline', await w.svc.goOffline('r1'), { status: 'offline', available: false });
  }

  // A rider who never went online: offline, and nothing is written.
  {
    const w = makeWorld();
    await w.rider('never');
    const out = await w.svc.goOffline('never');
    expectFields('never online', out, { status: 'offline', available: false, reason: 'offline', lastSeenAt: null, expiresAt: null, location: null });
    assert.strictEqual(await w.stored('never'), null, 'going offline never creates a row');
    assert.strictEqual((await w.repo.listPresence()).length, 0);
  }

  // Refused while carrying a delivery.
  {
    const w = makeWorld();
    const BUSY_MSG = 'Finish or release your current delivery before going offline.';

    // Online row, accepted delivery not yet reconciled into the row.
    await w.rider('a');
    await w.svc.goOnline('a', HERE);
    const a1 = await w.hold('a');
    const before = JSON.stringify(await w.stored('a'));
    w.advance(10 * SECOND);
    await expectError('offline while online + accepted', () => w.svc.goOffline('a'), unavailable('busy', BUSY_MSG));
    assert.strictEqual(JSON.stringify(await w.stored('a')), before, 'a refused go-offline writes nothing');

    // Stored busy (claimed) with the accepted delivery behind it.
    await w.rider('b');
    await w.svc.goOnline('b');
    await w.svc.claim('b');
    const b1 = await w.hold('b');
    assert.strictEqual((await w.stored('b')).status, 'busy');
    await expectError('offline while stored busy', () => w.svc.goOffline('b'), unavailable('busy', BUSY_MSG));
    assert.strictEqual((await w.stored('b')).status, 'busy', 'still busy');

    // Picked up and arrived are carrying too.
    for (const status of [S.PICKED_UP, S.ARRIVED]) {
      await w.move(b1, status);
      await expectError(`offline while ${status}`, () => w.svc.goOffline('b'), unavailable('busy'));
    }

    // Once the job ends and presence is reconciled, they can go offline.
    await w.move(b1, S.DELIVERED);
    await w.svc.reconcile('b');
    expectFields('after delivering', await w.svc.goOffline('b'), { status: 'offline', available: false });
    await w.move(a1, S.DELIVERED);
    expectFields('after delivering (a)', await w.svc.goOffline('a'), { status: 'offline' });

    // An offer alone (not accepted) does not stop them.
    await w.rider('c');
    await w.svc.goOnline('c');
    const offer = await w.hold('c', S.ASSIGNED);
    expectFields('offers do not block going offline', await w.svc.goOffline('c'), { status: 'offline', available: false });
    const kept = await w.repo.findById(offer.id);
    assert.strictEqual(kept.status, S.ASSIGNED, 'the presence service leaves the offer where it is: taking it back is the delivery service\'s job');
    assert.strictEqual(kept.driverId, 'c');
  }

  // -------------------------------------------------------------------------- pause
  {
    const w = makeWorld();
    await w.rider('r1');
    await w.svc.goOnline('r1', HERE);
    w.advance(30 * SECOND);
    const out = await w.svc.pause('r1');
    expectFields('paused', out, {
      status: 'paused', available: false, reason: 'paused', location: null, expiresAt: null, lastSeenAt: at(0), updatedAt: at(30 * SECOND)
    });
    expectFields('stored paused', await w.stored('r1'), {
      status: 'paused', latitude: null, longitude: null, accuracy: null, lastSeenAt: at(0), updatedAt: at(30 * SECOND)
    });

    // Idempotent: nothing is written the second time.
    w.advance(60 * SECOND);
    const spy = spyOn(w.repo, 'transitionPresence');
    try {
      expectFields('paused again', await w.svc.pause('r1'), { status: 'paused', available: false, updatedAt: at(30 * SECOND) });
      assert.strictEqual(spy.calls.length, 0, 'pausing while paused writes nothing');
    } finally { spy.restore(); }
    assert.strictEqual((await w.stored('r1')).updatedAt, at(30 * SECOND));

    // A paused rider does not go stale: they are not asked to beat.
    w.advance(10 * TTL);
    expectFields('long paused is still paused', await w.svc.getOwn('r1'), { status: 'paused', reason: 'paused' });
  }
  {
    const w = makeWorld();
    await w.rider('off');
    await w.rider('never');
    await w.rider('stale');
    await w.rider('carrying');
    await w.rider('leak');

    await w.svc.goOnline('off');
    await w.svc.goOffline('off');
    await expectError('pause while offline', () => w.svc.pause('off'), unavailable('offline', 'Go online before pausing.'));
    assert.strictEqual((await w.stored('off')).status, 'offline', 'a refused pause changes nothing');

    await expectError('pause, never online', () => w.svc.pause('never'), unavailable('offline', 'Go online before pausing.'));
    assert.strictEqual(await w.stored('never'), null, 'a refused pause creates no row');

    await w.svc.goOnline('stale');
    await w.svc.goOnline('carrying');
    await w.hold('carrying');
    await w.svc.goOnline('leak');
    await w.svc.claim('leak');
    w.advance(TTL);
    await expectError('pause after silence', () => w.svc.pause('stale'), unavailable('expired', 'Go online before pausing.'));
    assert.strictEqual((await w.stored('stale')).status, 'online', 'a refused pause does not write: reads and refusals never change the row');

    await expectError('pause while carrying', () => w.svc.pause('carrying'),
      unavailable('busy', 'Finish or release your current delivery before pausing.'));
    assert.strictEqual((await w.svc.getOwn('carrying')).status, 'busy', 'still busy, not paused');

    await expectError('pause with a stored busy row', () => w.svc.pause('leak'), unavailable('busy'));
    assert.strictEqual((await w.stored('leak')).status, 'busy');
  }

  // ------------------------------------------------------------------------- resume
  {
    const w = makeWorld();
    await w.rider('r1');
    await w.svc.goOnline('r1', HERE);
    await w.svc.pause('r1');

    // A paused rider can come back however long the break was: they never expire.
    w.advance(10 * TTL);
    const out = await w.svc.resume('r1', THERE);
    expectFields('resumed', out, {
      status: 'online', available: true, reason: null, location: THERE, lastSeenAt: at(10 * TTL), expiresAt: at(10 * TTL + TTL)
    });
    expectFields('stored resumed', await w.stored('r1'), { status: 'online', latitude: 3.848, longitude: 11.5021, accuracy: 7, lastSeenAt: at(10 * TTL) });

    // Without a position.
    await w.svc.pause('r1');
    w.advance(SECOND);
    const blind = await w.svc.resume('r1');
    expectFields('resumed, no position', blind, { status: 'online', location: null });
    expectFields('stored, no position', await w.stored('r1'), { latitude: null, longitude: null, accuracy: null });

    // Idempotent when already online: nothing is written.
    w.advance(SECOND);
    const spy = spyOn(w.repo, 'transitionPresence');
    try {
      expectFields('resume while online', await w.svc.resume('r1', HERE), { status: 'online', available: true });
      assert.strictEqual(spy.calls.length, 0, 'resuming while online writes nothing');
      assert.strictEqual((await w.stored('r1')).latitude, null, 'and does not take a position either');
    } finally { spy.restore(); }

    // Idempotent for a busy rider: told they are busy, not refused.
    await w.svc.claim('r1');
    expectFields('resume while busy', await w.svc.resume('r1'), { status: 'busy', available: false, reason: 'busy' });
    assert.strictEqual((await w.stored('r1')).status, 'busy');
  }
  {
    const w = makeWorld();
    await w.rider('off');
    await w.rider('never');
    await w.rider('stale');
    await w.svc.goOnline('off');
    await w.svc.goOffline('off');
    await w.svc.goOnline('stale');
    w.advance(TTL);
    const MSG = 'You are not on a break. Go online instead.';
    await expectError('resume while offline', () => w.svc.resume('off', HERE), unavailable('offline', MSG));
    assert.strictEqual((await w.stored('off')).status, 'offline', 'a refused resume leaves them offline');
    await expectError('resume, never online', () => w.svc.resume('never'), unavailable('offline', MSG));
    assert.strictEqual(await w.stored('never'), null, 'a refused resume creates no row');
    await expectError('resume after silence', () => w.svc.resume('stale'), unavailable('expired', MSG));
    assert.strictEqual((await w.stored('stale')).status, 'online', 'unchanged');
  }

  // ---------------------------------------------------------------------- heartbeat
  {
    // Extends the expiry and refreshes the position.
    const w = makeWorld();
    await w.rider('r1');
    await w.svc.goOnline('r1', HERE);
    w.advance(60 * SECOND);
    const beat = await w.svc.heartbeat('r1', THERE);
    assert.strictEqual(beat.expired, false);
    expectFields('beat', beat.presence, {
      status: 'online', available: true, lastSeenAt: at(60 * SECOND), expiresAt: at(60 * SECOND + TTL), location: THERE, updatedAt: at(60 * SECOND)
    });
    expectFields('stored after beat', await w.stored('r1'), { lastSeenAt: at(60 * SECOND), latitude: 3.848, longitude: 11.5021, accuracy: 7 });

    // The result has exactly { presence, expired }.
    assert.deepStrictEqual(Object.keys(beat).sort(), ['expired', 'presence']);

    // Without ever stopping, a rider beating on schedule outlives many windows.
    for (let i = 0; i < 20; i += 1) {
      w.advance(30 * SECOND);
      const live = await w.svc.heartbeat('r1');
      assert.strictEqual(live.presence.status, 'online', `beat ${i}: still online`);
      assert.strictEqual(live.expired, false);
    }
    assert.ok(w.clock.t - T0 > 4 * TTL, 'the loop ran for well over a window');
  }

  // Throttle: beats closer than 5 s are acknowledged without a write.
  {
    const w = makeWorld();
    await w.rider('r1');
    await w.svc.goOnline('r1');           // T0
    w.advance(PRESENCE_MIN_WRITE_INTERVAL_MS - 1);
    const spy = spyOn(w.repo, 'transitionPresence');
    try {
      const early = await w.svc.heartbeat('r1', HERE);
      assert.strictEqual(spy.calls.length, 0, 'a beat 4.999 s after the last write does not write');
      expectFields('throttled beat', early.presence, { status: 'online', available: true, lastSeenAt: at(0), updatedAt: at(0), location: null });
      assert.strictEqual(early.expired, false);
      expectFields('stored after a throttled beat', await w.stored('r1'), { lastSeenAt: at(0), updatedAt: at(0), latitude: null, longitude: null });

      w.advance(1);
      const due = await w.svc.heartbeat('r1', HERE);
      assert.strictEqual(spy.calls.length, 1, 'a beat exactly 5 s after the last write does write');
      expectFields('beat at 5 s', due.presence, { lastSeenAt: at(5 * SECOND), updatedAt: at(5 * SECOND), location: HERE });
      expectFields('stored after the beat at 5 s', await w.stored('r1'), { lastSeenAt: at(5 * SECOND), latitude: 4.0511 });

      // Throttled again against the write just made.
      w.advance(2 * SECOND);
      await w.svc.heartbeat('r1', THERE);
      assert.strictEqual(spy.calls.length, 1, 'the throttle counts from the latest write');
      assert.strictEqual((await w.stored('r1')).latitude, 4.0511, 'the throttled beat\'s position was not taken');
    } finally { spy.restore(); }
  }

  // A heartbeat NEVER raises an offline or paused rider.
  {
    const w = makeWorld();
    await w.rider('off');
    await w.rider('paused');
    await w.rider('never');
    await w.svc.goOnline('off', HERE);
    await w.svc.goOnline('paused', HERE);
    w.advance(20 * SECOND);
    await w.svc.goOffline('off');
    await w.svc.pause('paused');
    const offBefore = JSON.stringify(await w.stored('off'));
    const pausedBefore = JSON.stringify(await w.stored('paused'));
    w.advance(30 * SECOND);

    const spy = spyOn(w.repo, 'transitionPresence');
    try {
      const o = await w.svc.heartbeat('off', THERE);
      expectFields('offline rider beats', o.presence, { status: 'offline', available: false, reason: 'offline', location: null });
      assert.strictEqual(o.expired, false, 'not an expiry: they chose to go offline');

      const p = await w.svc.heartbeat('paused', THERE);
      expectFields('paused rider beats', p.presence, { status: 'paused', available: false, reason: 'paused', location: null });
      assert.strictEqual(p.expired, false);

      assert.strictEqual(spy.calls.length, 0, 'neither beat wrote anything');
    } finally { spy.restore(); }
    assert.strictEqual(JSON.stringify(await w.stored('off')), offBefore, 'the offline row is byte-for-byte unchanged (no beat, no position)');
    assert.strictEqual(JSON.stringify(await w.stored('paused')), pausedBefore, 'the paused row is byte-for-byte unchanged');

    // Beat after beat, still down.
    for (let i = 0; i < 5; i += 1) {
      w.advance(30 * SECOND);
      assert.strictEqual((await w.svc.heartbeat('off')).presence.status, 'offline');
      assert.strictEqual((await w.svc.heartbeat('paused')).presence.status, 'paused');
    }
    assert.strictEqual((await w.stored('off')).status, 'offline');
    assert.strictEqual((await w.stored('paused')).status, 'paused');

    // Someone who never went online: told so, no row made.
    const n = await w.svc.heartbeat('never', HERE);
    expectFields('never online', n.presence, { status: 'offline', available: false, reason: 'offline', lastSeenAt: null });
    assert.strictEqual(n.expired, false);
    assert.strictEqual(await w.stored('never'), null, 'a heartbeat never creates a row');
  }

  // Expiry at exactly the window: the heartbeat itself sets the rider offline.
  {
    const w = makeWorld();
    await w.rider('r1');
    await w.svc.goOnline('r1', HERE);                // lastSeenAt = T0

    w.advance(TTL - 1);                                // 1 ms before: still fresh
    const alive = await w.svc.heartbeat('r1', THERE);
    assert.strictEqual(alive.expired, false, '1 ms before the window the rider is kept alive');
    expectFields('kept alive', alive.presence, { status: 'online', available: true, lastSeenAt: at(TTL - 1), location: THERE });

    // Fresh world for the exact boundary.
    const x = makeWorld();
    await x.rider('r1');
    await x.svc.goOnline('r1', HERE);
    x.advance(TTL);                                    // exactly one window of silence
    const gone = await x.svc.heartbeat('r1', THERE);
    assert.strictEqual(gone.expired, true, 'at exactly the window the beat finds them expired');
    expectFields('expired by the beat', gone.presence, { status: 'offline', available: false, location: null, expiresAt: null });
    expectFields('stored after expiry', await x.stored('r1'), {
      status: 'offline', latitude: null, longitude: null, accuracy: null, lastSeenAt: at(0), updatedAt: at(TTL)
    });
    assert.strictEqual((await x.svc.getOwn('r1')).status, 'offline');

    // And the next beat does not bring them back.
    x.advance(30 * SECOND);
    const next = await x.svc.heartbeat('r1', THERE);
    expectFields('after expiry', next.presence, { status: 'offline', available: false });
    assert.strictEqual(next.expired, false, 'expired is reported once: the rider is already offline now');
    assert.strictEqual((await x.stored('r1')).latitude, null, 'the position stays cleared');
  }

  // A busy rider never expires.
  {
    const w = makeWorld();
    await w.rider('r1');
    await w.svc.goOnline('r1', HERE);
    await w.svc.claim('r1');
    await w.hold('r1');
    w.advance(10 * TTL);
    expectFields('busy and silent for ten windows', await w.svc.getOwn('r1'), { status: 'busy', available: false, reason: 'busy' });
    const beat = await w.svc.heartbeat('r1', THERE);
    assert.strictEqual(beat.expired, false, 'a busy rider is never expired by silence');
    expectFields('busy beat', beat.presence, { status: 'busy', lastSeenAt: at(10 * TTL), location: THERE });
    expectFields('stored busy', await w.stored('r1'), { status: 'busy', lastSeenAt: at(10 * TTL), latitude: 3.848 });
    assert.deepStrictEqual(await w.svc.expireStale(), [], 'the sweeper leaves a busy rider alone too');
    assert.strictEqual((await w.stored('r1')).status, 'busy');

    // Even a busy rider's first beat after a long silence keeps them busy and takes the position.
    w.advance(10 * TTL);
    await w.svc.heartbeat('r1');
    assert.strictEqual((await w.stored('r1')).latitude, null, 'a beat without a position clears it for a busy rider too');
    assert.strictEqual((await w.stored('r1')).status, 'busy');
  }

  // Position is updated, replaced and cleared by successive beats.
  {
    const w = makeWorld();
    await w.rider('r1');
    await w.svc.goOnline('r1', HERE);
    w.advance(6 * SECOND);
    assert.deepStrictEqual((await w.svc.heartbeat('r1', THERE)).presence.location, THERE, 'a new position replaces the old');
    assert.deepStrictEqual((await w.stored('r1')).latitude, 3.848);
    w.advance(6 * SECOND);
    assert.strictEqual((await w.svc.heartbeat('r1')).presence.location, null, 'a beat without a position clears it');
    expectFields('cleared', await w.stored('r1'), { latitude: null, longitude: null, accuracy: null });
    w.advance(6 * SECOND);
    assert.deepStrictEqual((await w.svc.heartbeat('r1', { lat: 4.1, lng: 9.8 })).presence.location, { lat: 4.1, lng: 9.8, accuracyM: null },
      'a position without accuracy keeps accuracyM null');
    assert.strictEqual((await w.stored('r1')).status, 'online', 'position updates never change the status');
  }

  // A beat after the sweeper already expired the rider: stays offline, deterministically.
  {
    const w = makeWorld();
    await w.rider('r1');
    await w.svc.goOnline('r1', HERE);
    w.advance(TTL);
    assert.deepStrictEqual(await w.svc.expireStale(), ['r1'], 'the sweeper got there first');
    const beat = await w.svc.heartbeat('r1', HERE);
    expectFields('beat after the sweep', beat.presence, { status: 'offline', available: false });
    assert.strictEqual(beat.expired, false, 'the sweeper already took the offers back; the beat reports nothing to do');
    expectFields('stored', await w.stored('r1'), { status: 'offline', lastSeenAt: at(0), latitude: null });

    // The same outcome in the other order: the beat expires them, the sweeper finds nothing.
    const x = makeWorld();
    await x.rider('r1');
    await x.svc.goOnline('r1', HERE);
    x.advance(TTL);
    assert.strictEqual((await x.svc.heartbeat('r1')).expired, true);
    assert.deepStrictEqual(await x.svc.expireStale(), [], 'nothing left for the sweeper');
    expectFields('same final state either way', await x.stored('r1'), { status: 'offline', lastSeenAt: at(0), latitude: null, longitude: null });
  }

  // A beat racing "go offline" / "pause" cannot resurrect the rider.
  for (const [label, act, final] of [
    ['go offline', (w) => w.svc.goOffline('r1'), 'offline'],
    ['pause', (w) => w.svc.pause('r1'), 'paused']
  ]) {
    const w = makeWorld();
    await w.rider('r1');
    await w.svc.goOnline('r1', HERE);
    w.advance(10 * SECOND);
    let fired = false;
    const restore = interpose(w.repo, 'findPresence', (original) => async (id) => {
      const snapshot = await original(id);          // the heartbeat has now read "online"...
      if (!fired) {
        fired = true;
        await act(w);                               // ...and the rider taps the button before the heartbeat writes
      }
      return snapshot;
    });
    let beat;
    try {
      beat = await w.svc.heartbeat('r1', THERE);
    } finally { restore(); }
    assert.ok(fired, `${label}: the race was exercised`);
    assert.strictEqual(beat.presence.status, final, `${label}: the beat reports the rider's own choice`);
    assert.strictEqual(beat.presence.available, false);
    assert.strictEqual(beat.expired, false);
    expectFields(`${label}: stored`, await w.stored('r1'), { status: final, lastSeenAt: at(0), latitude: null, longitude: null });
    assert.strictEqual((await w.stored('r1')).updatedAt, at(10 * SECOND), `${label}: the beat's write did not land`);
  }

  // A beat that finds the rider stale but loses to a concurrent beat: not expired.
  {
    const w = makeWorld();
    await w.rider('r1');
    await w.svc.goOnline('r1', HERE);
    w.advance(TTL);                                   // stale for this reader
    let fired = false;
    const restore = interpose(w.repo, 'findPresence', (original) => async (id) => {
      const snapshot = await original(id);
      if (!fired) {
        fired = true;                                 // a beat from another tab lands first
        const revived = await w.repo.transitionPresence(id, ['online'], { lastSeenAt: w.iso(), updatedAt: w.iso() });
        assert.ok(revived, 'the competing beat landed');
      }
      return snapshot;
    });
    let beat;
    try {
      beat = await w.svc.heartbeat('r1');
    } finally { restore(); }
    assert.strictEqual(beat.expired, false, 'not expired: the competing beat made them fresh');
    expectFields('revived by the other beat', beat.presence, { status: 'online', available: true, lastSeenAt: at(TTL) });
    assert.strictEqual((await w.stored('r1')).status, 'online', 'the guarded write did not take them offline');
  }

  // Heartbeat concurrency: many at once leave a consistent row.
  {
    const w = makeWorld();
    await w.rider('r1');
    await w.svc.goOnline('r1');
    w.advance(10 * SECOND);
    const results = await Promise.all(Array.from({ length: 8 }, () => w.svc.heartbeat('r1', HERE)));
    assert.ok(results.every((r) => r.presence.status === 'online' && r.expired === false), 'every beat sees an online rider');
    expectFields('stored', await w.stored('r1'), { status: 'online', lastSeenAt: at(10 * SECOND) });
  }

  // ----------------------------------------------------------------- suspended rider
  {
    const w = makeWorld();
    await w.rider('sus', { status: DRIVER_STATUS.SUSPENDED });
    const acts = {
      getOwn: () => w.svc.getOwn('sus'),
      goOnline: () => w.svc.goOnline('sus', HERE),
      goOffline: () => w.svc.goOffline('sus'),
      pause: () => w.svc.pause('sus'),
      resume: () => w.svc.resume('sus'),
      heartbeat: () => w.svc.heartbeat('sus', HERE)
    };
    for (const [name, act] of Object.entries(acts)) {
      await expectError(`suspended ${name}`, act, NOT_ACTIVE);
    }
    assert.strictEqual(await w.stored('sus'), null, 'a suspended rider cannot create a presence row');
    expectFields('resolve', await w.svc.resolve('sus'), { status: 'suspended', available: false, reason: 'suspended' });
    await expectError('suspended assertAvailable', () => w.svc.assertAvailable('sus'), unavailable('suspended', 'That rider is suspended.'));
  }

  // Suspended AFTER going online (say a direct database update): the row still says online, the answer is suspended.
  {
    const w = makeWorld();
    await w.rider('r1');
    await w.svc.goOnline('r1', HERE);
    await w.svc.claim('r1');
    const a = await w.hold('r1');
    await w.rider('r1', { status: DRIVER_STATUS.SUSPENDED });
    assert.strictEqual((await w.stored('r1')).status, 'busy', 'the row was not touched by the suspension');
    expectFields('suspended with a busy row and a delivery', await w.svc.resolve('r1'),
      { status: 'suspended', available: false, reason: 'suspended', location: null });

    // Put the row to online-and-fresh: still not available.
    await w.move(a, S.DELIVERED);
    await w.repo.transitionPresence('r1', ['busy'], { status: 'online', lastSeenAt: w.iso(), updatedAt: w.iso() });
    assert.strictEqual((await w.stored('r1')).status, 'online');
    expectFields('suspended with an online fresh row', await w.svc.resolve('r1'), { status: 'suspended', available: false, reason: 'suspended' });
    await expectError('assertAvailable', () => w.svc.assertAvailable('r1'), unavailable('suspended'));
    const many = await w.svc.resolveMany(await w.repo.listDrivers({ status: null }));
    expectFields('resolveMany', many.get('r1'), { status: 'suspended', available: false });
    await expectError('heartbeat', () => w.svc.heartbeat('r1', HERE), NOT_ACTIVE);
    assert.strictEqual((await w.stored('r1')).status, 'online', 'a refused call from a suspended rider writes nothing');

    // forceOffline takes the stored row down whatever it is.
    w.advance(5 * SECOND);
    const forced = await w.svc.forceOffline('r1');
    expectFields('forced', forced, { status: 'offline', latitude: null, longitude: null, accuracy: null, updatedAt: w.iso() });
    assert.strictEqual((await w.stored('r1')).status, 'offline');

    // Reactivation does not bring them back: they have to go online themselves.
    await w.rider('r1', { status: DRIVER_STATUS.ACTIVE });
    expectFields('reactivated', await w.svc.getOwn('r1'), { status: 'offline', available: false, reason: 'offline' });
    expectFields('still not available to dispatch', await w.svc.resolve('r1'), { status: 'offline', available: false });
    assert.strictEqual((await w.svc.availableRiderIds(await w.repo.listDrivers({ status: 'active' }))).size, 0, 'dispatch sees nobody');
    const beat = await w.svc.heartbeat('r1', HERE);
    assert.strictEqual(beat.presence.status, 'offline', 'a beat does not bring them back either');
    expectFields('goes online again by choice', await w.svc.goOnline('r1'), { status: 'online', available: true });
  }

  // forceOffline: busy is not an obstacle (an administrator's act); a rider with no row stays row-less.
  {
    const w = makeWorld();
    await w.rider('r1');
    await w.rider('never');
    await w.svc.goOnline('r1', HERE);
    await w.svc.claim('r1');
    await w.hold('r1');
    const forced = await w.svc.forceOffline('r1');
    assert.ok(forced, 'forceOffline returned the updated row');
    expectFields('forced while busy', await w.stored('r1'), { status: 'offline', latitude: null, longitude: null });
    assert.strictEqual(await w.svc.forceOffline('never'), null, 'nothing to force');
    assert.strictEqual(await w.stored('never'), null, 'and no row was created');
    // Idempotent.
    expectFields('forced twice', await w.svc.forceOffline('r1'), { status: 'offline' });
    // A paused rider is forced offline too.
    await w.rider('p');
    await w.svc.goOnline('p');
    await w.svc.pause('p');
    expectFields('paused -> forced offline', await w.svc.forceOffline('p'), { status: 'offline' });
  }

  // ---------------------------------------------------------------------------- claim
  {
    const w = makeWorld();
    await w.rider('r1');
    await w.svc.goOnline('r1', HERE);
    w.advance(100 * SECOND);                               // fresh: the window is 120 s
    const claimed = await w.svc.claim('r1');
    expectFields('claimed', claimed, { riderId: 'r1', status: 'busy', lastSeenAt: at(100 * SECOND), updatedAt: at(100 * SECOND) });
    assert.strictEqual((await w.stored('r1')).status, 'busy');
    assert.strictEqual((await w.svc.getOwn('r1')).status, 'busy');

    // The second claim is refused as busy, not as unavailable.
    const second = await expectError('second claim', () => w.svc.claim('r1'),
      unavailable('busy', 'Finish your current delivery before taking another.'));
    assert.strictEqual(second.statusCode, 409);
    assert.strictEqual((await w.stored('r1')).status, 'busy', 'a refused claim changes nothing');
  }
  {
    // Freshness boundary, decided in the same step as the claim.
    const w = makeWorld();
    await w.rider('edge');
    await w.rider('late');
    await w.svc.goOnline('edge');
    await w.svc.goOnline('late');
    w.advance(TTL - 1);
    expectFields('claim 1 ms before the window', await w.svc.claim('edge'), { status: 'busy' });
    w.advance(1);                                          // exactly one window since `late` was last seen
    await expectError('claim at exactly the window', () => w.svc.claim('late'),
      unavailable('expired', 'You went offline because the app stopped responding. Go online to take deliveries.'));
    assert.strictEqual((await w.stored('late')).status, 'online', 'a refused claim does not write');
    assert.strictEqual((await w.stored('late')).lastSeenAt, at(0), 'and does not refresh the beat');
    // Silent rider cannot claim however long.
    w.advance(10 * TTL);
    await expectError('claim long after', () => w.svc.claim('late'), unavailable('expired'));
  }
  {
    // Every other state says why.
    const w = makeWorld();
    for (const id of ['off', 'paused', 'never', 'sus']) await w.rider(id, id === 'sus' ? { status: DRIVER_STATUS.SUSPENDED } : {});
    await w.svc.goOnline('off');
    await w.svc.goOffline('off');
    await w.svc.goOnline('paused');
    await w.svc.pause('paused');
    await expectError('claim offline', () => w.svc.claim('off'), unavailable('offline', 'You are offline. Go online to take deliveries.'));
    await expectError('claim paused', () => w.svc.claim('paused'), unavailable('paused', 'You are on a break. Resume to take deliveries.'));
    await expectError('claim, never online', () => w.svc.claim('never'), unavailable('offline'));
    await expectError('claim suspended (no row)', () => w.svc.claim('sus'), unavailable('suspended', 'Your rider account is not active.'));
    assert.strictEqual((await w.stored('off')).status, 'offline');
    assert.strictEqual((await w.stored('paused')).status, 'paused');
    assert.strictEqual(await w.stored('never'), null, 'a refused claim creates no row');
    // A heartbeat does not make a paused or offline rider claimable.
    await w.svc.heartbeat('off');
    await w.svc.heartbeat('paused');
    await expectError('claim after a beat, offline', () => w.svc.claim('off'), unavailable('offline'));
    await expectError('claim after a beat, paused', () => w.svc.claim('paused'), unavailable('paused'));
  }
  {
    // Two claims at once: exactly one wins.
    const w = makeWorld();
    await w.rider('r1');
    await w.svc.goOnline('r1');
    const settled = await Promise.allSettled([w.svc.claim('r1'), w.svc.claim('r1')]);
    const won = settled.filter((s) => s.status === 'fulfilled');
    const lost = settled.filter((s) => s.status === 'rejected');
    assert.strictEqual(won.length, 1, 'exactly one of two simultaneous claims wins');
    assert.strictEqual(lost.length, 1, 'and the other is refused');
    assert.strictEqual(won[0].value.status, 'busy');
    assert.ok(lost[0].reason instanceof RiderUnavailableError, 'the loser gets the presence 409');
    assert.strictEqual(lost[0].reason.code, 'RIDER_BUSY', 'told they are busy');
    assert.strictEqual(lost[0].reason.statusCode, 409);

    // Five at once.
    const x = makeWorld();
    await x.rider('r1');
    await x.svc.goOnline('r1');
    const five = await Promise.allSettled(Array.from({ length: 5 }, () => x.svc.claim('r1')));
    assert.strictEqual(five.filter((s) => s.status === 'fulfilled').length, 1, 'one winner out of five');
    assert.ok(five.filter((s) => s.status === 'rejected').every((s) => s.reason.code === 'RIDER_BUSY'), 'four losers, all told busy');

    // Different riders claiming at once do not interfere.
    const y = makeWorld();
    await y.rider('a');
    await y.rider('b');
    await y.svc.goOnline('a');
    await y.svc.goOnline('b');
    const both = await Promise.allSettled([y.svc.claim('a'), y.svc.claim('b')]);
    assert.ok(both.every((s) => s.status === 'fulfilled'), 'two riders can each claim');
    assert.strictEqual((await y.stored('a')).status, 'busy');
    assert.strictEqual((await y.stored('b')).status, 'busy');
  }
  {
    // A claim whose delivery change fails is given back with reconcile.
    const w = makeWorld();
    await w.rider('r1');
    await w.svc.goOnline('r1');
    await w.svc.claim('r1');
    assert.strictEqual((await w.stored('r1')).status, 'busy');
    // (no delivery was ever accepted)
    await w.svc.reconcile('r1');
    assert.strictEqual((await w.stored('r1')).status, 'online', 'the claim was given back');
    expectFields('claimable again', await w.svc.claim('r1'), { status: 'busy' });
  }

  // -------------------------------------------------------------------------- reconcile
  {
    const w = makeWorld();
    await w.rider('r1');
    assert.strictEqual(await w.svc.reconcile('r1'), null, 'no row: nothing to reconcile');
    assert.strictEqual(await w.stored('r1'), null, 'and none is made');

    // online + an accepted delivery -> busy
    await w.svc.goOnline('r1', HERE);
    const d = await w.hold('r1');
    w.advance(10 * SECOND);
    const busy = await w.svc.reconcile('r1');
    expectFields('online -> busy', busy, { status: 'busy', updatedAt: at(10 * SECOND), lastSeenAt: at(0) });
    assert.strictEqual((await w.svc.getOwn('r1')).status, 'busy');

    // busy + still carrying: unchanged
    w.advance(10 * SECOND);
    expectFields('busy stays busy', await w.svc.reconcile('r1'), { status: 'busy', updatedAt: at(10 * SECOND) });

    // picked up, arrived: still busy
    for (const status of [S.PICKED_UP, S.ARRIVED]) {
      await w.move(d, status);
      expectFields(`busy while ${status}`, await w.svc.reconcile('r1'), { status: 'busy' });
    }

    // delivered -> busy -> online
    await w.move(d, S.DELIVERED);
    w.advance(5 * SECOND);
    const free = await w.svc.reconcile('r1');
    expectFields('busy -> online', free, { status: 'online', updatedAt: at(25 * SECOND) });
    expectFields('own view', await w.svc.getOwn('r1'), { status: 'online' });

    // online + nothing: unchanged (no write)
    const spy = spyOn(w.repo, 'transitionPresence');
    try {
      const same = await w.svc.reconcile('r1');
      expectFields('online stays online', same, { status: 'online', updatedAt: at(25 * SECOND) });
      assert.strictEqual(spy.calls.length, 0, 'an up-to-date row is not rewritten');
    } finally { spy.restore(); }
  }
  {
    // An offer or a failed delivery does not make a rider busy; a delivery ending in other ways frees them.
    const w = makeWorld();
    await w.rider('r1');
    await w.svc.goOnline('r1');
    const offer = await w.hold('r1', S.ASSIGNED);
    expectFields('offer only', await w.svc.reconcile('r1'), { status: 'online' });
    await w.move(offer, S.ACCEPTED);
    expectFields('offer accepted', await w.svc.reconcile('r1'), { status: 'busy' });
    await w.move(offer, S.FAILED);
    expectFields('failed hands it back to the seller: free', await w.svc.reconcile('r1'), { status: 'online' });
    await w.move(offer, S.ACCEPTED);
    await w.svc.reconcile('r1');
    await w.move(offer, S.CANCELLED);
    expectFields('cancelled: free', await w.svc.reconcile('r1'), { status: 'online' });
  }
  {
    // Reconcile never raises an offline or paused rider.
    const w = makeWorld();
    await w.rider('off');
    await w.rider('paused');
    await w.svc.goOnline('off');
    await w.svc.goOffline('off');
    await w.svc.goOnline('paused');
    await w.svc.pause('paused');
    await w.hold('off');
    await w.hold('paused');
    expectFields('offline + accepted delivery', await w.svc.reconcile('off'), { status: 'offline' });
    expectFields('paused + accepted delivery', await w.svc.reconcile('paused'), { status: 'paused' });
    assert.strictEqual((await w.stored('off')).status, 'offline', 'still offline in the store');
    assert.strictEqual((await w.stored('paused')).status, 'paused', 'still paused in the store');
    // They read as busy (derived from the delivery) but are never offered work.
    assert.strictEqual((await w.svc.getOwn('off')).status, 'busy');
    assert.strictEqual((await w.svc.availableRiderIds(await w.repo.listDrivers())).size, 0, 'neither is offerable');
  }

  // -------------------------------------------------------------------- healStaleBusy
  {
    const w = makeWorld();
    await w.rider('r1');
    await w.svc.goOnline('r1');
    await w.svc.claim('r1');                               // a busy row with no delivery behind it

    w.advance(PRESENCE_CLAIM_GRACE_MS - 1);
    assert.strictEqual(await w.svc.healStaleBusy(), 0, 'younger than the grace: it may be a claim whose delivery is still being written');
    assert.strictEqual((await w.stored('r1')).status, 'busy', 'left alone');

    w.advance(1);
    assert.strictEqual(await w.svc.healStaleBusy(), 1, 'at the grace it is a leak and is put right');
    expectFields('healed', await w.stored('r1'), { status: 'online', updatedAt: at(PRESENCE_CLAIM_GRACE_MS) });
    assert.strictEqual(await w.svc.healStaleBusy(), 0, 'nothing more to heal');
  }
  {
    // A busy rider who really holds an accepted delivery is never "healed".
    const w = makeWorld();
    await w.rider('real');
    await w.rider('leak');
    await w.svc.goOnline('real');
    await w.svc.goOnline('leak');
    await w.svc.claim('real');
    await w.svc.claim('leak');
    await w.hold('real');
    w.advance(10 * TTL);
    assert.strictEqual(await w.svc.healStaleBusy(), 1, 'only the rider with nothing behind the row');
    assert.strictEqual((await w.stored('real')).status, 'busy', 'the rider carrying a delivery stays busy');
    assert.strictEqual((await w.stored('leak')).status, 'online');

    // picked up / arrived count as carrying, an offer does not.
    await w.rider('pu');
    await w.rider('offered');
    await w.svc.goOnline('pu');
    await w.svc.goOnline('offered');
    await w.svc.claim('pu');
    await w.svc.claim('offered');
    await w.hold('pu', S.PICKED_UP);
    await w.hold('offered', S.ASSIGNED);
    w.advance(PRESENCE_CLAIM_GRACE_MS);
    assert.strictEqual(await w.svc.healStaleBusy(), 1, 'the picked-up rider is carrying; the one holding only an offer is healed');
    assert.strictEqual((await w.stored('pu')).status, 'busy');
    assert.strictEqual((await w.stored('offered')).status, 'online');
  }
  {
    // Rows that are not busy are never touched, however old.
    const w = makeWorld();
    for (const id of ['on', 'off', 'paused']) await w.rider(id);
    await w.svc.goOnline('on');
    await w.svc.goOnline('off');
    await w.svc.goOffline('off');
    await w.svc.goOnline('paused');
    await w.svc.pause('paused');
    const before = JSON.stringify(await w.repo.listPresence());
    w.advance(10 * TTL);
    assert.strictEqual(await w.svc.healStaleBusy(), 0);
    assert.strictEqual(JSON.stringify(await w.repo.listPresence()), before, 'no row changed');
  }
  {
    // The write is guarded: a claim that lands after the janitor read its candidates is not undone.
    const w = makeWorld();
    await w.rider('r1');
    await w.svc.goOnline('r1');
    await w.svc.claim('r1');
    w.advance(5 * PRESENCE_CLAIM_GRACE_MS);
    let fired = false;
    const restore = interpose(w.repo, 'findStaleBusyPresence', (original) => async (...args) => {
      const candidates = await original(...args);
      assert.strictEqual(candidates.length, 1, 'the janitor did see the leaked row');
      if (!fired) {
        fired = true;                                      // the rider accepts another delivery right now
        const reclaimed = await w.repo.transitionPresence('r1', ['busy'], { status: 'busy', lastSeenAt: w.iso(), updatedAt: w.iso() });
        assert.ok(reclaimed, 'the fresh claim landed');
      }
      return candidates;
    });
    let healed;
    try {
      healed = await w.svc.healStaleBusy();
    } finally { restore(); }
    assert.ok(fired);
    assert.strictEqual(healed, 0, 'the janitor\'s write found the row newer than it read, and did nothing');
    expectFields('still busy', await w.stored('r1'), { status: 'busy', updatedAt: at(5 * PRESENCE_CLAIM_GRACE_MS) });
  }
  {
    // Bounded, oldest first.
    const w = makeWorld();
    for (const id of ['a', 'b', 'c']) {
      await w.rider(id);
      await w.svc.goOnline(id);
      await w.svc.claim(id);
      w.advance(SECOND);                                   // a is claimed first, c last
    }
    w.advance(10 * TTL);
    assert.strictEqual(await w.svc.healStaleBusy({ limit: 2 }), 2, 'two healed under a limit of two');
    assert.strictEqual((await w.stored('a')).status, 'online', 'the oldest first');
    assert.strictEqual((await w.stored('b')).status, 'online');
    assert.strictEqual((await w.stored('c')).status, 'busy', 'the newest waits for the next pass');
    assert.strictEqual(await w.svc.healStaleBusy({ limit: 2 }), 1);
    assert.strictEqual((await w.stored('c')).status, 'online');
    assert.strictEqual(await w.svc.healStaleBusy({ limit: 2 }), 0);
  }

  // ---------------------------------------------------------------------- expireStale
  {
    const w = makeWorld();
    await w.rider('r1');
    await w.svc.goOnline('r1', HERE);
    w.advance(TTL - 1);
    assert.deepStrictEqual(await w.svc.expireStale(), [], '1 ms before the window nobody is expired');
    assert.strictEqual((await w.stored('r1')).status, 'online');
    w.advance(1);
    assert.deepStrictEqual(await w.svc.expireStale(), ['r1'], 'at exactly the window the rider is expired');
    expectFields('expired', await w.stored('r1'), {
      status: 'offline', latitude: null, longitude: null, accuracy: null, lastSeenAt: at(0), updatedAt: at(TTL)
    });
    expectFields('reads offline', await w.svc.getOwn('r1'), { status: 'offline', available: false, reason: 'offline', location: null });
    assert.deepStrictEqual(await w.svc.expireStale(), [], 'not expired twice');
    assert.strictEqual((await w.svc.availableRiderIds(await w.repo.listDrivers())).size, 0, 'dispatch no longer sees them');
  }
  {
    // Returns only the ids actually changed.
    const w = makeWorld();
    for (const id of ['stale_a', 'stale_g', 'fresh', 'off', 'paused', 'busy']) await w.rider(id);
    await w.svc.goOnline('stale_a');
    await w.svc.goOnline('stale_g');
    await w.svc.goOnline('off');
    await w.svc.goOffline('off');
    await w.svc.goOnline('paused');
    await w.svc.pause('paused');
    await w.svc.goOnline('busy');
    await w.svc.claim('busy');
    await w.hold('busy');
    w.advance(100 * SECOND);
    await w.svc.goOnline('fresh');
    w.advance(20 * SECOND);                                // stale_a, stale_g: a full window of silence; fresh: 20 s
    const expired = await w.svc.expireStale();
    assert.deepStrictEqual([...expired].sort(), ['stale_a', 'stale_g'], 'only the stale online riders');
    assert.strictEqual((await w.stored('fresh')).status, 'online');
    assert.strictEqual((await w.stored('off')).status, 'offline');
    assert.strictEqual((await w.stored('paused')).status, 'paused', 'a paused rider does not expire');
    assert.strictEqual((await w.stored('busy')).status, 'busy', 'a busy rider does not expire');

    // A long time later: paused and busy still do not expire.
    w.advance(10 * TTL);
    assert.deepStrictEqual(await w.svc.expireStale(), ['fresh'], 'now the one who was fresh is stale; paused and busy still are not');
    assert.strictEqual((await w.stored('paused')).status, 'paused');
    assert.strictEqual((await w.stored('busy')).status, 'busy');
  }
  {
    // A rider who beat since is skipped, whichever way the beat lands.
    const w = makeWorld();
    await w.rider('beat_before');
    await w.rider('beat_during');
    await w.svc.goOnline('beat_before');
    await w.svc.goOnline('beat_during');
    w.advance(TTL - 10 * SECOND);
    await w.svc.heartbeat('beat_before', HERE);            // beat before the sweep: not even a candidate
    w.advance(10 * SECOND);
    let fired = false;
    const restore = interpose(w.repo, 'findStalePresence', (original) => async (...args) => {
      const candidates = await original(...args);
      assert.deepStrictEqual(candidates.map((r) => r.riderId), ['beat_during'], 'only the rider silent for a window was a candidate');
      if (!fired) {
        fired = true;
        const beat = await w.repo.transitionPresence('beat_during', ['online'], { lastSeenAt: w.iso(), updatedAt: w.iso() });
        assert.ok(beat, 'a beat landed between the sweeper\'s read and its write');
      }
      return candidates;
    });
    let expired;
    try {
      expired = await w.svc.expireStale();
    } finally { restore(); }
    assert.ok(fired);
    assert.deepStrictEqual(expired, [], 'neither rider was expired');
    assert.strictEqual((await w.stored('beat_before')).status, 'online');
    expectFields('beat during the sweep', await w.stored('beat_during'), { status: 'online', lastSeenAt: at(TTL) });
    assert.strictEqual((await w.svc.getOwn('beat_during')).status, 'online');
  }
  {
    // Bounded and oldest first; the backlog is worked off over several sweeps.
    const w = makeWorld();
    for (const [id, offset] of [['r1', 0], ['r2', 1000], ['r3', 2000]]) {
      await w.rider(id);
      w.clock.t = T0 + offset;
      await w.svc.goOnline(id);
    }
    w.clock.t = T0 + 2000 + TTL + 5000;
    assert.deepStrictEqual(await w.svc.expireStale({ limit: 2 }), ['r1', 'r2'], 'the two silent longest, oldest first');
    assert.strictEqual((await w.stored('r3')).status, 'online', 'the third waits');
    assert.deepStrictEqual(await w.svc.expireStale({ limit: 2 }), ['r3']);
    assert.deepStrictEqual(await w.svc.expireStale({ limit: 2 }), []);
  }
  {
    // The default bound is 50 a pass.
    const w = makeWorld();
    for (let i = 0; i < 52; i += 1) {
      const id = `bulk_${String(i).padStart(2, '0')}`;
      await w.rider(id);
      await w.svc.goOnline(id);
    }
    w.advance(TTL);
    assert.strictEqual((await w.svc.expireStale()).length, 50, 'a default pass expires at most 50');
    assert.strictEqual((await w.svc.expireStale()).length, 2, 'the rest on the next pass');
    assert.strictEqual((await w.repo.listPresence()).filter((r) => r.status === 'online').length, 0);
  }

  // ----------------------------------------------- availableRiderIds / resolveMany / assertAvailable
  {
    const w = makeWorld();
    const ids = ['stale', 'avail', 'offered', 'failed', 'offline', 'paused', 'busy_row', 'carrying', 'never', 'sus', 'outsider'];
    for (const id of ids) await w.rider(id, id === 'sus' ? { status: DRIVER_STATUS.SUSPENDED } : {});

    await w.svc.goOnline('stale');
    w.advance(TTL + SECOND);                               // `stale` has now been silent for more than a window

    for (const id of ['avail', 'offered', 'failed', 'offline', 'paused', 'busy_row', 'carrying', 'outsider']) await w.svc.goOnline(id);
    await w.hold('offered', S.ASSIGNED);
    await w.hold('failed', S.FAILED);
    await w.svc.goOffline('offline');
    await w.svc.pause('paused');
    await w.svc.claim('busy_row');
    await w.hold('carrying');                              // accepted, row not reconciled: still stored online

    const active = (await w.repo.listDrivers({ status: 'active' })).filter((d) => d.id !== 'outsider');
    const available = await w.svc.availableRiderIds(active);
    assert.ok(available instanceof Set, 'a Set of ids');
    assert.deepStrictEqual([...available].sort(), ['avail', 'failed', 'offered'].sort(),
      'online + fresh + not carrying: riders holding only an offer or a failed delivery are still eligible; everyone else is not');
    assert.ok(!available.has('outsider'), 'a rider outside the list given is not chosen');
    assert.ok(!available.has('carrying'), 'stored online but carrying an accepted delivery: not available');
    assert.ok(!available.has('stale'), 'silent past the window: not available');
    assert.ok(!available.has('sus'), 'suspended: not available');
    assert.strictEqual((await w.svc.availableRiderIds([])).size, 0, 'an empty list gives an empty set');

    // The same people through resolveMany.
    const everyone = await w.repo.listDrivers({ status: null });
    const many = await w.svc.resolveMany(everyone);
    assert.ok(many instanceof Map);
    assert.strictEqual(many.size, ids.length, 'one answer per rider asked about');
    const want = {
      stale: ['offline', 'expired'], avail: ['online', null], offered: ['online', null], failed: ['online', null],
      offline: ['offline', 'offline'], paused: ['paused', 'paused'], busy_row: ['busy', 'busy'], carrying: ['busy', 'busy'],
      never: ['offline', 'offline'], sus: ['suspended', 'suspended'], outsider: ['online', null]
    };
    for (const [id, [status, reason]] of Object.entries(want)) {
      expectFields(`resolveMany(${id})`, many.get(id), { status, reason, available: status === 'online' });
    }
    expectFields('resolveMany carries the last beat', many.get('avail'), { lastSeenAt: at(TTL + SECOND) });
    assert.strictEqual(many.get('never').lastSeenAt, null);
    assert.strictEqual((await w.svc.resolveMany([])).size, 0);

    // availableRiderIds and resolveMany agree on who is available (the same rule, read two ways).
    const fromMany = [...many.entries()].filter(([id, r]) => r.available && id !== 'outsider').map(([id]) => id).sort();
    assert.deepStrictEqual(fromMany, [...available].sort(), 'both reads give the same available riders');

    // assertAvailable: each reason.
    const resolved = await w.svc.assertAvailable('avail');
    expectFields('available rider', resolved, { status: 'online', available: true, reason: null });
    const driver = await w.repo.findDriver('avail');
    expectFields('available rider, driver given', await w.svc.assertAvailable('avail', driver), { status: 'online', available: true });
    await expectError('offline', () => w.svc.assertAvailable('offline'), unavailable('offline', 'That rider is offline.'));
    await expectError('expired', () => w.svc.assertAvailable('stale'), unavailable('expired', 'That rider is offline: they stopped responding.'));
    await expectError('paused', () => w.svc.assertAvailable('paused'), unavailable('paused', 'That rider is on a break.'));
    await expectError('busy row', () => w.svc.assertAvailable('busy_row'), unavailable('busy', 'That rider is busy with another delivery.'));
    await expectError('carrying', () => w.svc.assertAvailable('carrying'), unavailable('busy'));
    await expectError('suspended', () => w.svc.assertAvailable('sus'), unavailable('suspended'));
    await expectError('never online', () => w.svc.assertAvailable('never'), unavailable('offline'));
    await expectError('not a rider', () => w.svc.assertAvailable('ghost'), unavailable('not_a_rider'));
    // An offer alone does not make a rider unavailable.
    expectFields('offered', await w.svc.assertAvailable('offered'), { status: 'online' });
  }

  // ------------------------------------------------------------- reads never write
  {
    // Silence expires a rider in every READ without touching the row, so a deployment that
    // cannot run the sweeper is never wrong, and a read can never create or change presence.
    const w = makeWorld();
    for (const id of ['never', 'stale', 'busy', 'paused']) await w.rider(id);
    await w.svc.goOnline('stale', HERE);
    await w.svc.goOnline('busy');
    await w.svc.claim('busy');
    await w.hold('busy');
    await w.svc.goOnline('paused');
    await w.svc.pause('paused');
    w.advance(TTL);
    const rowsBefore = JSON.stringify(await w.repo.listPresence());
    const everyone = await w.repo.listDrivers({ status: null });

    const ensure = spyOn(w.repo, 'ensurePresence');
    const swap = spyOn(w.repo, 'transitionPresence');
    try {
      expectFields('getOwn, never online', await w.svc.getOwn('never'), { status: 'offline', reason: 'offline', lastSeenAt: null });
      expectFields('getOwn, silent', await w.svc.getOwn('stale'), { status: 'offline', available: false, reason: 'expired', location: null });
      expectFields('getOwn, busy', await w.svc.getOwn('busy'), { status: 'busy' });
      expectFields('getOwn, paused', await w.svc.getOwn('paused'), { status: 'paused' });
      expectFields('resolve, silent', await w.svc.resolve('stale'), { status: 'offline', reason: 'expired', expired: true });
      await w.svc.resolveMany(everyone);
      await w.svc.availableRiderIds(everyone);
      await expectError('assertAvailable, silent', () => w.svc.assertAvailable('stale'), unavailable('expired'));
      assert.strictEqual(ensure.calls.length, 0, 'no read or refusal created a row');
      assert.strictEqual(swap.calls.length, 0, 'no read or refusal attempted a write');
    } finally { swap.restore(); ensure.restore(); }
    await expectError('claim, silent', () => w.svc.claim('stale'), unavailable('expired'));
    assert.strictEqual(await w.stored('never'), null, 'a rider who never went online still has no row');
    assert.strictEqual(JSON.stringify(await w.repo.listPresence()), rowsBefore, 'every stored row is exactly as it was');
    assert.strictEqual((await w.stored('stale')).status, 'online', 'the silent rider is still stored online: it reads offline without being rewritten');
  }

  // ----------------------------------------------------- whole lifecycle, end to end
  {
    // online -> accept (busy) -> deliver (online) -> go quiet (offline) -> beat does not revive.
    const w = makeWorld();
    await w.rider('r1');
    assert.strictEqual((await w.svc.getOwn('r1')).status, 'offline', 'a new rider starts offline');
    assert.strictEqual((await w.svc.availableRiderIds(await w.repo.listDrivers())).size, 0, 'and is not offered anything');

    await w.svc.goOnline('r1', HERE);
    assert.deepStrictEqual([...await w.svc.availableRiderIds(await w.repo.listDrivers())], ['r1'], 'online: offerable');

    await w.svc.claim('r1');
    const job = await w.hold('r1');
    assert.strictEqual((await w.svc.availableRiderIds(await w.repo.listDrivers())).size, 0, 'busy: not offerable');

    w.advance(10 * SECOND);
    await w.svc.heartbeat('r1', THERE);
    await w.move(job, S.DELIVERED);
    await w.svc.reconcile('r1');
    assert.deepStrictEqual([...await w.svc.availableRiderIds(await w.repo.listDrivers())], ['r1'], 'delivered: offerable again');

    w.advance(TTL);
    assert.strictEqual((await w.svc.availableRiderIds(await w.repo.listDrivers())).size, 0, 'silent for a window: not offerable, before any sweep ran');
    assert.strictEqual((await w.svc.getOwn('r1')).status, 'offline');
    assert.strictEqual((await w.stored('r1')).status, 'online', 'the row is only tidied by the sweep or the next beat');
    assert.deepStrictEqual(await w.svc.expireStale(), ['r1']);
    assert.strictEqual((await w.svc.heartbeat('r1', HERE)).presence.status, 'offline', 'the app waking up does not put them back');
    await w.svc.goOnline('r1', HERE);
    assert.deepStrictEqual([...await w.svc.availableRiderIds(await w.repo.listDrivers())], ['r1'], 'only going online does');
  }

  // ------------------------------------- repository: the compare-and-swap guards
  {
    const repo = new DeliveryRepository({ db: null });
    const T = '2026-10-03T10:00:00.000Z';
    const plus = (ms, base = T) => new Date(Date.parse(base) + ms).toISOString();
    const LATER = '2026-10-03T10:30:00.000Z';
    let n = 0;
    const seed = async (id, over = {}) => {
      await repo.ensurePresence(id, T);
      const moved = await repo.transitionPresence(id, ['offline'], {
        status: 'online', lastSeenAt: T, updatedAt: T, latitude: 4.05, longitude: 9.76, accuracy: 10, ...over
      });
      assert.ok(moved, 'seeded');
    };
    // Whether the CAS applied, against a freshly seeded rider each time.
    const applies = async (guards, over = {}, expected = ['online']) => {
      n += 1;
      const id = `cas_${n}`;
      await seed(id, over);
      return Boolean(await repo.transitionPresence(id, expected, { status: 'busy', updatedAt: LATER }, guards));
    };

    // ensurePresence
    await repo.ensurePresence('e1', T);
    assert.deepStrictEqual(await repo.findPresence('e1'), {
      riderId: 'e1', status: 'offline', latitude: null, longitude: null, accuracy: null, lastSeenAt: null, updatedAt: T
    }, 'ensurePresence makes an offline row that has never been seen');
    await repo.transitionPresence('e1', ['offline'], { status: 'online', lastSeenAt: T, updatedAt: T });
    await repo.ensurePresence('e1', LATER);
    expectFields('ensurePresence leaves an existing row alone', await repo.findPresence('e1'), { status: 'online', lastSeenAt: T, updatedAt: T });
    await Promise.all([repo.ensurePresence('e2', T), repo.ensurePresence('e2', T)]);
    assert.strictEqual((await repo.listPresence()).filter((r) => r.riderId === 'e2').length, 1, 'two creations make one row');

    // status guard, row missing, copies, partial patch
    await seed('s1');
    const snapshot = JSON.stringify(await repo.findPresence('s1'));
    assert.strictEqual(await repo.transitionPresence('s1', ['paused', 'busy', 'offline'], { status: 'offline', updatedAt: LATER }), null,
      'the stored status is not among the expected ones');
    assert.strictEqual(JSON.stringify(await repo.findPresence('s1')), snapshot, 'a refused swap changes nothing');
    assert.strictEqual(await repo.transitionPresence('nobody', ['online', 'offline', 'busy', 'paused'], { status: 'offline' }), null, 'no row, no swap');
    assert.strictEqual(await repo.findPresence('nobody'), null);
    assert.strictEqual(await repo.findPresence(''), null);
    assert.strictEqual(await repo.findPresence(null), null);

    const res = await repo.transitionPresence('s1', ['online'], { status: 'busy', updatedAt: LATER });
    expectFields('partial patch keeps the rest', res, { status: 'busy', updatedAt: LATER, lastSeenAt: T, latitude: 4.05, longitude: 9.76, accuracy: 10 });
    res.status = 'tampered';
    assert.strictEqual((await repo.findPresence('s1')).status, 'busy', 'the returned record is a copy');
    const read = await repo.findPresence('s1');
    read.status = 'tampered';
    assert.strictEqual((await repo.findPresence('s1')).status, 'busy', 'a read is a copy too');
    const cleared = await repo.transitionPresence('s1', ['busy'], { status: 'online', latitude: null, longitude: null, accuracy: null, updatedAt: LATER });
    expectFields('null clears a column', cleared, { latitude: null, longitude: null, accuracy: null, status: 'online' });
    const stamped = await repo.transitionPresence('s1', ['online'], { status: 'paused' });
    assert.ok(Number.isFinite(Date.parse(stamped.updatedAt)) && stamped.updatedAt !== LATER, 'without an updatedAt the swap stamps one');

    // seenSince: the last beat must be STRICTLY newer.
    assert.strictEqual(await applies({ seenSince: T }), false, 'seenSince == lastSeenAt: not newer, refused');
    assert.strictEqual(await applies({ seenSince: plus(-1) }), true, 'seenSince 1 ms before lastSeenAt: applies');
    assert.strictEqual(await applies({ seenSince: plus(1) }), false, 'seenSince 1 ms after lastSeenAt: refused');
    assert.strictEqual(await applies({ seenSince: plus(-TTL) }), true, 'well within the window');
    assert.strictEqual(await applies({ seenSince: plus(-1) }, { lastSeenAt: null }), false, 'never seen: refused');
    assert.strictEqual(await applies({ seenSince: plus(-1) }, { lastSeenAt: 'garbage' }), false, 'an unreadable beat: refused');
    assert.strictEqual(await applies({ seenSince: 'garbage' }), false, 'an unreadable guard fails closed');

    // staleAt: the last beat must be AT OR BEFORE.
    assert.strictEqual(await applies({ staleAt: T }), true, 'staleAt == lastSeenAt: stale, applies');
    assert.strictEqual(await applies({ staleAt: plus(-1) }), false, 'staleAt 1 ms before lastSeenAt: the rider beat after it, refused');
    assert.strictEqual(await applies({ staleAt: plus(1) }), true, 'staleAt 1 ms after lastSeenAt: applies');
    assert.strictEqual(await applies({ staleAt: plus(1) }, { lastSeenAt: null }), false, 'never seen: refused');
    assert.strictEqual(await applies({ staleAt: 'garbage' }), false, 'an unreadable guard fails closed');

    // updatedBefore: the row's own age, AT OR BEFORE.
    assert.strictEqual(await applies({ updatedBefore: T }), true, 'updatedBefore == updatedAt: untouched since, applies');
    assert.strictEqual(await applies({ updatedBefore: plus(-1) }), false, 'written after the guard: refused');
    assert.strictEqual(await applies({ updatedBefore: plus(1) }), true, 'written before the guard: applies');
    assert.strictEqual(await applies({ updatedBefore: plus(1) }, { updatedAt: null }), false, 'an unreadable updatedAt: refused');
    assert.strictEqual(await applies({ updatedBefore: 'garbage' }), false, 'an unreadable guard fails closed');

    // Guards combine: all must hold.
    assert.strictEqual(await applies({ seenSince: plus(-1), updatedBefore: plus(1) }), true, 'both hold');
    assert.strictEqual(await applies({ seenSince: plus(-1), updatedBefore: plus(-1) }), false, 'fresh but written too recently');
    assert.strictEqual(await applies({ seenSince: plus(1), updatedBefore: plus(1) }), false, 'old enough row but stale beat');
    assert.strictEqual(await applies({ staleAt: T, updatedBefore: T }), true);
    assert.strictEqual(await applies({ seenSince: plus(-1) }, {}, ['paused']), false, 'the time guard holds but the status is not expected');
    assert.strictEqual(await applies({}, {}, ['online']), true, 'no guards: status alone decides');
    assert.strictEqual(await applies({ seenSince: null, staleAt: null, updatedBefore: null }), true, 'null guards are no guards');

    // The reads dispatch and the janitors use.
    const reads = new DeliveryRepository({ db: null });
    const put = async (id, status, { lastSeenAt = T, updatedAt = T } = {}) => {
      await reads.ensurePresence(id, T);
      await reads.transitionPresence(id, ['offline'], { status, lastSeenAt, updatedAt, latitude: 4, longitude: 9, accuracy: 5 });
    };
    await put('on_t', 'online', { lastSeenAt: T });
    await put('on_t10', 'online', { lastSeenAt: plus(10 * SECOND) });
    await put('on_t5', 'online', { lastSeenAt: plus(5 * SECOND) });
    await put('on_old', 'online', { lastSeenAt: plus(-5 * SECOND) });
    await put('paused_new', 'paused', { lastSeenAt: plus(10 * SECOND) });
    await put('busy_new', 'busy', { lastSeenAt: plus(10 * SECOND), updatedAt: plus(10 * SECOND) });
    await put('busy_t', 'busy', { lastSeenAt: T, updatedAt: T });
    await put('busy_old', 'busy', { lastSeenAt: T, updatedAt: plus(-9 * SECOND) });
    await reads.ensurePresence('offline_only', T);

    const ids = (rows) => rows.map((r) => r.riderId);
    assert.deepStrictEqual(ids(await reads.listFreshOnlinePresence(T)).sort(), ['on_t10', 'on_t5'],
      'fresh online: strictly newer than the cutoff, online only (not paused, busy or offline)');
    assert.deepStrictEqual(ids(await reads.listFreshOnlinePresence(plus(5 * SECOND))), ['on_t10'], 'a beat AT the cutoff is not fresh');
    assert.deepStrictEqual(ids(await reads.listFreshOnlinePresence(plus(-1000))).sort(), ['on_t', 'on_t10', 'on_t5'], 'on_old is older than that cutoff');
    assert.strictEqual((await reads.listFreshOnlinePresence(T, { limit: 1 })).length, 1, 'bounded');
    assert.deepStrictEqual(await reads.listFreshOnlinePresence('garbage'), [], 'an unreadable cutoff gives nobody, not everybody');

    assert.deepStrictEqual(ids(await reads.findStalePresence(T)), ['on_old', 'on_t'], 'stale: at or before the cutoff, online only, oldest first');
    assert.deepStrictEqual(ids(await reads.findStalePresence(plus(-1))), ['on_old'], 'a beat 1 ms after the cutoff is not stale');
    assert.deepStrictEqual(ids(await reads.findStalePresence(T, { limit: 1 })), ['on_old'], 'bounded, oldest first');
    assert.deepStrictEqual(await reads.findStalePresence('garbage'), [], 'an unreadable cutoff expires nobody');

    assert.deepStrictEqual(ids(await reads.findStaleBusyPresence(T)), ['busy_old', 'busy_t'], 'stale busy: not written since the cutoff, busy only, oldest first');
    assert.deepStrictEqual(ids(await reads.findStaleBusyPresence(plus(-1))), ['busy_old'], 'a row written 1 ms after the cutoff is not a candidate');
    assert.deepStrictEqual(ids(await reads.findStaleBusyPresence(T, { limit: 1 })), ['busy_old']);
    assert.deepStrictEqual(await reads.findStaleBusyPresence('garbage'), [], 'an unreadable cutoff heals nobody');

    const all = await reads.listPresence();
    assert.strictEqual(all.length, 9, 'listPresence returns every row');
    assert.strictEqual((await reads.listPresence({ limit: 3 })).length, 3, 'bounded');
    all[0].status = 'tampered';
    assert.ok((await reads.listPresence()).every((r) => r.status !== 'tampered'), 'listPresence returns copies');
    const fresh = await reads.listFreshOnlinePresence(T);
    fresh[0].status = 'tampered';
    assert.ok((await reads.listFreshOnlinePresence(T)).every((r) => r.status === 'online'), 'so do the other reads');
  }

  console.log('    ✓ Rider presence service: lifecycle, heartbeat expiry, claims, races and dispatch reads hold.');
}

module.exports = { run };
