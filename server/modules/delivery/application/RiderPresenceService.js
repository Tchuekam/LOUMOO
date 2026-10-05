/**
 * LOUMOO Delivery — Rider presence service
 * ---------------------------------------------------------------------------
 * The rules for a rider's availability: go online / offline, pause / resume, the
 * heartbeat, the claim a rider makes by accepting a delivery, and the sweep that
 * sets silent riders offline. State lives in iam.rider_presence (migration 017);
 * what the state MEANS (busy, expired, suspended) is decided by resolvePresence()
 * in the domain from facts, never read back from the row alone.
 *
 * Trust model:
 *   - Every rider-facing method takes the AUTHENTICATED caller's id and nothing
 *     else: there is no rider id, status or "online" flag in any input, so no
 *     request can say "make rider X online" or "set me to online".
 *   - Only a registered, ACTIVE rider has presence at all (403 otherwise), and a
 *     suspended rider is refused here, resolved as `suspended` everywhere else, and
 *     can never be selected for work.
 *   - Presence is only ever RAISED by a deliberate act: go online, resume, or accept.
 *     A heartbeat only keeps an already-online (or busy) rider alive; it never
 *     brings an offline or paused rider back, so a beat still in flight when the
 *     rider tapped "go offline" cannot undo it, and a rider whose app went quiet is
 *     not silently revived by the next beat.
 *
 * This service never touches deliveries. Taking a rider's pending offers back when
 * they stop being available is the DeliveryService's job (it owns delivery
 * transitions); every method here says when that is needed.
 */

const { AuthorizationError } = require('../../../shared/errors/AppError');
const { DRIVER_STATUS } = require('../domain/Delivery');
const {
  PRESENCE_STATUS: P,
  STORED_PRESENCE_STATUSES,
  BUSY_DELIVERY_STATUSES,
  PRESENCE_MIN_WRITE_INTERVAL_MS,
  PRESENCE_CLAIM_GRACE_MS,
  RiderUnavailableError,
  presenceTtlMsFrom,
  isHeartbeatFresh,
  freshnessCutoffIso,
  resolvePresence,
  presentOwnPresence
} = require('../domain/RiderPresence');

// Same ceiling as the service's other rider reads.
const MAX_RIDERS_CONSIDERED = 500;
// A rider never holds more than a handful of deliveries; this only bounds the read.
const OPEN_DELIVERIES_READ = 100;

const NO_POSITION = Object.freeze({ latitude: null, longitude: null, accuracy: null });

class RiderPresenceService {
  /**
   * `repository` is the DeliveryRepository (riders, deliveries and presence rows
   * live behind it). `ttlMs` is how long a rider may stay silent before they stop
   * counting as online; unset, it comes from RIDER_PRESENCE_TTL_SECONDS, then the
   * default. An unusable value falls back rather than disabling expiry.
   */
  constructor({ repository, now, ttlMs } = {}) {
    if (!repository) throw new TypeError('RiderPresenceService needs a repository');
    this.repo = repository;
    this.now = typeof now === 'function' ? now : () => Date.now();
    this.ttlMs = typeof ttlMs === 'number'
      ? presenceTtlMsFrom(ttlMs / 1000)
      : presenceTtlMsFrom(process.env.RIDER_PRESENCE_TTL_SECONDS);
  }

  _nowIso() { return new Date(this.now()).toISOString(); }

  // ------------------------------------------------------------------ helpers

  /** The caller's rider record; 403 when they are not a rider or were suspended. */
  async _requireActiveRider(riderId) {
    const driver = riderId ? await this.repo.findDriver(riderId) : null;
    if (!driver) throw new AuthorizationError('You are not a registered rider.');
    if (driver.status !== DRIVER_STATUS.ACTIVE) throw new AuthorizationError('Your rider account is not active.');
    return driver;
  }

  async _busyCount(riderId) {
    const open = await this.repo.findOpenByDriver(riderId, { limit: OPEN_DELIVERIES_READ });
    return open.filter((d) => BUSY_DELIVERY_STATUSES.includes(d.status)).length;
  }

  /** `{ lastSeenAt, updatedAt, position }` for a write that proves the rider is here now. */
  _alive(at, location) {
    return {
      lastSeenAt: at,
      updatedAt: at,
      ...(location
        ? { latitude: location.lat, longitude: location.lng, accuracy: location.accuracyM ?? null }
        : NO_POSITION)
    };
  }

  /** The rider's presence from the facts, for a rider whose record is already loaded. */
  async resolve(riderId, driver) {
    const rider = driver === undefined ? await this.repo.findDriver(riderId) : driver;
    if (!rider || rider.status !== DRIVER_STATUS.ACTIVE) {
      return resolvePresence({ driver: rider, ttlMs: this.ttlMs, nowMs: this.now() });
    }
    const [row, busyCount] = await Promise.all([this.repo.findPresence(riderId), this._busyCount(riderId)]);
    return resolvePresence({ driver: rider, row, busyCount, ttlMs: this.ttlMs, nowMs: this.now() });
  }

  async _own(riderId, driver) {
    return presentOwnPresence(await this.resolve(riderId, driver), { ttlMs: this.ttlMs });
  }

  // --------------------------------------------------------------- rider acts

  /** The rider's own presence. */
  async getOwn(riderId) {
    const driver = await this._requireActiveRider(riderId);
    return this._own(riderId, driver);
  }

  /**
   * "I am here and available." From offline, paused, or already online (idempotent).
   * A rider who still holds a delivery they accepted comes back as busy, not online:
   * going online does not make a busy rider offerable.
   */
  async goOnline(riderId, location = null) {
    const driver = await this._requireActiveRider(riderId);
    const at = this._nowIso();
    await this.repo.ensurePresence(riderId, at);
    const busy = (await this._busyCount(riderId)) > 0;
    await this.repo.transitionPresence(
      riderId,
      STORED_PRESENCE_STATUSES,
      { status: busy ? P.BUSY : P.ONLINE, ...this._alive(at, location) }
    );
    return this._own(riderId, driver);
  }

  /**
   * "I am done." Refused while the rider carries a delivery they accepted: that
   * parcel is theirs until it is delivered or they release it. Their un-accepted
   * offers are not: the caller takes those back afterwards.
   */
  async goOffline(riderId) {
    const driver = await this._requireActiveRider(riderId);
    if ((await this._busyCount(riderId)) > 0) {
      throw new RiderUnavailableError('busy', {
        self: true, message: 'Finish or release your current delivery before going offline.'
      });
    }
    const at = this._nowIso();
    // No row means they were never online: nothing to write.
    await this.repo.transitionPresence(riderId, STORED_PRESENCE_STATUSES, { status: P.OFFLINE, updatedAt: at, ...NO_POSITION });
    return this._own(riderId, driver);
  }

  /**
   * "Not taking new deliveries for a while." Only from online. Refused while carrying
   * a delivery (finish or release it first); idempotent when already paused.
   */
  async pause(riderId) {
    const driver = await this._requireActiveRider(riderId);
    if ((await this._busyCount(riderId)) > 0) {
      throw new RiderUnavailableError('busy', {
        self: true, message: 'Finish or release your current delivery before pausing.'
      });
    }
    const current = await this.resolve(riderId, driver);
    if (current.status === P.PAUSED) return presentOwnPresence(current, { ttlMs: this.ttlMs });
    if (current.status !== P.ONLINE) {
      throw new RiderUnavailableError(current.reason, { self: true, message: 'Go online before pausing.' });
    }
    const at = this._nowIso();
    await this.repo.transitionPresence(riderId, [P.ONLINE, P.BUSY], { status: P.PAUSED, updatedAt: at, ...NO_POSITION });
    return this._own(riderId, driver);
  }

  /** "Back from my break." From paused; idempotent when already online or busy. */
  async resume(riderId, location = null) {
    const driver = await this._requireActiveRider(riderId);
    const current = await this.resolve(riderId, driver);
    if (current.status === P.ONLINE || current.status === P.BUSY) return presentOwnPresence(current, { ttlMs: this.ttlMs });
    if (current.status !== P.PAUSED) {
      throw new RiderUnavailableError(current.reason, { self: true, message: 'You are not on a break. Go online instead.' });
    }
    await this.repo.transitionPresence(riderId, [P.PAUSED], { status: P.ONLINE, ...this._alive(this._nowIso(), location) });
    return this._own(riderId, driver);
  }

  /**
   * "Still here." Keeps an online or busy rider alive and refreshes their position;
   * for anyone else it changes nothing and says what they are, so the client can
   * react (an offline rider is told they are offline, never quietly put back).
   *
   * A rider whose last beat is already older than the window is set offline here,
   * not kept alive: whether silence expires a rider must not depend on whether the
   * sweeper happened to run first. Returns `{ presence, expired }`; `expired` tells
   * the caller to take the rider's pending offers back.
   *
   * Beats closer together than PRESENCE_MIN_WRITE_INTERVAL_MS are answered from the
   * stored row without a write.
   */
  async heartbeat(riderId, location = null) {
    const driver = await this._requireActiveRider(riderId);
    const row = await this.repo.findPresence(riderId);
    const nowMs = this.now();
    const live = row && (row.status === P.ONLINE || row.status === P.BUSY);
    if (!live) return { presence: await this._own(riderId, driver), expired: false };

    // Only a free (online) rider goes stale. One carrying a parcel is busy whatever
    // their beats say: their silence is a delivery problem for an administrator, not
    // an expiry.
    if (row.status === P.ONLINE && !isHeartbeatFresh(row.lastSeenAt, this.ttlMs, nowMs)) {
      const gone = await this.repo.transitionPresence(
        riderId, [P.ONLINE], { status: P.OFFLINE, updatedAt: this._nowIso(), ...NO_POSITION },
        { staleAt: freshnessCutoffIso(this.ttlMs, nowMs) }
      );
      // `gone` is null when a concurrent beat revived them in the meantime: whatever
      // is stored now is the truth.
      return { presence: await this._own(riderId, driver), expired: Boolean(gone) };
    }

    const sinceWrite = nowMs - Date.parse(row.updatedAt);
    if (Number.isFinite(sinceWrite) && sinceWrite >= 0 && sinceWrite < PRESENCE_MIN_WRITE_INTERVAL_MS) {
      return { presence: from(row), expired: false };
    }
    const written = await this.repo.transitionPresence(riderId, [P.ONLINE, P.BUSY], this._alive(this._nowIso(), location));
    // Null: the row changed under us (they went offline): whatever is stored is the truth.
    return { presence: written ? from(written) : await this._own(riderId, driver), expired: false };
  }

  // ------------------------------------------------------- delivery-driven moves

  /**
   * Called when a rider accepts a delivery: online -> busy, atomically. The swap
   * only applies while the rider is stored online AND their last beat is fresh, so
   * two deliveries accepted at the same instant cannot both win, and a rider who
   * went offline, paused or silent cannot accept at all (409, with the reason).
   * Throws RiderUnavailableError; the caller must give the claim back with
    // A beat is the hot path (every rider, every 30 s): answered from the row it just
    // read or wrote, not from a fresh set of reads. A row stored busy reads as busy by
    // itself, and a free rider has nothing to count.
    const from = (stored) => presentOwnPresence(
      resolvePresence({ driver, row: stored, busyCount: 0, ttlMs: this.ttlMs, nowMs: this.now() }), { ttlMs: this.ttlMs }
    );
   * reconcile() if the delivery change that follows fails.
   */
  async claim(riderId) {
    const at = this._nowIso();
    const claimed = await this.repo.transitionPresence(
      riderId,
      [P.ONLINE],
      { status: P.BUSY, lastSeenAt: at, updatedAt: at },
      { seenSince: freshnessCutoffIso(this.ttlMs, this.now()) }
    );
    if (claimed) return claimed;
    // Say why. A concurrent claim that won shows up here as busy.
    const now = await this.resolve(riderId);
    throw new RiderUnavailableError(now.available ? 'busy' : now.reason, { self: true });
  }

  /**
   * Brings the stored row in line with the rider's deliveries, right now: busy while
   * they hold one they accepted (online -> busy), online again once they hold none
   * (busy -> online). Called after a delivery change that started or ended a rider's
   * work, and to give back a claim whose delivery change failed. Idempotent. It never
   * raises an offline or paused rider and never touches a suspended one.
   */
  async reconcile(riderId) {
    const row = await this.repo.findPresence(riderId);
    if (!row) return null;
    const busy = (await this._busyCount(riderId)) > 0;
    const at = this._nowIso();
    if (busy && row.status === P.ONLINE) {
      return this.repo.transitionPresence(riderId, [P.ONLINE], { status: P.BUSY, updatedAt: at });
    }
    if (!busy && row.status === P.BUSY) {
      return this.repo.transitionPresence(riderId, [P.BUSY], { status: P.ONLINE, updatedAt: at });
    }
    return row;
  }

  /**
   * Takes a rider out of availability whatever state they are in (suspension, a
   * deleted account). Not refused when they are busy: it is an administrator's act,
   * and the delivery they hold is dealt with separately.
   */
  async forceOffline(riderId) {
    return this.repo.transitionPresence(
      riderId, STORED_PRESENCE_STATUSES, { status: P.OFFLINE, updatedAt: this._nowIso(), ...NO_POSITION }
    );
  }

  // ----------------------------------------------------------- reading for dispatch

  /** Throws RiderUnavailableError unless the rider can be offered a delivery now. */
  async assertAvailable(riderId, driver) {
    const now = await this.resolve(riderId, driver);
    if (!now.available) throw new RiderUnavailableError(now.reason);
    return now;
  }

  /**
   * The ids, among `activeDrivers`, of the riders who can be offered a delivery now:
   * stored online, heard from within the window, and not carrying anything. The
   * only list dispatch is allowed to choose from.
   */
  async availableRiderIds(activeDrivers) {
    const active = new Set(activeDrivers.map((d) => d.id));
    if (!active.size) return new Set();
    const [online, busy] = await Promise.all([
      this.repo.listFreshOnlinePresence(freshnessCutoffIso(this.ttlMs, this.now()), { limit: MAX_RIDERS_CONSIDERED }),
      this.repo.countOpenByDriver({ statuses: BUSY_DELIVERY_STATUSES })
    ]);
    return new Set(online.filter((r) => active.has(r.riderId) && !busy.has(r.riderId)).map((r) => r.riderId));
  }

  /**
   * `Map<riderId, resolved presence>` for the given riders (the administrator's
   * roster), in two reads however many riders there are.
   */
  async resolveMany(drivers) {
    const [rows, busy] = await Promise.all([
      this.repo.listPresence({ limit: MAX_RIDERS_CONSIDERED * 2 }),
      this.repo.countOpenByDriver({ statuses: BUSY_DELIVERY_STATUSES })
    ]);
    const byRider = new Map(rows.map((r) => [r.riderId, r]));
    const nowMs = this.now();
    return new Map(drivers.map((driver) => [driver.id, resolvePresence({
      driver, row: byRider.get(driver.id) || null, busyCount: busy.get(driver.id) || 0, ttlMs: this.ttlMs, nowMs
    })]));
  }

  // ------------------------------------------------------------------- the sweep

  /**
   * Sets every online rider whose last beat is older than the window offline.
   * Returns the ids actually changed (a rider who beat since is skipped), so the
   * caller can take back their offers. Bounded per call; a backlog is worked off
   * over several sweeps. This is housekeeping: every read already treats a stale
   * rider as offline, so a deployment that cannot run the sweep (serverless) is
   * never wrong, only untidy.
   */
  async expireStale({ limit = 50 } = {}) {
    const nowMs = this.now();
    const cutoff = freshnessCutoffIso(this.ttlMs, nowMs);
    const stale = await this.repo.findStalePresence(cutoff, { limit });
    const expired = [];
    for (const row of stale) {
      const gone = await this.repo.transitionPresence(
        row.riderId, [P.ONLINE], { status: P.OFFLINE, updatedAt: new Date(nowMs).toISOString(), ...NO_POSITION }, { staleAt: cutoff }
      );
      if (gone) expired.push(row.riderId);
    }
    return expired;
  }

  /**
   * Puts right the `busy` rows that nothing backs up: a rider stored busy who holds
   * no accepted delivery (a crash, or a database error, between a delivery change and
   * its presence update, which would otherwise leave them unofferable for good). Only
   * rows nothing has written to for PRESENCE_CLAIM_GRACE_MS are considered, and the
   * write itself is guarded by the same age, so a claim made a moment ago, whose
   * delivery is still being written, is never undone. Returns how many were put right.
   */
  async healStaleBusy({ limit = 50 } = {}) {
    const cutoff = new Date(this.now() - PRESENCE_CLAIM_GRACE_MS).toISOString();
    const candidates = await this.repo.findStaleBusyPresence(cutoff, { limit });
    if (!candidates.length) return 0;
    const carrying = await this.repo.countOpenByDriver({ statuses: BUSY_DELIVERY_STATUSES });
    let healed = 0;
    for (const row of candidates) {
      if (carrying.has(row.riderId)) continue;
      const put = await this.repo.transitionPresence(
        row.riderId, [P.BUSY], { status: P.ONLINE, updatedAt: this._nowIso() }, { updatedBefore: cutoff }
      );
      if (put) healed += 1;
    }
    return healed;
  }
}

module.exports = { RiderPresenceService };
