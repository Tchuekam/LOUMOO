/**
 * Unit Test: Phone & OTP Verification (02.07)
 */

const assert = require('assert');
const OtpService = require('../../server/modules/identity/application/OtpService');
const CacheService = require('../../server/infrastructure/cache/CacheService');
const { ValidationError, RateLimitError } = require('../../server/shared/errors/AppError');

async function run() {
  console.log('  Testing Phone & OTP Verification Service...');

  // 1. Phone number normalization
  const norm1 = OtpService.normalizePhoneNumber('690123456');
  assert.strictEqual(norm1, '+237690123456', 'Should prefix +237 to 9-digit Cameroon numbers');

  const norm2 = OtpService.normalizePhoneNumber('+237 670 98 76 54');
  assert.strictEqual(norm2, '+237670987654', 'Should clean whitespace and keep +237');

  let invalidPhoneThrew = false;
  try {
    OtpService.normalizePhoneNumber('12345');
  } catch (err) {
    if (err instanceof ValidationError) invalidPhoneThrew = true;
  }
  assert.ok(invalidPhoneThrew, 'Should reject invalid phone format');

  // 2. Send OTP
  const testPhone = `+23769${Math.floor(1000000 + Math.random() * 9000000)}`;
  const sendResult = await OtpService.sendOtp(testPhone);
  assert.ok(sendResult.success, 'OTP dispatch should succeed');
  assert.strictEqual(sendResult.phoneNumber, testPhone);

  // 3. Cooldown Lockout (second immediate send should fail)
  let cooldownThrew = false;
  try {
    await OtpService.sendOtp(testPhone);
  } catch (err) {
    if (err instanceof RateLimitError) cooldownThrew = true;
  }
  assert.ok(cooldownThrew, 'Should enforce 60s resend cooldown');

  // 4. Retrieve generated code from Redis for test verification
  const otpData = await CacheService.get(`auth:otp:${testPhone}`);
  assert.ok(otpData, 'OTP should be stored in cache');
  assert.strictEqual(otpData.code.length, 6, 'OTP code must be 6 digits');

  // 5. Incorrect Code Attempt (Decrements attempts)
  let wrongCodeThrew = false;
  try {
    await OtpService.verifyOtp(testPhone, '000000');
  } catch (err) {
    if (err instanceof ValidationError) wrongCodeThrew = true;
  }
  assert.ok(wrongCodeThrew, 'Should reject wrong OTP code');

  // 6. Correct Code Verification
  const verifyResult = await OtpService.verifyOtp(testPhone, otpData.code);
  assert.ok(verifyResult.success, 'Verification should succeed with correct code');
  assert.strictEqual(verifyResult.isPhoneVerified, true);

  console.log('    ✓ OTP verification tests passed.');
}

module.exports = { run };

if (require.main === module) {
  run().catch(err => {
    console.error(err);
    process.exit(1);
  });
}
