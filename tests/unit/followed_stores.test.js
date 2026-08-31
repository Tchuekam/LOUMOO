/**
 * Unit Test: Followed Stores (04.05)
 */

require('../setup');
const assert = require('assert');
const FollowedStoresUseCase = require('../../server/modules/identity/application/FollowedStoresUseCase');
const { ConflictError } = require('../../server/shared/errors/AppError');
const harness = require('../helpers/harness');
const dbModule = require('../../server/infrastructure/database/SupabaseClient');
const { makeFakeDb } = require('../helpers/fallbackDb');

async function run() {
  console.log('  Testing Followed Stores Service...');

  // `iam.followed_stores.user_id` is a real foreign key into `iam.profiles`.
  // Provisioning a real profile (rather than inventing an id) is what makes
  // this exercise the persistence path instead of an in-memory fallback.
  const user = await harness.createUser({ stage: 'ready' });
  const store = await harness.createStore(user);
  const userId = user.id;
  const storeId = store.id;

  // 1. Follow a store
  const followed = await FollowedStoresUseCase.followStore(userId, {
    storeId,
    storeName: store.name,
    storeAvatar: 'https://images.unsplash.com/photo-1555421689-491a97ff2040?w=100',
    city: 'Douala',
    isVerified: true
  });

  assert.ok(followed.id, 'Followed store must have an ID');
  assert.strictEqual(followed.storeId, storeId);
  assert.strictEqual(followed.storeName, store.name);

  // 2. Duplicate follow prevention
  let duplicateBlocked = false;
  try {
    await FollowedStoresUseCase.followStore(userId, {
      storeId,
      storeName: 'Orca Electronics Duplicate'
    });
  } catch (err) {
    if (err instanceof ConflictError) duplicateBlocked = true;
  }
  assert.ok(duplicateBlocked, 'Duplicate store follow must be rejected with ConflictError');

  // 3. Check isStoreFollowed
  const isFollowed = await FollowedStoresUseCase.isStoreFollowed(userId, storeId);
  assert.strictEqual(isFollowed, true, 'Store should report as followed');

  const notFollowed = await FollowedStoresUseCase.isStoreFollowed(userId, 'store_random_xyz');
  assert.strictEqual(notFollowed, false, 'Non-followed store should report as false');

  // 4. List followed stores
  const list = await FollowedStoresUseCase.listFollowedStores(userId, { limit: 10, offset: 0 });
  assert.ok(list.stores.length >= 1, 'Should return at least 1 followed store');
  assert.strictEqual(list.stores[0].storeId, storeId);

  // 5. Unfollow store
  const unfollowRes = await FollowedStoresUseCase.unfollowStore(userId, storeId);
  assert.strictEqual(unfollowRes.success, true, 'Unfollow should succeed');

  const checkAfterUnfollow = await FollowedStoresUseCase.isStoreFollowed(userId, storeId);
  assert.strictEqual(checkAfterUnfollow, false, 'Store should no longer be followed');

  /* ── 6. Regression: memory-store merge on reads (dev fallback path) ────── */
  // The in-memory store is populated only when the DB write fails (dev mode).
  // Once populated, reads MUST stay consistent with it:
  //   (a) DB returns EMPTY rows  -> merge the in-memory records
  //   (b) DB ERRORS              -> fall back to the in-memory records
  // This pins the historical bug where listFollowedStores consulted the
  // memory store only in the catch block, discarding fallback records
  // whenever the DB was healthy but returned no rows.

  const originalGetAdmin = dbModule.SupabaseClient.getAdmin;
  try {
    const forcedError = { code: 'PGRST301', message: 'connection refused (forced)' };

    // (a) prime the in-memory store via the DB-error fallback on follow.
    const fallbackUser = `usr_follow_fallback_${Date.now()}`;
    const fallbackStoreId = 'store_fallback_regression';
    dbModule.SupabaseClient.getAdmin = () => makeFakeDb({ data: null, count: 0, error: forcedError });

    const fallbackFollowed = await FollowedStoresUseCase.followStore(fallbackUser, {
      storeId: fallbackStoreId,
      storeName: 'Fallback Boutique',
      city: 'Douala',
      isVerified: true
    });
    assert.ok(fallbackFollowed.id, 'DB-error follow must fall back to an in-memory record');
    assert.strictEqual(fallbackFollowed.storeId, fallbackStoreId);

    // (a2) DB healthy but EMPTY: the read must merge the in-memory record.
    dbModule.SupabaseClient.getAdmin = () => makeFakeDb({ data: [], count: 0, error: null });

    const mergedList = await FollowedStoresUseCase.listFollowedStores(fallbackUser, { limit: 10, offset: 0 });
    assert.strictEqual(mergedList.stores.length, 1,
      'A DB-empty read must surface in-memory fallback records (merge)');
    assert.strictEqual(mergedList.stores[0].storeId, fallbackStoreId);
    assert.strictEqual(mergedList.total, 1, 'Merged total must count the in-memory records');

    const mergedCheck = await FollowedStoresUseCase.isStoreFollowed(fallbackUser, fallbackStoreId);
    assert.strictEqual(mergedCheck, true,
      'isStoreFollowed must consult the memory store when the DB returns no rows');

    // (b) DB ERRORS on read: fall back to the in-memory store.
    const errorUser = `usr_follow_error_${Date.now()}`;
    dbModule.SupabaseClient.getAdmin = () => makeFakeDb({ data: null, count: 0, error: forcedError });

    const errorList = await FollowedStoresUseCase.listFollowedStores(errorUser, { limit: 10, offset: 0 });
    assert.strictEqual(errorList.stores.length, 0,
      'A DB-error read with an empty memory store must return no stores');

    const errorFallbackUser = `usr_follow_error_fb_${Date.now()}`;
    const errorFallbackFollowed = await FollowedStoresUseCase.followStore(errorFallbackUser, {
      storeId: 'store_error_fallback',
      storeName: 'Error Fallback Boutique'
    });
    assert.ok(errorFallbackFollowed.id);

    const errorListWithMemory = await FollowedStoresUseCase.listFollowedStores(errorFallbackUser, { limit: 10, offset: 0 });
    assert.strictEqual(errorListWithMemory.stores.length, 1,
      'A DB-error read must fall back to in-memory records');
    assert.strictEqual(errorListWithMemory.stores[0].storeId, 'store_error_fallback');
  } finally {
    dbModule.SupabaseClient.getAdmin = originalGetAdmin;
  }

  console.log('    ✓ Followed stores tests passed.');
}

module.exports = { run };
