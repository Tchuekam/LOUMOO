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
const dns = require('dns');

if (typeof dns.setDefaultResultOrder === 'function') {
  dns.setDefaultResultOrder('ipv4first');
}

if (!process.env.NODE_ENV || process.env.NODE_ENV === 'production') {
  process.env.NODE_ENV = 'test';
}

// Hermetic unless real services were explicitly opted into (LOUMOO_RUN_INTEGRATION=1).
// Done here, not only in tests/run_all.js, so it holds for every entry point —
// `node tests/unit/x.test.js`, `npm run test:security`, tests/runner.js — and runs
// before server/config/env.js reads credentials or .env. Several "unit" suites write
// to Supabase whenever credentials are present.
const requirements = require('./helpers/requirements');
if (requirements.realServicesEnabled()) {
  requirements.loadProjectEnv();
  requirements.refuseUnacknowledgedProduction();
} else {
  requirements.scrubServiceEnv(process.env);
}

if (!process.env.LOUMOO_TEST_AUTH_SECRET) {
  process.env.LOUMOO_TEST_AUTH_SECRET = crypto.randomBytes(24).toString('hex');
}

// Keep the global limiter out of the way of tight test loops.
process.env.CORS_ORIGINS = process.env.CORS_ORIGINS || 'http://127.0.0.1';

module.exports = { ready: true };
