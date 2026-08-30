/**
 * Unit Test: User-Facing Activity History (04.07)
 */

const assert = require('assert');
const UserActivityUseCase = require('../../server/modules/identity/application/UserActivityUseCase');

async function run() {
  console.log('  Testing User-Facing Activity History Service...');

  const userId = `usr_act_test_${Date.now()}`;

  // 1. Record activity
  const act1 = await UserActivityUseCase.recordActivity(userId, {
    actionType: 'profile_updated',
    title: 'Profile Updated',
    description: 'Updated display name and Douala quarter address.'
  });

  assert.ok(act1.id, 'Activity must have an ID');
  assert.strictEqual(act1.actionType, 'profile_updated');

  const act2 = await UserActivityUseCase.recordActivity(userId, {
    actionType: 'item_saved',
    title: 'Saved Product',
    description: 'Saved iPhone 16 Pro to wishlist.',
    resourceType: 'product',
    resourceId: 'p_16pro'
  });

  assert.ok(act2.id);

  // 2. Retrieve Activity Feed
  const feed = await UserActivityUseCase.getActivityFeed(userId, { limit: 10, offset: 0 });
  assert.ok(feed.activities.length >= 2, 'Should return recorded activities');
  assert.strictEqual(feed.activities[0].actionType, 'item_saved');

  // Verify privacy safety: no sensitive auth tokens or passwords
  const stringified = JSON.stringify(feed);
  assert.ok(!stringified.includes('password'), 'Activity feed must not contain password strings');
  assert.ok(!stringified.includes('clerk_secret'), 'Activity feed must not contain secret tokens');

  console.log('    ✓ User activity tests passed.');
}

module.exports = { run };
