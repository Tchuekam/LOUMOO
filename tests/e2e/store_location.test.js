/**
 * A seller's store-location edit is actually stored.
 * ---------------------------------------------------------------------------
 * `PATCH /stores/:id/location` upserted into `iam.store_locations` without
 * `street_address` (NOT NULL, no default) and never looked at the `{ error }`
 * supabase-js returns, so the database refused every edit that did not resend the
 * street (23502) while the endpoint answered 200 with the values it had been sent.
 * The location a rider is told to collect from, and the city the store is listed
 * under, therefore never changed. This runs the real use case, through the real
 * supabase-js client, against the real schema on the local Postgres.
 */
'use strict';

require('../setup');
const assert = require('assert');
const { createClient } = require('@supabase/supabase-js');
const { createLocalDb, loadPglite } = require('./support/localDb');
const { createMiniPostgrest } = require('./support/miniPostgrest');

async function run() {
  if (!loadPglite()) {
    if (process.env.CI) throw new Error('@electric-sql/pglite is not installed: run npm ci.');
    console.log('    - store_location: SKIPPED (@electric-sql/pglite is not installed; run npm install)');
    return;
  }

  const { db } = await createLocalDb();
  const rest = createMiniPostgrest({ db, secret: 'store-location-test-secret' });
  await new Promise((r) => rest.server.listen(0, '127.0.0.1', r));
  const admin = createClient(`http://127.0.0.1:${rest.server.address().port}`, rest.mintKey('service_role'), {
    auth: { persistSession: false, autoRefreshToken: false }, db: { schema: 'iam' }
  });

  // The use case reaches the database through SupabaseClient.getAdmin() at call time.
  const { SupabaseClient } = require('../../server/infrastructure/database/SupabaseClient');
  const original = SupabaseClient.getAdmin;
  SupabaseClient.getAdmin = () => admin;
  const StoreLocationUseCase = require('../../server/modules/store/application/StoreLocationUseCase');

  try {
    await db.query(`INSERT INTO iam.profiles (id, clerk_user_id) VALUES ('owner-1', 'c-owner-1')`);
    await db.query(`INSERT INTO iam.listing_categories (id, vertical, name, slug) VALUES ('electronics', 'shop', 'Electronics', 'electronics')`);
    await db.query(`INSERT INTO iam.stores (id, owner_id, name, slug) VALUES ('s-new', 'owner-1', 'No location yet', 's-new'), ('s-old', 'owner-1', 'Has a location', 's-old')`);
    await db.query(`INSERT INTO iam.store_locations (store_id, city, street_address) VALUES ('s-old', 'Douala', 'Rue de la Joie')`);
    const row = async (id) => (await db.query('SELECT city, region, landmark, street_address FROM iam.store_locations WHERE store_id = $1', [id])).rows[0];

    // 1. A store with no location row yet: the edit creates one (with the empty street the column needs).
    await StoreLocationUseCase.updateLocation({ id: 's-new', slug: 's-new' }, { city: 'Douala', region: 'Littoral' });
    assert.deepStrictEqual(await row('s-new'), { city: 'Douala', region: 'Littoral', landmark: null, street_address: '' },
      'the first location edit is stored');

} finally {
    SupabaseClient.getAdmin = original;
    await new Promise((r) => rest.server.close(r));
    await db.close();
}
}
