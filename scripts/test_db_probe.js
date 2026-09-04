const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });
const { SupabaseDatabase } = require('../server/infrastructure/database/SupabaseClient');

async function test() {
  const db = SupabaseDatabase.getAdmin();
  const tables = ['destinations', 'hotels', 'rooms', 'room_reservations', 'excursions', 'transport_seats'];
  for (const t of tables) {
    const t0 = Date.now();
    try {
      const res = await Promise.race([
        db.from(t).select('*').limit(1),
        new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT_10S')), 10000))
      ]);
      console.log(`[${t}] ${Date.now() - t0}ms -> ${res.error ? 'ERR: ' + res.error.message : 'OK (' + res.data.length + ' rows)'}`);
    } catch (err) {
      console.log(`[${t}] ${Date.now() - t0}ms -> CAUGHT: ${err.message}`);
    }
  }
}

test().then(() => process.exit(0)).catch(e => { console.error('Fatal', e); process.exit(1); });
