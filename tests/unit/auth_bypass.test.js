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

function evalInEnv(script, env, options = {}) {
  return execFileSync(process.execPath, ['-e', script], {
    cwd: PROJECT_ROOT,
    env: { ...process.env, ...env },
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    ...options
  }).trim();
}

/** Parses the last line of a child process's stdout as JSON. */
function lastJsonLine(stdout) {
  const lines = stdout.split('\n').filter(Boolean);
  return JSON.parse(lines[lines.length - 1]);
}

/** Env shared by the production-mode child processes below. */
function productionEnv(overrides = {}) {
  return {
    NODE_ENV: 'production',
    // Deliberately dummy: the point is that the server boots when the
    // security-critical credentials are PRESENT, and CLERK_WEBHOOK_SECRET is
    // the one credential whose absence must NOT block boot.
    CLERK_SECRET_KEY: 'sk_test_dummy',
    CLERK_PUBLISHABLE_KEY: 'pk_test_dummy',
    CLERK_WEBHOOK_SECRET: '',
    SUPABASE_URL: 'https://example.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: 'sb_test_dummy',
    CORS_ORIGINS: 'https://loumoo.cm',
    LOUMOO_TEST_AUTH_SECRET: '',
    ...overrides
  };
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
        SUPABASE_ANON_KEY: '',
        SUPABASE_JWT_SECRET: '',
        CORS_ORIGINS: '*'
      }
    );
  } catch (err) {
    refused = true;
    message = String(err.stderr || err.message);
  }

  assert.ok(refused,
    'A production server missing its security credentials must refuse to start, not degrade silently');
  /*
   * This asserted CLERK_SECRET_KEY, from when Clerk verified sessions. It no
   * longer does — authGuard verifies LOUMOO/Supabase HS256 tokens signed with
   * SUPABASE_JWT_SECRET, and that secret had NO production check at all while a
   * hardcoded fallback value sat in the repository. Boot must now refuse over
   * the credential that actually protects sessions.
   */
  assert.ok(message.includes('SUPABASE_JWT_SECRET'),
    'The refusal must name the session-signing secret so the operator can fix it');
  assert.ok(message.includes('SUPABASE_SERVICE_ROLE_KEY'),
    'The refusal must name every missing security credential, not just the first');
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

  /* ── 5. CLERK_WEBHOOK_SECRET is a warning, NOT a boot blocker ──────────── */
  /*    .env.example documents that without it the webhook endpoint answers  */
  /*    503. The old code threw at boot, contradicting the docs and blocking */
  /*    every deployment whose operator does not yet have a signing secret.  */

  const bootWithoutWebhookSecret = lastJsonLine(evalInEnv(
    `const c = require('./server/config/env');
     c.assertProductionConfig();                      // must NOT throw
     const problems = c.validateProductionConfig();
     const wh = problems.find(p => p.variable === 'CLERK_WEBHOOK_SECRET');
     console.log(JSON.stringify({
       booted: true,
       reported: Boolean(wh),
       severity: wh ? wh.severity : null,
       fatalCount: problems.filter(p => p.severity === 'error').length
     }));`,
    productionEnv()
  ));

  assert.strictEqual(bootWithoutWebhookSecret.booted, true,
    'Production must boot without CLERK_WEBHOOK_SECRET — the endpoint degrades to 503, the deployment must not');
  assert.strictEqual(bootWithoutWebhookSecret.reported, true,
    'validateProductionConfig must still surface the missing webhook secret');
  assert.strictEqual(bootWithoutWebhookSecret.severity, 'warning',
    'A missing webhook secret is a warning-level problem, not a boot blocker');
  assert.strictEqual(bootWithoutWebhookSecret.fatalCount, 0,
    'No fatal configuration problems must remain when only the webhook secret is absent');

  /* ── 6. The live webhook route answers 503 WEBHOOK_NOT_CONFIGURED ─────── */

  const webhookProbe = lastJsonLine(evalInEnv(
    `const http = require('http');
     const app = require('./server/index');           // boots the REAL server
     const server = http.createServer(app);
     server.listen(0, '127.0.0.1', () => {
       const port = server.address().port;
       const payload = JSON.stringify({ type: 'user.deleted', data: { id: 'user_attacker' } });
       const req = http.request({
         host: '127.0.0.1', port, path: '/api/v1/webhooks/clerk', method: 'POST',
         headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }
       }, res => {
         let body = '';
         res.on('data', c => body += c);
         res.on('end', () => {
           let parsed = null;
           try { parsed = JSON.parse(body); } catch (e) { /* not JSON */ }
           console.log(JSON.stringify({ status: res.statusCode, code: parsed && parsed.error && parsed.error.code }));
           server.close(() => process.exit(0));
         });
       });
       req.on('error', err => { console.error(err); process.exit(1); });
       req.write(payload); req.end();
     });`,
    productionEnv(),
    { timeout: 30000 }
  ));

  assert.strictEqual(webhookProbe.status, 503,
    'The Clerk webhook endpoint must answer 503 when CLERK_WEBHOOK_SECRET is not configured');
  assert.strictEqual(webhookProbe.code, 'WEBHOOK_NOT_CONFIGURED',
    'The 503 must carry the machine-readable WEBHOOK_NOT_CONFIGURED code');

  console.log('  ✓ Development bypass provably cannot execute in production');
}

module.exports = { run };

if (require.main === module) {
  run().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
}
