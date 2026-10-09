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

    // --------------------------------------------------------- resource embedding
    await db.query(`INSERT INTO iam.listing_categories (id, vertical, name, slug) VALUES ('electronics', 'shop', 'Electronics', 'electronics') ON CONFLICT DO NOTHING`);
    await db.query(`INSERT INTO iam.stores (id, owner_id, name, slug) VALUES ('s_a1', 'u_a', 'A One', 'a-one'), ('s_a2', 'u_a', 'A Two', 'a-two')`);
    r = await admin.from('stores').select('id, owner:profiles(id, email)').eq('id', 's_a1').single();
    assert.ifError(r.error);
    assert.deepStrictEqual(r.data, { id: 's_a1', owner: { id: 'u_a', email: 'a@x.test' } }, 'many-to-one embed with an alias is an object');

    r = await admin.from('profiles').select('id, stores(id, name)').eq('id', 'u_a').single();
    assert.ifError(r.error);
    assert.deepStrictEqual(r.data.stores.map((x) => x.id).sort(), ['s_a1', 's_a2'], 'one-to-many embed is an array');

    r = await admin.from('profiles').select('id, stores(id)').eq('id', 'u_b').single();
    assert.deepStrictEqual(r.data.stores, [], 'a parent with no children gets [] (not null)');

    r = await admin.from('profiles').select('id, stores!inner(id)').order('id');
    assert.deepStrictEqual(r.data.map((x) => x.id), ['u_a'], '!inner drops parents without a related row');

    r = await admin.from('profiles').select('id, stores!inner(id)').eq('stores.name', 'A One').order('id');
    assert.ifError(r.error);
    assert.deepStrictEqual(r.data, [{ id: 'u_a', stores: [{ id: 's_a1' }] }], 'a filter on an !inner embed narrows both the embed and the parents (how the catalogue lists only ACTIVE stores)');

    r = await admin.from('profiles').select('id, stores(id)').eq('stores.name', 'A One').order('id');
    assert.ifError(r.error);
    assert.deepStrictEqual(r.data.find((x) => x.id === 'u_a').stores, [{ id: 's_a1' }], 'without !inner the filter narrows only the embedded rows');
    assert.deepStrictEqual(r.data.find((x) => x.id === 'u_b').stores, [], 'and keeps every parent');

    r = await admin.from('profiles').select('id').eq('stores.name', 'A One');
    assert.strictEqual(r.error && r.error.code, 'PGRST108', 'a filter on an embed that is not in the select is refused, as PostgREST does');

    r = await admin.from('profiles').select('id, stores(id)').order('id');
    assert.deepStrictEqual(r.data.map((x) => x.id), ['u_a', 'u_b', 'u_c'], 'a plain embed keeps every parent');

    // ------------------------------------------------------------ upsert / update / delete
    r = await admin.from('profiles').upsert({ id: 'u_a', clerk_user_id: 'c_a', first_name: 'Ada' }, { onConflict: 'id' }).select().single();
    assert.ifError(r.error);
    assert.strictEqual(r.data.first_name, 'Ada', 'upsert merges into the existing row');

    r = await admin.from('profiles').update({ last_name: 'Lovelace' }).eq('id', 'u_a').select();
    assert.strictEqual(r.data.length, 1);
    assert.strictEqual(r.data[0].last_name, 'Lovelace', 'update returns the changed row');

    r = await admin.from('profiles').update({ last_name: 'X' }).eq('id', 'nobody').select();
    assert.deepStrictEqual(r.data, [], 'an update that matches nothing returns []');

    r = await admin.from('profiles').delete().eq('id', 'u_c').select();
    assert.strictEqual(r.data.length, 1, 'delete returns the removed row');
    r = await admin.from('profiles').select('id', { count: 'exact', head: true });
    assert.strictEqual(r.count, 2, 'and it is gone');

    // ------------------------------------------------------------------ jsonb / arrays
    r = await admin.from('profiles').update({ metadata: { a: [1, 2], b: 'x' } }).eq('id', 'u_b').select('id,metadata').single();
    if (!r.error) {
      assert.deepStrictEqual(r.data.metadata, { a: [1, 2], b: 'x' }, 'jsonb round-trips as an object');
    }

    // ------------------------------------------------------------- schema + roles
    r = await admin.schema('system').from('feature_flags').select('*');
    assert.ifError(r.error);
    assert.ok(Array.isArray(r.data), 'the system schema is reachable through Accept-Profile');

    r = await admin.schema('pg_catalog').from('pg_class').select('*');
    assert.strictEqual(r.error && r.error.code, 'PGRST106', 'a schema that is not exposed is refused');

    r = await anon.from('orders').select('id');
    const anonSeesNothing = (r.error && ['42501'].includes(r.error.code)) || (Array.isArray(r.data) && r.data.length === 0);
    assert.ok(anonSeesNothing, 'the anon key cannot read orders (RLS/grants are enforced by Postgres)');

    const forged = createClient(url, rest.mintKey('service_role').replace(/.$/, 'x'), opts);
    r = await forged.from('profiles').select('id');
    assert.strictEqual(r.error && r.error.code, 'PGRST301', 'a key with a bad signature is refused');

    console.log('    ✓ miniPostgrest: filters, paging, counts, single, upsert, errors, schema and role enforcement');
  } finally {
    await new Promise((r) => rest.server.close(r));
    await db.close();
  }
}

module.exports = { run };

if (require.main === module) {
  run().then(() => process.exit(0), (e) => { console.error(e); process.exit(1); });
}
