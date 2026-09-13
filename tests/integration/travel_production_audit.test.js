/**
 * LOUMOO Production Audit & Verification Test Suite
 * ---------------------------------------------------------------------------
 * Validates the core architectural & operational fixes implemented during the audit:
 *  1. RateLimitService graceful fallback when Redis is offline/unreachable
 *  2. Payment confirmation endpoint (POST /api/travel/bookings/:id/pay)
 *  3. OTA Booking Reference lookup (GET /api/travel/bookings/reference/:ref)
 *  4. Fuzzy/Slug hotel ID matching ('krystal_palace' -> 'htl-krystal-douala')
 *  5. Guest checkout with passenger contact details
 *  6. Role-based admin authorization (primaryRole: 'admin')
 */

require('../setup');
const assert = require('assert');
const http = require('http');
const app = require('../../server/index');
const { createUser, db } = require('../helpers/harness');
const { RateLimitService } = require('../../server/infrastructure/cache/RateLimitService');
const { travelRepository } = require('../../server/modules/travel/infrastructure/TravelRepository');

function makeRequest(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const server = http.createServer(app);
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      const payload = body ? JSON.stringify(body) : null;
      const reqHeaders = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...headers
      };
      if (payload) {
        reqHeaders['Content-Length'] = Buffer.byteLength(payload);
      }

      const req = http.request({
        host: '127.0.0.1',
        port,
        method,
        path: encodeURI(path),
        headers: reqHeaders
      }, res => {
        let raw = '';
        res.on('data', chunk => { raw += chunk; });
        res.on('end', () => {
          server.close();
          try {
            const data = raw ? JSON.parse(raw) : {};
            resolve({ status: res.statusCode, headers: res.headers, body: data });
          } catch (e) {
            resolve({ status: res.statusCode, headers: res.headers, raw });
          }
        });
      });

      req.on('error', err => {
        server.close();
        reject(err);
      });

      if (payload) {
        req.write(payload);
      }
      req.end();
    });
  });
}

async function run() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  LOUMOO TRAVEL PRODUCTION AUDIT VERIFICATION SUITE');
  console.log('═══════════════════════════════════════════════════════════\n');

  // [1] Verify RateLimitService graceful in-memory fallback
  console.log('  [1/6] Verifying RateLimitService in-memory sliding window fallback...');
  const testLimiter = new RateLimitService();
  // Simulate Redis client being not ready or null
  testLimiter.redis = null;

  const r1 = await testLimiter.isAllowed('ip-audit-123', 5, 60);
  assert.strictEqual(r1.allowed, true, 'First request must be allowed by memory fallback');
  assert.strictEqual(r1.remaining, 4, 'Remaining count must decrement');
  for (let i = 0; i < 4; i++) {
    await testLimiter.consume('ip-audit-123', 5, 60);
  }
  const r6 = await testLimiter.isAllowed('ip-audit-123', 5, 60);
  assert.strictEqual(r6.allowed, false, '6th request must be rejected (maxRequests = 5)');
  console.log('    ✓ RateLimitService safely falls back to memory sliding window without throwing 503.');

  // [2] Verify Fuzzy/Slug hotel ID matching
  console.log('  [2/6] Verifying Hotel ID resolver & fuzzy slug matching...');
  const resolvedBySlug = await travelRepository.getHotelById('krystal_palace');
  assert.ok(resolvedBySlug, 'Hotel must be resolved via frontend slug "krystal_palace"');
  assert.strictEqual(resolvedBySlug.id, 'htl-krystal-douala', 'Should map to htl-krystal-douala');

  const resolvedRooms = await travelRepository.getHotelRooms('krystal_palace');
  assert.ok(resolvedRooms.length > 0, 'Rooms must be resolved via hotel slug');
  console.log('    ✓ Frontend slug/index hotel identifiers successfully resolve to canonical entities.');

  // [3] Verify Guest Checkout
  console.log('  [3/6] Verifying Guest checkout with passenger contact details...');

  // Pick a seat that is actually free. Hardcoding one made this suite pass at
  // most once: the seat stayed occupied afterwards and every later run 409'd.
  const seatMapRes = await makeRequest('GET', '/api/travel/bus/seats/bus-sch-2');
  const freeSeat = (seatMapRes.body?.data?.seatLayout || [])
    .flatMap(r => r.seats || [])
    .find(s => s.status === 'AVAILABLE');
  assert.ok(freeSeat, 'fixture: no free seat on bus-sch-2');

  const guestBookingRes = await makeRequest('POST', '/api/travel/bookings', {
    type: 'bus',
    serviceId: 'bus-sch-2',
    passengers: [
      { name: 'Guest Traveler', phone: '+237 671 00 11 22', email: 'guest@loumoo.com', seat: freeSeat.seatNumber }
    ]
  });
  assert.strictEqual(guestBookingRes.status, 201, 'Guest booking should return 201 Created');
  assert.strictEqual(guestBookingRes.body.success, true);
  const guestBooking = guestBookingRes.body.booking || guestBookingRes.body.data;
  assert.ok(guestBooking.id, 'Booking ID must be generated');
  assert.ok(guestBooking.userId.startsWith('usr_guest_'), 'User ID must be assigned guest prefix');
  assert.ok(guestBooking.bookingReference.startsWith('LMT-BUS-'), 'Booking reference must be generated');
  console.log('    ✓ Guest booking completed with guest ID and contact details.');

  // [4] Verify Payment Confirmation Endpoint
  console.log('  [4/6] Verifying POST /api/travel/bookings/:id/pay payment confirmation...');

  // A payment may only be confirmed by someone who can prove they hold the
  // reservation, and only against a provider-attested settlement. An anonymous
  // caller with no contact proof must be refused — this endpoint previously
  // marked ANY booking PAID for ANY unauthenticated caller.
  const anonPay = await makeRequest('POST', `/api/travel/bookings/${guestBooking.id}/pay`, {
    provider: 'mtn_momo'
  });
  assert.strictEqual(anonPay.status, 404, 'Unverified caller must not confirm payment');

  process.env.LOUMOO_ALLOW_SIMULATED_PAYMENTS = 'true';
  const { paymentVerificationService } = require('../../server/modules/travel/application/PaymentVerificationService');
  paymentVerificationService.simulationEnabled = true;

  const payRes = await makeRequest('POST', `/api/travel/bookings/${guestBooking.id}/pay`, {
    paymentMethod: 'mtn_momo',
    provider: 'mtn_momo',
    phoneNumber: '+237 671 00 11 22',
    transactionRef: `TEST-MOMO-${Date.now()}`
  }, { 'x-guest-contact': '+237 671 00 11 22' });
  assert.strictEqual(payRes.status, 200, 'Payment confirmation should return 200 OK');
  assert.strictEqual(payRes.body.success, true);
  assert.strictEqual(payRes.body.data.status, 'CONFIRMED');
  assert.strictEqual(payRes.body.data.payment.status, 'PAID');
  console.log('    ✓ Verified holder can pay; unverified caller is refused.');

  // [5] Verify OTA Booking Reference Lookup
  console.log('  [5/6] Verifying GET /api/travel/bookings/reference/:ref OTA lookup...');

  // Reference alone is not an authenticator: it is short, printed on tickets and
  // shared over WhatsApp. Guests present reference + a contact detail.
  const noProof = await makeRequest('GET', `/api/travel/bookings/reference/${guestBooking.bookingReference}`);
  assert.strictEqual(noProof.status, 404, 'Reference alone must not disclose a booking');

  const refLookupRes = await makeRequest('GET', `/api/travel/bookings/reference/${guestBooking.bookingReference}`, null, {
    'x-guest-contact': '+237 671 00 11 22'
  });
  assert.strictEqual(refLookupRes.status, 200, 'Reference lookup should return 200 OK');
  assert.strictEqual(refLookupRes.body.success, true);
  assert.strictEqual(refLookupRes.body.data.id, guestBooking.id);
  assert.strictEqual(refLookupRes.body.data.reference, guestBooking.bookingReference);
  console.log('    ✓ Guest lookup requires reference AND a matching contact detail.');

  // [6] Verify Role-Based Admin Authorization
  console.log('  [6/6] Verifying Role-Based Admin Authorization (primaryRole: "admin")...');
  // createUser() does NOT accept a primaryRole — it hardcodes 'customer'. Passing
  // one silently produced a customer, so this step used to assert nothing about
  // admin authority; it only passed because ANY caller could read guest bookings.
  // Promote the row directly so the privileged path is genuinely exercised.
  const adminUser = await createUser({ stage: 'ready', suffix: 'admAudit' });
  await db().from('profiles').update({ primary_role: 'admin' }).eq('id', adminUser.id);
  const adminAuth = { Authorization: `Bearer ${adminUser.token}` };

  // A real customer must NOT be able to read someone else's booking...
  const plainUser = await createUser({ stage: 'ready', suffix: 'plainAudit' });
  const plainRes = await makeRequest('GET', `/api/travel/bookings/${guestBooking.id}`, null, {
    Authorization: `Bearer ${plainUser.token}`
  });
  assert.strictEqual(plainRes.status, 404, 'A non-privileged user must not read another booking');

  // ...while a genuine admin may.
  const adminGetBkgRes = await makeRequest('GET', `/api/travel/bookings/${guestBooking.id}`, null, adminAuth);
  assert.strictEqual(adminGetBkgRes.status, 200, 'Admin should be authorized to view any booking');
  assert.strictEqual(adminGetBkgRes.body.data.id, guestBooking.id);
  console.log('    ✓ Admin role genuinely authorizes; ordinary users are refused.');

  console.log('\n───────────────────────────────────────────────────────────');
  console.log('  ALL 6 AUDIT FIX VERIFICATIONS PASSED SUCCESSFULLY!');
  console.log('───────────────────────────────────────────────────────────\n');
}

if (require.main === module) {
  run().then(() => {
    process.exit(0);
  }).catch(err => {
    console.error('FAILED:', err);
    process.exit(1);
  });
}

module.exports = { run };
