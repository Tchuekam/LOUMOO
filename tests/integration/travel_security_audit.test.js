/**
 * LOUMOO TRAVEL — SECURITY & DATA-INTEGRITY REPRODUCTION SUITE
 * ---------------------------------------------------------------------------
 * Each case below asserts the CORRECT production behaviour. Before the audit
 * fixes these fail, which is precisely how the vulnerabilities were proven.
 *
 * Unlike travel_production_audit.test.js, this suite is re-runnable: it never
 * hardcodes a seat, it discovers a free one from the live seat map.
 *
 *  T1  Anonymous caller must NOT read a booking by reference (BOLA / PII leak)
 *  T2  Other authenticated user must NOT read someone else's booking
 *  T3  Anonymous caller must NOT mark a booking PAID
 *  T4  Payment must not be confirmable without a provider transaction reference
 *  T5  Unpaid booking must not be CONFIRMED with a VALID ticket
 *  T6  Booking references must not be trivially enumerable (5-digit space)
 *  T7  Hotel stays in the past must be rejected
 *  T8  Cancelling a multi-room hotel booking must release every room
 */

require('../setup');
const assert = require('assert');
const { request, createUser, cleanup, db } = require('../helpers/harness');

const results = [];
function check(id, desc, fn) {
  return (async () => {
    try {
      await fn();
      results.push({ id, desc, ok: true });
      console.log(`    ✓ ${id}  ${desc}`);
    } catch (err) {
      results.push({ id, desc, ok: false, err: err.message });
      console.log(`    ✗ ${id}  ${desc}`);
      console.log(`        → ${err.message.split('\n')[0]}`);
    }
  })();
}

/** Finds a bus service with at least one free seat and returns {serviceId, seat}. */
async function findFreeSeat() {
  const buses = await request('GET', '/api/travel/buses');
  const list = buses.body.items || buses.body.data || [];
  assert.ok(list.length > 0, 'fixture: no bus services available');

  for (const svc of list) {
    const id = svc.id || svc.serviceId || svc.scheduleId;
    const map = await request('GET', `/api/travel/bus/seats/${id}`);
    const data = map.body?.data || {};
    if (data.availableSeatsCount !== undefined && data.availableSeatsCount <= 0) continue;
    const layout = data.seatLayout || data.layout || [];
    for (const row of layout) {
      for (const s of row.seats || []) {
        if (s.status === 'AVAILABLE') return { serviceId: id, seat: s.seatNumber };
      }
    }
  }
  throw new Error('fixture: no free seat found on any bus service');
}

async function createBookingAs(token, { serviceId, seat, name = 'Audit Traveler' }) {
  return request('POST', '/api/travel/bookings', {
    token,
    body: {
      type: 'bus',
      serviceId,
      passengers: [{ name, phone: '+237 671 00 11 22', email: 'audit@loumoo.test', seat }]
    }
  });
}

async function run() {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  LOUMOO TRAVEL — SECURITY & DATA-INTEGRITY REPRODUCTION');
  console.log('═══════════════════════════════════════════════════════════\n');

  const victim = await createUser({ stage: 'ready', suffix: 'vic' });
  const attacker = await createUser({ stage: 'ready', suffix: 'atk' });

  const { serviceId, seat } = await findFreeSeat();
  const created = await createBookingAs(victim.token, { serviceId, seat });
  assert.strictEqual(created.status, 201, `fixture: victim booking failed (${created.status}) ${JSON.stringify(created.body).slice(0, 300)}`);

  const booking = created.body.booking || created.body.data;
  const ref = booking.bookingReference || booking.reference;
  console.log(`  Fixture: victim booking ${booking.id} / ${ref} on ${serviceId} seat ${seat}\n`);

  console.log('  ── Authorization ──');

  await check('T1', 'Anonymous cannot read a booking by reference', async () => {
    const res = await request('GET', `/api/travel/bookings/reference/${ref}`);
    assert.ok(
      res.status === 401 || res.status === 404,
      `anonymous reference lookup returned ${res.status} and leaked ` +
      `passengers=${JSON.stringify(res.body?.data?.passengers || []).slice(0, 120)} ` +
      `qr=${String(res.body?.data?.qrCodePayload || '').slice(0, 40)}`
    );
  });

  await check('T2', 'Another user cannot read the victim booking', async () => {
    const res = await request('GET', `/api/travel/bookings/${booking.id}`, { token: attacker.token });
    assert.strictEqual(res.status, 404, `cross-user read returned ${res.status}`);
  });

  console.log('\n  ── Payment integrity ──');

  await check('T3', 'Anonymous cannot mark a booking PAID', async () => {
    const res = await request('POST', `/api/travel/bookings/${booking.id}/pay`, {
      body: { provider: 'mtn_momo' }
    });
    assert.ok(
      res.status === 401 || res.status === 403 || res.status === 404,
      `anonymous payment confirmation returned ${res.status}; payment.status=${res.body?.data?.payment?.status}`
    );
  });

  await check('T4', 'Payment requires a real provider transaction reference', async () => {
    // MUST use a fresh booking: reusing the T3 booking would "pass" merely
    // because it is already PAID, masking the fabricated-reference defect.
    const fresh = await findFreeSeat();
    const r = await createBookingAs(victim.token, { ...fresh, name: 'Payment Probe' });
    assert.strictEqual(r.status, 201, 'fixture: payment-probe booking failed');
    const pb = r.body.booking || r.body.data;

    const res = await request('POST', `/api/travel/bookings/${pb.id}/pay`, {
      token: victim.token,
      body: { provider: 'mtn_momo' } // no transactionRef supplied
    });
    assert.notStrictEqual(
      res.body?.data?.payment?.status, 'PAID',
      'booking became PAID with a server-fabricated transaction reference'
    );
  });

  console.log('\n  ── Booking lifecycle ──');

  await check('T5', 'Unpaid booking is not CONFIRMED with a VALID ticket', async () => {
    const fresh = await findFreeSeat();
    const r = await createBookingAs(victim.token, { ...fresh, name: 'Lifecycle Probe' });
    const b = r.body.booking || r.body.data;
    const t = r.body.ticket;
    assert.ok(
      !(b.status === 'CONFIRMED' && b.payment?.status !== 'PAID'),
      `unpaid booking has status=${b.status} payment=${b.payment?.status}` +
      (t ? ` and ticket status=${t.status}` : '')
    );
  });

  await check('T6', 'Booking references are not trivially enumerable', async () => {
    const digits = String(ref).split('-').pop();
    assert.ok(
      digits.length >= 8,
      `reference "${ref}" has only a ${digits.length}-character random tail ` +
      `(~${Math.pow(10, digits.length).toLocaleString()} space) — enumerable`
    );
  });

  console.log('\n  ── Hotel data integrity ──');

  await check('T7', 'Hotel stays in the past are rejected', async () => {
    const hotels = await request('GET', '/api/travel/hotels?limit=1');
    const hotel = (hotels.body.items || hotels.body.data || [])[0];
    assert.ok(hotel, 'fixture: no hotels available');
    const rooms = await request('GET', `/api/travel/hotels/${hotel.id}/rooms`);
    const room = (rooms.body.items || rooms.body.data || [])[0];
    assert.ok(room, 'fixture: no rooms available');

    const res = await request('POST', '/api/travel/bookings', {
      token: victim.token,
      body: {
        type: 'hotel',
        hotelId: hotel.id,
        roomId: room.id,
        checkIn: '2020-01-10',
        checkOut: '2020-01-12',
        guests: 1,
        passengers: [{ name: 'Past Guest', phone: '+237 671 00 11 22' }]
      }
    });
    assert.notStrictEqual(res.status, 201, 'a stay in January 2020 was accepted as a live booking');
  });

  await check('T8', 'Cancelling a multi-room booking releases every room', async () => {
    const hotels = await request('GET', '/api/travel/hotels?limit=1');
    const hotel = (hotels.body.items || hotels.body.data || [])[0];
    const rooms = await request('GET', `/api/travel/hotels/${hotel.id}/rooms`);
    const room = (rooms.body.items || rooms.body.data || [])[0];
    assert.ok(room, 'fixture: no rooms available');

    const before = await request('GET', `/api/travel/hotels/${hotel.id}/rooms`);
    const invBefore = (before.body.items || before.body.data || []).find(r => r.id === room.id)?.availableInventory;

    const d = new Date(Date.now() + 86400000 * 30);
    const d2 = new Date(Date.now() + 86400000 * 32);
    const iso = x => x.toISOString().split('T')[0];

    const res = await request('POST', '/api/travel/bookings', {
      token: victim.token,
      body: {
        type: 'hotel',
        hotelId: hotel.id,
        roomId: room.id,
        checkIn: iso(d),
        checkOut: iso(d2),
        roomsCount: 3,
        guests: 1,
        passengers: [{ name: 'Multi Room', phone: '+237 671 00 11 22' }]
      }
    });
    if (res.status !== 201) {
      console.log(`        (skipped: 3-room booking not accepted, status ${res.status})`);
      return;
    }
    const b = res.body.booking || res.body.data;
    await request('POST', `/api/travel/bookings/${b.id}/cancel`, {
      token: victim.token,
      body: { reason: 'audit' }
    });

    const after = await request('GET', `/api/travel/hotels/${hotel.id}/rooms`);
    const invAfter = (after.body.items || after.body.data || []).find(r => r.id === room.id)?.availableInventory;
    assert.strictEqual(
      invAfter, invBefore,
      `inventory leaked: ${invBefore} before, ${invAfter} after book-3-then-cancel`
    );
  });

  console.log('\n  ── Legitimate flows still work ──');

  await check('T9', 'Guest with the right contact CAN retrieve their booking', async () => {
    const fresh = await findFreeSeat();
    const r = await request('POST', '/api/travel/bookings', {
      body: {
        type: 'bus',
        serviceId: fresh.serviceId,
        passengers: [{ name: 'Genuine Guest', phone: '+237 690 55 44 33', seat: fresh.seat }]
      }
    });
    assert.strictEqual(r.status, 201, `guest checkout broke: ${r.status}`);
    const gb = r.body.booking || r.body.data;
    const gref = gb.bookingReference || gb.reference;

    // Correct contact → allowed.
    const ok = await request('GET', `/api/travel/bookings/reference/${gref}`, {
      headers: { 'x-guest-contact': '+237 690 55 44 33' }
    });
    assert.strictEqual(ok.status, 200, `genuine guest was locked out (${ok.status})`);
    assert.strictEqual(ok.body.data.reference, gref);

    // Wrong contact → refused.
    const bad = await request('GET', `/api/travel/bookings/reference/${gref}`, {
      headers: { 'x-guest-contact': '+237 600 00 00 00' }
    });
    assert.strictEqual(bad.status, 404, `wrong contact was accepted (${bad.status})`);
  });

  await check('T10', 'Attested payment confirms the booking and issues a ticket', async () => {
    // Exercises the post-settlement path through the simulation seam. Without
    // LOUMOO_ALLOW_SIMULATED_PAYMENTS this correctly refuses (see T4), so the
    // flag is set for this single case only.
    process.env.LOUMOO_ALLOW_SIMULATED_PAYMENTS = 'true';
    const { paymentVerificationService } = require('../../server/modules/travel/application/PaymentVerificationService');
    paymentVerificationService.simulationEnabled = true;
    try {
      const fresh = await findFreeSeat();
      const r = await createBookingAs(victim.token, { ...fresh, name: 'Settlement Probe' });
      assert.strictEqual(r.status, 201, 'fixture: settlement-probe booking failed');
      const sb = r.body.booking || r.body.data;
      assert.strictEqual(sb.status, 'PENDING', `booking should start PENDING, got ${sb.status}`);

      const pay = await request('POST', `/api/travel/bookings/${sb.id}/pay`, {
        token: victim.token,
        body: { provider: 'mtn_momo', transactionRef: `MOMO-TEST-${Date.now()}` }
      });
      assert.strictEqual(pay.status, 200, `payment failed: ${pay.status} ${JSON.stringify(pay.body).slice(0, 200)}`);
      assert.strictEqual(pay.body.data.payment.status, 'PAID', 'payment not recorded as PAID');
      assert.strictEqual(pay.body.data.status, 'CONFIRMED', 'booking not promoted to CONFIRMED');
      assert.ok(pay.body.data.ticket, 'no ticket issued after payment');
      assert.strictEqual(pay.body.data.ticket.status, 'VALID', 'issued ticket is not VALID');

      // Paying twice must be a clean 409, never a 500 with a stack trace.
      const again = await request('POST', `/api/travel/bookings/${sb.id}/pay`, {
        token: victim.token,
        body: { provider: 'mtn_momo', transactionRef: `MOMO-TEST-${Date.now()}` }
      });
      assert.strictEqual(again.status, 409, `double payment returned ${again.status}, expected 409`);
    } finally {
      delete process.env.LOUMOO_ALLOW_SIMULATED_PAYMENTS;
      paymentVerificationService.simulationEnabled = false;
    }
  });

  // ---------------------------------------------------------------- summary
  const failed = results.filter(r => !r.ok);
  console.log('\n───────────────────────────────────────────────────────────');
  console.log(`  ${results.length - failed.length}/${results.length} passed, ${failed.length} failed`);
  console.log('───────────────────────────────────────────────────────────\n');

  await cleanup();
  if (failed.length > 0) {
    throw new Error(`${failed.length} test(s) failed in travel_security_audit: ${failed.map(f => `${f.id}: ${f.err}`).join(', ')}`);
  }
  return failed;
}

if (require.main === module) {
  run()
    .then(failed => process.exit(failed.length > 0 ? 1 : 0))
    .catch(err => { console.error('SUITE ERROR:', err); process.exit(1); });
}

module.exports = { run };
