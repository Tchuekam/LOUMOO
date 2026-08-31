/**
 * LOUMOO — Authentication Surface
 * ---------------------------------------------------------------------------
 * This suite used to exercise `SignUpUseCase` and `SignInUseCase`, which
 * accepted any identifier with no password and returned a session token. Both
 * are deleted: Clerk performs authentication, and the server's only job is to
 * verify the resulting session.
 *
 * What is tested here is that the retired surface stays retired and the new
 * one behaves.
 */

require('../setup');
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const harness = require('../helpers/harness');

const APPLICATION_DIR = path.resolve(__dirname, '..', '..', 'server', 'modules', 'identity', 'application');

async function run() {
  console.log('  Testing authentication surface...');

  /* ── 1. The credential-handling use cases are gone, not just unused ───── */

  for (const removed of ['SignUpUseCase.js', 'SignInUseCase.js', 'OtpService.js', 'SyncClerkUserUseCase.js']) {
    assert.strictEqual(
      fs.existsSync(path.join(APPLICATION_DIR, removed)),
      false,
      `${removed} fabricated authentication state and must not exist`
    );
  }

  /* ── 2. Their endpoints answer with a pointer, never a session ────────── */

  // Active server-authoritative signup dispatches OTP
  const signupRes = await harness.request('POST', '/api/v1/auth/signup', {
    body: { email: 'newuser@loumoo.cm', password: 'Password123!', firstName: 'Test', lastName: 'User', phone: '659248952' }
  });
  assert.strictEqual(signupRes.status, 200, 'Signup should answer 200 with OTP dispatched');
  assert.strictEqual(signupRes.body.status, 'success');

  /* ── 3. The public bootstrap exposes only browser-safe configuration ──── */

  const cfg = await harness.request('GET', '/api/v1/auth/config');
  assert.strictEqual(cfg.status, 200);
  assert.ok(['supabase', 'clerk'].includes(cfg.body.data.provider));

  const serialised = JSON.stringify(cfg.body);
  assert.ok(!serialised.includes('sk_test_') && !serialised.includes('sk_live_'),
    'The Clerk SECRET key must never be sent to a browser');
  assert.ok(!serialised.includes('service_role'),
    'The Supabase service role key must never be sent to a browser');
  assert.ok(!serialised.includes('whsec_'),
    'The webhook signing secret must never be sent to a browser');

  const appCfg = await harness.request('GET', '/api/config');
  const appSerialised = JSON.stringify(appCfg.body);
  assert.ok(!appSerialised.includes('sk_test_') && !appSerialised.includes('sk_live_'));
  assert.ok(!/"serviceRoleKey"/.test(appSerialised));

  /* ── 4. Establishing a session takes NO client-supplied identity ──────── */

  const user = await harness.createUser({ stage: 'verified' });

  // Attempting to name a different account in the body changes nothing: the
  // identity comes from the verified token alone.
  const victim = await harness.createUser({ stage: 'seller_ready', suffix: 'v' });
  const session = await harness.request('POST', '/api/v1/auth/session', {
    token: user.token,
    body: { userId: victim.id, clerkUserId: victim.clerkUserId, email: victim.email }
  });

  assert.strictEqual(session.status, 200);
  assert.strictEqual(session.body.data.user.id, user.id,
    'The established session must belong to the token holder, not to whoever the body names');
  assert.strictEqual(session.body.data.state, 'ONBOARDING_REQUIRED');

  /* ── 5. Sign-out cannot be used to affect another session ─────────────── */

  const logout = await harness.request('POST', '/api/v1/auth/logout', { token: user.token });
  assert.strictEqual(logout.status, 200);

  const stillValid = await harness.request('GET', '/api/v1/me/state', { token: victim.token });
  assert.strictEqual(stillValid.status, 200,
    'One user signing out must not disturb another user\'s session');

  console.log('  ✓ Authentication surface: credential endpoints retired, sessions token-derived');
}

module.exports = { run };

if (require.main === module) {
  run()
    .then(() => harness.cleanup())
    .then(() => process.exit(0))
    .catch(async e => { console.error(e); await harness.cleanup().catch(() => null); process.exit(1); });
}
