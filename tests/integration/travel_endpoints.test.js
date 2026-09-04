/**
 * LOUMOO Integration Tests — Travel REST Endpoints & Authorization Boundary
 * ---------------------------------------------------------------------------
 * Validates:
 *  1. Public endpoints work anonymously (search, bus schedules, seats, taxi quotes, packages, visa destinations)
 *  2. Private endpoints strictly reject unauthenticated callers (401 UNAUTHENTICATED)
 *  3. Authenticated callers can create bookings, retrieve trips, tickets, and cancel
 *  4. Cross-user isolation: User B cannot access or cancel User A's booking/trip/ticket (404 anti-enumeration)
 *  5. Parameter spoofing defense: ?userId=... query params and body userId cannot bypass caller ownership
 */

require('../setup');
const assert = require('assert');
const http = require('http');
const app = require('../../server/index');
const { createUser } = require('../helpers/harness');

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

      if (payload) req.write(payload);
      req.end();
    });
  });
}

async function run() {
  console.log('  Testing Travel REST API endpoints, public discovery & authorization boundaries...');

  // ==========================================================================
  // 1. PUBLIC DISCOVERY ENDPOINTS (UNAUTHENTICATED ACCESS ALLOWED)
  // ==========================================================================
  console.log('    [1] Verifying public discovery endpoints work without auth...');

  const searchRes = await makeRequest('GET', '/api/v1/travel/search?type=bus&origin=Douala&destination=Yaoundé');
  assert.strictEqual(searchRes.status, 200, 'Search must be publicly accessible');
  assert.strictEqual(searchRes.body.success, true);
  assert.ok(searchRes.body.data.buses.length >= 2, 'Search returned bus schedules');

  const opRes = await makeRequest('GET', '/api/v1/travel/bus/operators');
  assert.strictEqual(opRes.status, 200);
  assert.strictEqual(opRes.body.success, true);
  assert.ok(opRes.body.data.length >= 4, 'List of 4 operators returned');

  const seatRes = await makeRequest('GET', '/api/v1/travel/bus/seats/bus-sch-1');
  assert.strictEqual(seatRes.status, 200);
  assert.strictEqual(seatRes.body.success, true);
  assert.strictEqual(seatRes.body.data.scheduleId, 'bus-sch-1');
  assert.ok(seatRes.body.data.seatLayout.length >= 7);

  const quoteRes = await makeRequest('GET', '/api/v1/travel/taxi/quote?type=airport&vehicleClass=vip');
  assert.strictEqual(quoteRes.status, 200);
  assert.strictEqual(quoteRes.body.success, true);
  assert.ok(quoteRes.body.data.estimatedPrice >= 12000);
  assert.strictEqual(quoteRes.body.data.currency, 'XAF');

  const pkgRes = await makeRequest('GET', '/api/v1/travel/packages');
  assert.strictEqual(pkgRes.status, 200);
  assert.strictEqual(pkgRes.body.success, true);
  assert.ok(pkgRes.body.data.length >= 3);

  const visaDestRes = await makeRequest('GET', '/api/v1/travel/visa/destinations');
  assert.strictEqual(visaDestRes.status, 200);
  assert.strictEqual(visaDestRes.body.success, true);
  assert.ok(visaDestRes.body.data.length >= 4);

  // ==========================================================================
  // 2. PRIVATE ENDPOINTS REJECT UNAUTHENTICATED CALLERS (401)
  // ==========================================================================
  console.log('    [2] Verifying private travel endpoints reject anonymous callers with 401...');

  const anonBookRes = await makeRequest('POST', '/api/v1/travel/bookings', {
    type: 'bus',
    serviceId: 'bus-sch-1',
    passengers: [{ name: 'Intruder', seat: '1B' }]
  });
  assert.strictEqual(anonBookRes.status, 401, 'Anonymous booking creation must return 401');
  assert.strictEqual(anonBookRes.body.error?.code, 'UNAUTHENTICATED');

  const anonMyTripsRes = await makeRequest('GET', '/api/v1/travel/bookings/my-trips');
  assert.strictEqual(anonMyTripsRes.status, 401, 'Anonymous my-trips must return 401');
  assert.strictEqual(anonMyTripsRes.body.error?.code, 'UNAUTHENTICATED');

  const anonBookingsRes = await makeRequest('GET', '/api/v1/travel/bookings');
  assert.strictEqual(anonBookingsRes.status, 401, 'Anonymous bookings query must return 401');

  const anonBookingDetailRes = await makeRequest('GET', '/api/v1/travel/bookings/bkg_fake_id');
  assert.strictEqual(anonBookingDetailRes.status, 401, 'Anonymous booking detail must return 401');

  const anonCancelRes = await makeRequest('POST', '/api/v1/travel/bookings/bkg_fake_id/cancel', {
    reason: 'Malicious cancel'
  });
  assert.strictEqual(anonCancelRes.status, 401, 'Anonymous cancellation must return 401');

  const anonTripsRes = await makeRequest('GET', '/api/v1/travel/trips');
  assert.strictEqual(anonTripsRes.status, 401, 'Anonymous trips list must return 401');

  const anonTicketsRes = await makeRequest('GET', '/api/v1/travel/tickets');
  assert.strictEqual(anonTicketsRes.status, 401, 'Anonymous tickets list must return 401');

  const anonVisaAppRes = await makeRequest('POST', '/api/v1/travel/visa/applications', {
    country: 'France',
    applicantName: 'Intruder',
    phone: '+237 600000000'
  });
  assert.strictEqual(anonVisaAppRes.status, 401, 'Anonymous visa application must return 401');

  // ==========================================================================
  // 3. AUTHENTICATED USER LIFECYCLE (USER A)
  // ==========================================================================
  console.log('    [3] Verifying authenticated User A lifecycle...');

  const userA = await createUser({ stage: 'ready', suffix: 'trvA' });
  const authA = { Authorization: `Bearer ${userA.token}` };

  const userB = await createUser({ stage: 'ready', suffix: 'trvB' });
  const authB = { Authorization: `Bearer ${userB.token}` };

  // User A books a bus trip (attempts to pass spoofed userId, which must be ignored)
  const bookRes = await makeRequest('POST', '/api/v1/travel/bookings', {
    type: 'bus',
    serviceId: 'bus-sch-1',
    userId: 'spoofed_user_id_which_must_be_ignored',
    itinerary: {
      operator: 'General Express Voyages',
      route: 'Douala (Bépanda) → Yaoundé (Mvan)',
      departureDate: 'Tomorrow',
      departureTime: '08:00',
      terminal: 'Terminal Bépanda Quai 2'
    },
    passengers: [
      { name: 'ROSTAND TCHUEKAM', seat: '4A', idNumber: '09CM48921', phone: '+237 690 12 34 56' }
    ],
    pricing: {
      baseAmount: 6000,
      serviceFee: 500,
      totalAmount: 6500,
      currency: 'XAF'
    },
    payment: {
      method: 'mtn_momo',
      status: 'PAID'
    }
  }, authA);

  assert.strictEqual(bookRes.status, 201);
  assert.strictEqual(bookRes.body.success, true);
  const createdBooking = bookRes.body.booking || bookRes.body.data;
  assert.ok(createdBooking.id);
  assert.strictEqual(createdBooking.userId, userA.id, 'Booking must be strictly bound to authenticated User A');
  assert.ok(createdBooking.reference.startsWith('LMT-BUS-'));
  assert.strictEqual(createdBooking.status, 'CONFIRMED');

  // User A checks my-trips
  const myTripsRes = await makeRequest('GET', '/api/v1/travel/bookings/my-trips', null, authA);
  assert.strictEqual(myTripsRes.status, 200);
  assert.strictEqual(myTripsRes.body.success, true);
  assert.ok(myTripsRes.body.data.some(b => b.id === createdBooking.id), 'User A sees their booking in My Trips');

  // User A views single booking
  const getBkgRes = await makeRequest('GET', `/api/v1/travel/bookings/${createdBooking.id}`, null, authA);
  assert.strictEqual(getBkgRes.status, 200);
  assert.strictEqual(getBkgRes.body.data.id, createdBooking.id);
  assert.strictEqual(getBkgRes.body.data.userId, userA.id);

  // User A views their trips and tickets
  const userATrips = await makeRequest('GET', '/api/v1/travel/trips', null, authA);
  assert.strictEqual(userATrips.status, 200);
  assert.ok(userATrips.body.items.some(t => t.bookingId === createdBooking.id));

  const userATickets = await makeRequest('GET', '/api/v1/travel/tickets', null, authA);
  assert.strictEqual(userATickets.status, 200);
  const ticketA = userATickets.body.items.find(t => t.bookingId === createdBooking.id);
  assert.ok(ticketA, 'Ticket created for User A');

  // ==========================================================================
  // 4. CROSS-USER ISOLATION & ANTI-ENUMERATION (USER B CANNOT ACCESS USER A)
  // ==========================================================================
  console.log('    [4] Verifying cross-user isolation and anti-enumeration defenses...');

  // User B tries to view User A's booking -> must return 404 NOT_FOUND
  const bkgCrossRes = await makeRequest('GET', `/api/v1/travel/bookings/${createdBooking.id}`, null, authB);
  assert.strictEqual(bkgCrossRes.status, 404, 'User B viewing User A booking must return 404');
  assert.strictEqual(bkgCrossRes.body.error?.code, 'NOT_FOUND');

  // User B tries to cancel User A's booking -> must return 404 NOT_FOUND
  const cancelCrossRes = await makeRequest('POST', `/api/v1/travel/bookings/${createdBooking.id}/cancel`, {
    reason: 'Rival attempt to cancel'
  }, authB);
  assert.strictEqual(cancelCrossRes.status, 404, 'User B cancelling User A booking must return 404');
  assert.strictEqual(cancelCrossRes.body.error?.code, 'NOT_FOUND');

  // User B tries to supply User A's userId in query params to inspect User A's bookings
  const spoofQueryBkgRes = await makeRequest('GET', `/api/v1/travel/bookings/my-trips?userId=${userA.id}`, null, authB);
  assert.strictEqual(spoofQueryBkgRes.status, 200);
  assert.strictEqual(
    spoofQueryBkgRes.body.data.some(b => b.id === createdBooking.id),
    false,
    'User B querying with ?userId=userA must NOT receive User A records'
  );

  // User B tries to view User A's trip -> must return 404
  const tripCrossRes = await makeRequest('GET', `/api/v1/travel/trips/${userATrips.body.items[0].id}`, null, authB);
  assert.strictEqual(tripCrossRes.status, 404, 'User B viewing User A trip must return 404');

  // User B tries to view User A's ticket -> must return 404
  const ticketCrossRes = await makeRequest('GET', `/api/v1/travel/tickets/${ticketA.id}`, null, authB);
  assert.strictEqual(ticketCrossRes.status, 404, 'User B viewing User A ticket must return 404');

  // ==========================================================================
  // 5. LEGITIMATE OWNER CANCELLATION (USER A)
  // ==========================================================================
  console.log('    [5] Verifying legitimate cancellation by owner User A...');

  const cancelRes = await makeRequest('POST', `/api/v1/travel/bookings/${createdBooking.id}/cancel`, {
    reason: 'Trip rescheduled'
  }, authA);
  assert.strictEqual(cancelRes.status, 200);
  assert.strictEqual(cancelRes.body.data.status, 'CANCELLED');

  console.log('    ✓ All Travel REST endpoints and authorization boundaries verified.');
}

if (require.main === module) {
  run().catch(err => {
    console.error('FAILED:', err);
    process.exit(1);
  });
}

module.exports = { run };
