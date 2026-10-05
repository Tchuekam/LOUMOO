/**
 * LOUMOO Delivery — Offer sweeper
 * ---------------------------------------------------------------------------
 * Returns rider offers nobody answered to their sellers on a timer (see "Offer
 * expiry" in docs/DELIVERY_API.md). The reads already release a lapsed offer
 * when someone looks at it; this covers the case where nobody does, so the
 * seller is told the rider went quiet instead of finding out later.
 *
 * It also sweeps rider presence: a rider who is online but has stopped sending
 * heartbeats is set offline and the offers they never answered go back to their
 * sellers (see "Rider presence" in docs/DELIVERY_API.md). Every read already treats
 * a silent rider as offline, so this is tidiness and the offers, not correctness.
 *
 * Only for a long-lived process. A serverless runtime cannot keep a timer, and
 * relies on the release-on-read alone.
 */

const logger = require('../../../shared/logging/logger');

const DEFAULT_INTERVAL_MS = 60 * 1000;
const DEFAULT_BATCH = 50;

/**
 * Starts the sweep. Returns `{ tick, stop, timer }`: `tick()` runs one sweep now
 * (what the timer calls, exposed for tests and for an operator), `stop()` clears
 * the timer. The timer is unref'd, so it never keeps the process alive.
 *
 * Timer functions are injectable so the behaviour can be tested without waiting.
 */
function startOfferSweeper({
  service,
  intervalMs = DEFAULT_INTERVAL_MS,
  limit = DEFAULT_BATCH,
  setIntervalFn = setInterval,
  clearIntervalFn = clearInterval
} = {}) {
  if (!service || typeof service.expireStaleOffers !== 'function') {
    throw new TypeError('startOfferSweeper needs a delivery service with expireStaleOffers()');
  }
  if (!Number.isFinite(intervalMs) || intervalMs < 1000) {
    throw new RangeError('startOfferSweeper: intervalMs must be at least 1000');
  }

  // A service that cannot sweep presence (a test double, an older service) simply
  // has no such job.
  const presenceOn = typeof service.expireStalePresence === 'function';
  let running = false;

  async function tick() {
    // A slow sweep must not be overtaken by the next tick: two sweeps would only
    // race each other for the same rows.
    if (running) return { expired: 0, skipped: true };
    running = true;
    try {
      const result = { expired: 0 };
      if (service.offerTtlMs > 0) {
        Object.assign(result, await service.expireStaleOffers({ limit }));
        if (result.expired > 0) logger.info(`[OfferSweeper] returned ${result.expired} lapsed offer(s) to their sellers`);
      }
      // Chasing an order nobody is arranging is a separate job: its failure must
      // not hide the expiry above, and the expiry's must not hide this.
      if (service.nudgeEnabled && typeof service.nudgeUndispatched === 'function') {
        try {
          result.nudged = await service.nudgeUndispatched();
        } catch (err) {
          logger.error(`[OfferSweeper] reminders failed: ${err.message}`);
          result.nudgeFailed = true;
        }
      }
      // So is presence, for the same reason.
      if (presenceOn) {
        try {
          result.presence = await service.expireStalePresence({ limit });
          if (result.presence.expired > 0) logger.info(`[OfferSweeper] set ${result.presence.expired} silent rider(s) offline`);
          if (result.presence.healed > 0) logger.info(`[OfferSweeper] put ${result.presence.healed} stale busy rider(s) right`);
        } catch (err) {
          logger.error(`[OfferSweeper] presence sweep failed: ${err.message}`);
          result.presenceFailed = true;
        }
      }
      return result;
    } catch (err) {
      // Never let a failed sweep become an unhandled rejection on a timer.
      logger.error(`[OfferSweeper] sweep failed: ${err.message}`);
      return { expired: 0, failed: true };
    } finally {
      running = false;
    }
  }

  // Nothing to do (offer expiry off, no reminders, no presence sweep): do not hold a
  // timer that wakes every minute to do nothing.
  if (!(service.offerTtlMs > 0) && !service.nudgeEnabled && !presenceOn) {
    logger.info('[OfferSweeper] offer expiry, reminders and the presence sweep are off; not scheduling a sweep');
    return { tick, stop: () => {}, timer: null };
  }

  const timer = setIntervalFn(tick, intervalMs);
  if (timer && typeof timer.unref === 'function') timer.unref();
  return { tick, stop: () => clearIntervalFn(timer), timer };
}

module.exports = { startOfferSweeper, DEFAULT_INTERVAL_MS, DEFAULT_BATCH };
