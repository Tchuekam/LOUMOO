/**
 * LOUMOO — No Sensitive Authentication Data Is Exposed (HTTP)
 * ---------------------------------------------------------------------------
 * Proves the two secrets that pass through the signup/verify flow — the OTP
 * code and the chosen password — are never stored or returned in the clear:
 *   - the OTP cache record holds an HMAC of the code and AES-GCM ciphertext of
 *     the password, never the plaintext of either;
 *   - the signup response never echoes the password;
 *   - a failed login returns no token and no credential material.
 *
 * A fixed probe email keeps re-runs idempotent (no accumulation of throwaway
 * identity-provider users).
 */

require('../setup');
const assert = require('assert');
const harness = require('../helpers/harness');
const CacheService = require('../../server/infrastructure/cache/CacheService');
const OtpSecurity = require('../../server/modules/identity/infrastructure/OtpSecurity');
const AuthThrottle = require('../../server/modules/identity/infrastructure/AuthThrottle');

const OTP_NAMESPACE = 'auth_otp';
const EMAIL = 'sensitive_probe@loumoo-test.cm';
const PASSWORD = 'Sup3rSecret-Pw!';
const LOGIN_IP = '198.51.100.77';

async function run() {
  console.log('  Testing that sensitive auth data is never exposed...');

  await harness.start();

  try {
    // Observe THIS signup's freshly written record.
    await CacheService.delete(EMAIL, OTP_NAMESPACE);

    const signup = await harness.request('POST', '/api/v1/auth/signup', {
      body: { email: EMAIL, password: PASSWORD, firstName: 'Probe', lastName: 'User', phone: '690112233', city: 'douala' }
    });
    assert.strictEqual(signup.status, 200, 'Signup should dispatch an OTP');

    /* ── 1. The response never echoes the password ───────────────────────── */
    assert.ok(!JSON.stringify(signup.body).includes(PASSWORD),
      'The signup response must not contain the plaintext password');

    /* ── 2. The cache stores only hashed / encrypted secrets ─────────────── */
    const record = await CacheService.get(EMAIL, OTP_NAMESPACE);
    assert.ok(record, 'A pending OTP record must exist after signup');

    assert.ok(record.otpHash && /^[0-9a-f]{64}$/.test(record.otpHash),
      'The code must be stored as an HMAC-SHA256 digest');
    assert.strictEqual(record.otpCode, undefined, 'The plaintext OTP code must NOT be cached');
    assert.strictEqual(record.password, undefined, 'The plaintext password must NOT be cached');
    assert.ok(record.passwordEnc && !String(record.passwordEnc).includes(PASSWORD),
      'The password must be stored only as ciphertext, never as plaintext');

    // The whole serialized record must not contain the password anywhere.
    assert.ok(!JSON.stringify(record).includes(PASSWORD),
      'No field of the cache record may contain the plaintext password');

    // If dev handed back the code, prove the STORED value is a hash of it, not it.
    const devOtp = signup.body.data && signup.body.data.devOtp;
    if (devOtp) {
      assert.notStrictEqual(record.otpHash, devOtp, 'The stored value must not equal the code');
      assert.strictEqual(OtpSecurity.verifyOtp(devOtp, record.otpHash), true,
        'The stored HMAC must verify the real code — confirming it is a hash of it');
    }

    /* ── 3. A rejected login leaks neither a token nor credential material ── */
    // Seed the source throttle bucket so /login is refused at the gate, BEFORE
    // any identity-provider round-trip — this keeps the assertion hermetic and
    // still exercises a real rejection response.
    const now = Date.now();
    await CacheService.set(`login:src:${AuthThrottle.fingerprint(LOGIN_IP)}`,
      { count: 999, firstAt: now, expiresAt: now + 900 * 1000 }, 900, AuthThrottle.NAMESPACE);

    const wrong = await harness.request('POST', '/api/v1/auth/login', {
      headers: { 'X-Forwarded-For': LOGIN_IP },
      body: { email: `absent_${Date.now()}@loumoo-test.cm`, password: 'not-the-password' }
    });
    assert.strictEqual(wrong.status, 429, 'A throttled login is refused at the gate');
    const wrongJson = JSON.stringify(wrong.body);
    assert.ok(!wrongJson.includes('"token"') && !wrongJson.includes('accessToken'),
      'A rejected login must never hand back a session token');
    assert.ok(!wrongJson.includes('not-the-password'),
      'A rejected login must not echo the submitted password');
    await CacheService.delete(`login:src:${AuthThrottle.fingerprint(LOGIN_IP)}`, AuthThrottle.NAMESPACE);

    console.log('  ✓ Secrets are hashed/encrypted at rest and never returned in responses or errors');
  } finally {
    await CacheService.delete(EMAIL, OTP_NAMESPACE);
  }
}

module.exports = { run };

if (require.main === module) {
  run()
    .then(() => harness.cleanup())
    .then(() => process.exit(0))
    .catch(async e => { console.error(e); await harness.cleanup().catch(() => null); process.exit(1); });
}
