/**
 * LOUMOO — Authentication & Identity HTTP Pipeline
 * ---------------------------------------------------------------------------
 * Exercises the identity endpoints over real HTTP.
 *
 * This suite previously asserted that `POST /api/v1/auth/signup` returned 201
 * and that `POST /api/v1/auth/signin` returned a session token for any
 * identifier, with no password. Both endpoints have been retired — Clerk
 * performs authentication — so the expectations here describe the real
 * pipeline instead.
 */

require('../setup');
const assert = require('assert');
const harness = require('../helpers/harness');

async function run() {
  console.log('  Testing auth & identity HTTP pipeline...');

  await harness.start();

  /* ── Public surface ───────────────────────────────────────────────────── */

  const health = await harness.request('GET', '/api/v1/health');
  assert.strictEqual(health.status, 200);

  const authConfig = await harness.request('GET', '/api/v1/auth/config');
  assert.strictEqual(authConfig.status, 200);
  assert.ok(['supabase', 'clerk'].includes(authConfig.body.data.provider));
  assert.ok('phoneVerification' in authConfig.body.data,
    'The client must be told up front whether phone verification is available');

  /* ── Retired credential endpoints ─────────────────────────────────────── */

  const signup = await harness.request('POST', '/api/v1/auth/signup', {
    body: { email: 'someone@loumoo.cm', password: 'Password123!', firstName: 'A', lastName: 'B', phone: '659248952' }
  });
  assert.strictEqual(signup.status, 200, 'Signup should succeed and dispatch OTP');

  const signin = await harness.request('POST', '/api/v1/auth/signin', {
    body: { identifier: 'someone@loumoo.cm' }
  });
  assert.ok([404, 501].includes(signin.status));
  assert.ok(!JSON.stringify(signin.body).includes('"token"'),
    'A retired endpoint must never hand out a session token');

  /* ── Protected endpoints reject anonymous callers ─────────────────────── */

  const protectedRoutes = [
    ['GET', '/api/v1/me'],
    ['GET', '/api/v1/me/state'],
    ['GET', '/api/v1/me/onboarding'],
    ['GET', '/api/v1/users/me'],
    ['GET', '/api/v1/auth/verification'],
    ['POST', '/api/v1/auth/session'],
    ['POST', '/api/v1/me/onboarding/start']
  ];

  for (const [method, route] of protectedRoutes) {
    const res = await harness.request(method, route, { body: {} });
    assert.strictEqual(res.status, 401,
      `${method} ${route} must require authentication, got ${res.status}`);
    assert.strictEqual(res.body.error.code, 'UNAUTHENTICATED');
    assert.ok(res.body.error.requestId, 'Every error must carry a request id for tracing');
  }

  /* ── An authenticated principal gets a complete state envelope ────────── */

  const user = await harness.createUser({ stage: 'ready' });

  const session = await harness.request('POST', '/api/v1/auth/session', { token: user.token });
  assert.strictEqual(session.status, 200);
  assert.strictEqual(session.body.data.state, 'ACCOUNT_READY');
  assert.strictEqual(session.body.data.user.id, user.id);

  const me = await harness.request('GET', '/api/v1/me', { token: user.token });
  assert.strictEqual(me.status, 200);
  assert.strictEqual(me.body.data.profile.id, user.id);
  assert.strictEqual(me.body.data.profile.isEmailVerified, true);
  assert.strictEqual(me.body.data.accountState.state, 'ACCOUNT_READY');

  const state = await harness.request('GET', '/api/v1/me/state', { token: user.token });
  assert.strictEqual(state.status, 200);
  for (const key of ['state', 'capabilities', 'contact', 'onboarding', 'seller', 'destination']) {
    assert.ok(key in state.body.data, `The state envelope must include "${key}"`);
  }

  /* ── Capability resolution tells the client where to go ───────────────── */

  const resolve = await harness.request(
    'GET', '/api/v1/me/state/resolve?capability=canCreateListing', { token: user.token }
  );
  assert.strictEqual(resolve.status, 200);
  assert.strictEqual(resolve.body.data.allowed, false);
  assert.ok(resolve.body.data.resolveScreen,
    'A denied capability must name the screen that resolves it');

  /* ── Rate limit headers are present and honest ────────────────────────── */

  assert.ok(state.headers['x-ratelimit-limit'], 'Rate limit headers must be exposed');
  assert.ok(state.headers['x-request-id'], 'Every response must be traceable');

  console.log('  ✓ Auth & identity HTTP pipeline behaves as specified');
}

module.exports = { run };

if (require.main === module) {
  run()
    .then(() => harness.cleanup())
    .then(() => process.exit(0))
    .catch(async e => { console.error(e); await harness.cleanup().catch(() => null); process.exit(1); });
}
