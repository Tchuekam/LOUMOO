/**
 * LOUMOO — Authentication Failure Throttle (unit)
 * ---------------------------------------------------------------------------
 * Verifies the counter that backs login and OTP-generation brute-force
 * protection: source+account keyed fingerprints that never store the raw
 * identifier, a fixed window that a fresh failure cannot extend, blocking at
 * the threshold, and a clean reset on clear() or window expiry.
 */

require('../setup');
const assert = require('assert');

const AuthThrottle = require('../../server/modules/identity/infrastructure/AuthThrottle');
const CacheService = require('../../server/infrastructure/cache/CacheService');

async function run() {
  console.log('  Testing auth failure throttle...');

  /* ── 1. Fingerprints are deterministic, hiding, and identifier-combining ─ */
  const a = AuthThrottle.fingerprint('203.0.113.7', 'user@loumoo.cm');
  const b = AuthThrottle.fingerprint('203.0.113.7', 'user@loumoo.cm');
  const cDifferentSource = AuthThrottle.fingerprint('203.0.113.8', 'user@loumoo.cm');
  assert.strictEqual(a, b, 'Same inputs must fingerprint identically');
  assert.notStrictEqual(a, cDifferentSource, 'A different source must fingerprint differently');
  assert.match(a, /^[0-9a-f]{32}$/, 'A fingerprint is a truncated hex digest');
  assert.ok(!a.includes('user@loumoo.cm') && !a.includes('203.0.113.7'),
    'The raw identifiers must never appear in the fingerprint');

  const key = `test:${AuthThrottle.fingerprint('unit-' + Date.now())}`;
  const cfg = { max: 3, windowSeconds: 120 };

  try {
    /* ── 2. An empty bucket is never blocked ────────────────────────────── */
    let state = await AuthThrottle.check(key, cfg);
    assert.strictEqual(state.blocked, false);
    assert.strictEqual(state.count, 0);

    /* ── 3. Failures accrue; blocked exactly at the threshold ───────────── */
    assert.strictEqual(await AuthThrottle.recordFailure(key, { windowSeconds: 120 }), 1);
    assert.strictEqual(await AuthThrottle.recordFailure(key, { windowSeconds: 120 }), 2);
    state = await AuthThrottle.check(key, cfg);
    assert.strictEqual(state.blocked, false, 'Below the threshold must not block');
    assert.strictEqual(state.count, 2);

    assert.strictEqual(await AuthThrottle.recordFailure(key, { windowSeconds: 120 }), 3);
    state = await AuthThrottle.check(key, cfg);
    assert.strictEqual(state.blocked, true, 'At the threshold must block');
    assert.ok(state.retryAfter > 0, 'A blocked bucket reports how long to wait');

    /* ── 4. A fresh failure must NOT extend the fixed window ─────────────── */
    const before = await CacheService.get(key, AuthThrottle.NAMESPACE);
    await AuthThrottle.recordFailure(key, { windowSeconds: 120 });
    const after = await CacheService.get(key, AuthThrottle.NAMESPACE);
    assert.strictEqual(after.expiresAt, before.expiresAt,
      'Continuing to hammer a blocked bucket must not push its expiry out');

    /* ── 5. clear() resets it (the success path) ────────────────────────── */
    await AuthThrottle.clear(key);
    state = await AuthThrottle.check(key, cfg);
    assert.strictEqual(state.blocked, false);
    assert.strictEqual(state.count, 0);

    /* ── 6. An elapsed window is treated as a reset, not a lockout ──────── */
    const expiredKey = `test:${AuthThrottle.fingerprint('expired-' + Date.now())}`;
    await CacheService.set(expiredKey,
      { count: 99, firstAt: Date.now() - 100000, expiresAt: Date.now() - 1000 },
      120, AuthThrottle.NAMESPACE);
    state = await AuthThrottle.check(expiredKey, cfg);
    assert.strictEqual(state.blocked, false, 'An elapsed window must never keep a user locked out');
    await CacheService.delete(expiredKey, AuthThrottle.NAMESPACE);

    console.log('  ✓ Auth throttle: hiding fingerprints, fixed window, threshold block, clean reset');
  } finally {
    await AuthThrottle.clear(key);
  }
}

module.exports = { run };

if (require.main === module) {
  run().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
}
