/**
 * LOUMOO — Delivery offer sweeper
 * ---------------------------------------------------------------------------
 * The background timer that returns unanswered rider offers to their sellers and
 * sets silent riders offline: what it calls, that ticks never overlap, that a
 * failing sweep cannot escape the timer (and that the presence sweep and the other
 * two jobs cannot hide one another's result), that it never keeps the process
 * alive, and that it schedules nothing when it has nothing to do: offer expiry off,
 * no reminders AND no presence sweep. A service that has expireStalePresence always
 * has a presence sweep, so for a real service the timer runs whatever the offer
 * window is. Timers are injected, so nothing here waits. Pairs with the end-to-end
 * expiry cases in delivery_dispatch.test.js and the presence suites.
 */

require('../setup');

const assert = require('assert');
const logger = require('../../server/shared/logging/logger');
const { startOfferSweeper, DEFAULT_INTERVAL_MS, DEFAULT_BATCH } = require('../../server/modules/delivery/infrastructure/OfferSweeper');
const { DeliveryService } = require('../../server/modules/delivery/application/DeliveryService');
const { DeliveryRepository } = require('../../server/modules/delivery/infrastructure/DeliveryRepository');
const { DeliveryEvents } = require('../../server/modules/delivery/infrastructure/DeliveryEvents');
const { OrderRepository } = require('../../server/modules/commerce/infrastructure/OrderRepository');
const { Order, FULFILLMENT_STATUS, DELIVERY_METHOD, PAYMENT_STATUS } = require('../../server/modules/commerce/domain/Order');

/** A fake timer API recording what the sweeper schedules. */
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

const deferred = () => {
  let resolve; let reject;
  const promise = new Promise((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
};

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const ADMIN = { userId: 'admin_1', userRole: 'admin' };
const SELLER = { userId: 'seller_1', userRole: 'seller' };
const RIDER_1 = { userId: 'rider_1', userRole: 'customer' };
const RIDER_2 = { userId: 'rider_2', userRole: 'customer' };

/**
 * The real service over in-memory backends and a fake clock. `presenceTtlMs` is how
 * long a rider may stay silent; a case that is about something else than presence gives
 * it an hour, so the rider is still "here" whenever that case moves the clock.
 */
function realWorld({ presenceTtlMs }) {
  const clock = { t: Date.parse('2026-10-03T10:00:00.000Z') };
  const orders = new OrderRepository({ db: null });
  const repo = new DeliveryRepository({ db: null });
  const service = new DeliveryService({
    repository: repo, orderRepository: orders, events: new DeliveryEvents(), now: () => clock.t,
    offerTtlMs: 15 * MINUTE, presenceTtlMs
  });
  return { clock, orders, repo, service, advance: (ms) => { clock.t += ms; } };
}

/** A registered rider who has opened the app and gone online. */
async function registerOnline(w, id, name) {
  await w.service.registerDriver(id, { name, phone: `+2376000000${id.replace(/\D/g, '').padStart(2, '0')}` }, ADMIN);
  await w.service.riderGoOnline({ userId: id, userRole: 'customer' });
}

let orderSeq = 0;
/** A paid home-delivery order, a delivery for it, and that delivery offered to `riderId`. */
async function offerTo(w, riderId) {
  orderSeq += 1;
  const order = await w.orders.saveOrder(new Order({
    buyerId: 'buyer_1',
    sellerId: 'seller_1',
    items: [{ listingId: `lst_s${orderSeq}`, title: 'Phone', unitPriceXaf: 50000, quantity: 1, sellerId: 'seller_1', storeName: 'Tech Shop' }],
    shippingAddress: { fullName: 'Awa Njoya', phone: '+237622222222', street: 'Rue 1', city: 'Douala' },
    deliveryMethod: DELIVERY_METHOD.HOME_DELIVERY,
    paymentStatus: PAYMENT_STATUS.PAID,
    fulfillmentStatus: FULFILLMENT_STATUS.PROCESSING
  }));
  const created = await w.service.createDelivery(order.id, SELLER, {});
  await w.service.assignDriver(created.id, riderId, SELLER);
  return created;
}

async function run() {
  console.log('  Testing Delivery offer sweeper...');

  const logs = { info: [], error: [] };
  const originalInfo = logger.info;
  const originalError = logger.error;
  logger.info = (m) => logs.info.push(String(m));
  logger.error = (m) => logs.error.push(String(m));

  try {
    // ------------------------------------------------------------- construction
    assert.throws(() => startOfferSweeper({}), TypeError, 'a service is required');
    assert.throws(() => startOfferSweeper({ service: {} }), TypeError, 'and it must be able to sweep');
    assert.throws(() => startOfferSweeper({ service: { expireStaleOffers() {}, offerTtlMs: 1 }, intervalMs: 10 }), RangeError, 'a busy-loop interval is refused');
    assert.throws(() => startOfferSweeper({ service: { expireStaleOffers() {}, offerTtlMs: 1 }, intervalMs: NaN }), RangeError);
    assert.strictEqual(DEFAULT_INTERVAL_MS, 60000, 'it sweeps once a minute');

    // ------------------------------------------------------------- scheduling
    {
      const timers = fakeTimers();
      const calls = [];
      const service = { offerTtlMs: 900000, expireStaleOffers: async (opts) => { calls.push(opts); return { expired: 0 }; } };
      const sweeper = startOfferSweeper({ service, ...timers });
      assert.strictEqual(timers.scheduled.length, 1, 'one timer');
      assert.strictEqual(timers.scheduled[0].ms, DEFAULT_INTERVAL_MS);
      assert.strictEqual(timers.unrefCalled, true, 'the timer never keeps the process alive');
      assert.strictEqual(sweeper.timer, timers.scheduled[0]);

      await timers.scheduled[0].fn();
      assert.deepStrictEqual(calls, [{ limit: DEFAULT_BATCH }], 'a tick runs one bounded sweep');
      await sweeper.tick();
      assert.strictEqual(calls.length, 2, 'tick() is the same sweep, callable directly');

      sweeper.stop();
      assert.deepStrictEqual(timers.cleared, [timers.scheduled[0]], 'stop() clears exactly that timer');
    }
    {
      const timers = fakeTimers();
      const calls = [];
      const service = { offerTtlMs: 900000, expireStaleOffers: async (opts) => { calls.push(opts); return { expired: 0 }; } };
      startOfferSweeper({ service, intervalMs: 5000, limit: 7, ...timers });
      assert.strictEqual(timers.scheduled[0].ms, 5000, 'the interval is configurable');
      await timers.scheduled[0].fn();
      assert.deepStrictEqual(calls, [{ limit: 7 }], 'and so is the batch size');
    }

    // ------------------------------------------- nothing to sweep: no timer at all
    // The sweeper now also owns a presence sweep, so "offer expiry off" alone no longer
    // means "nothing to do": a service that CAN sweep presence keeps the timer (next
    // block). What still schedules nothing is a service with no presence sweep, with
    // expiry off and no reminders: a minimal double, or a service from before presence.
    {
      for (const offerTtlMs of [0, undefined, -1, NaN]) {
        const timers = fakeTimers();
        const sweeper = startOfferSweeper({ service: { offerTtlMs, expireStaleOffers: async () => ({ expired: 0 }) }, ...timers });
        assert.strictEqual(timers.scheduled.length, 0, `no timer when the window is ${offerTtlMs} and the service has no presence sweep`);
        assert.strictEqual(sweeper.timer, null);
        assert.doesNotThrow(() => sweeper.stop(), 'stop() is still safe');
      }
      // Something that is not a function is no presence sweep either.
      for (const expireStalePresence of [null, undefined, true, 'yes']) {
        const timers = fakeTimers();
        const sweeper = startOfferSweeper({ service: { offerTtlMs: 0, expireStaleOffers: async () => ({ expired: 0 }), expireStalePresence }, ...timers });
        assert.strictEqual(timers.scheduled.length, 0, `expireStalePresence: ${JSON.stringify(expireStalePresence)} is not a sweep`);
        assert.strictEqual(sweeper.timer, null);
        assert.deepStrictEqual(await sweeper.tick(), { expired: 0 }, 'a tick of nothing is still safe, and asks for nothing');
      }
      assert.ok(logs.info.some((m) => /offer expiry, reminders and the presence sweep are off/.test(m)), 'it says so, rather than going quiet');
    }

    // ---------------------------------- the presence sweep alone keeps the timer running
    {
      // Offer expiry off, no reminders, but the service can set silent riders offline:
      // the timer IS scheduled (it used to be skipped), and a tick runs only the presence job.
      const timers = fakeTimers();
      const calls = { expire: 0, nudge: 0, presence: [] };
      const service = {
        offerTtlMs: 0,
        expireStaleOffers: async () => { calls.expire += 1; return { expired: 0 }; },
        nudgeUndispatched: async () => { calls.nudge += 1; return {}; },
        expireStalePresence: async (opts) => { calls.presence.push(opts); return { expired: 2, healed: 1 }; }
      };
      const sweeper = startOfferSweeper({ service, limit: 9, ...timers });
      assert.strictEqual(timers.scheduled.length, 1, 'a presence sweep alone is reason enough for the timer');
      assert.strictEqual(timers.scheduled[0].ms, DEFAULT_INTERVAL_MS);
      assert.strictEqual(timers.unrefCalled, true, 'and it still never keeps the process alive');
      assert.strictEqual(sweeper.timer, timers.scheduled[0]);

      const before = logs.info.length;
      const result = await timers.scheduled[0].fn();
      assert.deepStrictEqual(calls.presence, [{ limit: 9 }], 'the presence sweep gets the same bounded batch');
      assert.strictEqual(calls.expire, 0, 'offer expiry is off, so it is not run');
      assert.strictEqual(calls.nudge, 0, 'and with reminders off (nudgeEnabled unset) neither are they');
      assert.deepStrictEqual(result, { expired: 0, presence: { expired: 2, healed: 1 } }, 'the tick reports what the presence sweep did');
      const said = logs.info.slice(before);
      assert.ok(said.some((m) => /set 2 silent rider\(s\) offline/.test(m)), 'it says how many riders it set offline');
      assert.ok(said.some((m) => /put 1 stale busy rider\(s\) right/.test(m)), 'and how many stale busy riders it put right');
      sweeper.stop();
      assert.deepStrictEqual(timers.cleared, [timers.scheduled[0]], 'stop() clears that timer');

      // Default batch, and a service whose presence sweep has nothing to report.
      const calls2 = [];
      const quiet = { offerTtlMs: 0, expireStalePresence: async (opts) => { calls2.push(opts); return { expired: 0, healed: 0 }; }, expireStaleOffers: async () => ({ expired: 0 }) };
      const before2 = logs.info.length;
      assert.deepStrictEqual(await startOfferSweeper({ service: quiet, ...fakeTimers() }).tick(), { expired: 0, presence: { expired: 0, healed: 0 } });
      assert.deepStrictEqual(calls2, [{ limit: DEFAULT_BATCH }], 'the default batch applies');
      assert.strictEqual(logs.info.length, before2, 'a presence sweep that changed nothing logs nothing (it runs every minute)');
    }

    // ------------------------ all three jobs in one tick, and none hides another's result
    {
      const calls = { expire: 0, nudge: 0, presence: 0 };
      const all = {
        offerTtlMs: 900000, nudgeEnabled: true,
        expireStaleOffers: async () => { calls.expire += 1; return { expired: 4 }; },
        nudgeUndispatched: async () => { calls.nudge += 1; return { sellers: 1, admins: 0 }; },
        expireStalePresence: async () => { calls.presence += 1; return { expired: 2, healed: 0 }; }
      };
      const r = await startOfferSweeper({ service: all, ...fakeTimers() }).tick();
      assert.deepStrictEqual(calls, { expire: 1, nudge: 1, presence: 1 }, 'one tick runs all three');
      assert.deepStrictEqual(r, { expired: 4, nudged: { sellers: 1, admins: 0 }, presence: { expired: 2, healed: 0 } });

      // A failing presence sweep never hides the expiry result or the reminders, and never escapes.
      const before = logs.error.length;
      const presenceDown = { ...all, expireStalePresence: async () => { throw new Error('rider_presence table down'); } };
      const r2 = await startOfferSweeper({ service: presenceDown, ...fakeTimers() }).tick();
      assert.strictEqual(r2.expired, 4, 'the expiry still reports');
      assert.deepStrictEqual(r2.nudged, { sellers: 1, admins: 0 }, 'and so do the reminders');
      assert.strictEqual(r2.presenceFailed, true, 'the presence failure is flagged');
      assert.strictEqual(r2.presence, undefined, 'with no half-result');
      assert.ok(logs.error.slice(before).some((m) => /presence sweep failed: rider_presence table down/.test(m)), 'and logged with its reason');

      // And the other way round: a failing reminder job does not stop the presence sweep.
      const nudgeDown = { ...all, nudgeUndispatched: async () => { throw new Error('orders table down'); } };
      const r3 = await startOfferSweeper({ service: nudgeDown, ...fakeTimers() }).tick();
      assert.strictEqual(r3.nudgeFailed, true);
      assert.deepStrictEqual(r3.presence, { expired: 2, healed: 0 }, 'the presence sweep still ran and reported');
      assert.strictEqual(r3.expired, 4);
    }

    // ----------------------------------------------- reminders for orders nobody is arranging
    {
      // Expiry off but reminders on: the timer still runs, and only the reminders are done.
      const timers = fakeTimers();
      const calls = { expire: 0, nudge: 0 };
      const service = {
        offerTtlMs: 0, nudgeEnabled: true,
        expireStaleOffers: async () => { calls.expire += 1; return { expired: 0 }; },
        nudgeUndispatched: async () => { calls.nudge += 1; return { sellers: 2, admins: 1 }; }
      };
      const sweeper = startOfferSweeper({ service, ...timers });
      assert.strictEqual(timers.scheduled.length, 1, 'reminders alone keep the sweep scheduled');
      const result = await sweeper.tick();
      assert.deepStrictEqual(calls, { expire: 0, nudge: 1 }, 'expiry is not run when it is off; reminders are');
      assert.deepStrictEqual(result.nudged, { sellers: 2, admins: 1 });

      // Both on: both run, in one tick.
      const both = { offerTtlMs: 900000, nudgeEnabled: true, expireStaleOffers: async () => { calls.expire += 1; return { expired: 1 }; }, nudgeUndispatched: async () => { calls.nudge += 1; return {}; } };
      const r2 = await startOfferSweeper({ service: both, ...fakeTimers() }).tick();
      assert.strictEqual(r2.expired, 1);
      assert.deepStrictEqual(calls, { expire: 1, nudge: 2 });

      // A failing reminder job never hides the expiry result, and never escapes the timer.
      const failing = { offerTtlMs: 900000, nudgeEnabled: true, expireStaleOffers: async () => ({ expired: 3 }), nudgeUndispatched: async () => { throw new Error('orders table down'); } };
      const r3 = await startOfferSweeper({ service: failing, ...fakeTimers() }).tick();
      assert.strictEqual(r3.expired, 3, 'the expiry still reports');
      assert.strictEqual(r3.nudgeFailed, true);
      assert.ok(logs.error.some((m) => /reminders failed: orders table down/.test(m)));

      // Reminders switched off: a service without the job is simply not asked for it.
      const plain = { offerTtlMs: 900000, nudgeEnabled: false, expireStaleOffers: async () => ({ expired: 0 }), nudgeUndispatched: async () => { throw new Error('must not be called'); } };
      assert.strictEqual((await startOfferSweeper({ service: plain, ...fakeTimers() }).tick()).nudged, undefined);
    }

    // ---------------------------------------------------------------- no overlap
    {
      const timers = fakeTimers();
      const gate = deferred();
      let started = 0;
      const service = { offerTtlMs: 900000, expireStaleOffers: async () => { started += 1; await gate.promise; return { expired: 2 }; } };
      const sweeper = startOfferSweeper({ service, ...timers });

      // Not awaited one by one: without the guard these would all be inside the
      // service at once (and a naive `await` would just hang the suite).
      const first = sweeper.tick();
      const second = sweeper.tick(); // lands while the first is still running
      const third = sweeper.tick();
      assert.strictEqual(started, 1, 'a tick during a running sweep does nothing');
      gate.resolve();
      assert.deepStrictEqual(await first, { expired: 2 });
      assert.deepStrictEqual(await second, { expired: 0, skipped: true });
      assert.deepStrictEqual(await third, { expired: 0, skipped: true });
      await sweeper.tick();
      assert.strictEqual(started, 2, 'once it finishes the next tick sweeps again');
    }
    {
      // The lock covers the presence sweep too: two presence sweeps would race each
      // other for the same rows (and double-withdraw the same offers).
      const timers = fakeTimers();
      const gate = deferred();
      let started = 0;
      const service = {
        offerTtlMs: 0,
        expireStaleOffers: async () => ({ expired: 0 }),
        expireStalePresence: async () => { started += 1; await gate.promise; return { expired: 1, healed: 0 }; }
      };
      const sweeper = startOfferSweeper({ service, ...timers });
      const first = sweeper.tick();
      const second = sweeper.tick(); // lands while the presence sweep is still running
      assert.strictEqual(started, 1, 'a tick during a running presence sweep does nothing');
      gate.resolve();
      assert.deepStrictEqual(await first, { expired: 0, presence: { expired: 1, healed: 0 } });
      assert.deepStrictEqual(await second, { expired: 0, skipped: true });
      await sweeper.tick();
      assert.strictEqual(started, 2, 'and the next tick, after it finished, sweeps again');
    }

    // ------------------------------------------------------------ failures contained
    {
      const timers = fakeTimers();
      let n = 0;
      const service = {
        offerTtlMs: 900000,
        expireStaleOffers: async () => { n += 1; if (n === 1) throw new Error('database is down'); return { expired: 1 }; }
      };
      const sweeper = startOfferSweeper({ service, ...timers });
      const before = logs.error.length;
      const failed = await timers.scheduled[0].fn(); // must resolve, not reject: a timer has nobody to catch it
      assert.deepStrictEqual(failed, { expired: 0, failed: true });
      assert.ok(logs.error.slice(before).some((m) => /database is down/.test(m)), 'the failure is logged with its reason');
      assert.deepStrictEqual(await sweeper.tick(), { expired: 1 }, 'and the next sweep still runs: a failure does not wedge the lock');
    }
    {
      // The same holds for a service that also sweeps presence: whichever job throws,
      // the tick resolves (a timer has nobody to catch a rejection) and the next one runs.
      const timers = fakeTimers();
      let offers = 0;
      const service = {
        offerTtlMs: 900000,
        expireStaleOffers: async () => { offers += 1; if (offers === 1) throw new Error('offers query failed'); return { expired: 1 }; },
        expireStalePresence: async () => ({ expired: 0, healed: 0 })
      };
      const sweeper = startOfferSweeper({ service, ...timers });
      const before = logs.error.length;
      const failing = await timers.scheduled[0].fn();
      assert.strictEqual(failing.failed, true, 'the failing tick resolves, and says it failed');
      assert.strictEqual(failing.expired, 0, 'with nothing expired');
      // The jobs are isolated: a failing offer-expiry query must not stop the presence
      // sweep from running in the same tick (it used to, which left silent riders online).
      assert.deepStrictEqual(failing.presence, { expired: 0, healed: 0 }, 'and the presence sweep still ran in that same tick');
      assert.ok(logs.error.slice(before).some((m) => /offers query failed/.test(m)), 'with its reason in the log');
      const next = await sweeper.tick();
      assert.strictEqual(next.expired, 1, 'the next tick runs the offer sweep again');
      assert.deepStrictEqual(next.presence, { expired: 0, healed: 0 }, 'and the presence sweep');
    }

    // --------------------------------------------------------------------- logging
    {
      const timers = fakeTimers();
      const service = { offerTtlMs: 900000, expireStaleOffers: async () => ({ expired: 3 }) };
      const sweeper = startOfferSweeper({ service, ...timers });
      const before = logs.info.length;
      await sweeper.tick();
      assert.ok(logs.info.slice(before).some((m) => /returned 3 lapsed offer/.test(m)), 'a sweep that released offers says how many');
      const quiet = { offerTtlMs: 900000, expireStaleOffers: async () => ({ expired: 0 }) };
      const before2 = logs.info.length;
      await startOfferSweeper({ service: quiet, ...fakeTimers() }).tick();
      assert.strictEqual(logs.info.length, before2, 'an empty sweep logs nothing (it runs every minute)');
    }

    // --------------------------------------- against the real service, end to end
    {
      const NotificationService = require('../../server/modules/identity/application/NotificationService');
      const originalCreate = NotificationService.create;
      const sent = [];
      NotificationService.create = async (userId, payload) => { sent.push({ userId, ...payload }); return null; };
      try {
        // ---- a lapsed OFFER goes back to the seller (the offer window, not presence)
        {
          // An hour of presence, so that the rider is still "here" when the offer window
          // (15 minutes) lapses: this case is about the offer window and nothing else.
          const w = realWorld({ presenceTtlMs: HOUR });
          await registerOnline(w, 'rider_1', 'Alain');
          const created = await offerTo(w, 'rider_1');

          const timers = fakeTimers();
          const sweeper = startOfferSweeper({ service: w.service, ...timers });
          assert.strictEqual(timers.scheduled.length, 1, 'a real service has a presence sweep, so the timer runs');
          await sweeper.tick();
          assert.strictEqual((await w.repo.findById(created.id)).status, 'assigned', 'an open offer is left alone');
          w.advance(16 * MINUTE);
          const result = await sweeper.tick();
          // (A real service also reports its reminder run, so compare what this test is about.)
          assert.strictEqual(result.expired, 1);
          assert.deepStrictEqual(result.presence, { expired: 0, healed: 0 }, 'a rider heard from within the hour is left online');
          assert.strictEqual((await w.repo.findById(created.id)).status, 'pending_assignment', 'a lapsed offer goes back to the seller');
          assert.strictEqual((await sweeper.tick()).expired, 0, 'and the next sweep finds nothing');
        }

        // ---- a rider who goes silent holding an offer: the PRESENCE sweep takes it back
        {
          const w = realWorld({ presenceTtlMs: 2 * MINUTE });
          await registerOnline(w, 'rider_1', 'Alain');
          await registerOnline(w, 'rider_2', 'Bruno');
          const created = await offerTo(w, 'rider_1');
          const sweeper = startOfferSweeper({ service: w.service, ...fakeTimers() });
          sent.length = 0;

          w.advance(90 * 1000); // inside the two-minute window
          await w.service.riderHeartbeat(RIDER_2); // Bruno's app keeps beating; Alain's does not
          const early = await sweeper.tick();
          assert.deepStrictEqual(early.presence, { expired: 0, healed: 0 }, 'a rider silent for 90 s of 120 s is still online');
          assert.strictEqual((await w.repo.findById(created.id)).status, 'assigned', 'and keeps their offer');

          w.advance(90 * 1000); // Alain has now been silent for three minutes; Bruno beat 90 s ago
          const late = await sweeper.tick();
          assert.strictEqual(late.expired, 0, 'the 15-minute offer window has not lapsed: this is not offer expiry');
          assert.deepStrictEqual(late.presence, { expired: 1, healed: 0 }, 'exactly one rider went silent: Alain, not Bruno');

          const back = await w.repo.findById(created.id);
          assert.strictEqual(back.status, 'pending_assignment', 'the unanswered offer is back with the seller');
          assert.strictEqual(back.driverId, null);
          const events = await w.repo.listEvents(created.id);
          const last = events[events.length - 1];
          assert.strictEqual(last.note, 'Rider stopped responding and was set offline', 'the timeline says why');
          assert.strictEqual(last.actorId, 'presence', 'by the system, not as the rider declining');
          assert.strictEqual(last.previousStatus, 'assigned');
          const told = sent.filter((n) => n.userId === 'seller_1' && n.title === 'A rider is no longer available');
          assert.strictEqual(told.length, 1, 'the seller is told once');

          assert.strictEqual((await w.service.getRiderPresence(RIDER_1)).status, 'offline', 'Alain is offline');
          assert.strictEqual((await w.service.getRiderPresence(RIDER_2)).status, 'online', 'Bruno is untouched');
          assert.deepStrictEqual((await sweeper.tick()).presence, { expired: 0, healed: 0 }, 'the next sweep finds nothing');
          assert.strictEqual(sent.filter((n) => n.title === 'A rider is no longer available').length, 1, 'and tells nobody again');

          // Only Bruno can be offered the delivery now: the silent rider is not a candidate.
          await w.service.autoAssignDriver(created.id, SELLER);
          const reoffered = await w.repo.findById(created.id);
          assert.strictEqual(reoffered.status, 'assigned');
          assert.strictEqual(reoffered.driverId, 'rider_2', 'the silent rider is not offered it again');
        }

        // ---- a rider carrying a parcel is never "silent": the sweep leaves them busy
        {
          const w = realWorld({ presenceTtlMs: 2 * MINUTE });
          await registerOnline(w, 'rider_1', 'Alain');
          const created = await offerTo(w, 'rider_1');
          await w.service.acceptDelivery(created.id, RIDER_1);
          const sweeper = startOfferSweeper({ service: w.service, ...fakeTimers() });
          w.advance(HOUR);
          const r = await sweeper.tick();
          assert.deepStrictEqual(r.presence, { expired: 0, healed: 0 }, 'nothing expired, and a busy row with a parcel behind it is not "healed"');
          assert.strictEqual((await w.service.getRiderPresence(RIDER_1)).status, 'busy', 'still busy after an hour of silence');
          assert.strictEqual((await w.repo.findById(created.id)).status, 'accepted', 'and still holding the delivery');
        }

        // ---- a busy row with nothing behind it (a crash between the two writes) is put right
        {
          const w = realWorld({ presenceTtlMs: 2 * MINUTE });
          await registerOnline(w, 'rider_1', 'Alain');
          // The leak: the claim was written, the delivery change never was.
          const leaked = await w.repo.transitionPresence('rider_1', ['online'], { status: 'busy', updatedAt: new Date(w.clock.t).toISOString() });
          assert.strictEqual(leaked.status, 'busy', 'setup: the rider is stored busy with no delivery');
          assert.strictEqual((await w.repo.findOpenByDriver('rider_1')).length, 0, 'setup: and holds nothing');
          const sweeper = startOfferSweeper({ service: w.service, ...fakeTimers() });

          w.advance(20 * 1000); // younger than the 30 s grace: a claim in flight looks exactly like this
          assert.deepStrictEqual((await sweeper.tick()).presence, { expired: 0, healed: 0 }, 'a fresh busy row is left alone');
          assert.strictEqual((await w.service.getRiderPresence(RIDER_1)).status, 'busy');

          w.advance(20 * 1000); // 40 s old
          assert.deepStrictEqual((await sweeper.tick()).presence, { expired: 0, healed: 1 }, 'an old one with nothing behind it is put right');
          const fixed = await w.service.getRiderPresence(RIDER_1);
          assert.strictEqual(fixed.status, 'online', 'back to online');
          assert.strictEqual(fixed.available, true);
        }
      } finally {
        NotificationService.create = originalCreate;
      }
    }

    console.log('    ✓ Delivery offer sweeper: scheduling, no overlap, contained failures and the real sweep hold.');
  } finally {
    logger.info = originalInfo;
    logger.error = originalError;
  }
}

module.exports = { run };
