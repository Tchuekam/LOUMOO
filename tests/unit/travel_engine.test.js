/**
 * LOUMOO Unit Tests — Travel Engine, Multi-Modal Search & Booking Domain
 */

require('../setup');
const assert = require('assert');
const { travelService, TravelService } = require('../../server/modules/travel/application/TravelService');
const { Booking, BOOKING_STATUS, SERVICE_TYPES } = require('../../server/modules/travel/domain/Booking');

async function run() {
  console.log('  Testing Travel Engine domain logic, multi-modal routing & booking lifecycle...');

  // 1. Bus Search & Filtering
  const busSearch = travelService.search({ type: 'bus', origin: 'Douala', destination: 'Yaoundé' });
  assert.ok(busSearch.buses.length >= 2, 'Found at least 2 bus schedules for Douala -> Yaoundé');
  assert.strictEqual(busSearch.buses[0].currency, 'XAF');
  assert.ok(busSearch.buses[0].operatorVerified, 'Operator is verified');
  assert.ok(busSearch.buses[0].amenities.includes('Wi-Fi 6') || busSearch.buses[0].amenities.includes('AC'), 'Has amenities list');

  // 2. Bus Operators
  const operators = travelService.getBusOperators();
  assert.ok(operators.length >= 4, 'Found 4 official Cameroon bus agencies');
  const general = operators.find(o => o.id === 'op-general-express');
  assert.ok(general, 'General Express found');
  assert.ok(general.terminals.Douala, 'Terminal info present');
  assert.ok(general.whatsapp, 'WhatsApp contact present');

  // 3. Seat Map & Availability Inspection
  const seatData = travelService.getBusSeats('bus-sch-1');
  assert.strictEqual(seatData.scheduleId, 'bus-sch-1');
  assert.strictEqual(seatData.layoutType, '2x1');
  assert.strictEqual(seatData.totalSeats, 28);
  assert.ok(seatData.occupiedSeats.includes('1A'), 'Seat 1A is marked occupied');
  assert.ok(seatData.seatLayout.length >= 7, 'Layout has at least 7 rows');
  assert.strictEqual(seatData.seatLayout[0].seats[0].status, 'OCCUPIED');

  // 4. Train Routes & Fallback Notice
  const trainSearch = travelService.search({ type: 'train', origin: 'Douala', destination: 'Yaoundé' });
  assert.ok(trainSearch.trains.length >= 2, 'Found Camrail trains for Douala -> Yaoundé');
  assert.ok(trainSearch.trains[0].trainClass.includes('VIP') || trainSearch.trains[0].trainClass.includes('Standard'));

  const unservicedTrain = travelService.search({ type: 'train', origin: 'Douala', destination: 'Kribi' });
  assert.ok(unservicedTrain.trainRouteNotice, 'Unserviced rail destination provides notice');

  // 5. Taxi Quote Calculation
  const taxiQuote = travelService.calculateTaxiQuote({ type: 'airport', origin: 'Akwa', destination: 'Douala Airport', vehicleClass: 'vip' });
  assert.strictEqual(taxiQuote.type, 'airport');
  assert.strictEqual(taxiQuote.currency, 'XAF');
  assert.ok(taxiQuote.estimatedPrice >= 12000, 'Airport transfer quote calculated');
  assert.ok(taxiQuote.driverAssigned.name, 'Driver partner assigned');

  // 6. Tourism Packages
  const packages = travelService.getPackages();
  assert.ok(packages.length >= 3, 'Found 3 curated tourism packages');
  const kribi = travelService.getPackageById('pkg-1');
  assert.strictEqual(kribi.durationDays, 3);
  assert.ok(kribi.itinerary.length === 3, '3-day itinerary present');
  assert.ok(kribi.included.length >= 2, 'Inclusions listed');

  // 7. Visa Concierge
  const visas = travelService.getVisaDestinations();
  assert.ok(visas.length >= 4, 'Found 4 visa destinations');
  const france = travelService.getVisaDestinationById('visa-fr');
  assert.ok(france.officialFee > 0, 'Official fee present');
  assert.ok(france.conciergeFee > 0, 'Concierge fee present');
  assert.ok(france.requirements.length >= 4, 'Requirements checklist present');

  // 8. Booking Domain Entity & Lifecycle
  const newBooking = new Booking({
    type: SERVICE_TYPES.BUS,
    userId: 'usr_unit_test',
    itinerary: {
      operator: 'Finexs Voyages',
      route: 'Douala → Yaoundé',
      departureTime: '07:30'
    },
    passengers: [{ name: 'SAMUEL ETOO', seat: '2C' }],
    pricing: { baseAmount: 7500, serviceFee: 500, totalAmount: 8000, currency: 'XAF' }
  });

  assert.ok(newBooking.id.startsWith('bkg_'));
  assert.ok(newBooking.reference.startsWith('LMT-BUS-'));
  assert.strictEqual(newBooking.status, BOOKING_STATUS.CONFIRMED);
  assert.ok(newBooking.qrCodePayload.includes(newBooking.reference));

  // Cancellation State Machine
  newBooking.cancel('Schedule change');
  assert.strictEqual(newBooking.status, BOOKING_STATUS.CANCELLED);
  assert.strictEqual(newBooking.cancellationReason, 'Schedule change');
  assert.throws(() => newBooking.cancel(), /Cannot cancel a booking with status 'CANCELLED'/);

  console.log('    ✓ Travel Engine domain unit tests passed.');
}

if (require.main === module) {
  run().catch(err => {
    console.error('FAILED:', err);
    process.exit(1);
  });
}

module.exports = { run };
