/**
 * Unit Test: Sign Up & Sign In (02.02, 02.03)
 */

const assert = require('assert');
const SignUpUseCase = require('../../server/modules/identity/application/SignUpUseCase');
const SignInUseCase = require('../../server/modules/identity/application/SignInUseCase');
const Role = require('../../server/modules/identity/value-objects/Role');
const { ValidationError } = require('../../server/shared/errors/AppError');

async function run() {
  console.log('  Testing Sign Up & Sign In Use Cases...');

  // 1. Validation error on invalid email
  let threwValidation = false;
  try {
    await SignUpUseCase.execute({
      email: 'not-an-email',
      firstName: 'Jean',
      lastName: 'Paul'
    });
  } catch (err) {
    if (err instanceof ValidationError) {
      threwValidation = true;
    }
  }
  assert.ok(threwValidation, 'Should reject invalid email format');

  // 2. Successful Buyer Registration
  const testEmail = `buyer_${Date.now()}@example.com`;
  const buyerResult = await SignUpUseCase.execute({
    email: testEmail,
    phoneNumber: '+237690123456',
    firstName: 'Rostand',
    lastName: 'Tchuekam',
    city: 'Douala',
    intent: 'buyer'
  });

  assert.ok(buyerResult.success, 'Buyer signup should succeed');
  assert.strictEqual(buyerResult.user.primaryRole, Role.CUSTOMER, 'Buyer should receive customer role');
  assert.strictEqual(buyerResult.user.email, testEmail);

  // 3. Successful Seller Registration
  const sellerEmail = `seller_${Date.now()}@example.com`;
  const sellerResult = await SignUpUseCase.execute({
    email: sellerEmail,
    phoneNumber: '+237670987654',
    firstName: 'Boutique',
    lastName: 'Akwa',
    city: 'Douala',
    intent: 'seller',
    sellerType: 'pro',
    businessName: 'Akwa Electronics SARL'
  });

  assert.ok(sellerResult.success, 'Seller signup should succeed');
  assert.strictEqual(sellerResult.user.primaryRole, Role.SELLER, 'Seller should receive seller role');
  assert.strictEqual(sellerResult.user.businessName, 'Akwa Electronics SARL');

  // 4. Sign In with valid user
  const signInResult = await SignInUseCase.execute({
    identifier: testEmail,
    token: `mock_token_${Date.now()}`
  });

  assert.ok(signInResult.success, 'Sign in should succeed');
  assert.ok(signInResult.token, 'Sign in should return a token');
  assert.ok(signInResult.permissions.length > 0, 'Sign in should return role permissions');

  console.log('    ✓ Sign up and sign in tests passed.');
}

module.exports = { run };

if (require.main === module) {
  run().catch(err => {
    console.error(err);
    process.exit(1);
  });
}
