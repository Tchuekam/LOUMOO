/**
 * Unit Test: Account Dashboard Read Model (04.02)
 */

const assert = require('assert');
const AccountDashboardUseCase = require('../../server/modules/identity/application/AccountDashboardUseCase');
const UserProfile = require('../../server/modules/identity/entities/UserProfile');

async function run() {
  console.log('  Testing Account Dashboard Read Model Aggregation...');

  const profile = new UserProfile({
    id: 'usr_dash_test_1',
    clerkUserId: 'user_clerk_dash_1',
    firstName: 'Rostand',
    lastName: 'Tchuekam',
    email: 'rostand@loumoo.cm',
    phone: '+237 690 12 34 56',
    city: 'Douala',
    role: 'seller',
    sellerType: 'pro',
    completionPercentage: 85,
    isPhoneVerified: true,
    isEmailVerified: true
  });

  const dashboard = await AccountDashboardUseCase.getDashboard(profile);

  assert.ok(dashboard.profile, 'Dashboard must contain profile snapshot');
  assert.strictEqual(dashboard.profile.name, 'Rostand Tchuekam');
  assert.strictEqual(dashboard.profile.role, 'seller');
  assert.strictEqual(dashboard.profile.completionPercentage, 85);

  assert.ok(dashboard.counts, 'Dashboard must contain aggregated counts');
  assert.strictEqual(typeof dashboard.counts.savedItems, 'number');
  assert.strictEqual(typeof dashboard.counts.followedStores, 'number');
  assert.strictEqual(typeof dashboard.counts.activeDeliveries, 'number');

  assert.ok(dashboard.escrowProtection.enabled, 'Escrow protection must be enabled');

  console.log('    ✓ Account dashboard tests passed.');
}

module.exports = { run };
