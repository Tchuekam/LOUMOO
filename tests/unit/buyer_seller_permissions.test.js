/**
 * Unit Test: Buyer & Seller Permissions and Resource Ownership (02.10, 02.11)
 */

const assert = require('assert');
const { requireResourceOwner } = require('../../server/modules/identity/presentation/guards/resourceOwnershipGuard');
const UserProfile = require('../../server/modules/identity/entities/UserProfile');
const Role = require('../../server/modules/identity/value-objects/Role');
const { AuthorizationError } = require('../../server/shared/errors/AppError');

async function run() {
  console.log('  Testing Buyer/Seller Permissions & Resource Isolation Guard...');

  const sellerA = new UserProfile({
    id: 'usr_seller_a',
    clerkUserId: 'clerk_a',
    primaryRole: Role.SELLER
  });

  const sellerB = new UserProfile({
    id: 'usr_seller_b',
    clerkUserId: 'clerk_b',
    primaryRole: Role.SELLER
  });

  const admin = new UserProfile({
    id: 'usr_admin',
    clerkUserId: 'clerk_admin',
    primaryRole: Role.ADMIN
  });

  const guard = requireResourceOwner(req => req.params.ownerId);

  // 1. Seller A accessing Seller A's resource -> ALLOWED
  let sellerAPassed = false;
  const reqA = { userProfile: sellerA, params: { ownerId: 'usr_seller_a' }, path: '/store/1' };
  guard(reqA, {}, err => {
    if (!err) sellerAPassed = true;
  });
  assert.ok(sellerAPassed, 'Seller A should have access to Seller A resource');

  // 2. Seller A accessing Seller B's resource -> REJECTED
  let sellerBBlocked = false;
  const reqCross = { userProfile: sellerA, params: { ownerId: 'usr_seller_b' }, path: '/store/2' };
  guard(reqCross, {}, err => {
    if (err instanceof AuthorizationError) sellerBBlocked = true;
  });
  assert.ok(sellerBBlocked, 'Seller A must NOT have access to Seller B resource');

  // 3. Admin accessing Seller B's resource -> ALLOWED
  let adminPassed = false;
  const reqAdmin = { userProfile: admin, params: { ownerId: 'usr_seller_b' }, path: '/store/2' };
  guard(reqAdmin, {}, err => {
    if (!err) adminPassed = true;
  });
  assert.ok(adminPassed, 'Admin should have access across resources');

  console.log('    ✓ Buyer/Seller permissions and resource ownership tests passed.');
}

module.exports = { run };

if (require.main === module) {
  run().catch(err => {
    console.error(err);
    process.exit(1);
  });
}
