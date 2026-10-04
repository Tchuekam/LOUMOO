/**
 * LOUMOO SuperAdmin — maintenance mode has no hard-coded way through
 * ---------------------------------------------------------------------------
 * `maintenanceGuard` used to skip the 503 for anyone sending
 * `Authorization: Bearer admin_token` (or `user_admin`, or any token merely
 * containing `super_admin`), or the header `x-admin-key: loumoo_dev_admin`,
 * whenever NODE_ENV was anything but 'production' — staging, development,
 * unset, or misspelled. Customers could place orders while the platform was
 * deliberately offline.
 *
 * The guard is mounted at app level BEFORE any auth runs, so the only thing that
 * can lift maintenance for a request is a `req.principal` that an upstream layer
 * resolved to an administrator. Nothing in the request itself — no string, no
 * header — is trusted. That is the same posture production already had.
 *
 * Each scenario runs in a clean child process (this file re-invoked with
 * `--probe`): the guard reads a cached setting and config is evaluated once at
 * import, so one process per scenario keeps them independent. Every probe is
 * checked both against the guard directly and over HTTP through the real app.
 *
 * Hermetic by construction: the child gets a scrubbed environment (no Supabase /
 * Clerk / Redis credentials, whatever the parent has) and an EMPTY working
 * directory, so `server/config/env.js` cannot load a `.env` / `.env.local`. The
 * child also reports whether a Supabase admin client exists, and the parent
 * asserts it does not — so this suite provably cannot reach a real project.
 */

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const GUARD_PATH = path.join(PROJECT_ROOT, 'SuperAdmin', 'backend', 'middleware', 'maintenanceGuard.js');
const REPO_PATH = path.join(PROJECT_ROOT, 'SuperAdmin', 'backend', 'repositories', 'SuperAdminRepository.js');
const SUPABASE_CLIENT_PATH = path.join(PROJECT_ROOT, 'server', 'infrastructure', 'database', 'SupabaseClient.js');
const SERVER_PATH = path.join(PROJECT_ROOT, 'server', 'index.js');
const CUSTOMER_ROUTE = '/api/v1/orders';

const TEST_SECRET = 'unit-test-secret-not-a-credential';
const BANNER = 'Scheduled maintenance window - back shortly.';

const ON = { enabled: true, banner_text: BANNER, allow_admin_bypass: true };
const ON_NO_ADMIN_BYPASS = { enabled: true, banner_text: BANNER, allow_admin_bypass: false };
const OFF = { enabled: false, banner_text: BANNER, allow_admin_bypass: true };

/* ----------------------------------------------------------------- child side */

async function probe() {
  const http = require('http');
  const SuperAdminRepository = require(REPO_PATH);
  const { maintenanceGuard } = require(GUARD_PATH);
  const { getAdminClient } = require(SUPABASE_CLIENT_PATH);
  const { maintenance, probes, http: withHttp } = JSON.parse(process.env.MAINT_PROBE);

  // With no credentials the repository has no database and keeps settings in memory.
  await SuperAdminRepository.updateSetting('maintenance_mode', maintenance, 'unit-test');

  let server = null;
  let baseUrl = null;
  if (withHttp) {
    server = http.createServer(require(SERVER_PATH));
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    baseUrl = `http://127.0.0.1:${server.address().port}`;
  }

  const results = [];
  for (const { name, headers, principal } of probes) {
    const req = { method: 'POST', path: CUSTOMER_ROUTE, headers: { ...headers } };
    if (principal) req.principal = { ...principal };
    const res = {
      statusCode: null,
      body: null,
      status(code) { this.statusCode = code; return this; },
      json(body) { this.body = body; return this; }
    };
    let passed = false;
    await maintenanceGuard(req, res, () => { passed = true; });
    const guard = {
      passed,
      status: res.statusCode,
      code: res.body && res.body.error ? res.body.error.code : null,
      message: res.body && res.body.error ? res.body.error.message : null
    };

    let http_ = null;
    if (withHttp) {
      const response = await fetch(`${baseUrl}${CUSTOMER_ROUTE}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', ...headers },
        body: '{}'
      });
      let body = null;
      try { body = await response.json(); } catch (_) { /* non-JSON body */ }
      http_ = { status: response.status, code: body && body.error ? body.error.code : null };
    }
    results.push({ name, guard, http: http_ });
  }

  console.log(JSON.stringify({ hermetic: getAdminClient() === null, results }));
  process.exit(0);
}

/* ---------------------------------------------------------------- parent side */

/** Only what `node` itself needs. Deliberately NOT `...process.env`. */
function hermeticEnv(overrides) {
  const keep = ['PATH', 'Path', 'SystemRoot', 'SYSTEMROOT', 'windir', 'COMSPEC', 'PATHEXT',
    'TEMP', 'TMP', 'TMPDIR', 'HOME', 'USERPROFILE'];
  const env = {};
  for (const key of keep) if (process.env[key] !== undefined) env[key] = process.env[key];
  return { ...env, CORS_ORIGINS: 'http://127.0.0.1', LOUMOO_TEST_AUTH_SECRET: '', ...overrides };
}

function runProbes({ nodeEnv, secret = '', maintenance, probes, http = true }) {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'loumoo-maint-probe-'));
  try {
    const env = hermeticEnv({
      LOUMOO_TEST_AUTH_SECRET: secret,
      MAINT_PROBE: JSON.stringify({ maintenance, probes, http })
    });
    if (nodeEnv !== undefined) env.NODE_ENV = nodeEnv;

    const stdout = execFileSync(process.execPath, [__filename, '--probe'], {
      cwd, env, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 90000
    });
    const lines = stdout.split('\n').filter(Boolean);
    const out = JSON.parse(lines[lines.length - 1]);
    assert.strictEqual(out.hermetic, true, 'the probe must run with no Supabase admin client (no real database)');
    assert.strictEqual(out.results.length, probes.length);
    return out.results;
  } finally {
    fs.rmSync(cwd, { recursive: true, force: true });
  }
}

const describeEnv = nodeEnv => (nodeEnv === undefined ? 'NODE_ENV unset' : `NODE_ENV=${nodeEnv}`);

/** Everything the old guard honoured. */
const LEGACY = [
  { name: 'Bearer admin_token', headers: { authorization: 'Bearer admin_token' } },
  { name: 'Bearer user_admin', headers: { authorization: 'Bearer user_admin' } },
  { name: 'Bearer x_super_admin_x', headers: { authorization: 'Bearer x_super_admin_x' } },
  { name: 'x-admin-key: loumoo_dev_admin', headers: { 'x-admin-key': 'loumoo_dev_admin' } },
  {
    name: 'Bearer admin_token + x-admin-key',
    headers: { authorization: 'Bearer admin_token', 'x-admin-key': 'loumoo_dev_admin' }
  }
];

function assertBlocked(label, { name, guard, http }) {
  assert.strictEqual(guard.passed, false, `[${label}] guard must not let through: ${name}`);
  assert.strictEqual(guard.status, 503, `[${label}] guard must answer 503 for: ${name}`);
  assert.strictEqual(guard.code, 'MAINTENANCE_MODE', `[${label}] guard must answer MAINTENANCE_MODE for: ${name}`);
  assert.strictEqual(guard.message, BANNER, `[${label}] the maintenance banner must be shown for: ${name}`);
  if (http) {
    assert.strictEqual(http.status, 503, `[${label}] POST ${CUSTOMER_ROUTE} must answer 503 over HTTP for: ${name}`);
    assert.strictEqual(http.code, 'MAINTENANCE_MODE', `[${label}] the 503 must be MAINTENANCE_MODE (not some other failure) for: ${name}`);
  }
}

async function run() {
  console.log('  Testing maintenanceGuard: no hard-coded bypass in any non-production NODE_ENV...');

  /* ── 1. Maintenance on, no test secret: no string or header lifts it, in any NODE_ENV ── */

  // 'prod' is a misspelling of 'production': the exact case the old
  // `NODE_ENV !== 'production'` check treated as a development machine.
  for (const nodeEnv of ['staging', 'development', undefined, 'prod']) {
    const label = describeEnv(nodeEnv);
    const results = runProbes({ nodeEnv, maintenance: ON, probes: LEGACY });
    for (const r of results) assertBlocked(label, r);
    console.log(`    ✓ ${label}, maintenance on: admin_token / user_admin / x_super_admin_x / x-admin-key all → 503 MAINTENANCE_MODE (guard and HTTP)`);
  }

  /* ── 2. Having the harness test secret configured revives nothing ── */

  // tests/setup.js sets a secret for every normal test run, so this is the
  // environment the rest of the suite lives in. The guard looks at no token at
  // all, so not even a well-formed test token for the super-admin subject helps.
  const withSecret = runProbes({
    nodeEnv: 'staging',
    secret: TEST_SECRET,
    maintenance: ON,
    probes: [
      ...LEGACY,
      { name: 'well-formed loumoo_test super-admin token', headers: { authorization: `Bearer loumoo_test:${TEST_SECRET}:loumoo_test_super_admin` } }
    ]
  });
  for (const r of withSecret) assertBlocked('NODE_ENV=staging, test secret set', r);
  console.log('    ✓ NODE_ENV=staging with a test secret configured: legacy strings and a valid test token still → 503 MAINTENANCE_MODE');

  /* ── 3. Control: with maintenance off the same requests are admitted ── */

  // Without this, a 503 above could come from anything. Here the guard must wave
  // every one of them through, and the real app must answer with something other
  // than MAINTENANCE_MODE (no auth header → the order route's own 401).
  const off = runProbes({ nodeEnv: 'staging', maintenance: OFF, probes: LEGACY });
  for (const { name, guard, http } of off) {
    assert.strictEqual(guard.passed, true, `with maintenance off the guard must call next() for: ${name}`);
    assert.strictEqual(guard.status, null, `with maintenance off the guard must not respond for: ${name}`);
    assert.notStrictEqual(http.code, 'MAINTENANCE_MODE', `with maintenance off the app must not answer MAINTENANCE_MODE for: ${name}`);
    assert.notStrictEqual(http.status, 503, `with maintenance off the app must not answer 503 for: ${name}`);
  }
  console.log('    ✓ maintenance off: the same requests are admitted (the 503s above are really the maintenance block)');

  /* ── 4. The one legitimate way through is still there: a resolved admin principal ── */

  const principals = runProbes({
    nodeEnv: 'staging',
    maintenance: ON,
    http: false,
    probes: [
      { name: 'principal: super_admin', headers: {}, principal: { id: 'usr_super', primaryRole: 'super_admin' } },
      { name: 'principal: admin', headers: {}, principal: { id: 'usr_admin', primaryRole: 'admin' } },
      { name: 'principal: customer', headers: {}, principal: { id: 'usr_customer', primaryRole: 'customer' } },
      // A customer who also sends every legacy credential is still a customer.
      {
        name: 'principal: customer + admin_token + x-admin-key',
        headers: { authorization: 'Bearer admin_token', 'x-admin-key': 'loumoo_dev_admin' },
        principal: { id: 'usr_customer', primaryRole: 'customer' }
      }
    ]
  });
  const byName = Object.fromEntries(principals.map(r => [r.name, r]));
  for (const name of ['principal: super_admin', 'principal: admin']) {
    assert.strictEqual(byName[name].guard.passed, true, `a resolved administrator must pass maintenance: ${name}`);
  }
  assertBlocked('principal', byName['principal: customer']);
  assertBlocked('principal', byName['principal: customer + admin_token + x-admin-key']);

  const noBypass = runProbes({
    nodeEnv: 'staging',
    maintenance: ON_NO_ADMIN_BYPASS,
    http: false,
    probes: [{ name: 'principal: super_admin, bypass disabled by policy', headers: {}, principal: { id: 'usr_super', primaryRole: 'super_admin' } }]
  });
  assertBlocked('allow_admin_bypass=false', noBypass[0]);
  console.log('    ✓ a resolved admin principal still bypasses (unless policy forbids it); customers do not, whatever headers they send');

  console.log('  All maintenanceGuard bypass-hardening tests passed.\n');
}

module.exports = { run };

if (require.main === module) {
  if (process.argv.includes('--probe')) {
    probe().catch(err => { console.error(err); process.exit(1); });
  } else {
    run().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
  }
}
