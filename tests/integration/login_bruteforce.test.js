/**
 * LOUMOO — Login Brute-Force & Credential-Stuffing Resistance (HTTP)
 * ---------------------------------------------------------------------------
 * Drives POST /api/v1/auth/login to prove the throttle gates repeated failures
 * before they ever reach the identity provider, and does so on a source+account
 * key rather than the account alone.
 *
 * `X-Forwarded-For` is set so that (with `trust proxy: 1`) `req.ip` is a known
 * value, letting the test seed the exact bucket the route derives. The blocked
 * requests short-circuit before Supabase, so this suite makes no network auth
 * call and creates nothing.
 */

require('../setup');
const assert = require('assert');
const harness = require('../helpers/harness');
const AuthThrottle = require('../../server/modules/identity/infrastructure/AuthThrottle');
const CacheService = require('../../server/infrastructure/cache/CacheService');

const SOURCE_IP = '203.0.113.7'; // TEST-NET-3, never a real client
const srcFp = AuthThrottle.fingerprint(SOURCE_IP);

function accountKey(email) {
  return `login:${srcFp}:${AuthThrottle.fingerprint(email)}`;
}
const sourceKey = `login:src:${srcFp}`;

// Seed a bucket already over any threshold, with a live 15-minute window.
async function seedBlocked(key) {
  const now = Date.now();
  await CacheService.set(
    key,
    { count: 999, firstAt: now, expiresAt: now + 900 * 1000 },
    900,
    AuthThrottle.NAMESPACE
  );
}

async function run() {
  console.log('  Testing login brute-force & stuffing resistance...');

  await harness.start();

  const targetEmail = `login_bf_${Date.now().toString(36)}@loumoo-test.cm`;
  const otherEmail = `login_bf_other_${Date.now().toString(36)}@loumoo-test.cm`;
  const headers = { 'X-Forwarded-For': SOURCE_IP };

  try {
    /* ── 1. Per-account bucket over the limit → 429 before Supabase ───────── */
    await seedBlocked(accountKey(targetEmail));
    const blocked = await harness.request('POST', '/api/v1/auth/login', {
      headers,
      body: { email: targetEmail, password: 'whatever-they-guess' }
    });
    assert.strictEqual(blocked.status, 429,
      'A source that has exhausted its guesses for an account must be throttled');
    assert.strictEqual(blocked.body.error.code, 'RATE_LIMITED',
      'The throttle must answer with the rate-limit code');
    assert.ok(blocked.headers['retry-after'], 'A 429 must tell the caller when to retry');
    const throttleMessage = blocked.body.error.message;

    /* ── 2. The message does not depend on whether the account exists ─────── */
    // A different (also-blocked) email yields the SAME message — no enumeration.
    await seedBlocked(accountKey(otherEmail));
    const blockedOther = await harness.request('POST', '/api/v1/auth/login', {
      headers,
      body: { email: otherEmail, password: 'another-guess' }
    });
    assert.strictEqual(blockedOther.status, 429);
    assert.strictEqual(blockedOther.body.error.message, throttleMessage,
      'The throttle response must be identical regardless of the address');

    /* ── 3. Source-wide bucket gates stuffing across many accounts ────────── */
    await AuthThrottle.clear(accountKey(targetEmail)); // ensure the account bucket is clear
    await seedBlocked(sourceKey);
    const stuffed = await harness.request('POST', '/api/v1/auth/login', {
      headers,
      body: { email: `never_seen_${Date.now()}@loumoo-test.cm`, password: 'x' }
    });
    assert.strictEqual(stuffed.status, 429,
      'A source failing across many accounts must be throttled even on a fresh account');

    /* ── 4. A different source is unaffected — no victim lock-out ─────────── */
    // The block is keyed on THIS source; a caller from elsewhere is not blocked
    // by our seeded buckets. (This request is allowed through to validation,
    // proving the gate did not fire; we stop at a malformed body to avoid a
    // live credential check.)
    const otherSource = await harness.request('POST', '/api/v1/auth/login', {
      headers: { 'X-Forwarded-For': '198.51.100.23' },
      body: { email: '', password: '' }
    });
    assert.strictEqual(otherSource.status, 400,
      'A different source must pass the throttle gate and reach normal validation');

    console.log('  ✓ Login throttle: source+account keyed, stuffing-aware, no cross-source lock-out');
  } finally {
    await AuthThrottle.clear(accountKey(targetEmail));
    await AuthThrottle.clear(accountKey(otherEmail));
    await AuthThrottle.clear(sourceKey);
  }
}

module.exports = { run };

if (require.main === module) {
  run()
    .then(() => harness.cleanup())
    .then(() => process.exit(0))
    .catch(async e => { console.error(e); await harness.cleanup().catch(() => null); process.exit(1); });
}
