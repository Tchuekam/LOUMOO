/**
 * LOUMOO Integration Tests — Travel Persistence Durability, Consistency & Concurrency
 * ------------------------------------------------------------------------------------
 * Proves:
 *  1. Travel data (bookings, passengers, trips, tickets) survives a process restart.
 *  2. Booking and ticket records can be retrieved after restart from durable storage.
 *  3. Seat reservations remain consistent and double-booking is prevented under concurrent race conditions.
 *  4. Duplicate or repeated booking attempts (idempotency) do not corrupt state across restarts.
 *  5. Persistence failures fail safely: zero false bookings and automatic seat rollback.
 */

require('../setup');
const assert = require('assert');
const { TravelRepository } = require('../../server/modules/travel/infrastructure/TravelRepository');
const { BookingEngine } = require('../../server/modules/travel/application/BookingEngine');
const { SeatInventoryService } = require('../../server/modules/travel/application/SeatInventoryService');
const { travelService } = require('../../server/modules/travel/application/TravelService');
const { ConflictError, InfrastructureError } = require('../../server/shared/errors/AppError');
const { SupabaseDatabase } = require('../../server/infrastructure/database/SupabaseClient');

async function run() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  LOUMOO TRAVEL DURABILITY & CONCURRENCY INTEGRATION TESTS');
  console.log('═══════════════════════════════════════════════════════════\n');

  const db = SupabaseDatabase.getAdmin();
  const testIdsToClean = [];

  const userA = { id: `usr_durable_a_${Date.now()}`, fullName: 'Alice Nkem' };
  const userB = { id: `usr_durable_b_${Date.now()}`, fullName: 'Bob Biya' };
  const userC = { id: `usr_durable_c_${Date.now()}`, fullName: 'Charlie Chidi' };
  const userD = { id: `usr_durable_d_${Date.now()}`, fullName: 'David Douala' };

  try {
    // Clean up any stale test bookings from previous runs
    if (db) {
      await db.from('travel_bookings').delete().like('user_id', 'usr_durable_%');
    }

    // ========================================================================
    // 1. DURABLE PERSISTENCE & SURVIVAL ACROSS PROCESS RESTART
    // ========================================================================
    console.log('  [1/5] Testing Travel data persistence & retrieval across process restart...');

    const repo1 = travelService.repo;
    const bookingEngine1 = travelService.bookingEngine;
    const testSeat1 = '8A';
    const testServiceId = 'bus-sch-1';

    // Free test seat if occupied
    await travelService.seatService.releaseSeats(testServiceId, [testSeat1]);

    const createPayload = {
      type: 'bus',
      serviceId: testServiceId,
      passengers: [{ name: userA.fullName, seat: testSeat1, phone: '+237690111222' }],
      paymentMethod: 'mtn_momo'
    };

    const result1 = await bookingEngine1.createBooking(createPayload, { user: userA });
    assert.ok(result1.booking.id, 'Booking ID must be generated');
    assert.ok(result1.trip.id, 'Trip must be generated');
    assert.ok(result1.ticket.ticketNumber, 'Ticket must be generated');
    testIdsToClean.push(result1.booking.id);

    console.log(`    Created booking ${result1.booking.id} (${result1.booking.reference}) for ${userA.fullName}`);

    // SIMULATE PROCESS RESTART / COLD START:
    // Create a brand-new instance of TravelRepository without the previous in-memory state.
    console.log('    Simulating server restart / fresh replica instance...');
    const restartedRepo = new TravelRepository();

    // In-memory cache in restartedRepo does NOT have result1.booking.id initially
    assert.strictEqual(restartedRepo.bookings.has(result1.booking.id), false, 'Restarted repo in-memory store starts cold');

    // Fetch from durable storage via restarted repository
    const recoveredBooking = await restartedRepo.getBookingById(result1.booking.id);
    assert.ok(recoveredBooking, 'Booking must be recovered from durable database after restart');
    assert.strictEqual(recoveredBooking.id, result1.booking.id);
    assert.strictEqual(recoveredBooking.userId, userA.id);
    assert.strictEqual(recoveredBooking.reference, result1.booking.reference);
    assert.strictEqual(recoveredBooking.status, 'CONFIRMED');
    assert.ok(recoveredBooking.passengers.length >= 1, 'Passengers must survive restart');
    assert.strictEqual(recoveredBooking.passengers[0].seat, testSeat1);

    // Verify trip retrieval after restart
    const recoveredTrip = await restartedRepo.getTripById(result1.booking.id);
    assert.ok(recoveredTrip, 'Trip must be recovered after restart');
    assert.strictEqual(recoveredTrip.bookingId, result1.booking.id);
    assert.strictEqual(recoveredTrip.userId, userA.id);

    // Verify ticket retrieval after restart
    const recoveredTicket = await restartedRepo.getTicketByIdOrBooking(result1.booking.id);
    assert.ok(recoveredTicket, 'Ticket must be recovered after restart');
    assert.strictEqual(recoveredTicket.ticketNumber, result1.ticket.ticketNumber);

    // Verify user bookings query after restart
    const userABookings = await restartedRepo.getUserBookings(userA.id);
    assert.ok(userABookings.some(b => b.id === result1.booking.id), 'User bookings query recovers durable records');

    console.log('    ✓ Booking, passengers, trips, and tickets successfully survived restart.');

    // ========================================================================
    // 2. SEAT INVENTORY DURABILITY ACROSS RESTART
    // ========================================================================
    console.log('  [2/5] Testing seat reservation durability across restart...');

    // Rehydrate restarted repo state from DB
    await restartedRepo.rehydrateFromDatabase();

    const restartedSeatService = new SeatInventoryService(restartedRepo);
    const occupiedSeats = await restartedSeatService.getOccupiedSeats(testServiceId);

    assert.ok(occupiedSeats.has(testSeat1), `Seat ${testSeat1} must remain occupied on restarted instance`);

    // Proving double-booking is rejected on restarted instance
    let doubleBookingBlocked = false;
    try {
      await restartedSeatService.reserveSeats(testServiceId, [testSeat1]);
    } catch (err) {
      if (err instanceof ConflictError && err.message.includes('already occupied')) {
        doubleBookingBlocked = true;
      }
    }
    assert.strictEqual(doubleBookingBlocked, true, 'Restarted instance must reject reservation of durably occupied seat');

    console.log('    ✓ Seat reservation state durably maintained across restart.');

    // ========================================================================
    // 3. CONCURRENCY-SAFE SEAT RESERVATION (DOUBLE-BOOKING PREVENTION)
    // ========================================================================
    console.log('  [3/5] Testing concurrent race conditions for identical seat...');

    const raceSeat = '8B';
    // Ensure test seat is free initially
    await travelService.seatService.releaseSeats(testServiceId, [raceSeat]);

    const racePayloadUserB = {
      type: 'bus',
      serviceId: testServiceId,
      passengers: [{ name: userB.fullName, seat: raceSeat, phone: '+237690333444' }]
    };

    const racePayloadUserC = {
      type: 'bus',
      serviceId: testServiceId,
      passengers: [{ name: userC.fullName, seat: raceSeat, phone: '+237690555666' }]
    };

    // Fire both booking requests concurrently in parallel
    const [raceResB, raceResC] = await Promise.allSettled([
      bookingEngine1.createBooking(racePayloadUserB, { user: userB }),
      bookingEngine1.createBooking(racePayloadUserC, { user: userC })
    ]);

    const successes = [raceResB, raceResC].filter(r => r.status === 'fulfilled');
    const failures = [raceResB, raceResC].filter(r => r.status === 'rejected');

    assert.strictEqual(successes.length, 1, 'Exactly ONE concurrent booking must succeed (201)');
    assert.strictEqual(failures.length, 1, 'Exactly ONE concurrent booking must fail with conflict (409)');

    const winningBooking = successes[0].value.booking;
    testIdsToClean.push(winningBooking.id);

    const losingError = failures[0].reason;
    assert.ok(
      losingError instanceof ConflictError,
      `Losing request must receive ConflictError, got: ${losingError.name || losingError.message}`
    );
    assert.ok(
      losingError.message.includes('already occupied') || losingError.message.includes('busy'),
      `Conflict error must describe seat occupancy: ${losingError.message}`
    );

    console.log(`    Winner: ${winningBooking.id} (${winningBooking.userId}) | Loser rejected: ${losingError.message}`);
    console.log('    ✓ Concurrency race handled safely with zero double bookings.');

    // ========================================================================
    // 4. IDEMPOTENCY SAFETY ACROSS RESTART & REPLAYS
    // ========================================================================
    console.log('  [4/5] Testing idempotency deduplication across process restarts...');

    const idemKey = `idem_${Date.now()}_unique`;
    const idemSeat = '9A';
    await travelService.seatService.releaseSeats(testServiceId, [idemSeat]);

    const idemPayload = {
      type: 'bus',
      serviceId: testServiceId,
      passengers: [{ name: userD.fullName, seat: idemSeat, phone: '+237690777888' }]
    };

    // First attempt
    const idemRes1 = await bookingEngine1.createBooking(idemPayload, { idempotencyKey: idemKey, user: userD });
    assert.ok(idemRes1.booking.id);
    testIdsToClean.push(idemRes1.booking.id);

    // Second attempt on the SAME engine (replay)
    const idemRes2 = await bookingEngine1.createBooking(idemPayload, { idempotencyKey: idemKey, user: userD });
    assert.strictEqual(idemRes2.booking.id, idemRes1.booking.id, 'Idempotent retry must return original booking ID');
    assert.strictEqual(idemRes2.booking.reference, idemRes1.booking.reference, 'Idempotent retry must return same reference');

    // Third attempt on a RESTARTED engine instance
    const freshEngine = new BookingEngine();
    freshEngine.repo = restartedRepo;
    const idemRes3 = await freshEngine.createBooking(idemPayload, { idempotencyKey: idemKey, user: userD });
    assert.strictEqual(idemRes3.booking.id, idemRes1.booking.id, 'Idempotent replay on restarted instance must return original booking');

    // Fourth attempt by a DIFFERENT user with same key -> must be rejected with 409
    let differentUserBlocked = false;
    try {
      await freshEngine.createBooking(idemPayload, { idempotencyKey: idemKey, user: userA });
    } catch (err) {
      if (err instanceof ConflictError && err.message.includes('already been used by another operation')) {
        differentUserBlocked = true;
      }
    }
    assert.strictEqual(differentUserBlocked, true, 'Idempotency key re-use by different user must be rejected');

    console.log('    ✓ Idempotency replay safely verified across engine instances and process restarts.');

    // ========================================================================
    // 5. PERSISTENCE FAILURES FAIL SAFELY (NO FALSE 201 & SEAT ROLLBACK)
    // ========================================================================
    console.log('  [5/5] Testing fail-safe persistence failure handling & seat rollback...');

    const failTestSeat = '9B';
    await travelService.seatService.releaseSeats(testServiceId, [failTestSeat]);

    // Construct an engine whose repository simulates a catastrophic database write failure
    const failingRepo = new TravelRepository();
    failingRepo.saveBooking = async function() {
      throw new InfrastructureError('Supabase', 'Simulated database disk failure / connection drop');
    };

    const failingBookingEngine = new BookingEngine();
    failingBookingEngine.repo = failingRepo;

    let persistenceFailed = false;
    try {
      await failingBookingEngine.createBooking({
        type: 'bus',
        serviceId: testServiceId,
        passengers: [{ name: 'Failure Test Traveler', seat: failTestSeat }]
      }, { user: userA });
    } catch (err) {
      if (err instanceof InfrastructureError && err.message.includes('Simulated database')) {
        persistenceFailed = true;
      }
    }

    assert.strictEqual(persistenceFailed, true, 'Persistence failure must throw InfrastructureError');

    // CRITICAL: Prove that seat '4B' was ROLLED BACK and NOT left locked/occupied!
    const occupancyAfterFailure = await travelService.seatService.getOccupiedSeats(testServiceId);
    assert.strictEqual(
      occupancyAfterFailure.has(failTestSeat),
      false,
      `Seat ${failTestSeat} must be rolled back and available after persistence failure`
    );

    // Prove that a subsequent legitimate booking can now reserve that seat successfully
    const recoveryBooking = await bookingEngine1.createBooking({
      type: 'bus',
      serviceId: testServiceId,
      passengers: [{ name: 'Recovery Traveler', seat: failTestSeat }]
    }, { user: userA });
    assert.ok(recoveryBooking.booking.id, 'Subsequent booking succeeds after rollback');
    testIdsToClean.push(recoveryBooking.booking.id);

    console.log('    ✓ Fail-safe rollback confirmed: zero false successful bookings and seats cleanly released.');

    console.log('\n  ═══════════════════════════════════════════════════════════');
    console.log('  ✓ ALL 5 TRAVEL DURABILITY & CONCURRENCY TESTS PASSED!');
    console.log('  ═══════════════════════════════════════════════════════════\n');
  } finally {
    // Clean up created test bookings from Supabase
    if (db) {
      try {
        if (testIdsToClean.length > 0) {
          await db.from('travel_bookings').delete().in('id', testIdsToClean);
        }
        await db.from('travel_bookings').delete().like('user_id', 'usr_durable_%');
        console.log(`  [Cleanup] Removed test bookings from durable database.`);
      } catch (err) {
        console.warn('  [Cleanup] Warning during test cleanup:', err.message);
      }
    }
  }
}

if (require.main === module) {
  run().catch(err => {
    console.error('\nFAILED:', err);
    process.exit(1);
  });
}

module.exports = { run };
