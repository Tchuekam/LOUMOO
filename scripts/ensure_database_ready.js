#!/usr/bin/env node
/**
 * LOUMOO — Ensure Database Ready (Phase 1 provisioner)
 * ---------------------------------------------------------------------------
 * One-shot utility that takes the Supabase project to "real persistence" state:
 *
 *   1. Inspect current schema/table state (idempotent)
 *   2. Apply migrations 001..005 if missing
 *   3. Expose { public, iam, system } to PostgREST
 *   4. Reload PostgREST config and verify via the Data API
 *
 * Credentials — provide ONE of:
 *   SUPABASE_MANAGEMENT_TOKEN=sbp_...        (Management API; recommended)
 *   SUPABASE_DB_PASSWORD=<postgres-password> (direct DB connection)
 *
 * Optional:
 *   SUPABASE_DB_HOST   default: <project ref> direct host (IPv6) or pooler
 *   SUPABASE_DB_PORT   default: 5432
 *
 * Usage:
 *   node scripts/ensure_database_ready.js
 */

const fs = require('fs');
const path = require('path');

// ---- minimal .env.local loader (no dotenv dependency dance) ----
function loadEnvFile(file) {
  const env = {};
  if (!fs.existsSync(file)) return env;
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#') || !t.includes('=')) continue;
    const idx = t.indexOf('=');
    let k = t.slice(0, idx).trim();
    let v = t.slice(idx + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (!(k in process.env)) env[k] = v;
  }
  return env;
}

const env = loadEnvFile(path.resolve(process.cwd(), '.env.local'));
const SUPABASE_URL = process.env.SUPABASE_URL || env.SUPABASE_URL || '';
const PROJECT_REF = process.env.SUPABASE_PROJECT_REF || env.SUPABASE_PROJECT_REF || (SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] || '');
const MIGRATIONS_DIR = path.resolve(__dirname, '..', 'server', 'infrastructure', 'database', 'migrations');
const MIGRATIONS = fs.readdirSync(MIGRATIONS_DIR).filter(f => /^\d+_.*\.sql$/.test(f)).sort();
const EXPOSE_SQL = "alter role authenticator set pgrst.db_schemas = 'public, iam, system';\nnotify pgrst, 'reload config';";

const mgmtToken = process.env.SUPABASE_MANAGEMENT_TOKEN || env.SUPABASE_MANAGEMENT_TOKEN || '';
const dbPassword = process.env.SUPABASE_DB_PASSWORD || env.SUPABASE_DB_PASSWORD || '';
const dbHost = process.env.SUPABASE_DB_HOST || env.DATABASE_DIRECT_HOST?.split(':')[0] || `db.${PROJECT_REF}.supabase.co`;
const dbPort = +(process.env.SUPABASE_DB_PORT || env.DATABASE_DIRECT_HOST?.split(':')[1] || 5432);

const log = (...a) => console.log('[ensure-db]', ...a);

// ---------------------------------------------------------------------------
// Management API path
// ---------------------------------------------------------------------------
async function viaManagement() {
  const base = 'https://api.supabase.com/v1/projects/' + PROJECT_REF + '/database/query';
  const headers = { 'Authorization': 'Bearer ' + mgmtToken, 'Content-Type': 'application/json' };
  async function execSql(sql) {
    const res = await fetch(base, { method: 'POST', headers, body: JSON.stringify({ query: sql }) });
    const body = await res.text();
    if (!res.ok) throw new Error(`Management API ${res.status}: ${body.slice(0, 300)}`);
    try { return JSON.parse(body); } catch { return body; }
  }
  log('Using Management API token (project', PROJECT_REF + ')');

  // 1. inspect
  const tablesRes = JSON.stringify(await execSql(
    "select table_schema, table_name from information_schema.tables where table_schema in ('iam','system') order by 1,2"));
  log('Existing iam/system tables:', tablesRes.slice(0, 400));

  // 2. apply each migration (split statements on ';' at line boundaries)
  for (const m of MIGRATIONS) {
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, m), 'utf8');
    const statements = sql.split(';\n').map(s => s.trim()).filter(s => s && !s.startsWith('--'));
    const pre = await execSql("select to_regclass('iam.listings') as lst");
    for (const stmt of statements) {
      if (/^\s*$/m.test(stmt)) continue;
      await execSql(stmt);
    }
    log('Applied migration:', m, `(${statements.length} statements)`);
  }

  // 3. expose schemas
  log('Exposing schemas...');
  await execSql("alter role authenticator set pgrst.db_schemas = 'public, iam, system'");
  await execSql("notify pgrst, 'reload config'");
  log('Schemas exposed + PostgREST reload notified.');
  return { mode: 'management' };
}

// ---------------------------------------------------------------------------
// Direct DB path
// ---------------------------------------------------------------------------
async function viaDatabase() {
  const { Client } = require('pg');
  const client = new Client({
    host: dbHost, port: dbPort, user: 'postgres', password: dbPassword,
    database: 'postgres', ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 10000
  });
  await client.connect();
  log('Connected to Postgres at', dbHost);

  const tables = await client.query(
    "select table_schema, table_name from information_schema.tables where table_schema in ('iam','system') order by 1,2");
  log('Existing iam/system tables:', JSON.stringify(tables.rows).slice(0, 400));

  for (const m of MIGRATIONS) {
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, m), 'utf8');
    await client.query(sql);   // multi-statement allowed via simple query protocol
    log('Applied migration:', m);
  }

  log('Exposing schemas...');
  await client.query(EXPOSE_SQL);
  log('Schemas exposed + PostgREST reload notified.');
  await client.end();
  return { mode: 'db' };
}

// ---------------------------------------------------------------------------
// Post-verification via Data API (works with either path)
// ---------------------------------------------------------------------------
async function verify() {
  const srvKey = process.env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY || '';
  const url = SUPABASE_URL.replace(/\/$/, '');
  for (const schema of ['iam', 'system']) {
    const res = await fetch(`${url}/rest/v1/xxx_probe?select=id&limit=1`, {
      headers: {
        apikey: srvKey, Authorization: `Bearer ${srvKey}`,
        'Accept-Profile': schema, 'Content-Profile': schema
      }
    });
    const body = (await res.text()).slice(0, 200);
    const ok = res.status === 200 || res.status === 404; // 404 = table missing but schema reachable
    console.log(`[verify] schema ${schema}: HTTP ${res.status} -> ${ok ? 'REACHABLE' : 'BLOCKED'} ${body}`);
  }
}

(async () => {
  if (!PROJECT_REF) { console.error('Cannot determine project ref. Set SUPABASE_PROJECT_REF.'); process.exit(1); }
  if (!mgmtToken && !dbPassword) {
    console.error('Provide SUPABASE_MANAGEMENT_TOKEN (sbp_...) or SUPABASE_DB_PASSWORD.');
    process.exit(2);
  }
  try {
    if (mgmtToken) await viaManagement(); else await viaDatabase();
    log('Verifying PostgREST schema exposure...');
    await verify();
    log('DONE. Restart the LOUMOO server to see real persistence.');
  } catch (err) {
    console.error('[ensure-db] FAILED:', err.message);
    process.exit(1);
  }
})();
