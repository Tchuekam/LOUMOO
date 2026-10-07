/**
 * LOUMOO — Rider presence (domain)
 * ---------------------------------------------------------------------------
 * Pure-unit coverage (no repository, no service, no clock but the one passed in)
 * for the rules that decide whether a rider can be offered a delivery RIGHT NOW:
 * the TTL parsing and clamp, the heartbeat freshness boundary, the precedence
 * between account standing / open deliveries / the stored row / the heartbeat,
 * the wire shape of the rider's own presence, and the 409 the dispatch paths raise.
 *
 * What it pins is the contract, with the boundary values written out: a heartbeat
 * exactly one TTL old is STALE, one millisecond younger is fresh; a suspended rider
 * is never available whatever a stored row says.
 */

require('../setup');

const assert = require('assert');

const {
  PRESENCE_STATUS: P,
  STORED_PRESENCE_STATUSES,
  BUSY_DELIVERY_STATUSES,
  PRESENCE_DEFAULT_TTL_SECONDS,
  PRESENCE_MIN_TTL_SECONDS,
  PRESENCE_MAX_TTL_SECONDS,
  PRESENCE_HEARTBEAT_INTERVAL_MS,
  PRESENCE_MIN_WRITE_INTERVAL_MS,
  PRESENCE_CLAIM_GRACE_MS,
  PRESENCE_NOTES,
  PRESENCE_ACTOR,
  RiderUnavailableError,
  presenceTtlMsFrom,
  isHeartbeatFresh,
  freshnessCutoffIso,
  resolvePresence,
  presentOwnPresence
} = require('../../server/modules/delivery/domain/RiderPresence');
const { DELIVERY_STATUS: S, DRIVER_STATUS } = require('../../server/modules/delivery/domain/Delivery');
const { AppError } = require('../../server/shared/errors/AppError');

const SECOND = 1000;
const TTL = 120 * SECOND;
const NOW = Date.parse('2026-10-03T10:00:00.000Z');
const at = (offsetMs) => new Date(NOW + offsetMs).toISOString();

const ACTIVE = { id: 'rider_1', status: DRIVER_STATUS.ACTIVE };
const SUSPENDED = { id: 'rider_1', status: DRIVER_STATUS.SUSPENDED };

/** A stored presence record (what the repository returns). */
function row(status, over = {}) {
  return {
    riderId: 'rider_1',
    status,
    latitude: null,
    longitude: null,
    accuracy: null,
    lastSeenAt: at(-10 * SECOND),
    updatedAt: at(-10 * SECOND),
    ...over
  };
}

const resolve = (input) => resolvePresence({ ttlMs: TTL, nowMs: NOW, ...input });

/** Asserts a resolved presence in one go, so a failure names the field that is wrong. */
function expectResolved(label, got, want) {
  for (const [key, value] of Object.entries(want)) {
    assert.deepStrictEqual(got[key], value, `${label}: ${key} should be ${JSON.stringify(value)} but is ${JSON.stringify(got[key])}`);
  }
}

async function run() {
  console.log('  Testing Rider presence domain...');

  // ----------------------------------------------------------------- constants
  {
    assert.deepStrictEqual({ ...P }, {
      OFFLINE: 'offline', ONLINE: 'online', BUSY: 'busy', PAUSED: 'paused', SUSPENDED: 'suspended'
    }, 'the five statuses a rider can be shown as');
    assert.deepStrictEqual([...STORED_PRESENCE_STATUSES], ['offline', 'online', 'busy', 'paused'],
      'only four statuses are ever STORED; suspended is derived from the rider\'s account');
    assert.ok(!STORED_PRESENCE_STATUSES.includes(P.SUSPENDED), 'suspended is never a stored status');
    assert.deepStrictEqual([...BUSY_DELIVERY_STATUSES].sort(), [S.ACCEPTED, S.ARRIVED, S.PICKED_UP].sort(),
      'a rider is busy from the moment they accept until the job ends');
    for (const notBusy of [S.ASSIGNED, S.PENDING_ASSIGNMENT, S.FAILED, S.DELIVERED, S.CANCELLED]) {
      assert.ok(!BUSY_DELIVERY_STATUSES.includes(notBusy), `${notBusy} does not make a rider busy`);
    }
    for (const frozen of [P, STORED_PRESENCE_STATUSES, BUSY_DELIVERY_STATUSES, PRESENCE_NOTES]) {
      assert.ok(Object.isFrozen(frozen), 'the constants cannot be mutated at run time');
    }
    assert.strictEqual(PRESENCE_DEFAULT_TTL_SECONDS, 120);
    assert.strictEqual(PRESENCE_MIN_TTL_SECONDS, 15);
    assert.strictEqual(PRESENCE_MAX_TTL_SECONDS, 3600);
    assert.strictEqual(PRESENCE_HEARTBEAT_INTERVAL_MS, 30 * SECOND, 'the client is asked to beat every 30 s');
    assert.strictEqual(PRESENCE_MIN_WRITE_INTERVAL_MS, 5 * SECOND, 'beats closer than 5 s are not written');
    assert.strictEqual(PRESENCE_CLAIM_GRACE_MS, 30 * SECOND, 'a busy row is left alone for 30 s before it can be called a leak');
    assert.ok(PRESENCE_HEARTBEAT_INTERVAL_MS < PRESENCE_DEFAULT_TTL_SECONDS * SECOND,
      'a client beating on schedule never reaches the default expiry');
    assert.strictEqual(PRESENCE_ACTOR, 'presence', 'timeline rows written by presence are not attributed to the rider');
    assert.deepStrictEqual(Object.keys(PRESENCE_NOTES).sort(), ['busy', 'expired', 'offline', 'paused']);
    assert.strictEqual(PRESENCE_NOTES.offline, 'Rider went offline');
    assert.strictEqual(PRESENCE_NOTES.paused, 'Rider paused availability');
    assert.strictEqual(PRESENCE_NOTES.busy, 'Rider accepted another delivery');
  }

  // ---------------------------------------------------------- presenceTtlMsFrom
  {
    const DEFAULT = 120000;
    for (const [input, label] of [
      [undefined, 'unset'], [null, 'null'], ['', 'empty string'], ['   ', 'blank string'], ['abc', '"abc"'],
      [0, '0'], ['0', '"0"'], [-1, 'negative'], ['-30', 'negative string'], [NaN, 'NaN'], [Infinity, 'Infinity'],
      [-Infinity, '-Infinity'], [true, 'true'], [false, 'false'], [{}, 'an object'], [[], 'an array'], [[60], 'an array of one number']
    ]) {
      assert.strictEqual(presenceTtlMsFrom(input), DEFAULT, `${label} falls back to the 120 s default, never to "no expiry"`);
    }
    assert.strictEqual(presenceTtlMsFrom(5), 15000, 'below the floor is raised to 15 s');
    assert.strictEqual(presenceTtlMsFrom(14.9), 15000, 'just under the floor is raised to 15 s');
    assert.strictEqual(presenceTtlMsFrom(15), 15000, 'the floor itself');
    assert.strictEqual(presenceTtlMsFrom(15.5), 15500, 'just above the floor is kept');
    assert.strictEqual(presenceTtlMsFrom(99999), 3600000, 'above the ceiling is cut to 1 h');
    assert.strictEqual(presenceTtlMsFrom(3601), 3600000, 'just above the ceiling is cut to 1 h');
    assert.strictEqual(presenceTtlMsFrom(3600), 3600000, 'the ceiling itself');
    assert.strictEqual(presenceTtlMsFrom('90'), 90000, 'an environment string is read as seconds');
    assert.strictEqual(presenceTtlMsFrom(' 90 '), 90000, 'surrounding spaces are ignored');
    assert.strictEqual(presenceTtlMsFrom('1e2'), 100000, 'exponent notation is a number');
    assert.strictEqual(presenceTtlMsFrom(120), 120000);
    assert.strictEqual(presenceTtlMsFrom(20.0004), 20000, 'the result is whole milliseconds');
    assert.strictEqual(presenceTtlMsFrom('5'), 15000, 'a string is clamped like a number');
    assert.strictEqual(presenceTtlMsFrom('99999'), 3600000, 'a string is clamped like a number');
    assert.ok(Number.isInteger(presenceTtlMsFrom(33.3333)), 'always an integer number of milliseconds');
  }

  // ------------------------------------------------------------ isHeartbeatFresh
  {
    assert.strictEqual(isHeartbeatFresh(at(0), TTL, NOW), true, 'a beat just now is fresh');
    assert.strictEqual(isHeartbeatFresh(at(-TTL + 1), TTL, NOW), true, '1 ms before the TTL it is still fresh');
    assert.strictEqual(isHeartbeatFresh(at(-TTL), TTL, NOW), false, 'at exactly the TTL it is stale');
    assert.strictEqual(isHeartbeatFresh(at(-TTL - 1), TTL, NOW), false, '1 ms past the TTL it is stale');
    assert.strictEqual(isHeartbeatFresh(at(-10 * TTL), TTL, NOW), false, 'long silent is stale');
    for (const bad of [null, undefined, '', 'garbage', 'not-a-date', {}, NaN]) {
      assert.strictEqual(isHeartbeatFresh(bad, TTL, NOW), false, `${JSON.stringify(bad)} (no usable beat) is stale, never fresh`);
    }
    // The window is whatever the caller passes.
    assert.strictEqual(isHeartbeatFresh(at(-14 * SECOND), 15 * SECOND, NOW), true);
    assert.strictEqual(isHeartbeatFresh(at(-15 * SECOND), 15 * SECOND, NOW), false);
    assert.strictEqual(isHeartbeatFresh(at(-59 * 60 * SECOND), 3600 * SECOND, NOW), true);
    assert.strictEqual(isHeartbeatFresh(at(-60 * 60 * SECOND), 3600 * SECOND, NOW), false);
  }

  // ------------------------------------------------------------ freshnessCutoffIso
  {
    assert.strictEqual(freshnessCutoffIso(TTL, NOW), '2026-10-03T09:58:00.000Z', 'the cutoff is now minus the window, as ISO');
    assert.strictEqual(freshnessCutoffIso(15 * SECOND, NOW), '2026-10-03T09:59:45.000Z');
    assert.strictEqual(freshnessCutoffIso(0, NOW), '2026-10-03T10:00:00.000Z', 'a zero window is "now"');
    // The cutoff and the freshness test agree on the boundary: a beat is fresh only if NEWER than the cutoff.
    const cutoff = Date.parse(freshnessCutoffIso(TTL, NOW));
    for (const [offset, fresh] of [[-1, false], [0, false], [1, true]]) {
      assert.strictEqual(isHeartbeatFresh(new Date(cutoff + offset).toISOString(), TTL, NOW), fresh,
        `a beat ${offset} ms from the cutoff: fresh=${fresh}`);
    }
  }

  // -------------------------------------------------------------- resolvePresence
  {
    const here = { latitude: 4.0511, longitude: 9.7679, accuracy: 12 };

    // Not a rider at all.
    expectResolved('no driver record', resolve({ driver: null }),
      { status: P.OFFLINE, available: false, reason: 'not_a_rider', expired: false, location: null, lastSeenAt: null, updatedAt: null });
    expectResolved('no driver record beats an online row', resolve({ driver: null, row: row(P.ONLINE, here), busyCount: 2 }),
      { status: P.OFFLINE, available: false, reason: 'not_a_rider', location: null });
    expectResolved('undefined driver is not a rider either', resolve({ driver: undefined, row: row(P.ONLINE) }),
      { available: false, reason: 'not_a_rider' });

    // Suspended beats everything: the row, the open deliveries, the position.
    for (const [label, input] of [
      ['an online fresh row', { row: row(P.ONLINE, here) }],
      ['a busy row', { row: row(P.BUSY, here) }],
      ['a paused row', { row: row(P.PAUSED) }],
      ['an offline row', { row: row(P.OFFLINE) }],
      ['no row', { row: null }],
      ['an online row and an accepted delivery', { row: row(P.ONLINE, here), busyCount: 1 }],
      ['a busy row and two accepted deliveries', { row: row(P.BUSY, here), busyCount: 2 }]
    ]) {
      expectResolved(`suspended with ${label}`, resolve({ driver: SUSPENDED, ...input }),
        { status: P.SUSPENDED, available: false, reason: 'suspended', expired: false, location: null });
    }
    expectResolved('suspended keeps the last-seen time for the administrator',
      resolve({ driver: SUSPENDED, row: row(P.ONLINE, { lastSeenAt: at(-5 * SECOND), updatedAt: at(-3 * SECOND) }) }),
      { lastSeenAt: at(-5 * SECOND), updatedAt: at(-3 * SECOND) });
    // An account standing nobody recognises fails closed: not available.
    for (const odd of ['banned', 'pending', '', null, undefined, 'ACTIVE']) {
      const got = resolve({ driver: { id: 'rider_1', status: odd }, row: row(P.ONLINE, here) });
      assert.strictEqual(got.available, false, `a rider whose status is ${JSON.stringify(odd)} is never available`);
      assert.strictEqual(got.status, P.SUSPENDED, `...and is treated as suspended (${JSON.stringify(odd)})`);
    }

    // Busy: an accepted delivery beats the row; a stored busy row is busy until put right.
    expectResolved('busy by delivery over an online row', resolve({ driver: ACTIVE, row: row(P.ONLINE, here), busyCount: 1 }),
      { status: P.BUSY, available: false, reason: 'busy', expired: false });
    expectResolved('busy by delivery with no row at all', resolve({ driver: ACTIVE, row: null, busyCount: 1 }),
      { status: P.BUSY, available: false, reason: 'busy', location: null });
    expectResolved('busy by delivery beats an offline row', resolve({ driver: ACTIVE, row: row(P.OFFLINE), busyCount: 1 }),
      { status: P.BUSY, available: false, reason: 'busy' });
    expectResolved('busy by delivery beats a paused row', resolve({ driver: ACTIVE, row: row(P.PAUSED), busyCount: 1 }),
      { status: P.BUSY, available: false, reason: 'busy' });
    expectResolved('busy by delivery is not expiry: a stale beat does not make them offline',
      resolve({ driver: ACTIVE, row: row(P.ONLINE, { lastSeenAt: at(-TTL) }), busyCount: 1 }),
      { status: P.BUSY, available: false, reason: 'busy', expired: false });
    expectResolved('a stored busy row with no delivery is busy', resolve({ driver: ACTIVE, row: row(P.BUSY), busyCount: 0 }),
      { status: P.BUSY, available: false, reason: 'busy' });
    expectResolved('a stored busy row is busy however old its beat', resolve({ driver: ACTIVE, row: row(P.BUSY, { lastSeenAt: at(-100 * TTL) }) }),
      { status: P.BUSY, expired: false });
    expectResolved('busy shows the rider\'s own position', resolve({ driver: ACTIVE, row: row(P.BUSY, here), busyCount: 1 }),
      { location: { lat: 4.0511, lng: 9.7679, accuracyM: 12 } });
    // busyCount defaults to 0 when omitted.
    expectResolved('busyCount omitted means none', resolve({ driver: ACTIVE, row: row(P.ONLINE) }), { status: P.ONLINE, available: true });

    // Paused / offline.
    expectResolved('paused', resolve({ driver: ACTIVE, row: row(P.PAUSED, here) }),
      { status: P.PAUSED, available: false, reason: 'paused', expired: false, location: null });
    expectResolved('paused even with a fresh beat', resolve({ driver: ACTIVE, row: row(P.PAUSED, { lastSeenAt: at(0) }) }),
      { status: P.PAUSED, available: false });
    expectResolved('offline row', resolve({ driver: ACTIVE, row: row(P.OFFLINE, here) }),
      { status: P.OFFLINE, available: false, reason: 'offline', expired: false, location: null });
    expectResolved('offline even with a fresh beat', resolve({ driver: ACTIVE, row: row(P.OFFLINE, { lastSeenAt: at(0) }) }),
      { status: P.OFFLINE, available: false, reason: 'offline' });
    expectResolved('no row means never been online', resolve({ driver: ACTIVE, row: null }),
      { status: P.OFFLINE, available: false, reason: 'offline', expired: false, location: null, lastSeenAt: null, updatedAt: null });

    // Online: only as good as the last beat.
    expectResolved('online and fresh', resolve({ driver: ACTIVE, row: row(P.ONLINE) }),
      { status: P.ONLINE, available: true, reason: null, expired: false, location: null });
    expectResolved('online, 1 ms before the TTL', resolve({ driver: ACTIVE, row: row(P.ONLINE, { lastSeenAt: at(-TTL + 1) }) }),
      { status: P.ONLINE, available: true, reason: null, expired: false });
    expectResolved('online, exactly at the TTL', resolve({ driver: ACTIVE, row: row(P.ONLINE, { lastSeenAt: at(-TTL) }) }),
      { status: P.OFFLINE, available: false, reason: 'expired', expired: true, location: null });
    expectResolved('online, 1 ms past the TTL', resolve({ driver: ACTIVE, row: row(P.ONLINE, { lastSeenAt: at(-TTL - 1) }) }),
      { status: P.OFFLINE, available: false, reason: 'expired', expired: true });
    expectResolved('an expired rider keeps their last-seen time (to show "last seen ...")',
      resolve({ driver: ACTIVE, row: row(P.ONLINE, { lastSeenAt: at(-TTL - 5000), updatedAt: at(-TTL - 4000), ...here }) }),
      { lastSeenAt: at(-TTL - 5000), updatedAt: at(-TTL - 4000), location: null });
    for (const never of [null, undefined, '', 'garbage']) {
      expectResolved(`online row never heard from (lastSeenAt ${JSON.stringify(never)})`,
        resolve({ driver: ACTIVE, row: row(P.ONLINE, { lastSeenAt: never }) }),
        { status: P.OFFLINE, available: false, reason: 'expired', expired: true });
    }
    // The window is the one asked for.
    expectResolved('a short window expires sooner',
      resolvePresence({ driver: ACTIVE, row: row(P.ONLINE, { lastSeenAt: at(-20 * SECOND) }), ttlMs: 15 * SECOND, nowMs: NOW }),
      { status: P.OFFLINE, reason: 'expired' });
    expectResolved('a long window keeps them',
      resolvePresence({ driver: ACTIVE, row: row(P.ONLINE, { lastSeenAt: at(-20 * SECOND) }), ttlMs: 3600 * SECOND, nowMs: NOW }),
      { status: P.ONLINE, available: true });

    // `available` is true for online and for nothing else.
    const everything = [];
    for (const driver of [null, ACTIVE, SUSPENDED]) {
      for (const stored of [null, P.OFFLINE, P.ONLINE, P.BUSY, P.PAUSED]) {
        for (const busyCount of [0, 1]) {
          for (const lastSeenAt of [at(-SECOND), at(-TTL)]) {
            everything.push(resolve({ driver, row: stored ? row(stored, { lastSeenAt }) : null, busyCount }));
          }
        }
      }
    }
    const availableOnes = everything.filter((r) => r.available);
    assert.ok(availableOnes.length > 0, 'the matrix does include an available rider');
    assert.ok(availableOnes.every((r) => r.status === P.ONLINE && r.reason === null && !r.expired),
      'available implies online, no reason, not expired');
    assert.ok(everything.filter((r) => r.status === P.ONLINE).every((r) => r.available), 'online implies available');
    assert.ok(everything.every((r) => r.available === (r.reason === null)), 'a reason is given exactly when the rider is unavailable');
    assert.deepStrictEqual([...new Set(everything.map((r) => r.status))].sort(), [P.BUSY, P.OFFLINE, P.ONLINE, P.PAUSED, P.SUSPENDED].sort(),
      'every status is reachable');

    // Location mapping.
    expectResolved('location is mapped with its accuracy', resolve({ driver: ACTIVE, row: row(P.ONLINE, here) }),
      { location: { lat: 4.0511, lng: 9.7679, accuracyM: 12 } });
    expectResolved('a position without accuracy keeps accuracyM null',
      resolve({ driver: ACTIVE, row: row(P.ONLINE, { latitude: 4.05, longitude: 9.76, accuracy: null }) }),
      { location: { lat: 4.05, lng: 9.76, accuracyM: null } });
    expectResolved('accuracy undefined also becomes null',
      resolve({ driver: ACTIVE, row: row(P.ONLINE, { latitude: 4.05, longitude: 9.76, accuracy: undefined }) }),
      { location: { lat: 4.05, lng: 9.76, accuracyM: null } });
    expectResolved('0,0 is a position, not "no position"', resolve({ driver: ACTIVE, row: row(P.ONLINE, { latitude: 0, longitude: 0, accuracy: 0 }) }),
      { location: { lat: 0, lng: 0, accuracyM: 0 } });
    expectResolved('no position stored', resolve({ driver: ACTIVE, row: row(P.ONLINE) }), { location: null });
    expectResolved('only half a position is no position', resolve({ driver: ACTIVE, row: row(P.ONLINE, { latitude: 4.05, longitude: null }) }),
      { location: null });
    expectResolved('only half a position is no position (other half)', resolve({ driver: ACTIVE, row: row(P.ONLINE, { latitude: null, longitude: 9.7 }) }),
      { location: null });
    // Position is only surfaced for online / busy: a paused or offline rider is not tracked.
    for (const stored of [P.PAUSED, P.OFFLINE]) {
      assert.strictEqual(resolve({ driver: ACTIVE, row: row(stored, here) }).location, null, `a ${stored} rider's stale position is not shown`);
    }
    // The input row is not modified.
    const original = row(P.ONLINE, here);
    const snapshot = JSON.stringify(original);
    resolve({ driver: ACTIVE, row: original, busyCount: 3 });
    assert.strictEqual(JSON.stringify(original), snapshot, 'resolving never mutates the stored record');
  }

  // ------------------------------------------------------------ presentOwnPresence
  {
    const here = { latitude: 4.0511, longitude: 9.7679, accuracy: 12 };
    const live = resolve({ driver: ACTIVE, row: row(P.ONLINE, { ...here, lastSeenAt: at(-20 * SECOND), updatedAt: at(-19 * SECOND) }) });
    const out = presentOwnPresence(live, { ttlMs: TTL });
    assert.deepStrictEqual(out, {
      status: P.ONLINE,
      available: true,
      reason: null,
      lastSeenAt: at(-20 * SECOND),
      expiresAt: at(-20 * SECOND + TTL),
      ttlSeconds: 120,
      heartbeatIntervalMs: 30000,
      location: { lat: 4.0511, lng: 9.7679, accuracyM: 12 },
      updatedAt: at(-19 * SECOND)
    }, 'the exact wire shape of the rider\'s own presence');
    assert.deepStrictEqual(Object.keys(out).sort(),
      ['available', 'expiresAt', 'heartbeatIntervalMs', 'lastSeenAt', 'location', 'reason', 'status', 'ttlSeconds', 'updatedAt'],
      'nothing internal (rider id, raw columns, the expired flag) leaks onto the wire');

    const busy = presentOwnPresence(resolve({ driver: ACTIVE, row: row(P.BUSY, { ...here, lastSeenAt: at(-5 * SECOND) }), busyCount: 1 }), { ttlMs: TTL });
    assert.strictEqual(busy.status, P.BUSY);
    assert.strictEqual(busy.available, false);
    assert.strictEqual(busy.reason, 'busy');
    // A busy rider is carrying a parcel and never expires, so there is no deadline to show:
    // a client that trusted a stale one would call a busy rider "expired".
    assert.strictEqual(busy.expiresAt, null, 'a busy rider has no deadline: they never expire');
    assert.deepStrictEqual(busy.location, { lat: 4.0511, lng: 9.7679, accuracyM: 12 }, 'the rider sees their own position');

    for (const [label, input] of [
      ['paused', { driver: ACTIVE, row: row(P.PAUSED, { lastSeenAt: at(-5 * SECOND) }) }],
      ['offline', { driver: ACTIVE, row: row(P.OFFLINE, { lastSeenAt: at(-5 * SECOND) }) }],
      ['expired', { driver: ACTIVE, row: row(P.ONLINE, { lastSeenAt: at(-TTL) }) }],
      ['suspended', { driver: SUSPENDED, row: row(P.ONLINE, { lastSeenAt: at(-5 * SECOND) }) }],
      ['not a rider', { driver: null, row: row(P.ONLINE, { lastSeenAt: at(-5 * SECOND) }) }]
    ]) {
      const shown = presentOwnPresence(resolve(input), { ttlMs: TTL });
      assert.strictEqual(shown.expiresAt, null, `${label}: no expiry is promised to someone who is not live`);
      assert.strictEqual(shown.available, false, `${label}: not available`);
      assert.strictEqual(shown.location, null, `${label}: no position`);
    }
    assert.strictEqual(presentOwnPresence(resolve({ driver: ACTIVE, row: row(P.PAUSED) }), { ttlMs: TTL }).reason, 'paused');
    assert.strictEqual(presentOwnPresence(resolve({ driver: ACTIVE, row: row(P.ONLINE, { lastSeenAt: at(-TTL) }) }), { ttlMs: TTL }).reason, 'expired');
    assert.strictEqual(presentOwnPresence(resolve({ driver: SUSPENDED, row: null }), { ttlMs: TTL }).reason, 'suspended');

    // No usable last-seen time: no expiry date is invented.
    const unseen = presentOwnPresence({ status: P.ONLINE, available: true, reason: null, lastSeenAt: null, location: null }, { ttlMs: TTL });
    assert.strictEqual(unseen.expiresAt, null, 'no beat, no expiry date');
    assert.strictEqual(unseen.lastSeenAt, null);
    assert.strictEqual(unseen.updatedAt, null, 'a missing updatedAt is null, not undefined');
    assert.strictEqual(presentOwnPresence({ status: P.ONLINE, available: true, reason: null, lastSeenAt: 'garbage', location: null }, { ttlMs: TTL }).expiresAt, null,
      'an unparsable beat gives no expiry date');

    // The advertised numbers follow the window passed in.
    assert.strictEqual(presentOwnPresence(live, { ttlMs: 15 * SECOND }).ttlSeconds, 15);
    assert.strictEqual(presentOwnPresence(live, { ttlMs: 15 * SECOND }).expiresAt, at(-20 * SECOND + 15 * SECOND));
    assert.strictEqual(presentOwnPresence(live, { ttlMs: 3600 * SECOND }).ttlSeconds, 3600);
    assert.strictEqual(presentOwnPresence(live, { ttlMs: 90500 }).ttlSeconds, 91, 'rounded to whole seconds');
    assert.strictEqual(presentOwnPresence(live, { ttlMs: TTL }).heartbeatIntervalMs, PRESENCE_HEARTBEAT_INTERVAL_MS);
  }

  // ------------------------------------------------------- RiderUnavailableError
  {
    const REASONS = ['offline', 'expired', 'paused', 'busy', 'suspended', 'not_a_rider'];

    for (const reason of REASONS) {
      const other = new RiderUnavailableError(reason);
      const self = new RiderUnavailableError(reason, { self: true });
      const expectedCode = reason === 'busy' ? 'RIDER_BUSY' : 'RIDER_UNAVAILABLE';
      for (const [who, err] of [['other', other], ['self', self]]) {
        assert.ok(err instanceof AppError, `${reason}/${who}: an AppError, so the error handler renders it`);
        assert.ok(err instanceof Error);
        assert.strictEqual(err.name, 'RiderUnavailableError');
        assert.strictEqual(err.statusCode, 409, `${reason}/${who}: 409`);
        assert.strictEqual(err.code, expectedCode, `${reason}/${who}: code`);
        assert.deepStrictEqual(err.details, { reason }, `${reason}/${who}: the reason travels in details`);
        assert.ok(typeof err.message === 'string' && err.message.length > 5, `${reason}/${who}: has a readable message`);
      }
      assert.notStrictEqual(other.message, self.message, `${reason}: the rider is spoken to differently than a seller choosing them`);
      assert.ok(/^(That rider|That account)/.test(other.message), `${reason}: the seller/administrator wording talks about "that rider": ${other.message}`);
      assert.ok(!/\byou(r)?\b/i.test(other.message), `${reason}: the seller wording never says "you": ${other.message}`);
    }
    assert.strictEqual(new Set(REASONS.map((r) => new RiderUnavailableError(r).message)).size, REASONS.length, 'every reason has its own wording (other)');
    assert.strictEqual(new Set(REASONS.map((r) => new RiderUnavailableError(r, { self: true }).message)).size, REASONS.length, 'every reason has its own wording (self)');

    // Specific wording the clients may show.
    assert.strictEqual(new RiderUnavailableError('suspended', { self: true }).message, 'Your rider account is not active.');
    assert.strictEqual(new RiderUnavailableError('not_a_rider', { self: true }).message, 'You are not a registered rider.');
    assert.strictEqual(new RiderUnavailableError('offline').message, 'That rider is offline.');
    assert.strictEqual(new RiderUnavailableError('busy').message, 'That rider is busy with another delivery.');
    assert.strictEqual(new RiderUnavailableError('paused').message, 'That rider is on a break.');
    assert.strictEqual(new RiderUnavailableError('suspended').message, 'That rider is suspended.');

    // Defaults and overrides.
    const dflt = new RiderUnavailableError();
    assert.strictEqual(dflt.code, 'RIDER_UNAVAILABLE', 'no reason is "unavailable", not "busy"');
    assert.deepStrictEqual(dflt.details, { reason: 'offline' });
    assert.strictEqual(dflt.message, 'That rider is offline.');
    for (const self of [false, true]) {
      const custom = new RiderUnavailableError('busy', { self, message: 'Finish or release your current delivery before going offline.' });
      assert.strictEqual(custom.message, 'Finish or release your current delivery before going offline.', `message override wins (self=${self})`);
      assert.strictEqual(custom.code, 'RIDER_BUSY', 'an overridden message does not change the code');
      assert.deepStrictEqual(custom.details, { reason: 'busy' });
    }
    const blank = new RiderUnavailableError('paused', { message: '' });
    assert.strictEqual(blank.message, 'That rider is on a break.', 'an empty override falls back to the stock wording');
    const unknown = new RiderUnavailableError('teleported');
    assert.strictEqual(unknown.code, 'RIDER_UNAVAILABLE', 'an unknown reason is never mistaken for busy');
    assert.strictEqual(unknown.message, 'That rider is offline.', 'an unknown reason gets the offline wording rather than "undefined"');
    assert.deepStrictEqual(unknown.details, { reason: 'teleported' });
    assert.strictEqual(new RiderUnavailableError('teleported', { self: true }).message, 'You are offline. Go online to take deliveries.');

    // What the HTTP layer will serialise.
    const json = new RiderUnavailableError('busy', { self: true }).toJSON();
    assert.strictEqual(json.error.code, 'RIDER_BUSY');
    assert.strictEqual(json.error.statusCode, 409);
    assert.deepStrictEqual(json.error.details, { reason: 'busy' });
  }

  console.log('    ✓ Rider presence domain: TTL, freshness boundary, precedence, wire shape and 409 hold.');
}

module.exports = { run };
