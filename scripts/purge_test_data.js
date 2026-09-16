#!/usr/bin/env node
/**
 * LOUMOO — Purge automated-test data.
 *
 * The integration suites create real rows so they exercise real constraints.
 * The harness cleans up after itself, but a suite that dies mid-run can leave
 * orphans behind, and those orphans then show up in store discovery.
 *
 * Removes only rows the harness created: stores prefixed `store_test_` and
 * profiles whose Clerk id is prefixed `user_test_`.
 *
 *   node scripts/purge_test_data.js
 *
 * Refuses to run against a production environment.
 */

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Must run BEFORE tests/setup: it rewrites NODE_ENV=production to 'test', so a
// guard on config.isProduction evaluated afterwards can never fire. Read the
// same env file server/config/env.js would load (dotenv never overrides it).
const envFile = ['.env.local', '.env'].map(f => path.resolve(process.cwd(), f)).find(f => fs.existsSync(f));
const declaredEnv = process.env.NODE_ENV
  || (envFile ? dotenv.parse(fs.readFileSync(envFile)).NODE_ENV : '');
if (declaredEnv === 'production') {
  console.error('[purge] Refusing to run with NODE_ENV=production.');
  process.exit(2);
}

require('../tests/setup');

const { SupabaseDatabase } = require('../server/infrastructure/database/SupabaseClient');
const MediaStorageService = require('../server/infrastructure/storage/MediaStorageService');
const config = require('../server/config/env');

if (config.isProduction) {
  console.error('[purge] Refusing to run with NODE_ENV=production.');
  process.exit(2);
}

const db = SupabaseDatabase.getAdmin();

/** Runs a delete, tolerating tables that do not exist in this deployment. */
async function quietDelete(table, column, value, schema = null) {
  try {
    const client = schema ? db.schema(schema) : db;
    const { error } = await client.from(table).delete().eq(column, value);
    if (error && error.code !== 'PGRST205') {
      console.warn(`[purge] ${table}.${column}=${value}: ${error.message}`);
    }
  } catch (err) {
    console.warn(`[purge] ${table}: ${err.message}`);
  }
}

/**
 * Reclaims the storage objects behind a test owner's/store's unattached
 * uploads. Must run before the rows go: deleting the store or profile
 * cascades upload_sessions away and the objects become unreachable.
 */
async function reclaimUploads(column, value) {
  const { data: staged } = await db
    .schema('system').from('upload_sessions')
    .select('id').eq(column, value).in('status', ['STAGED', 'ORPHANED']);

  if (staged && staged.length) {
    const result = await MediaStorageService.discard(staged.map(u => u.id), 'test data purge');
    console.log(`[purge] reclaimed ${result.removed || 0} storage object(s)`);
  }
}

async function purgeStore(storeId) {
  await reclaimUploads('store_id', storeId);
  const { data: listings } = await db.from('listings').select('id').eq('store_id', storeId);
  for (const listing of listings || []) {
    await quietDelete('listing_attribute_values', 'listing_id', listing.id);
    await quietDelete('listing_media', 'listing_id', listing.id);
    await quietDelete('listings', 'id', listing.id);
  }

  for (const table of ['store_members', 'store_locations', 'store_profiles',
    'store_hours', 'store_settings', 'store_verifications']) {
    await quietDelete(table, 'store_id', storeId);
  }
  await quietDelete('stores', 'id', storeId);
}

async function purgeProfile(userId) {
  await reclaimUploads('owner_id', userId);
  await quietDelete('upload_sessions', 'owner_id', userId, 'system');
  await quietDelete('verification_challenges', 'user_id', userId, 'system');
  await quietDelete('privacy_preferences', 'user_id', userId, 'system');
  await quietDelete('account_security_events', 'user_id', userId, 'system');

  for (const table of ['onboarding_progress', 'followed_stores', 'saved_items',
    'addresses', 'user_activities', 'notification_preferences']) {
    await quietDelete(table, 'user_id', userId);
  }

  const { data: owned } = await db.from('stores').select('id').eq('owner_id', userId);
  for (const store of owned || []) await purgeStore(store.id);

  await quietDelete('profiles', 'id', userId);
}

(async () => {
  const { data: stores } = await db.from('stores').select('id').like('id', 'store_test_%');
  console.log(`[purge] ${(stores || []).length} test store(s)`);
  for (const store of stores || []) await purgeStore(store.id);

  const { data: profiles } = await db.from('profiles').select('id').like('clerk_user_id', 'user_test_%');
  console.log(`[purge] ${(profiles || []).length} test profile(s)`);
  for (const profile of profiles || []) await purgeProfile(profile.id);

  console.log('[purge] done');
  process.exit(0);
})().catch(err => {
  console.error('[purge] FAILED:', err.message);
  process.exit(1);
});
