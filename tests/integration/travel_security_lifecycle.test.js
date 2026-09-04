/**
 * LOUMOO Integration Tests — Travel Domain Security, Privacy & Lifecycle Suite
 * ---------------------------------------------------------------------------
 * Comprehensive domain test verifying:
 *  1. Server-Side Authorization Boundary & Anti-IDOR Defense (404 anti-enumeration)
 *  2. Privacy & Zero PII Leakage on public search, seat maps, and quotes
 *  3. Payment Provider Agnosticism & Elimination of fake payment/gateway behavior
 *  4. Authoritative Server Pricing across all modalities (bus, taxi, hotel, excursion)
 *  5. Strict Booking Finite State Machine Lifecycle transitions
 *  6. Concurrency-Safe Seat Reservations & Fail-Safe Persistence Rollback
 */

require('../setup');
const assert = require('assert');
const { TravelRepository } = require('../../server/modules/travel/infrastructure/TravelRepository');
const { BookingEngine } = require('../../server/modules/travel/application/BookingEngine');
const { SeatInventoryService } = require('../../server/modules/travel/application/SeatInventoryService');
const { TravelService } = require('../../server/modules/travel/application/TravelService');
const { BOOKING_STATUS, PAYMENT_STATUS } = require('../../server/modules/travel/domain/Booking');
const {
  ConflictError,
  NotFoundError,
  ValidationError,
  AuthenticationError
} = require('../../server/shared/errors/AppError');

async function run() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  LOUMOO TRAVEL DOMAIN SECURITY & LIFECYCLE TEST SUITE');
  console.log('═══════════════════════════════════════════════════════════\n');

  const repo = new TravelRepository({ db: null });
  const seatService = new SeatInventoryService(repo);
  const bookingEngine = new BookingEngine(repo, seatService);
  const travelService = new TravelService(repo, bookingEngine, seatService);

  const userAlice = { id: `usr_alice_${Date.now()}`, fullName: 'Alice Mengue', primaryRole: 'customer' };
  const userBob = { id: `usr_bob_${Date.now()}`, fullName: 'Bob Biya', primaryRole: 'customer' };
  const userAdmin = { id: `usr_admin_${Date.now()}`, fullName: 'Admin System', primaryRole: 'admin' };

  const testBusServiceId = 'bus-sch-1';

  // ==========================================================================
  // 1. SERVER-SIDE AUTHORIZATION & ANTI-IDOR DEFENSE
  // ==========================================================================
  console.log('  [1/6] Testing Server-Side Authorization & Anti-IDOR Defenses...');

  // 1.1 Unauthenticated caller cannot create booking
  let unauthBlocked = false;
  try {
    await bookingEngine.createBooking({
      type: 'bus',
      serviceId: testBusServiceId,
      passengers: [{ name: 'Intruder', seat: '8A' }]
    }, { user: null });
  } catch (err) {
    if (err instanceof AuthenticationError) unauthBlocked = true;
  }
  assert.strictEqual(unauthBlocked, true, 'Unauthenticated booking creation must be rejected');

  // 1.2 Alice creates a valid bus booking
  await seatService.releaseSeats(testBusServiceId, ['8A']);
  const aliceBookingRes = await bookingEngine.createBooking({
    type: 'bus',
    serviceId: testBusServiceId,
    userId: 'spoofed_target_id', // Client tries to spoof owner
    passengers: [{ name: userAlice.fullName, seat: '8A', phone: '+237690111222' }]
  }, { user: userAlice });

  const aliceBooking = aliceBookingRes.booking;
  assert.strictEqual(aliceBooking.userId, userAlice.id, 'Server must enforce authenticated user ID and ignore spoofed ID');

  // 1.3 Alice can access her own booking
  const aliceFetched = await travelService.getBookingById(aliceBooking.id, { id: userAlice.id });
  assert.strictEqual(aliceFetched.id, aliceBooking.id, 'Alice can access her own booking');

  // 1.4 Bob attempts to access Alice booking -> must return 404 (Anti-Enumeration)
  let bobAccessBlocked = false;
  try {
    await travelService.getBookingById(aliceBooking.id, { id: userBob.id });
  } catch (err) {
    if (err instanceof NotFoundError) bobAccessBlocked = true;
  }
  assert.strictEqual(bobAccessBlocked, true, 'Bob accessing Alice booking must return NotFoundError (anti-IDOR 404)');

  // 1.5 Bob attempts to cancel Alice booking -> must return 404 (Anti-Enumeration)
  let bobCancelBlocked = false;
  try {
    await bookingEngine.cancelBooking(aliceBooking.id, userBob.id, 'Malicious cancel', { user: userBob });
  } catch (err) {
    if (err instanceof NotFoundError) bobCancelBlocked = true;
  }
  assert.strictEqual(bobCancelBlocked, true, 'Bob cancelling Alice booking must return NotFoundError (anti-IDOR 404)');

  // 1.6 Bob attempts to access Alice trip -> must return 404
  let bobTripBlocked = false;
  try {
    await travelService.getTripById(aliceBooking.id, { id: userBob.id });
  } catch (err) {
    if (err instanceof NotFoundError) bobTripBlocked = true;
  }
  assert.strictEqual(bobTripBlocked, true, 'Bob accessing Alice trip must return NotFoundError');

  // 1.7 Bob attempts to access Alice ticket -> must return 404
  let bobTicketBlocked = false;
  try {
    await travelService.getTicketById(aliceBooking.id, { id: userBob.id });
  } catch (err) {
    if (err instanceof NotFoundError) bobTicketBlocked = true;
  }
  assert.strictEqual(bobTicketBlocked, true, 'Bob accessing Alice ticket must return NotFoundError');

  // 1.8 Admin can view booking
  const adminFetched = await travelService.getBookingById(aliceBooking.id, userAdmin);
  assert.strictEqual(adminFetched.id, aliceBooking.id, 'Admin can view booking for support');

  console.log('    ✓ Server-side authorization & anti-enumeration 404 boundaries verified.');

  // ==========================================================================
  // 2. PRIVACY & ZERO PII LEAKAGE
  // ==========================================================================
  console.log('  [2/6] Testing Privacy & Elimination of PII Exposure...');

  // 2.1 Public search results must never contain passenger/customer PII
  const searchResults = await travelService.search({ origin: 'Douala', destination: 'Yaoundé' });
  const allSearchItems = [
    ...(searchResults.buses || []),
    ...(searchResults.trains || []),
    ...(searchResults.flights || []),
    ...(searchResults.hotels || []),
    ...(searchResults.tours || [])
  ];

  assert.ok(allSearchItems.length > 0, 'Search should return items');
  for (const item of allSearchItems) {
    assert.strictEqual(item.passengers, undefined, 'Public search item must not leak passengers');
    assert.strictEqual(item.customer, undefined, 'Public search item must not leak customer');
    assert.strictEqual(item.email, undefined, 'Public search item must not leak email');
    assert.strictEqual(item.phone, undefined, 'Public search item must not leak phone');
    assert.strictEqual(item.passportNumber, undefined, 'Public search item must not leak passportNumber');
  }

  // 2.2 Public bus seat map must expose only availability, never passenger names
  const seatMap = seatService.getSeatMap(testBusServiceId);
  assert.ok(seatMap.seatLayout && seatMap.seatLayout.length > 0);
  for (const row of seatMap.seatLayout) {
    const seats = Array.isArray(row.seats) ? row.seats : (Array.isArray(row) ? row : []);
    for (const seat of seats) {
      assert.ok(['AVAILABLE', 'OCCUPIED', 'available', 'booked'].includes(seat.status));
      assert.strictEqual(seat.passengerName, undefined, 'Seat map must not leak passenger names');
      assert.strictEqual(seat.passengerPhone, undefined, 'Seat map must not leak passenger phone');
      assert.strictEqual(seat.userId, undefined, 'Seat map must not leak booking userId');
    }
  }

  // 2.3 Taxi quote contains purely pricing & vehicle details, zero user data
  const taxiQuote = travelService.calculateTaxiQuote({ type: 'airport', vehicleClass: 'vip' });
  assert.strictEqual(taxiQuote.passengers, undefined);
  assert.strictEqual(taxiQuote.user, undefined);
  assert.ok(taxiQuote.estimatedPrice > 0);

  console.log('    ✓ Zero PII exposed across public search, seat maps, and quotes.');

  // ==========================================================================
  // 3. PAYMENT AGNOSTICISM & ZERO FAKE GATEWAY BEHAVIOR
  // ==========================================================================
  console.log('  [3/6] Testing Payment Provider Agnosticism...');

  // 3.1 Newly created booking must hold PENDING_PAYMENT status
  assert.strictEqual(
    aliceBooking.payment.status,
    PAYMENT_STATUS.PENDING,
    'Newly created booking must have PENDING_PAYMENT payment status'
  );

  // 3.2 Transaction reference must be null (no fake TXN-... strings)
  assert.strictEqual(
    aliceBooking.payment.transactionRef,
    null,
    'Newly created booking must have null transactionRef (no fake transactions)'
  );

  // 3.3 Gateway provider must be null (no fake gateway provider)
  assert.strictEqual(
    aliceBooking.payment.gatewayProvider,
    null,
    'Gateway provider must be null until a real provider is integrated'
  );

  // 3.4 Tampering attempt: Client sends payment.status = 'PAID' -> server overrides
  await seatService.releaseSeats(testBusServiceId, ['8B']);
  const tamperedBookingRes = await bookingEngine.createBooking({
    type: 'bus',
    serviceId: testBusServiceId,
    passengers: [{ name: userBob.fullName, seat: '8B' }],
    payment: {
      status: 'PAID',
      transactionRef: 'FAKE_TXN_ATTACK_9999',
      provider: 'fake_provider'
    }
  }, { user: userBob });

  const tamperedBooking = tamperedBookingRes.booking;
  assert.strictEqual(
    tamperedBooking.payment.status,
    PAYMENT_STATUS.PENDING,
    'Server must reject client attempt to mark booking as PAID'
  );
  assert.strictEqual(
    tamperedBooking.payment.transactionRef,
    null,
    'Server must reject client-supplied fake transaction reference'
  );

  // 3.5 Provider-agnostic payment confirmation hook
  const paymentConfirmResult = await travelService.recordPaymentConfirmation(aliceBooking.id, {
    provider: 'future_selected_provider',
    transactionRef: 'REAL_GATEWAY_REF_881923',
    amount: aliceBooking.amount
  });
  assert.strictEqual(
    paymentConfirmResult.payment.status,
    PAYMENT_STATUS.PAID,
    'Authorized payment confirmation updates payment status to PAID'
  );
  assert.strictEqual(
    paymentConfirmResult.payment.transactionRef,
    'REAL_GATEWAY_REF_881923',
    'Transaction reference updated from authorized provider confirmation'
  );

  console.log('    ✓ Payment architecture is strictly provider-agnostic with zero fake behavior.');

  // ==========================================================================
  // 4. AUTHORITATIVE SERVER-SIDE PRICING
  // ==========================================================================
  console.log('  [4/6] Testing Authoritative Server-Side Pricing...');

  // 4.1 Bus booking price tampering attempt
  await seatService.releaseSeats(testBusServiceId, ['8C']);
  const tamperedPriceBookingRes = await bookingEngine.createBooking({
    type: 'bus',
    serviceId: testBusServiceId,
    passengers: [{ name: userAlice.fullName, seat: '8C' }],
    pricing: {
      totalAmount: 10, // Tampered price: 10 XAF instead of 6500 XAF
      baseAmount: 10
    }
  }, { user: userAlice });

  assert.strictEqual(
    tamperedPriceBookingRes.booking.amount,
    6300,
    'Server must calculate authoritative price (6300 XAF) and reject client 10 XAF'
  );

  // 4.2 Taxi booking price is authoritatively computed by server
  const taxiBookingRes = await bookingEngine.createBooking({
    type: 'taxi',
    taxiDetails: { type: 'city', vehicleClass: 'comfort' },
    passengers: [{ name: userAlice.fullName, phone: '+237690111222' }],
    pricing: { totalAmount: 50 } // Tampered price
  }, { user: userAlice });

  assert.strictEqual(
    taxiBookingRes.booking.amount,
    3675,
    'Server must calculate authoritative taxi quote price (3675 XAF)'
  );

  // 4.3 Hotel stay pricing: rooms × nights × nightlyRate
  const hotelBookingRes = await bookingEngine.createBooking({
    type: 'hotel',
    hotelId: 'htl-krystal-douala',
    roomId: 'rm-krystal-deluxe',
    hotelRoomId: 'rm-krystal-deluxe',
    checkIn: '2026-10-01',
    checkOut: '2026-10-04', // 3 nights
    roomsCount: 2,
    passengers: [{ name: userAlice.fullName }],
    pricing: { totalAmount: 100 } // Tampered price
  }, { user: userAlice });

  // 2 rooms × 3 nights × 95,000 XAF = 570,000 XAF + 2% service fee (11,400 XAF) = 581,400 XAF
  assert.strictEqual(
    hotelBookingRes.booking.amount,
    581400,
    'Server must calculate hotel price as roomsCount × nights × pricePerNight + serviceFee'
  );

  console.log('    ✓ Server-side authoritative pricing strictly enforced across modalities.');

  // ==========================================================================
  // 5. BOOKING FINITE STATE MACHINE & LIFECYCLE GUARDS
  // ==========================================================================
  console.log('  [5/6] Testing Booking Finite State Machine & Lifecycle Transitions...');

  // 5.1 Valid transition: CONFIRMED -> CANCELLED
  const cancelResult = await bookingEngine.cancelBooking(
    tamperedBooking.id,
    userBob.id,
    'User plans changed',
    { user: userBob }
  );
  assert.strictEqual(cancelResult.status, BOOKING_STATUS.CANCELLED);

  // 5.2 Invalid transition: CANCELLED -> CANCELLED (cannot cancel already cancelled booking)
  let repeatCancelBlocked = false;
  try {
    await bookingEngine.cancelBooking(
      tamperedBooking.id,
      userBob.id,
      'Second cancel attempt',
      { user: userBob }
    );
  } catch (err) {
    if (err instanceof ConflictError && err.message.includes('CANCELLED')) {
      repeatCancelBlocked = true;
    }
  }
  assert.strictEqual(repeatCancelBlocked, true, 'Cannot cancel an already CANCELLED booking');

  // 5.3 Domain Entity guard: cannot confirm a CANCELLED booking
  const cancelledEntity = await repo.getBookingById(tamperedBooking.id);
  assert.throws(
    () => cancelledEntity.confirm(),
    /Cannot confirm a booking with status 'CANCELLED'/,
    'Cancelled booking cannot be confirmed'
  );

  // 5.4 Domain Entity guard: cannot cancel a COMPLETED booking
  const completedBooking = new (require('../../server/modules/travel/domain/Booking').Booking)({
    userId: userAlice.id,
    type: 'bus',
    itemId: testBusServiceId,
    status: BOOKING_STATUS.COMPLETED
  });
  assert.throws(
    () => completedBooking.cancel('Customer request'),
    /Cannot cancel a booking with status 'COMPLETED'/,
    'Completed booking cannot be cancelled'
  );

  console.log('    ✓ Booking lifecycle finite state machine strictly guarded against invalid transitions.');

  // ==========================================================================
  // 6. CONCURRENCY, SEAT BOUNDARIES, IDEMPOTENCY & ROLLBACK
  // ==========================================================================
  console.log('  [6/6] Testing Concurrency, Input Validation & Rollback Guarantees...');

  // 6.1 Duplicate seats in a single booking request must be rejected
  let duplicateSeatsBlocked = false;
  try {
    await bookingEngine.createBooking({
      type: 'bus',
      serviceId: testBusServiceId,
      passengers: [
        { name: 'Traveler One', seat: '4A' },
        { name: 'Traveler Two', seat: '4A' } // Duplicate seat
      ]
    }, { user: userAlice });
  } catch (err) {
    if (err instanceof ValidationError && err.message.includes('Duplicate seat')) {
      duplicateSeatsBlocked = true;
    }
  }
  assert.strictEqual(duplicateSeatsBlocked, true, 'Duplicate seat numbers in single request must be rejected (400)');

  // 6.2 Non-existent seat on layout must be rejected
  let invalidSeatBlocked = false;
  try {
    await bookingEngine.createBooking({
      type: 'bus',
      serviceId: testBusServiceId,
      passengers: [{ name: 'Traveler', seat: '99Z' }]
    }, { user: userAlice });
  } catch (err) {
    if (err instanceof ValidationError && err.message.includes('not a valid seat')) {
      invalidSeatBlocked = true;
    }
  }
  assert.strictEqual(invalidSeatBlocked, true, 'Seat outside vehicle layout must be rejected (400)');

  // 6.3 Concurrency race for identical seat: exactly one wins, other gets ConflictError
  const raceSeat = '9A';
  await seatService.releaseSeats(testBusServiceId, [raceSeat]);

  const [res1, res2] = await Promise.allSettled([
    bookingEngine.createBooking({
      type: 'bus',
      serviceId: testBusServiceId,
      passengers: [{ name: userAlice.fullName, seat: raceSeat }]
    }, { user: userAlice }),
    bookingEngine.createBooking({
      type: 'bus',
      serviceId: testBusServiceId,
      passengers: [{ name: userBob.fullName, seat: raceSeat }]
    }, { user: userBob })
  ]);

  const fulfilled = [res1, res2].filter(r => r.status === 'fulfilled');
  const rejected = [res1, res2].filter(r => r.status === 'rejected');
  assert.strictEqual(fulfilled.length, 1, 'Exactly one concurrent booking wins');
  assert.strictEqual(rejected.length, 1, 'Exactly one concurrent booking fails with conflict');
  assert.ok(rejected[0].reason instanceof ConflictError, 'Losing request receives ConflictError');

  // 6.4 Fail-safe persistence failure triggers automatic inventory rollback
  const failSeat = '9B';
  await seatService.releaseSeats(testBusServiceId, [failSeat]);

  const mockFailRepo = new TravelRepository({ db: null });
  mockFailRepo.saveBooking = async function() {
    throw new Error('Simulated atomic persistence write failure');
  };
  const mockFailEngine = new BookingEngine(mockFailRepo, seatService);

  let engineThrew = false;
  try {
    await mockFailEngine.createBooking({
      type: 'bus',
      serviceId: testBusServiceId,
      passengers: [{ name: userAlice.fullName, seat: failSeat }]
    }, { user: userAlice });
  } catch (err) {
    if (err.message.includes('Simulated atomic persistence write failure')) {
      engineThrew = true;
    }
  }
  assert.strictEqual(engineThrew, true, 'Persistence failure throws');

  // Verify seat was rolled back and is free
  const occupiedAfter = await seatService.getOccupiedSeats(testBusServiceId);
  assert.strictEqual(
    occupiedAfter.has(failSeat),
    false,
    'Reserved seat must be rolled back and free after persistence failure'
  );

  console.log('    ✓ Concurrency safety, input validation, and rollback guarantees verified.');

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  ✓ ALL TRAVEL DOMAIN SECURITY & LIFECYCLE TESTS PASSED!');
  console.log('═══════════════════════════════════════════════════════════\n');
}

if (require.main === module) {
  run().catch(err => {
    console.error('\nFAILED:', err);
    process.exit(1);
  });
}

module.exports = { run };
