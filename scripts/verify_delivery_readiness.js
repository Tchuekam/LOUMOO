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
 *
 * It only SELECTs: it writes nothing, creates nothing and sends nothing. Exit code 1
 * means something that must be fixed before deliveries can work; warnings are
 * things that make the circuit quietly less useful (nobody to alert, no riders).
 */

'use strict';

const MISSING_TABLE = ['PGRST205', '42P01'];
const MISSING_COLUMN = ['PGRST204', '42703'];

const DELIVERY_COLUMNS = [
  'id', 'order_id', 'buyer_id', 'seller_id', 'driver_id', 'status', 'pickup', 'dropoff', 'handover_nonce',
  'code_attempts', 'eta_minutes', 'distance_km', 'last_location', 'failure_reason', 'assigned_at', 'accepted_at',
  'picked_up_at', 'arrived_at', 'delivered_at', 'cancelled_at', 'created_at', 'updated_at'
];

/**
 * Runs every check and returns `[{ id, level: 'pass' | 'warn' | 'fail', title, detail }]`.
 * `db` is a Supabase client scoped to the `iam` schema; `env` is the environment.
 */
async function checkReadiness({ db, env = process.env }) {
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
    ['notifications', ['id', 'user_id', 'type', 'tone', 'title', 'body', 'read', 'metadata', 'created_at'], '010_notifications.sql']
  ];
  const present = {};
  for (const [table, columns, migration] of tables) {
    const r = await probe(table, columns);
    present[table] = r.ok;
    if (r.ok) add(`table:${table}`, 'pass', `iam.${table} exists with the columns the code uses`);
    else if (r.kind === 'table') add(`table:${table}`, 'fail', `iam.${table} does not exist`, `Apply ${migration}: node scripts/apply_migration.js ${migration}`);
    else if (r.kind === 'column') add(`table:${table}`, 'fail', `iam.${table} is missing a column the code uses`, `${r.message}. Re-apply ${migration}.`);
    else add(`table:${table}`, 'fail', `iam.${table} could not be read`, r.message);
  }

  // ---- somebody has to be able to act on the circuit
  if (present.delivery_drivers) {
    const { data, error } = await db.from('delivery_drivers').select('profile_id').eq('status', 'active').limit(1);
    if (error) add('riders', 'fail', 'Could not look for active riders', error.message);
    else if (data && data.length) add('riders', 'pass', 'At least one active rider is registered');
    else add('riders', 'warn', 'No active rider is registered', 'Sellers will have nobody to offer a delivery to. An administrator opens Riders in the admin screen and registers one.');
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

  const geocoder = env.DELIVERY_GEOCODER_URL;
  if (['off', 'false', '0', 'none', 'disabled'].includes(String(geocoder || '').trim().toLowerCase())) {
    add('geocoder', 'warn', 'Drop-off geocoding is switched off (DELIVERY_GEOCODER_URL)', 'Deliveries will have no ETA or distance unless the seller supplies coordinates.');
  } else if (geocoder) {
    add('geocoder', 'pass', 'Drop-off addresses are geocoded by your own service (DELIVERY_GEOCODER_URL)');
  } else {
    add('geocoder', 'pass', 'Drop-off addresses are geocoded by the public OpenStreetMap Nominatim service (the default)',
      'The customer\'s drop-off address is sent to it so deliveries get an ETA. Set DELIVERY_GEOCODER_URL to your own Nominatim, or to "off", if that is not acceptable.');
  }

  const serverless = Boolean(env.NETLIFY || env.VERCEL || env.AWS_LAMBDA_FUNCTION_NAME);
  if (serverless) add('runtime', 'warn', 'This looks like a serverless runtime', 'No live stream (the apps poll instead) and no offer sweeper: a seller hears about a lapsed offer only when something touches it. Railway runs the full circuit.');
  else add('runtime', 'pass', 'A long-lived runtime: the live stream and the offer sweeper are available');

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
  const results = await checkReadiness({ db });
  console.log(formatReport(results));
  process.exit(results.some((r) => r.level === 'fail') ? 1 : 0);
}

if (require.main === module) {
  main().catch((e) => { console.error(`Readiness check failed to run: ${e.message}`); process.exit(2); });
}

module.exports = { checkReadiness, formatReport };
