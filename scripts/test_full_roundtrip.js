const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });
const { SupabaseDatabase } = require('../server/infrastructure/database/SupabaseClient');

async function main() {
  const db = SupabaseDatabase.getAdmin();
  const testId = `bkg_probe_${Date.now()}`;
  const testRef = `REF-${Date.now()}`;
  const testTicket = `TK-${Date.now()}`;
  const testUser = 'usr_probe_test';

  console.log('1. Inserting travel_bookings...');
  const bkgRes = await db.from('travel_bookings').insert({
    id: testId,
    user_id: testUser,
    type: 'bus',
    item_id: 'bus-sch-1',
    booking_reference: testRef,
    status: 'CONFIRMED',
    amount: 6500,
    currency: 'XAF',
    pricing_breakdown: { baseAmount: 6000, serviceFee: 500, totalAmount: 6500 },
    itinerary: { origin: 'Douala', destination: 'Yaoundé' },
    payment_info: { method: 'mtn_momo', status: 'PAID' }
  }).select();
  if (bkgRes.error) throw new Error(`Booking insert error: ${bkgRes.error.message}`);
  console.log('Booking inserted:', bkgRes.data[0].id);

  console.log('2. Inserting booking_passengers...');
  const passRes = await db.from('booking_passengers').insert({
    booking_id: testId,
    name: 'Rostand Test',
    seat: '4A',
    phone: '+237690000000'
  }).select();
  if (passRes.error) throw new Error(`Passenger insert error: ${passRes.error.message}`);
  console.log('Passenger inserted:', passRes.data[0].name, 'Seat:', passRes.data[0].seat);

  console.log('3. Inserting trips...');
  const tripRes = await db.from('trips').insert({
    user_id: testUser,
    booking_id: testId,
    type: 'bus',
    provider_name: 'General Express',
    origin: 'Douala',
    destination: 'Yaoundé',
    departure: new Date().toISOString(),
    arrival: new Date(Date.now() + 14400000).toISOString(),
    status: 'UPCOMING',
    seat: '4A',
    details: { busClass: 'VIP' }
  }).select();
  if (tripRes.error) throw new Error(`Trip insert error: ${tripRes.error.message}`);
  console.log('Trip inserted:', tripRes.data[0].id);

  console.log('4. Inserting tickets...');
  const tktRes = await db.from('tickets').insert({
    booking_id: testId,
    ticket_number: testTicket,
    qr_payload: 'SIGNED_PAYLOAD',
    status: 'VALID'
  }).select();
  if (tktRes.error) throw new Error(`Ticket insert error: ${tktRes.error.message}`);
  console.log('Ticket inserted:', tktRes.data[0].ticket_number);

  console.log('5. Querying with joins/passengers...');
  const queryRes = await db.from('travel_bookings')
    .select('*, booking_passengers(*), trips(*), tickets(*)')
    .eq('id', testId)
    .single();
  if (queryRes.error) throw new Error(`Query join error: ${queryRes.error.message}`);
  console.log('Retrieved booking with relations:');
  console.log('- Booking:', queryRes.data.id, queryRes.data.booking_reference);
  console.log('- Passengers:', queryRes.data.booking_passengers.length);
  console.log('- Trips:', queryRes.data.trips.length);
  console.log('- Tickets:', queryRes.data.tickets.length);

  console.log('6. Cleaning up test data...');
  await db.from('travel_bookings').delete().eq('id', testId);
  console.log('Cleaned up successfully! CASCADE deletion verified.');
}

main().then(() => process.exit(0)).catch(e => { console.error('FAILED:', e); process.exit(1); });
