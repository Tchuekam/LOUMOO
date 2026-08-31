/**
 * Unit Test: Followed Stores (04.05)
 */

require('../setup');
const assert = require('assert');
const FollowedStoresUseCase = require('../../server/modules/identity/application/FollowedStoresUseCase');
const { ConflictError } = require('../../server/shared/errors/AppError');
const harness = require('../helpers/harness');

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

  console.log('    ✓ Followed stores tests passed.');
}

module.exports = { run };
