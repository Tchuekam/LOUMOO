#!/usr/bin/env node
/**
 * LOUMOO: is THIS deployment ready for deliveries?  (read-only)
 * ---------------------------------------------------------------------------
 * The delivery suites prove the code and the migrations in isolation; they cannot
 * know whether migration 013 was applied to YOUR database, whether anyone is
 * registered as a rider, or whether the server has the secret that handover codes
 * are derived from. This answers that, against the project in your environment
 * (.env.local, like scripts/apply_migration.js):
 *
 *   npm run delivery:readiness
 *   npm run delivery:readiness -- --live     (also asks the geocoder one question)
 *
 * It only SELECTs: it writes nothing and creates nothing. It sends nothing either,
 * except with --live, which geocodes a landmark ("Bonanjo, Douala"), never an address
 * from your data, to prove the geocoder is reachable from this network. Exit code 1
 * means something that must be fixed before deliveries can work; warnings are
 * things that make the circuit quietly less useful (nobody to alert, no riders,
 * no rider online right now).
 *
 * Rider presence (migration 017): a delivery can only be offered to a rider who is
 * online, which the server reads from iam.rider_presence. Without that table accept,
 * assign, auto-assign and the rider list answer 503, so a missing table is a FAIL
 * naming the migration. RIDER_PRESENCE_TTL_SECONDS is checked the way the server
 * reads it (domain/RiderPresence.js), so what this prints is the window in force.
 */

'use strict';

const {
  PRESENCE_DEFAULT_TTL_SECONDS,
  PRESENCE_MIN_TTL_SECONDS,
  PRESENCE_MAX_TTL_SECONDS,
  PRESENCE_HEARTBEAT_INTERVAL_MS,
  presenceTtlMsFrom
} = require('../server/modules/delivery/domain/RiderPresence');

const MISSING_TABLE = ['PGRST205', '42P01'];
const MISSING_COLUMN = ['PGRST204', '42703'];

const DELIVERY_COLUMNS = [
  'id', 'order_id', 'buyer_id', 'seller_id', 'driver_id', 'status', 'pickup', 'dropoff', 'handover_nonce',
  'code_attempts', 'eta_minutes', 'distance_km', 'last_location', 'failure_reason', 'assigned_at', 'accepted_at',
  'picked_up_at', 'arrived_at', 'delivered_at', 'cancelled_at', 'created_at', 'updated_at'
];

/**
 * Runs every check and returns `[{ id, level: 'pass' | 'warn' | 'fail', title, detail }]`.
 * `db` is a Supabase client scoped to the `iam` schema; `env` is the environment;
 * `now` is the clock in ms (tests).
 */
async function checkReadiness({ db, env = process.env, geocoder = null, now = Date.now }) {
  const results = [];
  const add = (id, level, title, detail = '') => results.push({ id, level, title, detail });

  async function probe(table, columns) {
    const { error } = await db.from(table).select(columns.join(',')).limit(1);
    if (!error) return { ok: true };
    if (MISSING_TABLE.includes(error.code)) return { ok: false, kind: 'table' };
    if (MISSING_COLUMN.includes(error.code)) return { ok: false, kind: 'column', message: error.message };
    return { ok: false, kind: 'error', message: `${error.code || ''} ${error.message}`.trim() };
  }

  // ---- the delivery tables (migration 013) and the feed that carries the messages (010)
  const tables = [
    ['deliveries', DELIVERY_COLUMNS, '013_delivery_tracking.sql'],
    ['delivery_drivers', ['profile_id', 'display_name', 'phone', 'status', 'created_by'], '013_delivery_tracking.sql'],
    ['delivery_events', ['id', 'delivery_id', 'status', 'previous_status', 'actor_id', 'note', 'created_at'], '013_delivery_tracking.sql'],
    ['driver_locations', ['id', 'delivery_id', 'driver_id', 'lat', 'lng', 'speed_kmh', 'heading', 'accuracy_m', 'recorded_at'], '013_delivery_tracking.sql'],
    ['notifications', ['id', 'user_id', 'type', 'tone', 'title', 'body', 'read', 'metadata', 'created_at'], '010_notifications.sql'],
    // Rider presence: who is online. The fourth entry says what is lost without it.
    ['rider_presence', ['rider_id', 'status', 'latitude', 'longitude', 'accuracy', 'last_seen_at', 'updated_at'], '017_rider_presence.sql',
      'Dispatch cannot work without it: a delivery is only offered to a rider who is online, so accepting, assigning, auto-assigning and the rider list answer 503 until it exists. Apply it BEFORE deploying the rider presence code.']
  ];
  const present = {};
  for (const [table, columns, migration, consequence] of tables) {
    const r = await probe(table, columns);
    present[table] = r.ok;
    if (r.ok) add(`table:${table}`, 'pass', `iam.${table} exists with the columns the code uses`);
    else if (r.kind === 'table') add(`table:${table}`, 'fail', `iam.${table} does not exist`, `${consequence ? `${consequence} ` : ''}Apply ${migration}: node scripts/apply_migration.js ${migration}`);
    else if (r.kind === 'column') add(`table:${table}`, 'fail', `iam.${table} is missing a column the code uses`, `${r.message}. Re-apply ${migration}.`);
    else add(`table:${table}`, 'fail', `iam.${table} could not be read`, r.message);
  }

  // The server's own reading of RIDER_PRESENCE_TTL_SECONDS: how long a rider may be silent
  // and still count as online.
  const presenceTtlSeconds = presenceTtlMsFrom(env.RIDER_PRESENCE_TTL_SECONDS) / 1000;

  // ---- somebody has to be able to act on the circuit
  let activeRiders = false;
  if (present.delivery_drivers) {
    const { data, error } = await db.from('delivery_drivers').select('profile_id').eq('status', 'active').limit(1);
    if (error) add('riders', 'fail', 'Could not look for active riders', error.message);
    else if (data && data.length) { activeRiders = true; add('riders', 'pass', 'At least one active rider is registered'); }
    else add('riders', 'warn', 'No active rider is registered', 'Sellers will have nobody to offer a delivery to. An administrator opens Riders in the admin screen and registers one.');
  }
  // A registered rider is only offered work while ONLINE (a recent heartbeat). Riders who exist
  // but are all offline is the normal state out of hours: say so, informationally, so that
  // "sellers see no riders" is explained here and not discovered on a busy afternoon.
  if (present.rider_presence && activeRiders) {
    const cutoff = new Date(now() - presenceTtlSeconds * 1000).toISOString();
    const { data, error } = await db.from('rider_presence').select('rider_id').eq('status', 'online').gt('last_seen_at', cutoff).limit(1);
    if (error) add('presence-online', 'fail', 'Could not look for riders who are online', error.message);
    else if (data && data.length) add('presence-online', 'pass', `At least one rider is online right now (heard from within the last ${presenceTtlSeconds} seconds)`);
    else {
      add('presence-online', 'warn', 'No rider is online right now',
        `Active riders are registered, but none has sent a heartbeat in the last ${presenceTtlSeconds} seconds, so a seller cannot offer a delivery to anyone at this moment. `
        + 'This is normal outside working hours. If riders say they are online, check that their app is open (it sends a heartbeat every '
        + `${Math.round(PRESENCE_HEARTBEAT_INTERVAL_MS / 1000)} seconds). Riders carrying a delivery are busy, not counted here.`);
    }
  }
  {
    const { data, error } = await db.from('profiles').select('id').in('primary_role', ['admin', 'super_admin']).limit(1);
    if (error) add('admins', 'fail', 'Could not look for administrators', error.message);
    else if (data && data.length) add('admins', 'pass', 'At least one administrator exists to register riders and to be alerted');
    else add('admins', 'warn', 'No administrator exists', 'Nobody can register riders, and a locked handover or a suspended rider holding a parcel alerts nobody.');
  }
  {
    const { data, error } = await db.from('listings').select('id,seller_id').eq('status', 'PUBLISHED').limit(1);
    if (error) add('listings', 'fail', 'Could not look for orderable listings', error.message);
    else if (data && data.length) add('listings', 'pass', 'At least one published listing exists, so a real order can be placed');
    else add('listings', 'warn', 'No listing is published', 'Only real, published listings can be ordered: showcase products cannot, so there is nothing to deliver yet.');
  }

  // ---- the server's own configuration
  if (env.SUPABASE_JWT_SECRET) add('secret', 'pass', 'SUPABASE_JWT_SECRET is set (handover codes are derived from it)');
  else add('secret', 'fail', 'SUPABASE_JWT_SECRET is not set', 'The server will not issue a handover code without it, so no delivery can be completed.');

  const ttl = env.DELIVERY_OFFER_TTL_MINUTES;
  if (ttl === undefined || ttl === '') add('ttl', 'pass', 'Offer expiry uses the default (15 minutes)');
  else if (Number(ttl) === 0) add('ttl', 'warn', 'Offer expiry is switched off (DELIVERY_OFFER_TTL_MINUTES=0)', 'A rider who ignores an offer holds the order forever.');
  else if (!Number.isFinite(Number(ttl)) || Number(ttl) < 0) add('ttl', 'warn', `DELIVERY_OFFER_TTL_MINUTES="${ttl}" is not a usable number`, 'The default (15 minutes) applies.');
  else add('ttl', 'pass', `Offer expiry is ${Number(ttl)} minute(s)`);

  // How long a rider may be silent and still count as online. The server clamps and falls back
  // (there is no "never"), so an unusable value is not an error, but it is not what was written.
  {
    const raw = env.RIDER_PRESENCE_TTL_SECONDS;
    const text = typeof raw === 'string' ? raw.trim() : raw;
    if (text === undefined || text === null || text === '') {
      add('presence-ttl', 'pass', `Rider presence uses the default window (${PRESENCE_DEFAULT_TTL_SECONDS} seconds without a heartbeat takes a rider offline)`);
    } else {
      const seconds = Number(text);
      const shown = `RIDER_PRESENCE_TTL_SECONDS="${String(text).slice(0, 40)}"`;
      if (!Number.isFinite(seconds) || seconds <= 0) {
        add('presence-ttl', 'warn', `${shown} is not a usable number`,
          `The default (${PRESENCE_DEFAULT_TTL_SECONDS} seconds) applies. There is no way to switch expiry off: 0 does not mean "never", because a rider who stays "online" forever is offered every job and answers none.`);
      } else if (seconds < PRESENCE_MIN_TTL_SECONDS) {
        add('presence-ttl', 'warn', `${shown} is below the minimum (${PRESENCE_MIN_TTL_SECONDS} seconds)`,
          `${PRESENCE_MIN_TTL_SECONDS} seconds applies. The app sends a heartbeat every ${Math.round(PRESENCE_HEARTBEAT_INTERVAL_MS / 1000)} seconds, so a window this short would take riders offline between beats.`);
      } else if (seconds > PRESENCE_MAX_TTL_SECONDS) {
        add('presence-ttl', 'warn', `${shown} is above the maximum (${PRESENCE_MAX_TTL_SECONDS} seconds)`,
          `${PRESENCE_MAX_TTL_SECONDS} seconds (one hour) applies. A rider who closed the app would otherwise still be offered work for that long.`);
      } else {
        const beat = PRESENCE_HEARTBEAT_INTERVAL_MS / 1000;
        add('presence-ttl', 'pass', `Rider presence window is ${presenceTtlSeconds} second(s) without a heartbeat`,
          seconds < 2 * beat ? `That is under two heartbeats (${beat} seconds each): one missed beat takes a rider offline.` : '');
      }
    }
  }

  const geocoderUrl = env.DELIVERY_GEOCODER_URL;
  if (['off', 'false', '0', 'none', 'disabled'].includes(String(geocoderUrl || '').trim().toLowerCase())) {
    add('geocoder', 'warn', 'Drop-off geocoding is switched off (DELIVERY_GEOCODER_URL)', 'Deliveries will have no ETA or distance unless the seller supplies coordinates.');
  } else if (geocoderUrl) {
    add('geocoder', 'pass', 'Drop-off addresses are geocoded by your own service (DELIVERY_GEOCODER_URL)');
  } else {
    add('geocoder', 'pass', 'Drop-off addresses are geocoded by the public OpenStreetMap Nominatim service (the default)',
      'The customer\'s drop-off address is sent to it so deliveries get an ETA. Set DELIVERY_GEOCODER_URL to your own Nominatim, or to "off", if that is not acceptable.');
  }

  // Opt-in (--live): actually ask the geocoder one question from THIS network, using a
  // landmark rather than anyone's address. Off by default so the check sends nothing.
  if (geocoder) {
    let point = null;
    try { point = await geocoder.geocode('Bonanjo, Douala'); } catch (e) { point = null; }
    if (point) add('geocoder-live', 'pass', `The geocoder answered from here (Bonanjo, Douala is at ${point.lat}, ${point.lng})`);
    else add('geocoder-live', 'warn', 'The geocoder gave no answer from here', 'Deliveries will have no ETA until it does. Check that this network can reach DELIVERY_GEOCODER_URL (or the public Nominatim service), or point it at your own instance.');
  }

  const serverless = Boolean(env.NETLIFY || env.VERCEL || env.AWS_LAMBDA_FUNCTION_NAME);
  if (serverless) add('runtime', 'warn', 'This looks like a serverless runtime', 'No live stream (the apps poll instead) and no offer or presence sweep: a seller hears about a lapsed offer only when something touches it, and a rider who went silent is only tidied up when they next check in (they are never offered work meanwhile). Railway runs the full circuit.');
  else add('runtime', 'pass', 'A long-lived runtime: the live stream, the offer sweeper and the presence sweep are available');

  add('indexes', 'warn', 'Migration 014 (offer indexes) cannot be checked through the API',
    'It only speeds up two queries. Confirm with: select indexname from pg_indexes where indexname in (\'idx_deliveries_stale_offers\',\'idx_delivery_events_offer_handbacks\');');

  return results;
}

function formatReport(results) {
  const mark = { pass: 'PASS', warn: 'WARN', fail: 'FAIL' };
  const lines = results.map((r) => `${mark[r.level]}  ${r.title}${r.detail ? `\n      ${r.detail}` : ''}`);
  const fails = results.filter((r) => r.level === 'fail').length;
  const warns = results.filter((r) => r.level === 'warn').length;
  lines.push('', fails
    ? `NOT READY: ${fails} blocking problem(s), ${warns} warning(s).`
    : `READY${warns ? ` (with ${warns} warning(s) worth reading)` : ''}.`);
  return lines.join('\n');
}

async function main() {
  const path = require('path');
  require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });
  const { SupabaseDatabase } = require('../server/infrastructure/database/SupabaseClient');
  let db;
  try {
    db = SupabaseDatabase.getAdmin();
  } catch (e) {
    console.error(`Cannot reach the database: ${e.message}\nSet SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (.env.local), then run again.`);
    process.exit(2);
  }
  const live = process.argv.includes('--live');
  const geocoder = live ? require('../server/modules/delivery/infrastructure/Geocoder').createGeocoder() : null;
  const results = await checkReadiness({ db, geocoder });
  console.log(formatReport(results));
  process.exit(results.some((r) => r.level === 'fail') ? 1 : 0);
}

if (require.main === module) {
  main().catch((e) => { console.error(`Readiness check failed to run: ${e.message}`); process.exit(2); });
}

module.exports = { checkReadiness, formatReport };
