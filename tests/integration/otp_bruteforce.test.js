/**
 * LOUMOO — OTP Brute-Force & Enumeration Resistance (HTTP)
 * ---------------------------------------------------------------------------
 * Drives the real /api/v1/auth/verify-otp and /resend-otp endpoints over HTTP
 * to prove the account brute-force protections hold.
 *
 * The pending OTP is seeded directly into the cache with the same hashed shape
 * the signup path writes, so this suite exercises the verification policy
 * WITHOUT creating a Supabase auth user or sending any email — the failure
 * paths never reach account provisioning.
 */

require('../setup');
const assert = require('assert');
const harness = require('../helpers/harness');
const CacheService = require('../../server/infrastructure/cache/CacheService');
const OtpSecurity = require('../../server/modules/identity/infrastructure/OtpSecurity');

const OTP_NAMESPACE = 'auth_otp';

async function seedPendingOtp(email, code) {
  const now = Date.now();
  await CacheService.set(email, {
    email,
    passwordEnc: OtpSecurity.encryptSecret('Sup3r-Secret!'),
    firstName: 'Otp', lastName: 'Tester', phone: '', city: '',
    otpHash: OtpSecurity.hashOtp(code),
    attempts: 0,
    sendCount: 1,
    createdAt: now,
    lastSentAt: now,
    expiresAt: now + 900 * 1000
  }, 900, OTP_NAMESPACE);
}

async function run() {
  console.log('  Testing OTP brute-force & enumeration resistance...');

  await harness.start();

  const email = `otp_bruteforce_${Date.now().toString(36)}@loumoo-test.cm`;
  const unknownEmail = `otp_unknown_${Date.now().toString(36)}@loumoo-test.cm`;
  const correctCode = '135790';

  try {
    await seedPendingOtp(email, correctCode);

    /* ── 1. Five wrong guesses, then the code is destroyed ─────────────────── */
    const seenMessages = new Set();
    for (let i = 1; i <= 5; i++) {
      const res = await harness.request('POST', '/api/v1/auth/verify-otp', {
        body: { email, code: '000000' }
      });
      assert.strictEqual(res.status, 401, `Wrong-code attempt ${i} must be rejected with 401`);
      seenMessages.add(res.body && res.body.error && res.body.error.message);
    }

    // Messaging is uniform — a wrong guess is indistinguishable from anything
    // else, so it leaks neither correctness nor account existence.
    assert.strictEqual(seenMessages.size, 1,
      'Every failed attempt must return the exact same message');

    /* ── 2. The (previously) correct code no longer works after lockout ────── */
    const afterLock = await harness.request('POST', '/api/v1/auth/verify-otp', {
      body: { email, code: correctCode }
    });
    assert.strictEqual(afterLock.status, 401,
      'Once the attempt limit is hit the code is invalidated, even the correct one');

    const remaining = await CacheService.get(email, OTP_NAMESPACE);
    assert.strictEqual(remaining, null,
      'A locked-out OTP must be destroyed in the cache, not left to keep accepting guesses');

    /* ── 3. A wrong guess must never extend the code's lifetime ────────────── */
    const freshEmail = `otp_ttl_${Date.now().toString(36)}@loumoo-test.cm`;
    await seedPendingOtp(freshEmail, '246810');
    const before = await CacheService.get(freshEmail, OTP_NAMESPACE);
    await harness.request('POST', '/api/v1/auth/verify-otp', { body: { email: freshEmail, code: '111111' } });
    const afterWrong = await CacheService.get(freshEmail, OTP_NAMESPACE);
    assert.ok(afterWrong, 'The code should still exist after one wrong guess');
    assert.strictEqual(afterWrong.expiresAt, before.expiresAt,
      'A wrong guess must not push the expiry forward');
    assert.strictEqual(afterWrong.attempts, 1, 'The failed attempt must be counted');
    await CacheService.delete(freshEmail, OTP_NAMESPACE);

    /* ── 4. Verify with no pending code is the same generic 401 ────────────── */
    const noPending = await harness.request('POST', '/api/v1/auth/verify-otp', {
      body: { email: unknownEmail, code: '000000' }
    });
    assert.strictEqual(noPending.status, 401);
    assert.ok(seenMessages.has(noPending.body.error.message),
      'A never-issued code and a wrong code must be indistinguishable');

    /* ── 5. Resend for an unknown address creates nothing and reveals nothing ─ */
    const resend = await harness.request('POST', '/api/v1/auth/resend-otp', {
      body: { email: unknownEmail }
    });
    assert.strictEqual(resend.status, 200,
      'Resend must answer with the same success envelope regardless of whether a signup is pending');
    const createdByResend = await CacheService.get(unknownEmail, OTP_NAMESPACE);
    assert.strictEqual(createdByResend, null,
      'Resend must NOT mint a pending OTP for an address that never signed up');
    assert.strictEqual(resend.body.data.devOtp, undefined,
      'No code may be handed back when nothing was sent');

    console.log('  ✓ OTP endpoints resist brute force, replay after lockout, and enumeration');
  } finally {
    await CacheService.delete(email, OTP_NAMESPACE);
    await CacheService.delete(unknownEmail, OTP_NAMESPACE);
  }
}

module.exports = { run };

if (require.main === module) {
  run()
    .then(() => harness.cleanup())
    .then(() => process.exit(0))
    .catch(async e => { console.error(e); await harness.cleanup().catch(() => null); process.exit(1); });
}
