/**
 * LOUMOO SuperAdmin — the guard has no hard-coded way in
 * ---------------------------------------------------------------------------
 * `requireSuperAdminRole` used to grant super-admin to anyone sending
 * `Authorization: Bearer admin_token` (or `user_admin`, or any token merely
 * containing `super_admin`), or the header `x-admin-key: loumoo_dev_admin`,
 * whenever NODE_ENV was anything but 'production' — staging, development,
 * unset, or misspelled.
 *
 * The only non-session way in now is the project's test-auth mechanism, which
 * `config.testAuth.enabled` decides ONCE at import time. So every scenario runs
 * in a clean child process (this file re-invoked with `--probe`), and each probe
 * is checked both against the guard directly and over HTTP through the real app.
 *
 * Hermetic by construction: the child gets a scrubbed environment (no Supabase /
 * Clerk / Redis credentials, whatever the parent has) and an EMPTY working
 * directory, so `server/config/env.js` cannot load a `.env` / `.env.local`.
 */

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const GUARD_PATH = path.join(PROJECT_ROOT, 'SuperAdmin', 'backend', 'middleware', 'superAdminGuard.js');
const SERVER_PATH = path.join(PROJECT_ROOT, 'server', 'index.js');
const ADMIN_URL_PATH = '/api/v1/admin/settings';

const TEST_SECRET = 'unit-test-secret-not-a-credential';

/* ----------------------------------------------------------------- child side */

async function probe() {
  const http = require('http');
  const { requireSuperAdminRole } = require(GUARD_PATH);
  const probes = JSON.parse(process.env.GUARD_PROBES);
  const withHttp = process.env.GUARD_PROBE_HTTP === '1';

  let server = null;
  let baseUrl = null;
  if (withHttp) {
    server = http.createServer(require(SERVER_PATH));
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    baseUrl = `http://127.0.0.1:${server.address().port}`;
  }

  const results = [];
  for (const { name, headers } of probes) {
    const req = { headers: { ...headers } };
    const guard = { passed: false, statusCode: null };
    await requireSuperAdminRole(req, {}, err => {
      if (err) guard.statusCode = err.statusCode || 500;
      else guard.passed = true;
    });
    guard.granted = Boolean(req.principal && req.principal.primaryRole === 'super_admin');

    let status = null;
    if (withHttp) {
      const res = await fetch(`${baseUrl}${ADMIN_URL_PATH}`, { headers });
      status = res.status;
    }
    results.push({ name, guard, status });
  }

  console.log(JSON.stringify(results));
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

function runProbes({ nodeEnv, secret = '', probes, http = true }) {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'loumoo-guard-probe-'));
  try {
    const env = hermeticEnv({
      LOUMOO_TEST_AUTH_SECRET: secret,
      GUARD_PROBES: JSON.stringify(probes),
      GUARD_PROBE_HTTP: http ? '1' : '0'
    });
    if (nodeEnv !== undefined) env.NODE_ENV = nodeEnv;

    const stdout = execFileSync(process.execPath, [__filename, '--probe'], {
      cwd, env, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 90000
    });
    const lines = stdout.split('\n').filter(Boolean);
    return JSON.parse(lines[lines.length - 1]);
  } finally {
    fs.rmSync(cwd, { recursive: true, force: true });
  }
}

const describeEnv = nodeEnv => (nodeEnv === undefined ? 'NODE_ENV unset' : `NODE_ENV=${nodeEnv}`);

/** Everything the old guard honoured, plus test-token shapes with no secret behind them. */
const LEGACY_AND_FORGED = [
  { name: 'Bearer admin_token', headers: { authorization: 'Bearer admin_token' } },
  { name: 'Bearer user_admin', headers: { authorization: 'Bearer user_admin' } },
  { name: 'Bearer x_super_admin_x', headers: { authorization: 'Bearer x_super_admin_x' } },
  { name: 'x-admin-key: loumoo_dev_admin', headers: { 'x-admin-key': 'loumoo_dev_admin' } },
  {
    name: 'Bearer admin_token + x-admin-key',
    headers: { authorization: 'Bearer admin_token', 'x-admin-key': 'loumoo_dev_admin' }
  }
];

async function run() {
  console.log('  Testing SuperAdmin guard: no hard-coded bypass in any non-production NODE_ENV...');

  /* ── 1. No test secret configured: nothing grants access, in any NODE_ENV ── */

  const forgedTestTokens = [
    { name: 'loumoo_test token, guessed secret', headers: { authorization: 'Bearer loumoo_test:guess:loumoo_test_super_admin' } },
    { name: 'loumoo_test token, empty secret', headers: { authorization: 'Bearer loumoo_test::loumoo_test_super_admin' } }
  ];

  // 'prod' is a misspelling of 'production': the exact case the old
  // `NODE_ENV !== 'production'` check treated as a development machine.
  for (const nodeEnv of ['staging', 'development', undefined, 'prod']) {
    const label = describeEnv(nodeEnv);
    const results = runProbes({ nodeEnv, probes: [...LEGACY_AND_FORGED, ...forgedTestTokens] });
    assert.strictEqual(results.length, LEGACY_AND_FORGED.length + forgedTestTokens.length);

    for (const { name, guard, status } of results) {
      assert.strictEqual(guard.granted, false, `[${label}] guard must not grant super-admin for: ${name}`);
      assert.strictEqual(guard.passed, false, `[${label}] guard must not pass: ${name}`);
      assert.strictEqual(guard.statusCode, 401, `[${label}] guard must answer 401 for: ${name}`);
      assert.strictEqual(status, 401, `[${label}] ${ADMIN_URL_PATH} must answer 401 over HTTP for: ${name}`);
    }
    console.log(`    ✓ ${label}, no test secret: admin_token / user_admin / x_super_admin_x / x-admin-key all → 401 (guard and HTTP)`);
  }

  /* ── 2. Test secret configured (non-production): the sanctioned way in, and ONLY it ── */

  const validToken = `loumoo_test:${TEST_SECRET}:loumoo_test_super_admin`;
  const configured = runProbes({
    nodeEnv: 'staging',
    secret: TEST_SECRET,
    probes: [
      { name: 'valid secret, super-admin subject', headers: { authorization: `Bearer ${validToken}` } },
      { name: 'wrong secret, super-admin subject', headers: { authorization: `Bearer loumoo_test:not-the-secret:loumoo_test_super_admin` } },
      // A perfectly valid test token for some OTHER subject (what harness.createUser mints
      // for a customer) must not become an administrator.
      { name: 'valid secret, ordinary subject', headers: { authorization: `Bearer loumoo_test:${TEST_SECRET}:user_test_customer` } },
      ...LEGACY_AND_FORGED
    ]
  });
  const byName = Object.fromEntries(configured.map(r => [r.name, r]));

  const ok = byName['valid secret, super-admin subject'];
  assert.strictEqual(ok.guard.passed, true, 'A correctly-signed test token for the super-admin subject must pass when test auth is enabled');
  assert.strictEqual(ok.guard.granted, true);
  assert.strictEqual(ok.status, 200, 'and reach the admin endpoint over HTTP');

  const wrong = byName['wrong secret, super-admin subject'];
  assert.strictEqual(wrong.guard.passed, false);
  assert.strictEqual(wrong.guard.statusCode, 401, 'A wrong test secret must be rejected with 401');
  assert.strictEqual(wrong.status, 401);

  const ordinary = byName['valid secret, ordinary subject'];
  assert.strictEqual(ordinary.guard.granted, false, 'A valid test token for an ordinary subject must never be a super administrator');
  assert.strictEqual(ordinary.guard.passed, false);
  assert.notStrictEqual(ordinary.status, 200);

  for (const { name } of LEGACY_AND_FORGED) {
    const r = byName[name];
    assert.strictEqual(r.guard.granted, false, `Configuring the test secret must not revive: ${name}`);
    assert.strictEqual(r.guard.statusCode, 401, `Configuring the test secret must not revive: ${name}`);
    assert.strictEqual(r.status, 401);
  }
  console.log('    ✓ NODE_ENV=staging with a test secret: only a correctly-signed super-admin test token passes; legacy tokens stay dead');

  /* ── 3. Production: even a correct secret and token grant nothing ── */

  const prod = runProbes({
    nodeEnv: 'production',
    secret: TEST_SECRET,
    http: false,
    probes: [{ name: 'valid token in production', headers: { authorization: `Bearer ${validToken}` } }, ...LEGACY_AND_FORGED]
  });
  for (const { name, guard } of prod) {
    assert.strictEqual(guard.granted, false, `NODE_ENV=production must not grant super-admin for: ${name}`);
    assert.strictEqual(guard.statusCode, 401, `NODE_ENV=production must answer 401 for: ${name}`);
  }
  console.log('    ✓ NODE_ENV=production: the test token is dead even with the secret set');

  console.log('  All SuperAdmin guard bypass-hardening tests passed.\n');
}

module.exports = { run };

if (require.main === module) {
  if (process.argv.includes('--probe')) {
    probe().catch(err => { console.error(err); process.exit(1); });
  } else {
    run().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
  }
}
