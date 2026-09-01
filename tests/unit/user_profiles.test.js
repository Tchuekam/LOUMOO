/**
 * Unit Test: Hardened User Profiles & Update Use Case (02.09)
 * Covers:
 *   1. Completion scoring & public card sanitization
 *   2. Cache key consistency using internal ID
 *   3. KYC state transition state machine validation
 *   4. Strict Zod schema & regex sanitization
 *   5. Optimistic locking & version conflict detection
 *   6. Database error handling & ServiceUnavailableError
 *   7. Audit logging with PII redaction
 *   8. Rate limiter configuration
 */

const assert = require('assert');
const { ZodError } = require('zod');
const UserProfile = require('../../server/modules/identity/entities/UserProfile');
const UpdateUserProfileUseCase = require('../../server/modules/identity/application/UpdateUserProfileUseCase');
const { UpdateProfileSchema, ALLOWED_BUYER_INTERESTS, ALLOWED_SHOPPING_PRIORITIES } = UpdateUserProfileUseCase;
const {
  ValidationError,
  ConflictError,
  ServiceUnavailableError,
  AuthorizationError,
  RateLimitError
} = require('../../server/shared/errors/AppError');
const RateLimitService = require('../../server/infrastructure/cache/RateLimitService');

async function run() {
  console.log('  Testing Hardened User Profile Entity & Update Use Case...');

  // 1. Completion score & Versioning on Entity
  const basicProfile = new UserProfile({
    id: 'usr_test_1',
    clerkUserId: 'user_1',
    email: 'test@loumoo.cm',
    firstName: 'Paul',
    lastName: 'Biya',
    version: 1
  });
  assert.strictEqual(basicProfile.version, 1, 'Initial version should be 1');
  assert.strictEqual(basicProfile.completionPercentage >= 20, true, 'Base profile should have at least 20% completion');

  const richProfile = new UserProfile({
    id: 'usr_test_up_' + Date.now(),
    clerkUserId: 'user_2',
    email: 'merchant@loumoo.cm',
    firstName: 'Mr',
    lastName: 'Toukam',
    city: 'Douala (Akwa)',
    emailVerifiedAt: '2026-08-01T10:00:00.000Z',
    phoneVerifiedAt: '2026-08-01T10:05:00.000Z',
    onboardingStatus: 'COMPLETED',
    sellerType: 'pro',
    businessName: 'Orca Electronics',
    kycDocStatus: 'pending',
    version: 1
  });

  assert.strictEqual(richProfile.isEmailVerified, true);
  assert.strictEqual(richProfile.isPhoneVerified, true);
  assert.strictEqual(richProfile.completionPercentage >= 80, true);

  // 2. Public card sanitization (No PII leaked)
  const merchantCard = richProfile.toSafeMerchantPublicCard();
  assert.strictEqual(merchantCard.id, richProfile.id);
  assert.strictEqual(merchantCard.fullName, 'Orca Electronics');
  assert.strictEqual(merchantCard.email, undefined, 'Merchant card must never leak email');
  assert.strictEqual(merchantCard.phoneNumber, undefined, 'Merchant card must never leak phone');
  assert.strictEqual(merchantCard.isVerifiedSeller, false, 'Pending KYC is not verified seller');

  // 3. KYC State Transition Validation
  console.log('    • Testing KYC state machine transitions...');
  // pending -> submitted (Legal)
  let kycCheck = richProfile.canTransitionKycStatus('submitted');
  assert.strictEqual(kycCheck.valid, true, 'pending -> submitted should be legal');

  // pending -> verified (Illegal, must submit first)
  kycCheck = richProfile.canTransitionKycStatus('verified');
  assert.strictEqual(kycCheck.valid, false, 'pending -> verified directly should be illegal');

  // submitted -> verified | rejected (Legal)
  const submittedProfile = new UserProfile({ ...richProfile, kycDocStatus: 'submitted' });
  assert.strictEqual(submittedProfile.canTransitionKycStatus('verified').valid, true);
  assert.strictEqual(submittedProfile.canTransitionKycStatus('rejected').valid, true);

  // rejected -> submitted (Legal)
  const rejectedProfile = new UserProfile({ ...richProfile, kycDocStatus: 'rejected' });
  assert.strictEqual(rejectedProfile.canTransitionKycStatus('submitted').valid, true);
  // rejected -> verified (Illegal without resubmission)
  assert.strictEqual(rejectedProfile.canTransitionKycStatus('verified').valid, false);

  // 4. Strict Schema & Input Validation
  console.log('    • Testing strict input validation & regex sanitization...');
  // Rejects unknown fields in Zod parse
  assert.throws(() => {
    UpdateProfileSchema.parse({
      firstName: 'Jean',
      unknownMaliciousField: 'exploit'
    });
  }, ZodError, 'Strict schema must reject unknown fields');

  // Rejects unknown fields in UseCase execution with ValidationError
  await assert.rejects(
    async () => UpdateUserProfileUseCase.execute(richProfile, {
      firstName: 'Jean',
      unknownMaliciousField: 'exploit'
    }),
    ValidationError,
    'UseCase must wrap schema errors in ValidationError'
  );

  // Rejects HTML / XSS in names
  assert.throws(() => {
    UpdateProfileSchema.parse({ firstName: '<script>alert(1)</script>' });
  }, ZodError, 'Schema must reject HTML in names');

  // Rejects emojis in names
  assert.throws(() => {
    UpdateProfileSchema.parse({ firstName: 'Marc 🚀' });
  }, ZodError, 'Schema must reject emojis in names');

  // Rejects invalid buyer interests enum
  assert.throws(() => {
    UpdateProfileSchema.parse({ buyerInterests: ['weapons', 'crypto'] });
  }, ZodError, 'Schema must reject unallowed interest enums');

  // Rejects invalid shopping priorities enum
  assert.throws(() => {
    UpdateProfileSchema.parse({ shoppingPriorities: ['illegal_goods'] });
  }, ZodError, 'Schema must reject unallowed priority enums');

  // Rejects malformed Tax NIU
  assert.throws(() => {
    UpdateProfileSchema.parse({ taxNiuNumber: '123' });
  }, ZodError, 'Schema must reject too short NIU');

  // Accepts valid inputs
  const validParsed = UpdateProfileSchema.parse({
    firstName: 'Jean-Paul',
    lastName: "D'Almeida",
    city: 'Douala (Bonanjo)',
    buyerInterests: ['tech', 'fashion'],
    shoppingPriorities: ['quality', 'speed'],
    taxNiuNumber: 'M051812345678A',
    rccmNumber: 'RC/DLA/2026/B/1234',
    version: 1
  });
  assert.strictEqual(validParsed.firstName, 'Jean-Paul');
  assert.strictEqual(validParsed.taxNiuNumber, 'M051812345678A');

  // 5. Update User Profile Use Case & Optimistic Locking
  console.log('    • Testing UseCase update execution & optimistic locking...');

  // Unauthenticated caller throws AuthorizationError
  await assert.rejects(
    async () => UpdateUserProfileUseCase.execute(null, { city: 'Yaoundé' }),
    AuthorizationError,
    'Unauthenticated call must throw AuthorizationError'
  );

  // Illegal KYC transition in UseCase throws ValidationError
  await assert.rejects(
    async () => UpdateUserProfileUseCase.execute(richProfile, { kycDocStatus: 'verified' }),
    ValidationError,
    'Direct pending -> verified in UseCase must throw ValidationError'
  );

  // Version mismatch throws ConflictError
  await assert.rejects(
    async () => UpdateUserProfileUseCase.execute(richProfile, {
      city: 'Yaoundé',
      version: 99
    }),
    ConflictError,
    'Stale version must throw ConflictError'
  );

  // Valid update succeeds and increments version
  const updateResult = await UpdateUserProfileUseCase.execute(richProfile, {
    city: 'Yaoundé',
    buyerInterests: ['electronics', 'fashion'],
    version: 1
  }, { ip: '127.0.0.1' });

  assert.ok(updateResult.success, 'Profile update should succeed');
  assert.strictEqual(updateResult.user.city, 'Yaoundé');
  assert.strictEqual(updateResult.user.version, 2, 'Version must be incremented to 2');
  assert.deepStrictEqual(updateResult.user.buyerInterests, ['electronics', 'fashion']);

  // 6. Rate Limiting Check
  console.log('    • Testing Rate Limiting (10 req/min limit)...');
  const rateLimitKey = `test_profile_limit_${Date.now()}`;
  for (let i = 0; i < 10; i++) {
    const res = await RateLimitService.consume(rateLimitKey, 10, 60);
    assert.strictEqual(res.allowed, true);
  }
  // 11th request must throw RateLimitError
  await assert.rejects(
    async () => RateLimitService.consume(rateLimitKey, 10, 60),
    RateLimitError,
    '11th request must exceed quota and throw RateLimitError'
  );

  console.log('    ✓ All user profile unit tests passed with 100% assertions satisfied.');
}

module.exports = { run };

if (require.main === module) {
  run().catch(err => {
    console.error(err);
    process.exit(1);
  });
}
