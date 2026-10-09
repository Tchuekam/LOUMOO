/**
 * LOUMOO — the local end-to-end stack.
 * ---------------------------------------------------------------------------
 *   PGlite (real Postgres, the repo's migrations)         one process: this one
 *     └─ PostgREST stand-in + Auth stand-in on 127.0.0.1:<restPort>
 *          └─ the REAL server (`node server/index.js`) as a child process,
 *             talking to it with the unmodified supabase-js client
 *               └─ the REAL generated frontend, served from public/
 *
 * Safety by construction:
 *   - The child gets a minimal, explicit environment. It does not inherit this
 *     process's variables and LOUMOO_NO_DOTENV=1 stops it reading any .env file,
 *     so a developer's real (production) credentials can never reach it.
 *   - SUPABASE_URL is a loopback address that this process owns.
 *   - Every credential is generated here, per run.
 *
 * In non-production the server logs `[DB-FAILURE] ... DEV MODE: continuing with
 * in-memory fallback` and carries on. That would let a real database defect pass
 * unnoticed, so the stack records the child's output and exposes
 * `silentFallbacks()`; a run that logged one is not a clean run.
 */
'use strict';

const fs = require('fs');
const net = require('net');
const path = require('path');
const crypto = require('crypto');
const { spawn } = require('child_process');

const { createLocalDb } = require('./localDb');
const { createMiniPostgrest } = require('./miniPostgrest');
const { createMiniAuth } = require('./miniAuth');
const { createMiniStorage } = require('./miniStorage');
const { mintKey } = require('./jwt');

const REPO = path.resolve(__dirname, '../../..');

function freePort() {
  return new Promise((resolve, reject) => {
    const s = net.createServer();
    s.once('error', reject);
    s.listen(0, '127.0.0.1', () => { const { port } = s.address(); s.close(() => resolve(port)); });
  });
}

/** The few variables a child process needs on Windows/Linux to run node at all. */
function baseEnv() {
  const keep = ['PATH', 'Path', 'SystemRoot', 'SYSTEMROOT', 'windir', 'TEMP', 'TMP', 'COMSPEC', 'PATHEXT', 'HOME', 'USERPROFILE', 'LOCALAPPDATA', 'APPDATA', 'NODE_PATH'];
  const out = {};
  for (const k of keep) if (process.env[k] !== undefined) out[k] = process.env[k];
  return out;
}

async function waitFor(url, { timeoutMs = 90000, intervalMs = 400 } = {}) {
  const t0 = Date.now();
  let last = null;
  while (Date.now() - t0 < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.status < 500) return res;
      last = new Error(`HTTP ${res.status}`);
    } catch (e) { last = e; }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error(`timed out waiting for ${url}: ${last && last.message}`);
}

/**
 * @param {object} [opts]
 * @param {string} [opts.nodeEnv='development']  development exposes the signup OTP in the API response (config.isDevelopment)
 * @param {object} [opts.env]                    extra variables for the server process
 * @param {string} [opts.logFile]                where to tee the server's output
 * @param {boolean} [opts.seed=true]             run scripts/seed_taxonomy.js (what `npm run db:seed` does on a real deploy):
 *                                               without it no listing can be created (listings.category_id is a foreign key)
 */
async function startLocalStack(opts = {}) {
  const nodeEnv = opts.nodeEnv || 'development';
  const secret = crypto.randomBytes(32).toString('hex');
  const testAuthSecret = crypto.randomBytes(24).toString('hex');

  const { db, migrations } = await createLocalDb({ dataDir: opts.dataDir });
  const auth = createMiniAuth({ db, secret });
  const restLog = [];
  const storage = createMiniStorage({});
  const rest = createMiniPostgrest({ db, secret, auth, storage, onRequest: (r) => { restLog.push(r); if (restLog.length > 5000) restLog.shift(); } });
  await new Promise((r) => rest.server.listen(0, '127.0.0.1', r));
  const restUrl = `http://127.0.0.1:${rest.server.address().port}`;

  const anonKey = rest.mintKey('anon');
  const serviceKey = rest.mintKey('service_role');

  const appPort = opts.appPort || await freePort();
  const baseUrl = `http://127.0.0.1:${appPort}`;

  const env = {
    ...baseEnv(),
    NODE_ENV: nodeEnv,
    PORT: String(appPort),
    APP_BASE_URL: baseUrl,
    CORS_ORIGINS: baseUrl,
    LOUMOO_NO_DOTENV: '1',
    SUPABASE_URL: restUrl,
    SUPABASE_ANON_KEY: anonKey,
    SUPABASE_SERVICE_ROLE_KEY: serviceKey,
    SUPABASE_JWT_SECRET: secret,
    SUPABASE_PROJECT_REF: 'local-e2e',
    LOUMOO_TEST_AUTH_SECRET: testAuthSecret,
    DELIVERY_GEOCODER_URL: 'off',
    SEARCH_ENABLED: 'false',
    ...(opts.env || {}),
  };

  if (opts.seed !== false) {
    await new Promise((resolve, reject) => {
      const seed = spawn(process.execPath, ['scripts/seed_taxonomy.js'], { cwd: REPO, env, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
      let out = '';
      seed.stdout.on('data', (c) => { out += c; });
      seed.stderr.on('data', (c) => { out += c; });
      seed.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`taxonomy seed failed (exit ${code}):
${out.slice(-1500)}`))));
    });
  }

}
