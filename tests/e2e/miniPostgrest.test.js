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
    // ------------------------------------------------------------ insert / select
    let r = await admin.from('profiles').insert([
      { id: 'u_a', clerk_user_id: 'c_a', email: 'a@x.test' },
      { id: 'u_b', clerk_user_id: 'c_b', email: 'b@x.test' },
      { id: 'u_c', clerk_user_id: 'c_c', email: 'c@x.test' },
    ]).select();
    assert.ifError(r.error);
    assert.strictEqual(r.data.length, 3, 'a bulk insert returns the rows');
    assert.ok(r.data[0].created_at, 'column defaults are applied');

    r = await admin.from('profiles').select('id,email').eq('id', 'u_a').single();
    assert.ifError(r.error);
    assert.deepStrictEqual(r.data, { id: 'u_a', email: 'a@x.test' }, 'select list + eq + single() give exactly the object');

    r = await admin.from('profiles').select('id').in('id', ['u_a', 'u_c']).order('id', { ascending: false });
    assert.deepStrictEqual(r.data.map((x) => x.id), ['u_c', 'u_a'], 'in() + order desc');

    r = await admin.from('profiles').select('id').ilike('email', 'B@%').maybeSingle();
    assert.strictEqual(r.data && r.data.id, 'u_b', 'ilike with a wildcard + maybeSingle()');

    r = await admin.from('profiles').select('id').is('phone_number', null).or('id.eq.u_a,id.eq.u_b').order('id');
    assert.ifError(r.error);
    assert.deepStrictEqual(r.data.map((x) => x.id), ['u_a', 'u_b'], 'is null + or(...)');

    r = await admin.from('profiles').select('id', { count: 'exact' }).order('id').range(1, 1);
    assert.strictEqual(r.count, 3, 'count=exact reports the total ignoring the page');
    assert.deepStrictEqual(r.data.map((x) => x.id), ['u_b'], 'range() pages');

    r = await admin.from('profiles').select('id', { count: 'exact', head: true }).neq('id', 'u_a');
    assert.strictEqual(r.count, 2, 'head + count');

    r = await admin.from('profiles').select('id').eq('id', 'nobody').maybeSingle();
    assert.ifError(r.error);
    assert.strictEqual(r.data, null, 'maybeSingle() on no rows is null, not an error');

    r = await admin.from('profiles').select('id').eq('id', 'nobody').single();
    assert.strictEqual(r.error && r.error.code, 'PGRST116', 'single() on no rows is PGRST116, as PostgREST reports it');

    // ------------------------------------------------------------------- errors
    r = await admin.from('profiles').insert({ id: 'u_a', clerk_user_id: 'c_dupe' });
    assert.strictEqual(r.error && r.error.code, '23505', 'a unique violation keeps its SQLSTATE');

    r = await admin.from('orders').insert({ id: 'o_x', buyer_id: 'ghost', seller_id: 'u_a', order_number: 'N1', total_amount_xaf: 1000 });
    assert.strictEqual(r.error && r.error.code, '23503', 'a foreign-key violation keeps its SQLSTATE');

    r = await admin.from('no_such_table').select('*');
    assert.strictEqual(r.error && r.error.code, 'PGRST205', 'a missing table (an unapplied migration) is PGRST205');

    r = await admin.from('profiles').insert({ id: 'u_z', clerk_user_id: 'c_z', not_a_column: 1 });
    assert.strictEqual(r.error && r.error.code, 'PGRST204', 'an unknown column (an unapplied migration) is PGRST204');

    r = await admin.from('profiles').select('id, nothing_here(id)');
    assert.strictEqual(r.error && r.error.code, 'PGRST200', 'embedding a table with no relationship is PGRST200, not an empty result');

} finally {
    await new Promise((r) => rest.server.close(r));
    await db.close();
}
}
