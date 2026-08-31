#!/usr/bin/env node
/**
 * LOUMOO — Apply a single SQL migration through the Supabase Management API.
 *
 * Unlike scripts/ensure_database_ready.js this sends each migration file as ONE
 * statement batch, so `DO $$ ... $$;` blocks and functions survive intact.
 *
 *   node scripts/apply_migration.js 006_account_state_and_listing_gate.sql
 *   node scripts/apply_migration.js --all
 *
 * Requires SUPABASE_MANAGEMENT_TOKEN (sbp_...) in the environment or .env.local.
 */

const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });

const MIGRATIONS_DIR = path.resolve(__dirname, '..', 'server', 'infrastructure', 'database', 'migrations');
const TOKEN = process.env.SUPABASE_MANAGEMENT_TOKEN || '';
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const PROJECT_REF = process.env.SUPABASE_PROJECT_REF
  || (SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/) || [])[1]
  || '';

async function execSql(sql) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: sql })
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${text.slice(0, 800)}`);
  try { return JSON.parse(text); } catch { return text; }
}

async function main() {
  if (!TOKEN) { console.error('SUPABASE_MANAGEMENT_TOKEN is required.'); process.exit(2); }
  if (!PROJECT_REF) { console.error('Cannot determine SUPABASE_PROJECT_REF.'); process.exit(2); }

  const arg = process.argv[2];
  const files = arg === '--all' || !arg
    ? fs.readdirSync(MIGRATIONS_DIR).filter(f => /^\d+_.*\.sql$/.test(f)).sort()
    : [arg];

  for (const file of files) {
    const full = path.join(MIGRATIONS_DIR, file);
    if (!fs.existsSync(full)) { console.error(`Missing migration: ${file}`); process.exit(1); }
    process.stdout.write(`[migrate] ${file} ... `);
    await execSql(fs.readFileSync(full, 'utf8'));
    console.log('OK');
  }

  await execSql("alter role authenticator set pgrst.db_schemas = 'public, iam, system'");
  await execSql("notify pgrst, 'reload config'");
  console.log('[migrate] Schemas exposed, PostgREST reloaded.');
}

main().catch(err => { console.error('\n[migrate] FAILED:', err.message); process.exit(1); });
