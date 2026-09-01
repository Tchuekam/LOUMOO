/**
 * LOUMOO Integration Tests — Travel REST Endpoints & Pipeline
 */

require('../setup');
const assert = require('assert');
const http = require('http');
const app = require('../../server/index');

function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const server = http.createServer(app);
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      const payload = body ? JSON.stringify(body) : null;
      const headers = {
        'Content-Type': 'application/json'
      };
      if (payload) {
        headers['Content-Length'] = Buffer.byteLength(payload);
      }

      const req = http.request({
        host: '127.0.0.1',
        port,
        method,
        path: encodeURI(path),
        headers
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
  console.log('  Testing Travel REST API endpoints, bus search, seat layouts & booking lifecycle...');

  // 1. GET /api/v1/travel/search
  const searchRes = await makeRequest('GET', '/api/v1/travel/search?type=bus&origin=Douala&destination=Yaoundé');
  assert.strictEqual(searchRes.status, 200);
  assert.strictEqual(searchRes.body.success, true);
  assert.ok(searchRes.body.data.buses.length >= 2, 'Search returned bus schedules');

  // 2. GET /api/v1/travel/bus/operators
  const opRes = await makeRequest('GET', '/api/v1/travel/bus/operators');
  assert.strictEqual(opRes.status, 200);
  assert.strictEqual(opRes.body.success, true);
  assert.ok(opRes.body.data.length >= 4, 'List of 4 operators returned');

  // 3. GET /api/v1/travel/bus/seats/:scheduleId
  const seatRes = await makeRequest('GET', '/api/v1/travel/bus/seats/bus-sch-1');
  assert.strictEqual(seatRes.status, 200);
  assert.strictEqual(seatRes.body.success, true);
  assert.strictEqual(seatRes.body.data.scheduleId, 'bus-sch-1');
  assert.ok(seatRes.body.data.seatLayout.length >= 7);

  // 4. GET /api/v1/travel/taxi/quote
  const quoteRes = await makeRequest('GET', '/api/v1/travel/taxi/quote?type=airport&vehicleClass=vip');
  assert.strictEqual(quoteRes.status, 200);
  assert.strictEqual(quoteRes.body.success, true);
  assert.ok(quoteRes.body.data.estimatedPrice >= 12000);
  assert.strictEqual(quoteRes.body.data.currency, 'XAF');

  // 5. GET /api/v1/travel/packages
  const pkgRes = await makeRequest('GET', '/api/v1/travel/packages');
  assert.strictEqual(pkgRes.status, 200);
  assert.strictEqual(pkgRes.body.success, true);
  assert.ok(pkgRes.body.data.length >= 3);

  // 6. GET /api/v1/travel/visa/destinations
  const visaRes = await makeRequest('GET', '/api/v1/travel/visa/destinations');
  assert.strictEqual(visaRes.status, 200);
  assert.strictEqual(visaRes.body.success, true);
  assert.ok(visaRes.body.data.length >= 4);

  // 7. POST /api/v1/travel/bookings (Create Bus Booking)
  const bookRes = await makeRequest('POST', '/api/v1/travel/bookings', {
    type: 'bus',
    scheduleId: 'bus-sch-1',
    userId: 'usr_test_traveler',
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
  });

  assert.strictEqual(bookRes.status, 201);
  assert.strictEqual(bookRes.body.success, true);
  const createdBooking = bookRes.body.data;
  assert.ok(createdBooking.id);
  assert.ok(createdBooking.reference.startsWith('LMT-BUS-'));
  assert.strictEqual(createdBooking.status, 'CONFIRMED');

  // 8. GET /api/v1/travel/bookings/my-trips
  const myTripsRes = await makeRequest('GET', `/api/v1/travel/bookings/my-trips?userId=${createdBooking.userId}`);
  assert.strictEqual(myTripsRes.status, 200);
  assert.strictEqual(myTripsRes.body.success, true);
  assert.ok(myTripsRes.body.data.some(b => b.id === createdBooking.id), 'Created booking present in My Trips');

  // 9. GET /api/v1/travel/bookings/:id
  const getBkgRes = await makeRequest('GET', `/api/v1/travel/bookings/${createdBooking.id}`);
  assert.strictEqual(getBkgRes.status, 200);
  assert.strictEqual(getBkgRes.body.data.id, createdBooking.id);
  assert.ok(getBkgRes.body.data.qrCodePayload.includes(createdBooking.reference));

  // 10. POST /api/v1/travel/bookings/:id/cancel
  const cancelRes = await makeRequest('POST', `/api/v1/travel/bookings/${createdBooking.id}/cancel`, {
    userId: createdBooking.userId,
    reason: 'Trip rescheduled'
  });
  assert.strictEqual(cancelRes.status, 200);
  assert.strictEqual(cancelRes.body.data.status, 'CANCELLED');

  console.log('    ✓ All Travel REST endpoints passed all assertions.');
}

if (require.main === module) {
  run().catch(err => {
    console.error('FAILED:', err);
    process.exit(1);
  });
}

module.exports = { run };
