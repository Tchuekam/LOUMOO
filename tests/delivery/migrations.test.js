/**
 * The delivery migrations, on a real Postgres engine.
 * ---------------------------------------------------------------------------
 * Everything else in the delivery suites runs against in-memory stand-ins. This
 * applies the REAL migration files, in the order scripts/apply_migration.js uses,
 * to an in-memory PostgreSQL (PGlite) and then checks the database rules the
 * delivery code depends on: the one-open-delivery-per-order index, the status and
 * range checks, what a deleted account does to its deliveries, the retention
 * function, row-level security, and that a row exactly as NotificationService writes
 * it is accepted.
 *
 * It also applies the whole set a SECOND time, because `apply_migration.js --all`
 * re-applies every file on every run and stops at the first failure: a migration
 * that is not re-runnable would keep every later one (delivery included) from ever
 * reaching an already-migrated database.
 *
 * It cannot say anything about a particular deployment (is migration 013 applied
 * THERE?): `npm run delivery:readiness` answers that, read-only, with the project's
 * own credentials. PGlite is a devDependency; without it the suite skips locally and
 * fails in CI.
 */

require('../setup');
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const MIGRATIONS = path.resolve(__dirname, '../../server/infrastructure/database/migrations');

function loadPglite() {
  try {
    return {
      PGlite: require('@electric-sql/pglite').PGlite,
      extensions: {
        pg_trgm: require('@electric-sql/pglite/contrib/pg_trgm').pg_trgm,
        uuid_ossp: require('@electric-sql/pglite/contrib/uuid_ossp').uuid_ossp,
        pgcrypto: require('@electric-sql/pglite/contrib/pgcrypto').pgcrypto
      }
    };
  } catch (e) {
    return null;
  }
}

/** The error a statement raises, as its SQLSTATE code, or 'OK'. */
async function sqlstate(db, sql, params) {
  try {
    await db.query(sql, params);
    return 'OK';
  } catch (e) {
    return e.code || e.message;
  }
}

async function applyAll(db) {
  const files = fs.readdirSync(MIGRATIONS).filter((f) => /^\d+_.*\.sql$/.test(f)).sort();
  for (const f of files) {
    try {
      await db.exec(fs.readFileSync(path.join(MIGRATIONS, f), 'utf8'));
    } catch (e) {
      try { await db.exec('ROLLBACK'); } catch (_) { /* nothing open */ }
      throw new Error(`${f} failed: ${String(e.message).split('\n')[0]}`);
    }
  }
  return files;
}

async function run() {
  const lib = loadPglite();
  if (!lib) {
    if (process.env.CI) throw new Error('@electric-sql/pglite is not installed: the migrations cannot be checked (run npm ci).');
    console.log('    - delivery migrations: SKIPPED (@electric-sql/pglite is not installed; run npm install)');
    return;
  }

  const db = new lib.PGlite({ extensions: lib.extensions });
  // What Supabase provides before any of our SQL runs.
  await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
    CREATE SCHEMA IF NOT EXISTS auth;
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS 'SELECT NULL::uuid';
    CREATE FUNCTION auth.role() RETURNS text LANGUAGE sql AS 'SELECT ''service_role''::text';
    CREATE SCHEMA IF NOT EXISTS extensions;`);

  // ---------------------------------------------------------- 1. apply, then re-apply
  const files = await applyAll(db);
  assert.ok(files.includes('013_delivery_tracking.sql') && files.includes('014_delivery_offer_indexes.sql'), 'the delivery migrations are in the set');
  assert.ok(files.includes('010_notifications.sql'), 'and so is the notifications feed they write to');
  await applyAll(db); // throws on the first migration that is not re-runnable

  // ------------------------------------------------------------------------ 2. seed
  for (const id of ['buyer_1', 'seller_1', 'rider_1', 'rider_2', 'admin_1']) {
    await db.query('INSERT INTO iam.profiles (id, clerk_user_id) VALUES ($1, $2)', [id, `clerk_${id}`]);
  }
  for (const id of ['ord_1', 'ord_2', 'ord_3']) {
    await db.query(
      `INSERT INTO iam.orders (id, buyer_id, seller_id, order_number, total_amount_xaf, shipping_address)
       VALUES ($1, 'buyer_1', 'seller_1', $2, 57500, '{"_deliveryMethod":"HOME_DELIVERY","city":"Douala"}'::jsonb)`,
      [id, `KM-${id}`]
    );
  }
  await db.query(`INSERT INTO iam.delivery_drivers (profile_id, display_name, phone) VALUES ('rider_1', 'Alain', '+237600000001')`);
  const newDelivery = (id, orderId, status = 'pending_assignment', extra = '') =>
    db.query(`INSERT INTO iam.deliveries (id, order_id, buyer_id, seller_id, status${extra ? ', ' + extra.split('=')[0] : ''}) VALUES ($1, $2, 'buyer_1', 'seller_1', $3${extra ? ', ' + extra.split('=')[1] : ''})`, [id, orderId, status]);

  // ---------------------------------------- 3. one open delivery per order, at the database
  await newDelivery('dlv_a', 'ord_1');
  assert.strictEqual(await sqlstate(db, `INSERT INTO iam.deliveries (id, order_id, buyer_id, seller_id) VALUES ('dlv_b', 'ord_1', 'buyer_1', 'seller_1')`), '23505',
    'a second OPEN delivery for the same order is refused by the database (two tabs racing cannot both win)');
  await db.query(`UPDATE iam.deliveries SET status = 'cancelled' WHERE id = 'dlv_a'`);
  assert.strictEqual(await sqlstate(db, `INSERT INTO iam.deliveries (id, order_id, buyer_id, seller_id) VALUES ('dlv_b', 'ord_1', 'buyer_1', 'seller_1')`), 'OK',
    'once the first is cancelled, the seller can arrange another');
  assert.strictEqual(await sqlstate(db, `INSERT INTO iam.deliveries (id, order_id, buyer_id, seller_id) VALUES ('dlv_c', 'ord_2', 'buyer_1', 'seller_1')`), 'OK', 'a different order is unaffected');

  // ------------------------------------------------------------ 4. value rules
  assert.strictEqual(await sqlstate(db, `INSERT INTO iam.deliveries (id, order_id, buyer_id, status) VALUES ('dlv_x', 'ord_3', 'buyer_1', 'on_a_boat')`), '23514', 'an unknown status is refused');
  assert.strictEqual(await sqlstate(db, `UPDATE iam.deliveries SET code_attempts = -1 WHERE id = 'dlv_b'`), '23514', 'a negative guess count is refused');
  assert.strictEqual(await sqlstate(db, `UPDATE iam.deliveries SET eta_minutes = -3 WHERE id = 'dlv_b'`), '23514', 'a negative ETA is refused');
  assert.strictEqual(await sqlstate(db, `INSERT INTO iam.deliveries (id, order_id, buyer_id, driver_id) VALUES ('dlv_y', 'ord_3', 'buyer_1', 'rider_2')`), '23503',
    'a delivery can only be held by a registered rider (rider_2 is not one)');
  assert.strictEqual(await sqlstate(db, `INSERT INTO iam.delivery_drivers (profile_id, display_name, phone, status) VALUES ('rider_2', 'B', '+237600000002', 'banned')`), '23514', 'a rider is active or suspended');
  assert.strictEqual(await sqlstate(db, `INSERT INTO iam.driver_locations (delivery_id, driver_id, lat, lng) VALUES ('dlv_b', 'rider_1', 91, 9)`), '23514', 'a latitude off the globe is refused');
  assert.strictEqual(await sqlstate(db, `INSERT INTO iam.driver_locations (delivery_id, driver_id, lat, lng, heading) VALUES ('dlv_b', 'rider_1', 4.05, 9.7, 360)`), '23514', 'a heading of 360 is refused');
  assert.strictEqual(await sqlstate(db, `INSERT INTO iam.driver_locations (delivery_id, driver_id, lat, lng, heading, speed_kmh) VALUES ('dlv_b', 'rider_1', 4.05, 9.7, 359.99999, 24)`), 'OK', 'but 359.99999 is accepted (double precision, not float4)');

  // ----------------------------------------- 5. what deleting an account does
  await db.query(`UPDATE iam.deliveries SET driver_id = 'rider_1', status = 'assigned' WHERE id = 'dlv_c'`);
  // 23001 is a RESTRICT foreign key refusing the delete (23503 is a missing parent on insert).
  assert.ok(['23001', '23503'].includes(await sqlstate(db, `DELETE FROM iam.profiles WHERE id = 'buyer_1'`)),
    'a buyer with deliveries cannot be hard-deleted (accounts are anonymised in place)');
  await db.query(`DELETE FROM iam.profiles WHERE id = 'rider_1'`);
  const held = (await db.query(`SELECT driver_id, status FROM iam.deliveries WHERE id = 'dlv_c'`)).rows[0];
  assert.strictEqual(held.driver_id, null, 'deleting a rider never blocks: their delivery just loses its rider');
  assert.strictEqual((await db.query(`SELECT count(*)::int n FROM iam.delivery_drivers WHERE profile_id = 'rider_1'`)).rows[0].n, 0, 'and their rider record goes with them');
  await db.query(`INSERT INTO iam.profiles (id, clerk_user_id) VALUES ('rider_1', 'clerk_rider_1b')`);
  await db.query(`INSERT INTO iam.delivery_drivers (profile_id, display_name, phone) VALUES ('rider_1', 'Alain', '+237600000001')`);

  // --------------------------------------- 6. timeline and GPS history follow the delivery
  await db.query(`INSERT INTO iam.delivery_events (delivery_id, status, previous_status, actor_id, note) VALUES ('dlv_c', 'pending_assignment', 'assigned', 'rider_1', 'Rider declined')`);
  await db.query(`DELETE FROM iam.deliveries WHERE id = 'dlv_c'`);
  assert.strictEqual((await db.query(`SELECT count(*)::int n FROM iam.delivery_events WHERE delivery_id = 'dlv_c'`)).rows[0].n, 0, 'deleting a delivery takes its timeline with it');

  // ----------------------------------------------------- 7. GPS retention function
  await db.query(`INSERT INTO iam.deliveries (id, order_id, buyer_id, seller_id, status) VALUES ('dlv_done', 'ord_3', 'buyer_1', 'seller_1', 'delivered')`);
  await db.query(`INSERT INTO iam.driver_locations (delivery_id, driver_id, lat, lng, recorded_at) VALUES
    ('dlv_done', 'rider_1', 4.0, 9.7, NOW() - interval '40 days'), ('dlv_done', 'rider_1', 4.0, 9.7, NOW() - interval '1 day'),
    ('dlv_b', 'rider_1', 4.0, 9.7, NOW() - interval '40 days')`);
  const removed = (await db.query(`SELECT iam.prune_driver_locations(30) AS n`)).rows[0].n;
  assert.strictEqual(Number(removed), 1, 'only the old points of a FINISHED delivery are pruned');
  assert.strictEqual((await db.query(`SELECT count(*)::int n FROM iam.driver_locations WHERE delivery_id = 'dlv_b' AND recorded_at < NOW() - interval '30 days'`)).rows[0].n, 1, 'an open delivery keeps its whole trail');
  assert.strictEqual(await sqlstate(db, `SELECT iam.prune_driver_locations(0)`), 'P0001', 'a retention of zero days is refused');

  // ----------------------------------------------------- 8. row-level security
  const rls = (await db.query(`SELECT relname, relrowsecurity FROM pg_class WHERE relnamespace = 'iam'::regnamespace
    AND relname IN ('deliveries', 'delivery_drivers', 'delivery_events', 'driver_locations', 'notifications') ORDER BY relname`)).rows;
  assert.strictEqual(rls.length, 5);
  assert.ok(rls.every((r) => r.relrowsecurity), 'row-level security is on for every delivery table and the feed');
  const policies = (await db.query(`SELECT tablename, policyname, roles FROM pg_policies WHERE schemaname = 'iam'
    AND tablename IN ('deliveries', 'delivery_drivers', 'delivery_events', 'driver_locations')`)).rows;
  assert.ok(policies.length >= 4, 'each delivery table has its policy');
  for (const p of policies) {
    assert.ok(String(p.roles).includes('service_role') && !/anon|authenticated|public/.test(String(p.roles)),
      `${p.tablename}: only the server (service role) may read or write it; the policy "${p.policyname}" must not open it to browsers`);
  }

  // ------------------------------------------------ 9. the indexes the queries lean on
  const indexes = (await db.query(`SELECT indexname FROM pg_indexes WHERE schemaname = 'iam'`)).rows.map((r) => r.indexname);
  for (const name of ['uq_deliveries_one_open_per_order', 'idx_deliveries_stale_offers', 'idx_delivery_events_offer_handbacks', 'idx_deliveries_driver_open', 'idx_notifications_user', 'idx_orders_open_by_created']) {
    assert.ok(indexes.includes(name), `index ${name} exists`);
  }
  // The reminder job's query is the one that index is for: the planner can use it
  // (a tiny table prefers a scan, so the planner is told scans are expensive).
  await db.exec('SET enable_seqscan = off');
  const plan = (await db.query(`EXPLAIN SELECT * FROM iam.orders WHERE fulfillment_status IN ('processing') ORDER BY created_at DESC LIMIT 200`)).rows.map((r) => r['QUERY PLAN']).join('\n');
  await db.exec('SET enable_seqscan = on');
  assert.ok(/idx_orders_open_by_created/.test(plan), `the open-orders query uses the partial index:\n${plan}`);

  // --------------------------------- 10. a notification exactly as the service writes it
  const row = { user_id: 'seller_1', type: 'delivery', tone: 'neutral', title: 'A delivery is locked and needs you', body: 'Unlock it, or mark it failed.', read: false,
    metadata: { audience: 'admin', action: 'open_dispatch', deliveryId: 'dlv_b', orderId: 'ord_1' } };
  assert.strictEqual(await sqlstate(db, `INSERT INTO iam.notifications (user_id, type, tone, title, body, read, metadata) VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb)`,
    [row.user_id, row.type, row.tone, row.title, row.body, row.read, JSON.stringify(row.metadata)]), 'OK', 'a delivery notification with its routing metadata is stored');
  for (const tone of ['accent', 'success', 'sale', 'neutral']) {
    assert.strictEqual(await sqlstate(db, `INSERT INTO iam.notifications (user_id, tone, title) VALUES ('seller_1', $1, 't')`, [tone]), 'OK', `tone "${tone}" (used by the order and delivery code) is accepted`);
  }
  assert.strictEqual(await sqlstate(db, `INSERT INTO iam.notifications (user_id, tone, title) VALUES ('seller_1', 'shouty', 't')`), '23514', 'an unknown tone is refused (the service falls back to memory on any insert error, so this must stay in step with the code)');
  const stored = (await db.query(`SELECT metadata FROM iam.notifications WHERE title = 'A delivery is locked and needs you'`)).rows[0].metadata;
  assert.strictEqual(stored.action, 'open_dispatch', 'and the metadata the client routes on survives the round trip');

  // ---------- 11. what the order service stores in the order row survives a round trip
  const order = (await db.query(`SELECT shipping_address->>'_deliveryMethod' AS m FROM iam.orders WHERE id = 'ord_1'`)).rows[0];
  assert.strictEqual(order.m, 'HOME_DELIVERY', 'the delivery method rides in the order row, which is where OrderRepository reads it back from');

  console.log(`    ✓ Delivery migrations: ${files.length} files apply in order and again, and the database enforces what the delivery code relies on.`);
}

module.exports = { run };
