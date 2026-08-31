/**
 * LOUMOO — Test environment bootstrap.
 *
 * Required BEFORE anything loads the config, because `config.testAuth.enabled`
 * is evaluated once at module load. Sets NODE_ENV=test and a per-run test
 * authentication secret so the harness can mint principals.
 *
 * Production safety: `config.testAuth.enabled` is hard-wired to false whenever
 * NODE_ENV === 'production', so this file cannot weaken a production server
 * even if it were somehow loaded there. `tests/unit/auth_bypass.test.js`
 * asserts exactly that.
 */

const crypto = require('crypto');

if (!process.env.NODE_ENV || process.env.NODE_ENV === 'production') {
  process.env.NODE_ENV = 'test';
}

if (!process.env.LOUMOO_TEST_AUTH_SECRET) {
  process.env.LOUMOO_TEST_AUTH_SECRET = crypto.randomBytes(24).toString('hex');
}

// Keep the global limiter out of the way of tight test loops.
process.env.CORS_ORIGINS = process.env.CORS_ORIGINS || 'http://127.0.0.1';

module.exports = { ready: true };
