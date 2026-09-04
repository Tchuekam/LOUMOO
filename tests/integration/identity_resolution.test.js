/**
 * LOUMOO — Identity Resolution & Integrity at Verification (HTTP)
 * ---------------------------------------------------------------------------
 * Proves that OTP verification binds the session to the caller's REAL, existing
 * account — resolved through the indexed profiles mirror — instead of scanning
 * the auth table or fabricating a synthetic `usr_<hex(email)>` identity.
 *
 * A profile is provisioned via the harness with a known stable id and email.
 * A pending OTP is then seeded directly (correct code, NO cached auth id) so
 * verification must resolve the identity from the mirror. The token the
 * endpoint returns must belong to that existing account.
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
    passwordEnc: OtpSecurity.encryptSecret('Return1ng-User!'),
    firstName: 'Return', lastName: 'User', phone: '', city: 'douala',
    otpHash: OtpSecurity.hashOtp(code),
    attempts: 0,
    sendCount: 1,
    createdAt: now,
    lastSentAt: now,
    expiresAt: now + 900 * 1000,
    // Deliberately absent so resolution must go through the indexed mirror:
    supabaseUserId: null
  }, 900, OTP_NAMESPACE);
}

async function run() {
  console.log('  Testing identity resolution & integrity at verification...');

  await harness.start();

  // An existing, verified account with a stable id and a known email.
  const user = await harness.createUser({ stage: 'verified' });
  const code = '424242';

  try {
    await seedPendingOtp(user.email, code);

    const res = await harness.request('POST', '/api/v1/auth/verify-otp', {
      body: { email: user.email, code }
    });

    assert.strictEqual(res.status, 200, 'Verification with the correct code must succeed');

    const resolvedId = res.body.data.user.id;

    // 1) The session is bound to the EXISTING account, not a new or guessed one.
    assert.strictEqual(resolvedId, user.clerkUserId,
      'Verification must resolve the caller to their existing account id');

    // 2) No synthetic identity was fabricated.
    assert.ok(!String(resolvedId).startsWith('usr_'),
      'A verified session must never carry a synthesized usr_<hex(email)> id');

    // 3) The issued token actually authenticates as that same account — proving
    //    the identity boundary is internally consistent end to end.
    const me = await harness.request('GET', '/api/v1/me', {
      token: res.body.data.token
    });
    assert.strictEqual(me.status, 200);
    assert.strictEqual(me.body.data.profile.id, user.id,
      'The minted token must authenticate as the resolved account, not a duplicate');

    // 4) The OTP was consumed (single use) — the cache entry is gone.
    const remaining = await CacheService.get(user.email, OTP_NAMESPACE);
    assert.strictEqual(remaining, null, 'A successfully used OTP must be destroyed');

    console.log('  ✓ Verification resolves the real account via the indexed mirror; no synthetic identity');
  } finally {
    await CacheService.delete(user.email, OTP_NAMESPACE);
  }
}

module.exports = { run };

if (require.main === module) {
  run()
    .then(() => harness.cleanup())
    .then(() => process.exit(0))
    .catch(async e => { console.error(e); await harness.cleanup().catch(() => null); process.exit(1); });
}
