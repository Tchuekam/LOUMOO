/**
 * LOUMOO Integration Tests — Travel Production Backend Suite
 * ---------------------------------------------------------------------------
 * Thoroughly validates:
 *  1. Normalized search engine with multi-attribute filtering & pagination
 *  2. Hotel directory, detail, and room stay price calculation (nights × nightly rate)
 *  3. Excursions and transport modalities (buses, trains, flights, rides)
 *  4. Transactional booking creation with server-side price enforcement (authenticated)
 *  5. Concurrency & double-booking prevention (seat conflicts)
 *  6. Idempotency key handling (duplicate request returns existing record, isolated per user)
 *  7. Cancellation and inventory release (seats re-opened)
 *  8. Auto-generated Trips powering "My Trips" (user isolated)
 *  9. Digital Tickets with signed, non-sensitive QR payload
 * 10. Standardized error contract adherence (401 on missing auth, 404 on cross-user access, 409 on conflict, 400 on validation)
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
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  LOUMOO TRAVEL PRODUCTION BACKEND INTEGRATION TEST SUITE');
  console.log('═══════════════════════════════════════════════════════════\n');

  // Provision verified test users
  const primaryUser = await createUser({ stage: 'ready', suffix: 'prodTrv1' });
  const rivalUser = await createUser({ stage: 'ready', suffix: 'prodTrv2' });
  const primaryAuth = { Authorization: `Bearer ${primaryUser.token}` };
  const rivalAuth = { Authorization: `Bearer ${rivalUser.token}` };

  // ==========================================================================
  // 1. SEARCH ENGINE & NORMALIZATION
  // ==========================================================================
  console.log('  [1/10] Testing Multi-Modal Normalized Search Engine...');
  const searchRes = await makeRequest('GET', '/api/travel/search?origin=Douala&destination=Yaoundé&page=1&limit=10');
  assert.strictEqual(searchRes.status, 200, 'Search should return 200 OK');
  assert.strictEqual(searchRes.body.success, true);
  assert.ok(Array.isArray(searchRes.body.items), 'Search should return items array');
  assert.ok(searchRes.body.pagination, 'Search should include pagination');
  assert.strictEqual(searchRes.body.pagination.page, 1);
  assert.ok(searchRes.body.items.length > 0, 'Should find transport between Douala and Yaoundé');

  // Verify normalization contract
  const sampleItem = searchRes.body.items[0];
  assert.ok(sampleItem.id, 'Item must have id');
  assert.ok(sampleItem.type, 'Item must have type');
  assert.ok(sampleItem.provider, 'Item must have provider');
  assert.ok(sampleItem.title, 'Item must have title');
  assert.ok(sampleItem.price !== undefined, 'Item must have price');
  assert.strictEqual(sampleItem.currency, 'XAF', 'Currency must be XAF');
  assert.ok(sampleItem.availability !== undefined, 'Item must have availability flag');

  // Type filter test (hotels only)
  const hotelSearchRes = await makeRequest('GET', '/api/travel/search?type=hotel&destination=Douala');
  assert.strictEqual(hotelSearchRes.status, 200);
  assert.ok(hotelSearchRes.body.items.every(i => i.type === 'hotel'), 'All items should be hotels');
  assert.ok(hotelSearchRes.body.items.some(i => i.title.includes('Krystal')), 'Krystal Palace Douala present in hotel search');

  console.log('    ✓ Search normalization, filtering & pagination verified.');

  // ==========================================================================
  // 2. HOTELS & ROOM STAY PRICING
  // ==========================================================================
  console.log('  [2/10] Testing Hotel Directory, Details & Server Stay Calculation...');
  const hotelsListRes = await makeRequest('GET', '/api/travel/hotels');
  assert.strictEqual(hotelsListRes.status, 200);
  assert.ok(hotelsListRes.body.items.length >= 5, 'Should return at least 5 curated hotels');

  const krystal = hotelsListRes.body.items.find(h => h.id === 'htl-krystal-douala');
  assert.ok(krystal, 'Krystal Palace found in hotels directory');
  assert.strictEqual(krystal.city, 'Douala');
  assert.ok(krystal.latitude && krystal.longitude, 'Coordinates must be present');

  // Fetch Rooms with 3 nights stay calculation
  const checkIn = '2026-10-15';
  const checkOut = '2026-10-18'; // 3 nights
  const roomsRes = await makeRequest('GET', `/api/travel/hotels/${krystal.id}/rooms?checkIn=${checkIn}&checkOut=${checkOut}&guests=2`);
  assert.strictEqual(roomsRes.status, 200);
  assert.ok(roomsRes.body.items.length >= 2, 'Krystal should have multiple room tiers');

  const deluxeRoom = roomsRes.body.items.find(r => r.id === 'rm-krystal-deluxe');
  assert.ok(deluxeRoom, 'Deluxe room found');
  assert.strictEqual(deluxeRoom.nightlyPrice, 95000);
  assert.ok(deluxeRoom.stayQuote, 'Stay quote must be calculated by server');
  assert.strictEqual(deluxeRoom.stayQuote.nights, 3);
  assert.strictEqual(deluxeRoom.stayQuote.subtotal, 95000 * 3, 'Subtotal must equal nights * nightlyPrice');
  assert.ok(deluxeRoom.stayQuote.totalAmount > deluxeRoom.stayQuote.subtotal, 'Total amount includes service fee');

  console.log('    ✓ Hotel directory and authoritative stay pricing calculation verified.');

  // ==========================================================================
  // 3. EXCURSIONS & TRANSPORT MODALITIES
  // ==========================================================================
  console.log('  [3/10] Testing Excursions & Transport Modalities (Buses, Trains, Flights, Rides)...');
  const excRes = await makeRequest('GET', '/api/travel/excursions');
  assert.strictEqual(excRes.status, 200);
  assert.ok(excRes.body.items.length >= 3, 'Should return curated excursions');
  assert.ok(excRes.body.items.some(e => e.id === 'exc-lobe-falls'), 'Lobé waterfalls excursion present');

  const busRes = await makeRequest('GET', '/api/travel/buses');
  assert.strictEqual(busRes.status, 200);
  assert.ok(busRes.body.items.length >= 2, 'Buses returned');

  const trainRes = await makeRequest('GET', '/api/travel/trains');
  assert.strictEqual(trainRes.status, 200);
  assert.ok(trainRes.body.items.length >= 1, 'Camrail trains returned');

  const flightRes = await makeRequest('GET', '/api/travel/flights');
  assert.strictEqual(flightRes.status, 200);
  assert.ok(flightRes.body.items.length >= 1, 'Flights returned');

  const rideRes = await makeRequest('GET', '/api/travel/rides?type=airport&vehicleClass=vip');
  assert.strictEqual(rideRes.status, 200);
  assert.ok(rideRes.body.data.estimatedPrice >= 12000, 'Airport ride quote computed');

  console.log('    ✓ Excursions and transport modalities verified.');

  // ==========================================================================
  // 4. TRANSACTIONAL BUS BOOKING & SERVER-SIDE PRICE ENFORCEMENT
  // ==========================================================================
  console.log('  [4/10] Testing Transactional Bus Booking & Price Calculation...');
  const busBookingRes = await makeRequest('POST', '/api/travel/bookings', {
    type: 'bus',
    serviceId: 'bus-sch-1',
    passengers: [
      { name: 'Dr. Rostand Tchuekam', phone: '+237 670 11 22 33', seat: '6A' }
    ],
    // Client attempts to pass fake low price
    pricing: { totalAmount: 100 }
  }, primaryAuth);

  assert.strictEqual(busBookingRes.status, 201, 'Booking must be created with 201 Created');
  assert.strictEqual(busBookingRes.body.success, true);
  const createdBusBooking = busBookingRes.body.booking || busBookingRes.body.data;
  assert.ok(createdBusBooking.id, 'Booking ID generated');
  assert.strictEqual(createdBusBooking.userId, primaryUser.id, 'Booking userId must equal authenticated principal');
  assert.ok(createdBusBooking.bookingReference.startsWith('LMT-BUS-'), 'Booking reference generated');
  assert.strictEqual(createdBusBooking.status, 'CONFIRMED');
  
  // Verify server OVERRODE fake client price with real service price
  assert.ok(
    createdBusBooking.pricing.totalAmount >= 6000,
    `Server must calculate authoritative price (got ${createdBusBooking.pricing.totalAmount}, expected >= 6000)`
  );

  console.log('    ✓ Transactional booking created and client price tampering rejected.');

  // ==========================================================================
  // 5. CONCURRENCY & DOUBLE-BOOKING PREVENTION (SEAT CONFLICT)
  // ==========================================================================
  console.log('  [5/10] Testing Concurrency & Double-Booking Prevention on Seat 6A...');
  const conflictRes = await makeRequest('POST', '/api/travel/bookings', {
    type: 'bus',
    serviceId: 'bus-sch-1',
    passengers: [
      { name: 'Rival Traveler', phone: '+237 690 99 88 77', seat: '6A' } // Same seat!
    ]
  }, rivalAuth);

  assert.strictEqual(conflictRes.status, 409, 'Double-booking the same seat must return 409 Conflict');
  assert.ok(conflictRes.body.error, 'Error object must be present');
  assert.ok(
    conflictRes.body.error.message.includes('already occupied') || conflictRes.body.error.code === 'CONFLICT',
    'Error must explain that seat is already occupied'
  );

  console.log('    ✓ Double-booking attempt was safely rejected with 409 Conflict.');

  // ==========================================================================
  // 6. IDEMPOTENCY KEY HANDLING
  // ==========================================================================
  console.log('  [6/10] Testing Idempotency Key Handling on Repeated Submissions...');
  const testIdempotencyKey = `idem_test_${Date.now()}`;
  const firstSubmission = await makeRequest('POST', '/api/travel/bookings', {
    type: 'bus',
    serviceId: 'bus-sch-1',
    passengers: [
      { name: 'Dr. Rostand Tchuekam', phone: '+237 670 11 22 33', seat: '6C' }
    ]
  }, {
    ...primaryAuth,
    'X-Idempotency-Key': testIdempotencyKey
  });

  assert.strictEqual(firstSubmission.status, 201);
  const firstBookingId = (firstSubmission.body.booking || firstSubmission.body.data).id;

  // Immediate retry with the EXACT same idempotency key (e.g. network retry / double-click)
  const retrySubmission = await makeRequest('POST', '/api/travel/bookings', {
    type: 'bus',
    serviceId: 'bus-sch-1',
    passengers: [
      { name: 'Dr. Rostand Tchuekam', phone: '+237 670 11 22 33', seat: '6C' }
    ]
  }, {
    ...primaryAuth,
    'X-Idempotency-Key': testIdempotencyKey
  });

  const retryBookingId = (retrySubmission.body.booking || retrySubmission.body.data).id;
  assert.strictEqual(
    retryBookingId,
    firstBookingId,
    'Idempotency key must return the original booking rather than creating a duplicate'
  );

  // Rival user attempting to reuse same idempotency key should be blocked
  const rivalIdemRes = await makeRequest('POST', '/api/travel/bookings', {
    type: 'bus',
    serviceId: 'bus-sch-1',
    passengers: [
      { name: 'Rival Traveler', phone: '+237 690 99 88 77', seat: '7A' }
    ]
  }, {
    ...rivalAuth,
    'X-Idempotency-Key': testIdempotencyKey
  });
  assert.strictEqual(rivalIdemRes.status, 409, 'Rival reusing idempotency key must return 409 Conflict');

  console.log('    ✓ Idempotent request returned existing booking without duplicating inventory.');

  // ==========================================================================
  // 7. CANCELLATION & INVENTORY RELEASE
  // ==========================================================================
  console.log('  [7/10] Testing Booking Cancellation and Seat Release...');
  const cancelRes = await makeRequest('POST', `/api/travel/bookings/${firstBookingId}/cancel`, {
    reason: 'Schedule change'
  }, primaryAuth);

  assert.strictEqual(cancelRes.status, 200);
  assert.strictEqual(cancelRes.body.data.status, 'CANCELLED');

  // Now seat '6C' should be re-released and available again for another traveler!
  const reBookRes = await makeRequest('POST', '/api/travel/bookings', {
    type: 'bus',
    serviceId: 'bus-sch-1',
    passengers: [
      { name: 'New Passenger', phone: '+237 699 00 00 00', seat: '6C' }
    ]
  }, rivalAuth);

  assert.strictEqual(reBookRes.status, 201, 'Released seat 6C can now be booked by another traveler');

  console.log('    ✓ Booking cancelled and seat inventory successfully released.');

  // ==========================================================================
  // 8. HOTEL BOOKING & SERVER PRICING
  // ==========================================================================
  console.log('  [8/10] Testing Hotel Room Booking Flow...');
  const hotelBookRes = await makeRequest('POST', '/api/travel/bookings', {
    type: 'hotel',
    hotelId: 'htl-krystal-douala',
    roomId: 'rm-krystal-deluxe',
    checkIn: '2026-11-01',
    checkOut: '2026-11-03', // 2 nights
    roomsCount: 1,
    guests: 2
  }, primaryAuth);

  assert.strictEqual(hotelBookRes.status, 201);
  const createdHotelBooking = hotelBookRes.body.booking || hotelBookRes.body.data;
  assert.ok(createdHotelBooking.bookingReference.startsWith('LMT-HTL-'));
  assert.strictEqual(createdHotelBooking.itinerary.nights, 2);
  assert.strictEqual(createdHotelBooking.pricing.baseAmount, 95000 * 2);

  console.log('    ✓ Hotel room booked with 2-night server price calculation.');

  // ==========================================================================
  // 9. TRIPS & TICKETS VERIFICATION (ISOLATED PER USER)
  // ==========================================================================
  console.log('  [9/10] Testing Trip Creation ("My Trips") & Secure Ticket QR Generation...');
  // Query trips for primary user
  const tripsRes = await makeRequest('GET', '/api/travel/trips', null, primaryAuth);
  assert.strictEqual(tripsRes.status, 200);
  assert.ok(tripsRes.body.items.length >= 2, 'User trips must include booked trips');

  const busTrip = tripsRes.body.items.find(t => t.bookingId === createdBusBooking.id);
  assert.ok(busTrip, 'Bus trip record generated');
  assert.strictEqual(busTrip.origin, 'Douala');
  assert.strictEqual(busTrip.destination, 'Yaoundé');
  assert.strictEqual(busTrip.seat, '6A');

  // Verify rival user CANNOT see primary user trips
  const rivalTripsRes = await makeRequest('GET', '/api/travel/trips', null, rivalAuth);
  assert.strictEqual(rivalTripsRes.status, 200);
  assert.strictEqual(
    rivalTripsRes.body.items.some(t => t.bookingId === createdBusBooking.id),
    false,
    'Rival user must not see primary user trips'
  );

  // Query tickets for primary user
  const ticketsRes = await makeRequest('GET', '/api/travel/tickets', null, primaryAuth);
  assert.strictEqual(ticketsRes.status, 200);
  assert.ok(ticketsRes.body.items.length >= 2, 'Tickets issued for bookings');

  const busTicket = ticketsRes.body.items.find(t => t.bookingId === createdBusBooking.id);
  assert.ok(busTicket, 'Digital ticket issued for bus booking');
  assert.ok(busTicket.ticketNumber.startsWith('TK-BUS-'), 'Ticket number formatted correctly');
  assert.strictEqual(busTicket.status, 'VALID');

  // Verify QR payload is non-sensitive and tamper-resistant
  assert.ok(busTicket.qrPayload, 'QR payload present');
  const parsedQr = JSON.parse(busTicket.qrPayload);
  assert.ok(parsedQr.data, 'QR data block exists');
  assert.ok(parsedQr.sig, 'QR HMAC signature exists');
  assert.strictEqual(parsedQr.data.tkt, busTicket.ticketNumber);
  assert.strictEqual(parsedQr.data.ref, createdBusBooking.bookingReference);

  console.log('    ✓ Auto-generated Trips and signed Ticket QR payloads verified.');

  // ==========================================================================
  // 10. ERROR CONTRACT & SECURITY BOUNDARIES
  // ==========================================================================
  console.log('  [10/10] Testing Standardized Error Contract & Edge Cases...');
  const notFoundRes = await makeRequest('GET', '/api/travel/hotels/non-existent-hotel-id');
  assert.strictEqual(notFoundRes.status, 404);
  assert.ok(notFoundRes.body.error, 'Error object present');
  assert.strictEqual(notFoundRes.body.error.code, 'NOT_FOUND');

  const badDateRes = await makeRequest('GET', '/api/travel/hotels/htl-krystal-douala/rooms?checkIn=2026-10-20&checkOut=2026-10-18');
  assert.strictEqual(badDateRes.status, 400);
  assert.ok(badDateRes.body.error, 'Bad date range caught by validation');
  assert.strictEqual(badDateRes.body.error.code, 'VALIDATION_ERROR');

  // Security test: Anonymous request to private endpoint must fail with 401
  const anonBookingAttempt = await makeRequest('POST', '/api/travel/bookings', {
    type: 'bus',
    serviceId: 'bus-sch-1'
  });
  assert.strictEqual(anonBookingAttempt.status, 401);
  assert.strictEqual(anonBookingAttempt.body.error?.code, 'UNAUTHENTICATED');

  // Security test: Cross-user booking retrieval must fail with 404 (anti-enumeration)
  const crossUserBookingRes = await makeRequest('GET', `/api/travel/bookings/${createdBusBooking.id}`, null, rivalAuth);
  assert.strictEqual(crossUserBookingRes.status, 404);
  assert.strictEqual(crossUserBookingRes.body.error?.code, 'NOT_FOUND');

  console.log('    ✓ Error contract strictly follows { error: { code, message } } format.');

  console.log('\n───────────────────────────────────────────────────────────');
  console.log('  ALL 10 TRAVEL PRODUCTION BACKEND TEST PHASES PASSED!');
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
