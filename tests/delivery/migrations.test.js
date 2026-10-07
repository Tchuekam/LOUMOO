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

  // ---------- 11b. every order state the code writes is one the database accepts (019)
  // The escrow and cancel writes are best-effort, so a CHECK that lags the code
  // fails silently (a delivered order stayed "escrow_held" for ever). Pin them.
  {
    const { PAYMENT_STATUS, FULFILLMENT_STATUS } = require('../../server/modules/commerce/domain/Order');
    for (const status of Object.values(PAYMENT_STATUS)) {
      assert.strictEqual(await sqlstate(db, `UPDATE iam.orders SET payment_status = $1 WHERE id = 'ord_3'`, [status]), 'OK', `payment status "${status}" is accepted`);
    }
    for (const status of Object.values(FULFILLMENT_STATUS)) {
      assert.strictEqual(await sqlstate(db, `UPDATE iam.orders SET fulfillment_status = $1 WHERE id = 'ord_3'`, [status]), 'OK', `fulfillment status "${status}" is accepted`);
    }
    assert.strictEqual(await sqlstate(db, `UPDATE iam.orders SET payment_status = 'lost' WHERE id = 'ord_3'`), '23514', 'an unknown payment status is refused');
    await db.query(`UPDATE iam.orders SET payment_status = 'pending', fulfillment_status = 'processing' WHERE id = 'ord_3'`);
  }

  // ---------------------------------------------- 12. rider presence (migration 017)
  // A rider in delivery_drivers EXISTS; iam.rider_presence says whether they are HERE: one
  // overwritten row per rider, kept apart from the GPS trail of a delivery. The rows this
  // block makes belong to riders of its own, and it removes them at the end.
  {
    const PRESENCE_FILE = '017_rider_presence.sql';
    assert.ok(files.includes(PRESENCE_FILE), 'the rider presence migration is in the set that was applied');

    /** The SQLSTATE and the name of the constraint a statement tripped, so a test can say WHICH rule refused. */
    const refusal = async (sql, params) => {
      try {
        await db.query(sql, params);
        return { code: 'OK', constraint: null };
      } catch (e) {
        return { code: e.code || e.message, constraint: e.constraint || null };
      }
    };
    const presenceRow = async (id) => (await db.query(`SELECT * FROM iam.rider_presence WHERE rider_id = $1`, [id])).rows[0];
    const presenceCount = async () => (await db.query(`SELECT count(*)::int n FROM iam.rider_presence`)).rows[0].n;
    const gpsPoints = async () => (await db.query(`SELECT count(*)::int n FROM iam.driver_locations`)).rows[0].n;

    for (const id of ['pres_a', 'pres_b', 'pres_c']) {
      await db.query('INSERT INTO iam.profiles (id, clerk_user_id) VALUES ($1, $2)', [id, `clerk_${id}`]);
    }
    // pres_c has an account but is NOT a registered rider.
    for (const id of ['pres_a', 'pres_b']) {
      await db.query(`INSERT INTO iam.delivery_drivers (profile_id, display_name, phone) VALUES ($1, $1, '+237600000009')`, [id]);
    }
    assert.strictEqual(await presenceCount(), 0, 'registering a rider creates no presence row: a rider who never went online is simply offline');
    const gpsBefore = await gpsPoints();

    // ----- the columns
    const cols = (await db.query(`SELECT column_name, data_type, is_nullable, column_default, character_maximum_length FROM information_schema.columns
      WHERE table_schema = 'iam' AND table_name = 'rider_presence'`)).rows;
    const riderIdWidth = (await db.query(`SELECT character_maximum_length AS n FROM information_schema.columns
      WHERE table_schema = 'iam' AND table_name = 'delivery_drivers' AND column_name = 'profile_id'`)).rows[0].n;
    const col = (name) => cols.find((c) => c.column_name === name);
    for (const [name, type] of Object.entries({
      rider_id: 'character varying', status: 'character varying', latitude: 'double precision', longitude: 'double precision',
      accuracy: 'double precision', last_seen_at: 'timestamp with time zone', updated_at: 'timestamp with time zone'
    })) {
      assert.ok(col(name), `rider_presence.${name} exists`);
      assert.strictEqual(col(name).data_type, type, `rider_presence.${name} is ${type}`);
    }
    assert.strictEqual(col('rider_id').character_maximum_length, riderIdWidth, `rider_id is exactly as wide as the rider's profile id (${riderIdWidth}), so every rider can have a row`);
    for (const name of ['rider_id', 'status', 'updated_at']) assert.strictEqual(col(name).is_nullable, 'NO', `${name} is required`);
    for (const name of ['latitude', 'longitude', 'accuracy', 'last_seen_at']) assert.strictEqual(col(name).is_nullable, 'YES', `${name} is optional: a rider who shares no position, or never beat, has none`);
    assert.ok(!col('delivery_id') && !col('driver_id'), 'the live availability row is not tied to any delivery: it is not the GPS trail');
    assert.strictEqual(
      (await db.query(`SELECT count(*)::int n FROM pg_constraint WHERE conrelid = 'iam.rider_presence'::regclass AND contype = 'f'`)).rows[0].n, 1,
      'and has exactly one foreign key (to the rider), none to a delivery'
    );

    // A row with nothing but a rider id is a rider who is offline and has not been heard from.
    await db.query(`INSERT INTO iam.rider_presence (rider_id) VALUES ('pres_a')`);
    const fresh = await presenceRow('pres_a');
    assert.strictEqual(fresh.status, 'offline', 'the default status is offline: nobody becomes available by accident');
    assert.strictEqual(fresh.last_seen_at, null, 'and has never been heard from');
    assert.strictEqual(fresh.latitude, null);
    assert.ok(Math.abs(Date.now() - new Date(fresh.updated_at).getTime()) < 60 * 1000, 'updated_at is stamped by the database when the row is made');

    // ----- one row per rider
    assert.strictEqual((await refusal(`INSERT INTO iam.rider_presence (rider_id) VALUES ('pres_a')`)).code, '23505', 'a rider has one presence row, not a history');
    const upserted = await refusal(`INSERT INTO iam.rider_presence (rider_id, status) VALUES ('pres_a', 'online') ON CONFLICT (rider_id) DO NOTHING`);
    assert.strictEqual(upserted.code, 'OK', 'ensurePresence (insert ... on conflict do nothing) is accepted');
    assert.strictEqual((await presenceRow('pres_a')).status, 'offline', 'and leaves the existing row exactly as it was');

    // ----- the status rule: offline | online | busy | paused, and nothing else (suspended is derived, never stored)
    for (const status of ['online', 'busy', 'paused', 'offline']) {
      assert.strictEqual((await refusal(`UPDATE iam.rider_presence SET status = $1 WHERE rider_id = 'pres_a'`, [status])).code, 'OK', `"${status}" is a stored status`);
      assert.strictEqual((await presenceRow('pres_a')).status, status, `and it reads back as ${status}`);
    }
    for (const status of ['suspended', 'bogus', 'Online', 'ONLINE', 'available', '']) {
      const r = await refusal(`UPDATE iam.rider_presence SET status = $1 WHERE rider_id = 'pres_a'`, [status]);
      assert.strictEqual(r.code, '23514', `"${status}" is refused by the status check`);
      assert.ok(/status/.test(r.constraint), `"${status}" was refused by the STATUS rule, not some other (${r.constraint})`);
    }
    assert.strictEqual((await presenceRow('pres_a')).status, 'offline', 'the refused statuses changed nothing');
    assert.strictEqual((await refusal(`UPDATE iam.rider_presence SET status = NULL WHERE rider_id = 'pres_a'`)).code, '23502', 'a row cannot have no status');
    assert.strictEqual((await refusal(`INSERT INTO iam.rider_presence (rider_id, status) VALUES ('pres_b', 'suspended')`)).code, '23514', 'a suspended row cannot be inserted either');

    // ----- a position is a pair, on the globe, with a non-negative accuracy
    const place = (lat, lng, acc = null) => refusal(`UPDATE iam.rider_presence SET latitude = $1, longitude = $2, accuracy = $3 WHERE rider_id = 'pres_a'`, [lat, lng, acc]);
    for (const [lat, lng, what] of [[4.05, null, 'a latitude without a longitude'], [null, 9.76, 'a longitude without a latitude']]) {
      const r = await place(lat, lng);
      assert.strictEqual(r.code, '23514', `${what} is refused`);
      assert.ok(/position_pair/.test(r.constraint), `${what} is refused by the position-pair rule (${r.constraint})`);
    }
    assert.strictEqual((await place(null, null)).code, 'OK', 'no position at all (both null) is accepted');
    assert.strictEqual((await place(4.051123456789, 9.767912345678, 12.5)).code, 'OK', 'both together are accepted');
    const placed = await presenceRow('pres_a');
    assert.deepStrictEqual([placed.latitude, placed.longitude, placed.accuracy], [4.051123456789, 9.767912345678, 12.5],
      'coordinates keep their full precision (double precision, not float4)');
    assert.strictEqual((await refusal(`UPDATE iam.rider_presence SET latitude = NULL WHERE rider_id = 'pres_a'`)).code, '23514', 'a position cannot be half cleared');
    assert.strictEqual((await refusal(`UPDATE iam.rider_presence SET latitude = NULL, longitude = NULL, accuracy = NULL WHERE rider_id = 'pres_a'`)).code, 'OK', 'clearing all three is how a rider goes offline without a trace');
    for (const [lat, lng, rule, what] of [
      [91, 9.7, /latitude/, 'latitude 91'], [-91, 9.7, /latitude/, 'latitude -91'],
      [4.05, 181, /longitude/, 'longitude 181'], [4.05, -181, /longitude/, 'longitude -181']
    ]) {
      const r = await place(lat, lng);
      assert.strictEqual(r.code, '23514', `${what} is off the globe and refused`);
      assert.ok(rule.test(r.constraint), `${what} was refused by its own range rule (${r.constraint})`);
    }
    for (const [lat, lng] of [[90, 180], [-90, -180], [0, 0]]) {
      assert.strictEqual((await place(lat, lng)).code, 'OK', `the edge of the globe (${lat}, ${lng}) is accepted`);
    }
    const noAccuracy = await place(4.05, 9.76, -1);
    assert.strictEqual(noAccuracy.code, '23514', 'a negative accuracy is refused');
    assert.ok(/accuracy/.test(noAccuracy.constraint), `by the accuracy rule (${noAccuracy.constraint})`);
    for (const acc of [0, 8, null]) assert.strictEqual((await place(4.05, 9.76, acc)).code, 'OK', `accuracy ${acc} is accepted`);
    assert.strictEqual((await refusal(`UPDATE iam.rider_presence SET last_seen_at = '2026-10-03T10:00:00Z' WHERE rider_id = 'pres_a'`)).code, 'OK', 'last_seen_at takes a timestamp');

    // ----- only a registered rider can have presence
    for (const [id, what] of [['pres_c', 'an account that is not a rider'], ['nobody', 'an id with no account at all']]) {
      const r = await refusal(`INSERT INTO iam.rider_presence (rider_id) VALUES ($1)`, [id]);
      assert.strictEqual(r.code, '23503', `${what} cannot have a presence row (foreign key to delivery_drivers)`);
      assert.ok(/rider_id/.test(r.constraint), `${what}: refused by the rider foreign key (${r.constraint})`);
    }
    assert.strictEqual(await presenceCount(), 1, 'the refused inserts left no rows behind');
    const fk = (await db.query(`SELECT confrelid::regclass::text AS target, confdeltype FROM pg_constraint
      WHERE conrelid = 'iam.rider_presence'::regclass AND contype = 'f'`)).rows[0];
    assert.ok(/delivery_drivers$/.test(fk.target), `the foreign key points at delivery_drivers (${fk.target})`);
    assert.strictEqual(fk.confdeltype, 'c', 'and cascades on delete');

    // ----- the presence of a rider that goes away goes with them
    await db.query(`INSERT INTO iam.rider_presence (rider_id, status) VALUES ('pres_b', 'online')`);
    assert.strictEqual(await presenceCount(), 2);
    await db.query(`DELETE FROM iam.delivery_drivers WHERE profile_id = 'pres_b'`);
    assert.strictEqual(await presenceRow('pres_b'), undefined, 'removing the rider record removes their presence row');
    assert.ok(await presenceRow('pres_a'), 'and only theirs');
    // The whole chain: the account, then the rider record, then the presence row.
    await db.query(`INSERT INTO iam.profiles (id, clerk_user_id) VALUES ('pres_d', 'clerk_pres_d')`);
    await db.query(`INSERT INTO iam.delivery_drivers (profile_id, display_name, phone) VALUES ('pres_d', 'D', '+237600000010')`);
    await db.query(`INSERT INTO iam.rider_presence (rider_id, status) VALUES ('pres_d', 'busy')`);
    await db.query(`DELETE FROM iam.profiles WHERE id = 'pres_d'`);
    assert.strictEqual(await presenceRow('pres_d'), undefined, 'deleting the account takes the rider record and the presence row with it, and never blocks');

    // ----- presence is not GPS history
    assert.strictEqual(await gpsPoints(), gpsBefore, 'none of the presence writes touched iam.driver_locations (the delivery GPS trail)');

    // ----- row-level security: the server only, like the other delivery tables
    const rlsRow = (await db.query(`SELECT relrowsecurity FROM pg_class WHERE oid = 'iam.rider_presence'::regclass`)).rows[0];
    assert.strictEqual(rlsRow.relrowsecurity, true, 'row-level security is on for rider_presence');
    const presencePolicies = (await db.query(`SELECT policyname, roles, cmd, qual, with_check FROM pg_policies WHERE schemaname = 'iam' AND tablename = 'rider_presence'`)).rows;
    assert.strictEqual(presencePolicies.length, 1, `exactly one policy exists on rider_presence (${presencePolicies.map((p) => p.policyname).join(', ')})`);
    assert.ok(String(presencePolicies[0].roles).includes('service_role') && !/anon|authenticated|public/.test(String(presencePolicies[0].roles)),
      `only the server (service role) may read or write presence; the policy "${presencePolicies[0].policyname}" must not open it to browsers`);
    assert.strictEqual(presencePolicies[0].cmd, 'ALL', 'and the server may do everything (it is the only writer)');
    assert.deepStrictEqual([presencePolicies[0].qual, presencePolicies[0].with_check], ['true', 'true'], 'on every row, for reads and for writes (the role is the restriction, not a row filter)');
    const may = async (role, privilege) => (await db.query(`SELECT has_table_privilege($1, 'iam.rider_presence', $2) AS ok`, [role, privilege])).rows[0].ok;
    for (const privilege of ['SELECT', 'INSERT', 'UPDATE', 'DELETE']) {
      assert.strictEqual(await may('service_role', privilege), true, `service_role holds ${privilege} (a policy is not a grant)`);
      assert.strictEqual(await may('anon', privilege), false, `anon holds no ${privilege}`);
      assert.strictEqual(await may('authenticated', privilege), false, `authenticated holds no ${privilege}`);
    }
    // And the policy, not only the grants, is what keeps a browser out: give the browser roles
    // every privilege a misconfigured project could hand them, and RLS must still hide the rows.
    // (Schema access is granted only for this check and taken back right after.)
    const visibleToServer = await presenceCount();
    assert.strictEqual(visibleToServer, 1, 'pres_a\'s row is there to be hidden');
    await db.exec(`GRANT USAGE ON SCHEMA iam TO anon, authenticated, service_role;
      GRANT SELECT, INSERT, UPDATE, DELETE ON iam.rider_presence TO anon, authenticated;`);
    try {
      for (const role of ['anon', 'authenticated']) {
        await db.exec(`SET ROLE ${role}`);
        try {
          assert.strictEqual((await db.query(`SELECT * FROM iam.rider_presence`)).rows.length, 0, `${role} sees no presence rows even holding SELECT`);
          const changed = await db.query(`UPDATE iam.rider_presence SET status = 'online' WHERE rider_id = 'pres_a'`);
          assert.strictEqual(changed.affectedRows, 0, `${role} cannot move a rider's presence even holding UPDATE`);
          assert.strictEqual((await db.query(`DELETE FROM iam.rider_presence WHERE rider_id = 'pres_a'`)).affectedRows, 0, `${role} cannot delete a presence row`);
          let denied = null;
          // pres_a already has a row, so a plain insert would be a 23505 if row-level security let it through: 42501 is the policy refusing it.
          try { await db.query(`INSERT INTO iam.rider_presence (rider_id, status) VALUES ('pres_a', 'online')`); } catch (e) { denied = e.code; }
          assert.strictEqual(denied, '42501', `${role} cannot insert a presence row: row-level security refuses it`);
        } finally {
          await db.exec('RESET ROLE');
        }
      }
      await db.exec('SET ROLE service_role');
      try {
        assert.strictEqual((await db.query(`SELECT * FROM iam.rider_presence`)).rows.length, visibleToServer, 'while the server (service role) sees every row');
      } finally {
        await db.exec('RESET ROLE');
      }
    } finally {
      await db.exec(`REVOKE SELECT, INSERT, UPDATE, DELETE ON iam.rider_presence FROM anon, authenticated;
        REVOKE USAGE ON SCHEMA iam FROM anon, authenticated, service_role;`);
    }
    assert.strictEqual((await presenceRow('pres_a')).status, 'offline', 'nothing a browser role tried moved the row');

    // ----- the partial index serves the two scans the server makes
    const presenceIndexes = (await db.query(`SELECT indexname, indexdef FROM pg_indexes WHERE schemaname = 'iam' AND tablename = 'rider_presence'`)).rows;
    const online = presenceIndexes.find((i) => i.indexname === 'idx_rider_presence_online_seen');
    assert.ok(online, 'index idx_rider_presence_online_seen exists');
    assert.ok(/\(last_seen_at\)/.test(online.indexdef), `it is on last_seen_at (${online.indexdef})`);
    assert.ok(/WHERE .*status.*'online'/.test(online.indexdef), `and covers only online riders, so it stays small (${online.indexdef})`);
    await db.exec('SET enable_seqscan = off');
    try {
      for (const [what, sql] of [
        ['"who is online and fresh" (ranking riders for an offer)',
          `SELECT * FROM iam.rider_presence WHERE status = 'online' AND last_seen_at > NOW() - interval '2 minutes'`],
        ['"who is online and stale" (the sweeper)',
          `SELECT * FROM iam.rider_presence WHERE status = 'online' AND last_seen_at <= NOW() - interval '2 minutes' ORDER BY last_seen_at ASC LIMIT 50`]
      ]) {
        const plan = (await db.query(`EXPLAIN ${sql}`)).rows.map((r) => r['QUERY PLAN']).join('\n');
        assert.ok(/idx_rider_presence_online_seen/.test(plan), `${what} uses the partial index:\n${plan}`);
      }
    } finally {
      await db.exec('SET enable_seqscan = on');
    }
    // The index serves reads and nothing else: heartbeats are timestamps, so two online riders heard from at
    // the same instant is routine and must never be refused.
    await db.query(`INSERT INTO iam.profiles (id, clerk_user_id) VALUES ('pres_e', 'clerk_pres_e')`);
    await db.query(`INSERT INTO iam.delivery_drivers (profile_id, display_name, phone) VALUES ('pres_e', 'E', '+237600000011')`);
    const sameInstant = '2026-10-03T10:00:00.000Z';
    assert.strictEqual((await refusal(`UPDATE iam.rider_presence SET status = 'online', last_seen_at = $1 WHERE rider_id = 'pres_a'`, [sameInstant])).code, 'OK');
    assert.strictEqual((await refusal(`INSERT INTO iam.rider_presence (rider_id, status, last_seen_at) VALUES ('pres_e', 'online', $1)`, [sameInstant])).code, 'OK',
      'two online riders heard from at the same instant are both accepted (the index is not unique)');
    await db.query(`UPDATE iam.rider_presence SET status = 'offline' WHERE rider_id = 'pres_a'`);
    await db.query(`DELETE FROM iam.profiles WHERE id = 'pres_e'`);
    assert.strictEqual(await presenceCount(), 1, 'the second rider and their row were removed again');

    // ----- re-running the migration on a table that holds data changes nothing
    // (apply_migration.js --all re-applies every file on every run; the whole set was applied twice above,
    // on an empty table, so this is the case that matters in production).
    const before = (await db.query(`SELECT * FROM iam.rider_presence ORDER BY rider_id`)).rows;
    // It also asks PostgREST to reload its schema cache: without that the API answers "table not found" for the
    // new table until somebody does it by hand, and the readiness probe would report migration 017 as missing.
    const reloads = [];
    const stopListening = await db.listen('pgrst', (payload) => reloads.push(payload));
    try {
      await db.exec(fs.readFileSync(path.join(MIGRATIONS, PRESENCE_FILE), 'utf8'));
      await new Promise((resolve) => setTimeout(resolve, 25)); // the notification is delivered after the commit
    } finally {
      await stopListening();
    }
    assert.deepStrictEqual(reloads, ['reload schema'], 'applying 017 notifies pgrst to reload its schema cache, once');
    assert.deepStrictEqual((await db.query(`SELECT * FROM iam.rider_presence ORDER BY rider_id`)).rows, before, 're-applying 017 keeps every row exactly as it was');
    assert.strictEqual((await db.query(`SELECT count(*)::int n FROM pg_policies WHERE schemaname = 'iam' AND tablename = 'rider_presence'`)).rows[0].n, 1, 'and does not stack a second policy');
    assert.strictEqual((await db.query(`SELECT count(*)::int n FROM pg_indexes WHERE schemaname = 'iam' AND tablename = 'rider_presence'`)).rows[0].n, 2, 'or a second index (the key and the partial one)');
    assert.strictEqual((await db.query(`SELECT relrowsecurity FROM pg_class WHERE oid = 'iam.rider_presence'::regclass`)).rows[0].relrowsecurity, true, 'and row-level security stays on');

    // Leave the seed as it was.
    await db.query(`DELETE FROM iam.profiles WHERE id IN ('pres_a', 'pres_b', 'pres_c')`);
    assert.strictEqual(await presenceCount(), 0, 'the presence rows went with their riders');
    console.log('    ✓ Rider presence (017): columns, status, position and foreign-key rules, cascade, RLS, the partial index and re-running it, all hold on a real engine.');
  }

  console.log(`    ✓ Delivery migrations: ${files.length} files apply in order and again, and the database enforces what the delivery code relies on.`);
}

module.exports = { run };
