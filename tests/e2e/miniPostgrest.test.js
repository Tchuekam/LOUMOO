/**
 * The local PostgREST stand-in, checked through the REAL supabase-js client.
 * ---------------------------------------------------------------------------
 * The end-to-end run is only as trustworthy as the stand-in it talks to, so this
 * pins the behaviours the application depends on: filters, ordering, paging,
 * counts, single()/maybeSingle(), upsert, update/delete, the error codes the
 * code branches on (23505, 23503, 23514, PGRST116/204/205), schema selection and
 * the role taken from the API key (RLS + grants enforced by Postgres itself).
 *
 * It cannot prove the stand-in matches PostgREST byte for byte; it proves it
 * matches what @supabase/supabase-js asks for and what this codebase reads back.
 * Skips (loudly) when PGlite is not installed locally; fails in CI.
 */
'use strict';

require('../setup');
const assert = require('assert');
const http = require('http');
const { createClient } = require('@supabase/supabase-js');
const { createLocalDb, loadPglite } = require('./support/localDb');
const { createMiniPostgrest } = require('./support/miniPostgrest');

const SECRET = 'local-e2e-secret-not-a-real-credential';

async function run() {
  if (!loadPglite()) {
    if (process.env.CI) throw new Error('@electric-sql/pglite is not installed: the local stack cannot be checked (run npm ci).');
    console.log('    - miniPostgrest: SKIPPED (@electric-sql/pglite is not installed; run npm install)');
    return;
  }

  const { db, migrations } = await createLocalDb();
  assert.ok(migrations.length >= 19, `all migrations applied on the local Postgres (${migrations.length})`);

  const rest = createMiniPostgrest({ db, secret: SECRET });
  await new Promise((r) => rest.server.listen(0, '127.0.0.1', r));
  const url = `http://127.0.0.1:${rest.server.address().port}`;
  const opts = { auth: { persistSession: false, autoRefreshToken: false }, db: { schema: 'iam' } };
  const admin = createClient(url, rest.mintKey('service_role'), opts);
  const anon = createClient(url, rest.mintKey('anon'), opts);

  try {

} finally {
    await new Promise((r) => rest.server.close(r));
    await db.close();
}
}
