/**
 * LOUMOO Delivery — Rider presence (domain)
 * ---------------------------------------------------------------------------
 * Whether a registered rider can be offered a delivery RIGHT NOW. Being in
 * `delivery_drivers` only says the rider exists; presence says they are here.
 *
 *   offline    not taking work (never went online, went offline, or went quiet)
 *   online     here, has a fresh heartbeat, free: the only status that is offered work
 *   busy       carrying a delivery they accepted (accepted / picked up / arrived)
 *   paused     here but not taking new work (a break)
 *   suspended  an administrator suspended the rider; never available
 *
 * What is STORED (iam.rider_presence) is offline | online | busy | paused.
 * `suspended` is never stored: it is the rider's account standing
 * (iam.delivery_drivers.status), read at the moment of asking, so a suspension
 * applied anywhere (admin screen, a direct update) wins over whatever the
 * presence row says. `busy` and the heartbeat expiry are likewise re-derived from
 * facts (the rider's open deliveries, the clock) by resolvePresence(), so a row
 * left stale by a crash can never make an unavailable rider look available.
 *
 * The contract is docs/DELIVERY_API.md ("Rider presence"). Change that first.
 */

const { AppError } = require('../../../shared/errors/AppError');
const { DELIVERY_STATUS, DRIVER_STATUS } = require('./Delivery');

const PRESENCE_STATUS = Object.freeze({
  OFFLINE: 'offline',
  ONLINE: 'online',
  BUSY: 'busy',
  PAUSED: 'paused',
  SUSPENDED: 'suspended'
});

// The values the table's CHECK constraint accepts. `suspended` is derived, see above.
const STORED_PRESENCE_STATUSES = Object.freeze([
  PRESENCE_STATUS.OFFLINE,
  PRESENCE_STATUS.ONLINE,
  PRESENCE_STATUS.BUSY,
  PRESENCE_STATUS.PAUSED
]);

// The deliveries that make a rider BUSY: they accepted, so their time is committed.
// An `assigned` offer does not: it is only an offer, and the rider can still answer
// it (or go offline, which withdraws it). `failed` is waiting on the seller.
const BUSY_DELIVERY_STATUSES = Object.freeze([
  DELIVERY_STATUS.ACCEPTED,
  DELIVERY_STATUS.PICKED_UP,
  DELIVERY_STATUS.ARRIVED
]);

// How long a rider may stay silent before they stop counting as online. A starting
// point to tune with real riders (RIDER_PRESENCE_TTL_SECONDS), not a measured value:
// four missed beats of the 30 s the client is asked to send. There is no "never":
// a ghost rider who is offered every job and answers none is the failure this
// feature exists to prevent, so 0 or garbage falls back to the default.
const PRESENCE_DEFAULT_TTL_SECONDS = 120;
const PRESENCE_MIN_TTL_SECONDS = 15;
const PRESENCE_MAX_TTL_SECONDS = 60 * 60;

// What the client is told to send, and the fastest the server will act on. Beats
// closer together than the minimum are acknowledged but not written, so a client
// that loops (or two open tabs) costs a read, not a write, per beat.
const PRESENCE_HEARTBEAT_INTERVAL_MS = 30 * 1000;
const PRESENCE_MIN_WRITE_INTERVAL_MS = 5 * 1000;

// A row stored `busy` with no accepted delivery behind it is a leak (a crash between
// a delivery change and its presence update). The sweeper puts such a row right, but
// only once it is this old: a claim is written a moment BEFORE the delivery it is for,
// and a younger row may be exactly that, in flight.
const PRESENCE_CLAIM_GRACE_MS = 30 * 1000;

// Timeline notes for an offer taken back because the rider's availability changed.
// Shown to staff (and the rider), never to the buyer.
const PRESENCE_NOTES = Object.freeze({
  offline: 'Rider went offline',
  paused: 'Rider paused availability',
  expired: 'Rider stopped responding and was set offline',
  busy: 'Rider accepted another delivery'
});

// The actor written on those timeline rows. Not the rider: `_ridersWhoPassed` reads a
// rider-attributed move back to pending as "declined this delivery", and a rider who
// went on a break has not declined anything. Same pattern as the 'order' and
// 'reconcile' system actors.
const PRESENCE_ACTOR = 'presence';

/** Seconds from the environment (or an option) as milliseconds, clamped, with a default. */
function presenceTtlMsFrom(seconds) {
  const fallback = PRESENCE_DEFAULT_TTL_SECONDS * 1000;
  const raw = typeof seconds === 'string' ? seconds.trim() : seconds;
  if (raw === undefined || raw === null || raw === '') return fallback;
  const n = typeof raw === 'string' ? Number(raw) : raw;
  if (typeof n !== 'number' || !Number.isFinite(n) || n <= 0) return fallback;
  const clamped = Math.min(PRESENCE_MAX_TTL_SECONDS, Math.max(PRESENCE_MIN_TTL_SECONDS, n));
  return Math.round(clamped * 1000);
}

/** True while the rider's last heartbeat is younger than the window (at exactly the window it is stale). */
function isHeartbeatFresh(lastSeenAt, ttlMs, nowMs) {
  const seen = Date.parse(lastSeenAt);
  return Number.isFinite(seen) && nowMs - seen < ttlMs;
}

/** The ISO time a heartbeat must be NEWER than to still count: anything at or before it is stale. */
function freshnessCutoffIso(ttlMs, nowMs) {
  return new Date(nowMs - ttlMs).toISOString();
}

/**
 * A rider's presence as it stands now, from the facts.
 *
 * `driver`     the delivery_drivers record, or null (not a rider)
 * `row`        the stored presence record, or null (never been online)
 * `busyCount`  how many deliveries the rider holds in BUSY_DELIVERY_STATUSES
 *
 * Order of precedence, strongest first: not a rider, suspended, busy (holding an
 * accepted delivery, or stored busy: the claim is written before the delivery it is
 * for, so a row stored busy is busy until it is put right), paused, then offline /
 * online by heartbeat. Returns
 * `{ status, available, reason, expired, lastSeenAt, updatedAt, location }`;
 * `available` is true for `online` and nothing else.
 */
function resolvePresence({ driver, row = null, busyCount = 0, ttlMs, nowMs }) {
  const base = {
    lastSeenAt: row ? row.lastSeenAt || null : null,
    updatedAt: row ? row.updatedAt || null : null,
    location: null,
    expired: false
  };
  const answer = (status, reason = null, extra = {}) => ({
    ...base, ...extra, status, available: status === PRESENCE_STATUS.ONLINE, reason
  });

  if (!driver) return answer(PRESENCE_STATUS.OFFLINE, 'not_a_rider');
  if (driver.status !== DRIVER_STATUS.ACTIVE) return answer(PRESENCE_STATUS.SUSPENDED, 'suspended');

  const stored = row ? row.status : PRESENCE_STATUS.OFFLINE;
  const here = row && row.latitude != null && row.longitude != null
    ? { location: { lat: row.latitude, lng: row.longitude, accuracyM: row.accuracy ?? null } }
    : { location: null };

  if (busyCount > 0 || stored === PRESENCE_STATUS.BUSY) return answer(PRESENCE_STATUS.BUSY, 'busy', here);
  if (stored === PRESENCE_STATUS.PAUSED) return answer(PRESENCE_STATUS.PAUSED, 'paused');
  if (stored === PRESENCE_STATUS.OFFLINE) return answer(PRESENCE_STATUS.OFFLINE, 'offline');

  // Stored online: only as good as the last beat.
  if (!isHeartbeatFresh(base.lastSeenAt, ttlMs, nowMs)) {
    return answer(PRESENCE_STATUS.OFFLINE, 'expired', { expired: true });
  }
  return answer(PRESENCE_STATUS.ONLINE, null, here);
}

/**
 * The wire shape of the rider's OWN presence. The rider sees their own position;
 * sellers and administrators are never given it (see listDrivers / listRiderRoster).
 */
function presentOwnPresence(resolved, { ttlMs }) {
  const live = resolved.status === PRESENCE_STATUS.ONLINE || resolved.status === PRESENCE_STATUS.BUSY;
  const seen = Date.parse(resolved.lastSeenAt);
  return {
    status: resolved.status,
    available: resolved.available,
    reason: resolved.reason,
    lastSeenAt: resolved.lastSeenAt || null,
    expiresAt: live && Number.isFinite(seen) ? new Date(seen + ttlMs).toISOString() : null,
    ttlSeconds: Math.round(ttlMs / 1000),
    heartbeatIntervalMs: PRESENCE_HEARTBEAT_INTERVAL_MS,
    location: resolved.location,
    updatedAt: resolved.updatedAt || null
  };
}

const UNAVAILABLE_MESSAGES = Object.freeze({
  other: {
    offline: 'That rider is offline.',
    expired: 'That rider is offline: they stopped responding.',
    paused: 'That rider is on a break.',
    busy: 'That rider is busy with another delivery.',
    suspended: 'That rider is suspended.',
    not_a_rider: 'That account is not a rider.'
  },
  self: {
    offline: 'You are offline. Go online to take deliveries.',
    expired: 'You went offline because the app stopped responding. Go online to take deliveries.',
    paused: 'You are on a break. Resume to take deliveries.',
    busy: 'Finish your current delivery before taking another.',
    suspended: 'Your rider account is not active.',
    not_a_rider: 'You are not a registered rider.'
  }
});

/**
 * 409: the rider cannot take work right now. Code RIDER_BUSY when they are carrying
 * a delivery, RIDER_UNAVAILABLE for every other reason. `self` words the message for
 * the rider themselves ("you") rather than for a seller choosing them ("that rider");
 * `message` replaces the stock wording when the action needs its own (going offline
 * while carrying a parcel is not "taking another delivery").
 */
class RiderUnavailableError extends AppError {
  constructor(reason = 'offline', { self = false, message = null } = {}) {
    const table = UNAVAILABLE_MESSAGES[self ? 'self' : 'other'];
    super(message || table[reason] || table.offline, {
      code: reason === 'busy' ? 'RIDER_BUSY' : 'RIDER_UNAVAILABLE',
      statusCode: 409,
      details: { reason }
    });
  }
}

module.exports = {
  PRESENCE_STATUS,
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
};
