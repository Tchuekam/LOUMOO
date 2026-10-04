/**
 * The readiness check's logic, against a fake database (no network, no credentials).
 * The script itself is run by an operator against a real project; what is pinned here
 * is that it tells the truth about each situation: a missing table names the
 * migration to apply, a database with nobody registered warns instead of passing, and
 * it never writes.
 */

require('../setup');
const assert = require('assert');
const { checkReadiness, formatReport } = require('../../scripts/verify_delivery_readiness');

/** A fake Supabase client over `{ table: { missing?, columns?, rows? } }`. It records writes. */
function fakeDb(spec) {
  const writes = [];
  const db = {
    writes,
    from(table) {
      const t = spec[table] || { rows: [] };
      const q = { filters: [] };
      q.select = (columns) => { q.columns = String(columns || '').split(','); return q; };
      q.eq = () => q;
      q.in = () => q;
      q.limit = async () => {
        if (t.missing) return { data: null, error: { code: 'PGRST205', message: `Could not find the table 'iam.${table}'` } };
        if (t.lacks && q.columns.includes(t.lacks)) return { data: null, error: { code: 'PGRST204', message: `Could not find the '${t.lacks}' column of '${table}'` } };
        if (t.fails) return { data: null, error: { code: 'XX000', message: 'connection reset' } };
        return { data: t.rows || [], error: null };
      };
      for (const m of ['insert', 'update', 'upsert', 'delete']) q[m] = () => { writes.push(`${m} ${table}`); return q; };
      return q;
    }
  };
  return db;
}

const READY_ENV = { SUPABASE_JWT_SECRET: 'x' };
const FULL = {
  deliveries: { rows: [] }, delivery_drivers: { rows: [{ profile_id: 'rider_1' }] }, delivery_events: { rows: [] },
  driver_locations: { rows: [] }, notifications: { rows: [] },
  profiles: { rows: [{ id: 'admin_1' }] }, listings: { rows: [{ id: 'l1', seller_id: 's1' }] }
};
const by = (results, id) => results.find((r) => r.id === id);

async function run() {
  console.log('  Testing the delivery readiness check...');

  // A healthy deployment.
  {
    const db = fakeDb(FULL);
    const results = await checkReadiness({ db, env: READY_ENV });
    assert.ok(!results.some((r) => r.level === 'fail'), 'nothing blocks: ' + JSON.stringify(results.filter((r) => r.level === 'fail')));
    assert.strictEqual(by(results, 'riders').level, 'pass');
    assert.strictEqual(by(results, 'admins').level, 'pass');
    assert.strictEqual(by(results, 'listings').level, 'pass');
    assert.strictEqual(by(results, 'secret').level, 'pass');
    assert.ok(/^READY/m.test(formatReport(results)));
    assert.deepStrictEqual(db.writes, [], 'a readiness check never writes');
  }

  // The situation this exists for: migration 013 was never applied.
  {
    const results = await checkReadiness({ db: fakeDb({ ...FULL, deliveries: { missing: true }, delivery_drivers: { missing: true }, delivery_events: { missing: true }, driver_locations: { missing: true } }), env: READY_ENV });
    const t = by(results, 'table:deliveries');
    assert.strictEqual(t.level, 'fail');
    assert.ok(/013_delivery_tracking\.sql/.test(t.detail) && /apply_migration/.test(t.detail), 'it names the migration and the command');
    assert.ok(/NOT READY/.test(formatReport(results)));
    assert.strictEqual(by(results, 'riders'), undefined, 'and does not pretend to count riders in a table that is not there');
    assert.strictEqual(by(results, 'table:notifications').level, 'pass', 'the other findings are still reported');
  }

  // Notifications unmigrated: the feed would silently live in one process's memory.
  {
    const results = await checkReadiness({ db: fakeDb({ ...FULL, notifications: { missing: true } }), env: READY_ENV });
    assert.strictEqual(by(results, 'table:notifications').level, 'fail');
    assert.ok(/010_notifications\.sql/.test(by(results, 'table:notifications').detail));
  }

  // A column the code uses is missing (a half-applied or older migration).
  {
    const results = await checkReadiness({ db: fakeDb({ ...FULL, deliveries: { lacks: 'handover_nonce' } }), env: READY_ENV });
    assert.strictEqual(by(results, 'table:deliveries').level, 'fail');
    assert.ok(/handover_nonce/.test(by(results, 'table:deliveries').detail), 'it says which column');
  }

  // Migrated but not yet usable: a warning, not a pass.
  {
    const results = await checkReadiness({ db: fakeDb({ ...FULL, delivery_drivers: { rows: [] }, profiles: { rows: [] }, listings: { rows: [] } }), env: READY_ENV });
    assert.strictEqual(by(results, 'riders').level, 'warn');
    assert.strictEqual(by(results, 'admins').level, 'warn');
    assert.strictEqual(by(results, 'listings').level, 'warn');
    assert.ok(!results.some((r) => r.level === 'fail'), 'these do not block, they warn');
    assert.ok(/warning/.test(formatReport(results)));
  }

  // The server's own settings.
  {
    const db = fakeDb(FULL);
    assert.strictEqual(by(await checkReadiness({ db, env: {} }), 'secret').level, 'fail', 'no JWT secret means no handover code');
    assert.strictEqual(by(await checkReadiness({ db, env: { ...READY_ENV, DELIVERY_OFFER_TTL_MINUTES: '0' } }), 'ttl').level, 'warn', 'expiry off is called out');
    assert.strictEqual(by(await checkReadiness({ db, env: { ...READY_ENV, DELIVERY_OFFER_TTL_MINUTES: 'soon' } }), 'ttl').level, 'warn');
    assert.strictEqual(by(await checkReadiness({ db, env: { ...READY_ENV, DELIVERY_OFFER_TTL_MINUTES: '30' } }), 'ttl').level, 'pass');
    assert.strictEqual(by(await checkReadiness({ db, env: { ...READY_ENV, DELIVERY_GEOCODER_URL: 'off' } }), 'geocoder').level, 'warn', 'no geocoding means no ETA, and says so');
    assert.strictEqual(by(await checkReadiness({ db, env: READY_ENV }), 'geocoder').level, 'pass');
    assert.ok(/sent to it/.test(by(await checkReadiness({ db, env: READY_ENV }), 'geocoder').detail), 'the default says where the address goes');
    assert.ok(!/sent to it/.test(by(await checkReadiness({ db, env: { ...READY_ENV, DELIVERY_GEOCODER_URL: 'https://geo.internal/search' } }), 'geocoder').detail || ''), 'your own service needs no such warning');
    assert.strictEqual(by(await checkReadiness({ db, env: { ...READY_ENV, NETLIFY: 'true' } }), 'runtime').level, 'warn', 'serverless is called out');
    assert.strictEqual(by(await checkReadiness({ db, env: READY_ENV }), 'runtime').level, 'pass');
  }

  // --live asks the geocoder one question, about a landmark; without it nothing is sent.
  {
    const db = fakeDb(FULL);
    let asked = [];
    const answering = { geocode: async (q) => { asked.push(q); return { lat: 4.05, lng: 9.69 }; } };
    const silent = { geocode: async () => null };
    const broken = { geocode: async () => { throw new Error('unreachable'); } };
    assert.strictEqual(by(await checkReadiness({ db, env: READY_ENV }), 'geocoder-live'), undefined, 'no probe unless asked');
    const ok = by(await checkReadiness({ db, env: READY_ENV, geocoder: answering }), 'geocoder-live');
    assert.strictEqual(ok.level, 'pass');
    assert.deepStrictEqual(asked, ['Bonanjo, Douala'], 'it asks about a landmark, never an address from your data');
    assert.strictEqual(by(await checkReadiness({ db, env: READY_ENV, geocoder: silent }), 'geocoder-live').level, 'warn', 'no answer is a warning: deliveries just have no ETA');
    assert.strictEqual(by(await checkReadiness({ db, env: READY_ENV, geocoder: broken }), 'geocoder-live').level, 'warn', 'and a throwing geocoder is too');
    assert.ok(!(await checkReadiness({ db, env: READY_ENV, geocoder: silent })).some((r) => r.level === 'fail'), 'it never blocks readiness');
  }

  // A database that cannot be read is a failure, not a silent pass.
  {
    const results = await checkReadiness({ db: fakeDb({ ...FULL, deliveries: { fails: true } }), env: READY_ENV });
    assert.strictEqual(by(results, 'table:deliveries').level, 'fail');
    assert.ok(/connection reset/.test(by(results, 'table:deliveries').detail));
  }

  console.log('    ✓ Readiness: a missing migration names its fix, an empty circuit warns, and nothing is ever written.');
}

module.exports = { run };
