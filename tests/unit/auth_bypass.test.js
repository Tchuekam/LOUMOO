/**
 * LOUMOO — Development Mechanisms Cannot Run In Production
 * ---------------------------------------------------------------------------
 * The brief allows a development-only mechanism, but requires that it can NEVER
 * execute in production. This suite loads the configuration in a clean child
 * process with NODE_ENV=production and asserts the bypass is off — even with
 * the secret deliberately set, which is the exact misconfiguration that would
 * otherwise be catastrophic.
 */

require('../setup');
const assert = require('assert');
const { execFileSync } = require('child_process');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..', '..');

function evalInEnv(script, env) {
  return execFileSync(process.execPath, ['-e', script], {
    cwd: PROJECT_ROOT,
    env: { ...process.env, ...env },
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  }).trim();
}

async function run() {
  /* ── 1. The bypass is disabled under NODE_ENV=production ──────────────── */

  const productionState = evalInEnv(
    "const c = require('./server/config/env'); console.log(JSON.stringify({enabled: c.testAuth.enabled, isProduction: c.isProduction}));",
    {
      NODE_ENV: 'production',
      // Deliberately present: the point is that its presence changes nothing.
      LOUMOO_TEST_AUTH_SECRET: 'a-secret-that-must-not-work-in-production'
    }
  );

  const parsed = JSON.parse(productionState);
  assert.strictEqual(parsed.isProduction, true);
  assert.strictEqual(parsed.enabled, false,
    'The test authentication bypass MUST be disabled in production even when the secret is set');

  /* ── 2. And enabled in development, so the harness works ──────────────── */

  const devState = evalInEnv(
    "const c = require('./server/config/env'); console.log(JSON.stringify({enabled: c.testAuth.enabled}));",
    { NODE_ENV: 'test', LOUMOO_TEST_AUTH_SECRET: 'harness-secret' }
  );
  assert.strictEqual(JSON.parse(devState).enabled, true);

  /* ── 3. Production refuses to boot when it cannot enforce security ────── */

  let refused = false;
  let message = '';
  try {
    evalInEnv(
      "require('./server/config/env').assertProductionConfig(); console.log('BOOTED');",
      {
        NODE_ENV: 'production',
        CLERK_SECRET_KEY: '',
        CLERK_PUBLISHABLE_KEY: '',
        CLERK_WEBHOOK_SECRET: '',
        SUPABASE_URL: '',
        SUPABASE_SERVICE_ROLE_KEY: '',
        CORS_ORIGINS: '*'
      }
    );
  } catch (err) {
    refused = true;
    message = String(err.stderr || err.message);
  }

  assert.ok(refused,
    'A production server missing its security credentials must refuse to start, not degrade silently');
  assert.ok(message.includes('CLERK_SECRET_KEY'),
    'The refusal must name the missing variables so the operator can fix it');
  assert.ok(message.includes('CORS_ORIGINS'),
    'A wildcard CORS origin must be rejected in production');

  /* ── 4. The bypass secret itself is a production misconfiguration ─────── */

  const problems = JSON.parse(evalInEnv(
    "console.log(JSON.stringify(require('./server/config/env').validateProductionConfig().map(p => p.variable)));",
    {
      NODE_ENV: 'production',
      LOUMOO_TEST_AUTH_SECRET: 'leaked',
      CLERK_SECRET_KEY: 'sk_live_x',
      CLERK_PUBLISHABLE_KEY: 'pk_live_x',
      CLERK_WEBHOOK_SECRET: 'whsec_x',
      SUPABASE_URL: 'https://example.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'service_role_key_value',
      CORS_ORIGINS: 'https://loumoo.cm'
    }
  ));

  assert.ok(problems.includes('LOUMOO_TEST_AUTH_SECRET'),
    'Setting the test bypass secret in production must be reported as a misconfiguration');

  console.log('  ✓ Development bypass provably cannot execute in production');
}

module.exports = { run };

if (require.main === module) {
  run().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
}
