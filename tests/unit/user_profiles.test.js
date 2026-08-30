/**
 * Unit Test: User Profiles & Completion Scoring (02.09)
 */

const assert = require('assert');
const UserProfile = require('../../server/modules/identity/entities/UserProfile');
const UpdateUserProfileUseCase = require('../../server/modules/identity/application/UpdateUserProfileUseCase');
const Role = require('../../server/modules/identity/value-objects/Role');

async function run() {
  console.log('  Testing User Profile Entity & Update Use Case...');

  // 1. Completion score progression
  const basicProfile = new UserProfile({
    id: 'usr_test_1',
    clerkUserId: 'user_1',
    email: 'test@loumoo.cm',
    firstName: 'Paul',
    lastName: 'Biya'
  });
  assert.strictEqual(basicProfile.completionPercentage >= 20, true, 'Base profile should have at least 20% completion');

  const richProfile = new UserProfile({
    id: 'usr_test_2',
    clerkUserId: 'user_2',
    email: 'merchant@loumoo.cm',
    firstName: 'Mr',
    lastName: 'Toukam',
    city: 'Douala (Akwa)',
    isPhoneVerified: true,
    sellerType: 'pro',
    businessName: 'Orca Electronics',
    kycDocStatus: 'verified'
  });
  assert.strictEqual(richProfile.completionPercentage >= 85, true, 'Rich merchant profile should reach 85%+ completion');

  // 2. Public card sanitization (No PII leaked)
  const merchantCard = richProfile.toSafeMerchantPublicCard();
  assert.strictEqual(merchantCard.id, 'usr_test_2');
  assert.strictEqual(merchantCard.fullName, 'Orca Electronics');
  assert.strictEqual(merchantCard.email, undefined, 'Public merchant card must not expose email');
  assert.strictEqual(merchantCard.phoneNumber, undefined, 'Public merchant card must not expose phone');
  assert.strictEqual(merchantCard.isVerifiedSeller, true);

  // 3. Update User Profile Use Case
  const updateResult = await UpdateUserProfileUseCase.execute(richProfile, {
    city: 'Yaoundé (Bastos)',
    buyerInterests: ['electronics', 'fashion']
  });

  assert.ok(updateResult.success, 'Profile update should succeed');
  assert.strictEqual(updateResult.user.city, 'Yaoundé (Bastos)');
  assert.deepStrictEqual(updateResult.user.buyerInterests, ['electronics', 'fashion']);

  console.log('    ✓ User profile tests passed.');
}

module.exports = { run };

if (require.main === module) {
  run().catch(err => {
    console.error(err);
    process.exit(1);
  });
}
