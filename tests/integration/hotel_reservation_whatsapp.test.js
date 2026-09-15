/**
 * End-to-end verification of Hotel Reservation -> DB + WhatsApp Notification to Hotel
 */

require('../setup');
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { TravelRepository } = require('../../server/modules/travel/infrastructure/TravelRepository');
const { BookingEngine } = require('../../server/modules/travel/application/BookingEngine');
const { HotelAvailabilityService } = require('../../server/modules/travel/application/HotelAvailabilityService');
const { BOOKING_STATUS, PAYMENT_STATUS } = require('../../server/modules/travel/domain/Booking');
const { Hotel } = require('../../server/modules/travel/domain/Hotel');

async function testHotelReservationAndWhatsApp() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  TEST: HOTEL RESERVATION -> DB + WHATSAPP NOTIFICATION');
  console.log('═══════════════════════════════════════════════════════════\n');

  // 1. Hotel entity & contact data resolution
  console.log('  [1/5] Verifying Hotel domain contact & phone/whatsapp resolution...');
  const repo = new TravelRepository({ db: null });
  const hotels = await repo.getHotels();
  assert(hotels.length > 0, 'Must have seeded hotels in repository');
  
  const sampleHotel = hotels[0];
  console.log(`       Hotel: ${sampleHotel.name}, Phone: ${sampleHotel.phone}, WhatsApp: ${sampleHotel.whatsapp}`);
  assert.ok(sampleHotel.phone, 'Hotel must have resolved phone number');
  assert.ok(sampleHotel.whatsapp, 'Hotel must have resolved whatsapp number');
  assert.ok(!sampleHotel.whatsapp.includes('undefined'), 'WhatsApp number must not be undefined');

  // 2. HotelAvailabilityService returns hotel contact details
  console.log('  [2/5] Testing HotelAvailabilityService.checkRoomAvailability()...');
  const hotelAvailService = new HotelAvailabilityService(repo);
  const sampleRoom = sampleHotel.rooms[0];
  assert.ok(sampleRoom, 'Sample hotel must have rooms');

  const avail = await hotelAvailService.checkRoomAvailability({
    hotelId: sampleHotel.id,
    roomId: sampleRoom.id,
    checkIn: '2026-10-01',
    checkOut: '2026-10-04',
    guests: 2,
    roomsCount: 1
  });

  assert.strictEqual(avail.available, true, 'Room must be available');
  assert.strictEqual(avail.hotelPhone, sampleHotel.phone, 'Availability must include hotel phone');
  assert.strictEqual(avail.hotelWhatsapp, sampleHotel.whatsapp, 'Availability must include hotel whatsapp');
  assert.strictEqual(avail.pricing.nights, 3, 'Pricing must calculate 3 nights');
  console.log(`       Verified stay quote: ${avail.pricing.nights} nights, total: ${avail.pricing.totalAmount} ${avail.pricing.currency}`);

  // 3. BookingEngine reservation persistence & itinerary contact encapsulation
  console.log('  [3/5] Testing BookingEngine.createBooking(type: "hotel")...');
  const bookingEngine = new BookingEngine(repo, null, hotelAvailService);
  const user = { id: `usr_traveler_${Date.now()}`, fullName: 'Paul Biya', primaryRole: 'customer' };

  const bookingResult = await bookingEngine.createBooking({
    type: 'hotel',
    hotelId: sampleHotel.id,
    roomId: sampleRoom.id,
    checkIn: '2026-10-01',
    checkOut: '2026-10-04',
    roomsCount: 1,
    guests: 2,
    passengers: [{ name: 'Paul Biya', phone: '+237690123456' }]
  }, { user });

  assert.ok(bookingResult.booking, 'Booking must be returned');
  assert.ok(bookingResult.trip, 'Trip must be generated');
  assert.strictEqual(bookingResult.booking.status, BOOKING_STATUS.PENDING, 'Booking must be PENDING (held awaiting payment)');
  assert.strictEqual(bookingResult.booking.payment.status, PAYMENT_STATUS.PENDING, 'Payment status must be PENDING');
  
  // Verify hotel phone and whatsapp are preserved on booking itinerary and trip details
  assert.strictEqual(bookingResult.booking.itinerary.hotelPhone, sampleHotel.phone, 'Booking itinerary must store hotelPhone');
  assert.strictEqual(bookingResult.booking.itinerary.hotelWhatsapp, sampleHotel.whatsapp, 'Booking itinerary must store hotelWhatsapp');
  assert.strictEqual(bookingResult.trip.details.hotelPhone, sampleHotel.phone, 'Trip details must store hotelPhone');
  assert.strictEqual(bookingResult.trip.details.hotelWhatsapp, sampleHotel.whatsapp, 'Trip details must store hotelWhatsapp');
  console.log(`       Booking reference: ${bookingResult.booking.bookingReference}`);
  console.log(`       Trip provider: ${bookingResult.trip.providerName}, Itinerary hotel phone: ${bookingResult.booking.itinerary.hotelPhone}`);

  // 4. Verification of WhatsApp message formatting & URL generation logic
  console.log('  [4/5] Testing WhatsApp notification URL & message synthesis...');
  const trip = {
    reference: bookingResult.booking.bookingReference,
    hotelWhatsApp: bookingResult.booking.itinerary.hotelWhatsapp,
    hotelName: sampleHotel.name,
    passenger: 'Paul Biya',
    roomType: sampleRoom.name,
    checkIn: '2026-10-01',
    checkOut: '2026-10-04',
    nights: 3,
    guests: 2,
    amount: bookingResult.booking.pricing.totalAmount
  };

  const cleanWa = (trip.hotelWhatsApp || '').replace(/[^0-9]/g, '').replace(/^00/, '');
  assert.ok(cleanWa.length >= 9, 'Clean WhatsApp number must contain international digits');
  assert.ok(!cleanWa.includes('+'), 'Clean WhatsApp number must NOT contain plus signs');
  assert.ok(!cleanWa.startsWith('00'), 'Clean WhatsApp number must NOT start with 00');

  const msgLines = [
    '🏨 *Nouvelle réservation LOUMOO*',
    '',
    `Référence: *${trip.reference}*`,
    `Hôtel: ${trip.hotelName}`,
    `Chambre: ${trip.roomType}`,
    `Nom du client: ${trip.passenger}`,
    `Arrivée: ${trip.checkIn}`,
    `Départ: ${trip.checkOut}`,
    `${trip.nights} nuit${trip.nights > 1 ? 's' : ''} · ${trip.guests} voyageur${trip.guests > 1 ? 's' : ''}`,
    trip.amount ? `Montant total: XAF ${Number(trip.amount).toLocaleString('fr-FR')}` : '',
    '',
    "Merci de confirmer la disponibilité de la chambre et de préparer l'accueil."
  ].filter(Boolean).join('\n');

  const targetUrl = cleanWa
    ? ('https://wa.me/' + cleanWa + '?text=' + encodeURIComponent(msgLines))
    : ('https://api.whatsapp.com/send?text=' + encodeURIComponent(msgLines));

  assert.ok(targetUrl.startsWith('https://wa.me/237'), 'Target URL must route to wa.me with country code');
  assert.ok(targetUrl.includes(encodeURIComponent(trip.reference)), 'Target URL must contain encoded booking reference');
  assert.ok(targetUrl.includes(encodeURIComponent(sampleHotel.name)), 'Target URL must contain encoded hotel name');
  console.log(`       Sample WhatsApp dispatch URL: ${targetUrl.slice(0, 75)}...`);

  // 5. Verification of compiled frontend artifacts
  console.log('  [5/5] Verifying compiled frontend artifacts...');
  const compiledHtml = fs.readFileSync(path.join(__dirname, '../../Commerce App.dc.html'), 'utf8');
  const hotelChunkHtml = fs.readFileSync(path.join(__dirname, '../../HotelScreens.dc.html'), 'utf8');
  
  // Verify hotelDetail in NO_NAV
  assert.ok(compiledHtml.includes("'hotelDetail','hotelBooking','hotelVoucher'"), 'hotelDetail must be in NO_NAV');
  
  // Verify hotel-sticky-reserve-bar class & CSS rule
  assert.ok(hotelChunkHtml.includes('class="hotel-sticky-reserve-bar"'), 'hotel-sticky-reserve-bar class must be present in HotelScreens.dc.html');
  assert.ok(compiledHtml.includes('.hotel-sticky-reserve-bar { left: 260px !important; }'), 'Desktop offset rule must be present in master CSS');

  // Verify WhatsApp sanitization in compiled HTML
  assert.ok(compiledHtml.includes(".replace(/[^0-9]/g, '').replace(/^00/, '')"), 'WhatsApp number sanitizer must be present');
  assert.ok(compiledHtml.includes("https://api.whatsapp.com/send?text="), 'WhatsApp fallback URL must be present');

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  ✓ ALL HOTEL RESERVATION & WHATSAPP TESTS PASSED 100%!');
  console.log('═══════════════════════════════════════════════════════════\n');
}

testHotelReservationAndWhatsApp().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
