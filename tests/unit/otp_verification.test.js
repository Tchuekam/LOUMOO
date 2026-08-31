/**
 * LOUMOO — Contact Verification
 * ---------------------------------------------------------------------------
 * The previous suite tested an `OtpService` that generated a six-digit code,
 * logged it to the console, stored it in Redis and then marked the phone
 * verified when it matched. No SMS was ever sent. That is a simulation of
 * verification, not verification, and it has been removed.
 *
 * What replaces it: Clerk owns verification, LOUMOO mirrors the result, and a
 * channel with no configured provider fails loudly instead of pretending.
 */

require('../setup');
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ContactVerificationService = require('../../server/modules/identity/application/ContactVerificationService');
const ClerkIdentityProvider = require('../../server/modules/identity/infrastructure/ClerkIdentityProvider');
const config = require('../../server/config/env');
const harness = require('../helpers/harness');

async function run() {
  console.log('  Testing contact verification...');

  /* ── 1. The simulated OTP service is gone ─────────────────────────────── */

  assert.strictEqual(
    fs.existsSync(path.resolve(__dirname, '..', '..', 'server', 'modules', 'identity', 'application', 'OtpService.js')),
    false,
    'The console-logging OTP service must not exist'
  );

  /* ── 2. Phone normalisation is strict E.164 for Cameroon ──────────────── */

  assert.strictEqual(ContactVerificationService.normalizePhoneNumber('690123456'), '+237690123456');
  assert.strictEqual(ContactVerificationService.normalizePhoneNumber('+237 670 98 76 54'), '+237670987654');
  assert.strictEqual(ContactVerificationService.normalizePhoneNumber('237-690-11-22-33'), '+237690112233');
  assert.strictEqual(ContactVerificationService.normalizePhoneNumber('00237690112233'), '+237690112233');

  for (const bad of ['12345', '+33612345678', '69012345', 'not-a-number', '']) {
    let rejected = false;
    try { ContactVerificationService.normalizePhoneNumber(bad); } catch (e) { rejected = true; }
    assert.ok(rejected, `"${bad}" must be rejected as an invalid Cameroon number`);
  }

  /* ── 3. Missing provider config fails loudly, never silently ──────────── */

  const capability = ClerkIdentityProvider.phoneVerificationCapability();
  assert.strictEqual(capability.provider, config.verification.phoneProvider);

  if (!capability.available) {
    const user = await harness.createUser({ stage: 'verified' });
    const principal = {
      id: user.id,
      clerkUserId: user.clerk_user_id,
      email: user.email,
      phoneNumber: '+237690112233',
      emailVerifiedAt: user.email_verified_at,
      phoneVerifiedAt: null
    };

    let err = null;
    try {
      await ContactVerificationService.requestPhoneVerification(principal, '+237690112233');
    } catch (e) {
      err = e;
    }

    assert.ok(err, 'An unconfigured phone channel must raise, not return a fake success');
    assert.strictEqual(err.statusCode, 503);
    assert.strictEqual(err.code, 'PHONE_VERIFICATION_NOT_CONFIGURED');
    assert.ok(err.details.requirement && err.details.requirement.length > 20,
      'The error must state the exact configuration the operator needs to supply');
    assert.ok(/PHONE_VERIFICATION_PROVIDER/.test(err.details.requirement),
      'The requirement must name the environment variable to set');

    // ...and no verification state may have been written as a side effect.
    const { data: after } = await harness.db()
      .from('profiles').select('phone_verified_at').eq('id', user.id).single();
    assert.strictEqual(after.phone_verified_at, null,
      'A failed verification attempt must never mark the number verified');
  }

  /* ── 4. Status reporting is honest about what it can do ───────────────── */

  const verifiedUser = await harness.createUser({ stage: 'ready' });
  const status = await harness.request('GET', '/api/v1/auth/verification', { token: verifiedUser.token });

  assert.strictEqual(status.status, 200);
  assert.strictEqual(status.body.data.email.verified, true);
  assert.strictEqual(status.body.data.email.provider, 'clerk');
  assert.strictEqual(status.body.data.phone.verified, false);
  assert.strictEqual(status.body.data.phone.available, capability.available);
  if (!capability.available) {
    assert.ok(status.body.data.phone.configurationRequirement,
      'The status must tell the client why phone verification is unavailable');
  }

  /* ── 5. Verification endpoints require an authenticated session ───────── */

  for (const route of ['/api/v1/auth/verification', '/api/v1/auth/verification/refresh', '/api/v1/auth/verification/email']) {
    const method = route.endsWith('/verification') ? 'GET' : 'POST';
    const res = await harness.request(method, route, { body: {} });
    assert.strictEqual(res.status, 401,
      `${route} must not be usable without a session, got ${res.status}`);
  }

  /* ── 6. Re-requesting verification on an already-verified address ─────── */

  const already = await harness.request('POST', '/api/v1/auth/verification/email', {
    token: verifiedUser.token
  });
  assert.strictEqual(already.status, 200);
  assert.strictEqual(already.body.data.alreadyVerified, true,
    'An already-verified address is a normal outcome, not an error to recover from');

  console.log('  ✓ Contact verification: Clerk-owned, mirrored, and honest about missing providers');
}

module.exports = { run };

if (require.main === module) {
  run()
    .then(() => harness.cleanup())
    .then(() => process.exit(0))
    .catch(async e => { console.error(e); await harness.cleanup().catch(() => null); process.exit(1); });
}
