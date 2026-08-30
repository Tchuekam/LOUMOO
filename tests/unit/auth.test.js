/**
 * Unit Test: Authentication & Identity Mapping
 */

const assert = require('assert');
const { SyncClerkUserUseCase } = require('../../server/modules/identity/application/SyncClerkUserUseCase');
const ResolveUserIdentityUseCase = require('../../server/modules/identity/application/ResolveUserIdentityUseCase');
const UserProfile = require('../../server/modules/identity/entities/UserProfile');

async function run() {
  console.log('  Testing Identity Synchronization & UserProfile...');

  const mockClerkUser = {
    id: `user_test_${Date.now()}`,
    first_name: 'Loic',
    last_name: 'Tchuekam',
    primary_email_address_id: 'email_1',
    email_addresses: [
      { id: 'email_1', email_address: 'tchuekrostand@gmail.com' }
    ],
    primary_phone_number_id: 'phone_1',
    phone_numbers: [
      { id: 'phone_1', phone_number: '+237690123456' }
    ],
    public_metadata: { role: 'seller' }
  };

  // 1. Sync Clerk User
  const syncResult = await SyncClerkUserUseCase.execute(mockClerkUser, 'user.created');
  assert.ok(syncResult.internalUserId, 'Internal User ID must be generated/mapped');
  assert.strictEqual(syncResult.clerkUserId, mockClerkUser.id);

  // 2. Resolve User Identity
  const resolved = await ResolveUserIdentityUseCase.execute(mockClerkUser.id);
  assert.ok(resolved instanceof UserProfile, 'Should return UserProfile instance');
  assert.strictEqual(resolved.firstName, 'Loic');
  assert.strictEqual(resolved.email, 'tchuekrostand@gmail.com');
  assert.strictEqual(resolved.primaryRole, 'seller');
  assert.strictEqual(resolved.isSeller(), true);

  console.log('    ✓ Identity synchronization tests passed.');
}

module.exports = { run };
