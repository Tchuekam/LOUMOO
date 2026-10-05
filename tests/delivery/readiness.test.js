/**
 * The readiness check's logic, against a fake database (no network, no credentials).
 * The script itself is run by an operator against a real project; what is pinned here
 * is that it tells the truth about each situation: a missing table names the
 * migration to apply, a database with nobody registered warns instead of passing, and
 * it never writes. Rider presence (migration 017) is covered the same way: a missing
 * presence table is a FAIL that names 017, an unusable RIDER_PRESENCE_TTL_SECONDS and a
 * circuit with riders but nobody online are warnings, and the effective window is the
 * one the server itself would use.
 */

require('../setup');
const assert = require('assert');
const { checkReadiness, formatReport } = require('../../scripts/verify_delivery_readiness');
const { presenceTtlMsFrom } = require('../../server/modules/delivery/domain/RiderPresence');

/**
 * A fake Supabase client over `{ table: { missing?, lacks?, fails?, rows? } }`. It records writes
 * and every read (`queries`), and applies the filters the check uses (`eq`, `in`, `gt`) to the rows,
 * but only on a column the row actually carries: the rows of the older tables carry none of the
 * filtered columns, which keeps them returned exactly as before.
 */
function fakeDb(spec) {
  const writes = [];
  const queries = [];
  const db = {
    writes,
    queries,
    from(table) {
      const t = spec[table] || { rows: [] };
      const q = { table, eqs: [], gts: [], filters: [] };
      q.select = (columns) => { q.columns = String(columns || '').split(','); return q; };
      q.eq = (col, val) => { q.eqs.push([col, val]); q.filters.push((row) => !(col in row) || row[col] === val); return q; };
      q.in = (col, vals) => { q.filters.push((row) => !(col in row) || vals.includes(row[col])); return q; };
      q.gt = (col, val) => { q.gts.push([col, val]); q.filters.push((row) => !(col in row) || Date.parse(row[col]) > Date.parse(val)); return q; };
      q.limit = async (n) => {
        queries.push({ table, columns: q.columns, eqs: q.eqs, gts: q.gts, limit: n });
        if (t.missing) return { data: null, error: { code: 'PGRST205', message: `Could not find the table 'iam.${table}'` } };
        if (t.lacks && q.columns.includes(t.lacks)) return { data: null, error: { code: 'PGRST204', message: `Could not find the '${t.lacks}' column of '${table}'` } };
        if (t.fails) return { data: null, error: { code: 'XX000', message: 'connection reset' } };
        return { data: (t.rows || []).filter((row) => q.filters.every((f) => f(row))).slice(0, n), error: null };
      };
      for (const m of ['insert', 'update', 'upsert', 'delete']) q[m] = () => { writes.push(`${m} ${table}`); return q; };
      return q;
    }
  };
  return db;
}

const READY_ENV = { SUPABASE_JWT_SECRET: 'x' };
/** A healthy deployment at `nowMs`: one rider who is online and was heard from five seconds ago. */
function healthyWorld(nowMs) {
  return {
    deliveries: { rows: [] }, delivery_drivers: { rows: [{ profile_id: 'rider_1' }] }, delivery_events: { rows: [] },
    driver_locations: { rows: [] }, notifications: { rows: [] },
    rider_presence: { rows: [{ rider_id: 'rider_1', status: 'online', last_seen_at: new Date(nowMs - 5000).toISOString() }] },
    profiles: { rows: [{ id: 'admin_1' }] }, listings: { rows: [{ id: 'l1', seller_id: 's1' }] }
  };
}
const by = (results, id) => results.find((r) => r.id === id);
const idsAt = (results, level) => results.filter((r) => r.level === level).map((r) => r.id).sort();

async function run() {
  console.log('  Testing the delivery readiness check...');
  // The clock the check reads: passed in by the new cases, and (within milliseconds) the real one
  // for the older ones, which leave it at its default.
  const NOW = Date.now();
  const FULL = healthyWorld(NOW);

  // A healthy deployment.
  {
    const db = fakeDb(FULL);
    const results = await checkReadiness({ db, env: READY_ENV });
    assert.ok(!results.some((r) => r.level === 'fail'), 'nothing blocks: ' + JSON.stringify(results.filter((r) => r.level === 'fail')));
    assert.strictEqual(by(results, 'riders').level, 'pass');
    assert.strictEqual(by(results, 'admins').level, 'pass');
    assert.strictEqual(by(results, 'listings').level, 'pass');
    assert.strictEqual(by(results, 'secret').level, 'pass');
    assert.strictEqual(by(results, 'table:rider_presence').level, 'pass', 'the presence table is checked, and found');
    assert.strictEqual(by(results, 'presence-ttl').level, 'pass');
    assert.strictEqual(by(results, 'presence-online').level, 'pass', 'a rider is online');
    assert.deepStrictEqual(idsAt(results, 'warn'), ['indexes'], 'the only thing it cannot see through the API is migration 014');
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

  // ---------------------------------------------------------------- rider presence (migration 017)

  // The presence table was never created: dispatch cannot work, so this blocks, and it names 017.
  {
    const db = fakeDb({ ...FULL, rider_presence: { missing: true } });
    const results = await checkReadiness({ db, env: READY_ENV, now: () => NOW });
    const t = by(results, 'table:rider_presence');
    assert.strictEqual(t.level, 'fail');
    assert.strictEqual(t.title, 'iam.rider_presence does not exist');
    assert.ok(/017_rider_presence\.sql/.test(t.detail), 'it names the migration: ' + t.detail);
    assert.ok(/node scripts\/apply_migration\.js 017_rider_presence\.sql/.test(t.detail), 'and the command to run');
    assert.ok(/503/.test(t.detail) && /BEFORE deploying/.test(t.detail), 'and what breaks, and that it goes in before the code does');
    assert.deepStrictEqual(idsAt(results, 'fail'), ['table:rider_presence'], 'it is the only thing that blocks');
    assert.ok(/NOT READY: 1 blocking problem/.test(formatReport(results)), 'so the verdict is NOT READY');
    assert.strictEqual(by(results, 'presence-online'), undefined, 'and it does not pretend to count online riders in a table that is not there');
    assert.strictEqual(by(results, 'presence-ttl').level, 'pass', 'the setting is still judged');
    assert.strictEqual(by(results, 'table:deliveries').level, 'pass', 'the other findings are still reported');
    assert.strictEqual(by(results, 'riders').level, 'pass');
    assert.deepStrictEqual(db.writes, []);
  }

  // The table is there but an older shape of it (a column the code uses is missing), or cannot be read.
  {
    const lacking = await checkReadiness({ db: fakeDb({ ...FULL, rider_presence: { lacks: 'last_seen_at' } }), env: READY_ENV, now: () => NOW });
    assert.strictEqual(by(lacking, 'table:rider_presence').level, 'fail');
    assert.ok(/last_seen_at/.test(by(lacking, 'table:rider_presence').detail), 'it says which column');
    assert.ok(/017_rider_presence\.sql/.test(by(lacking, 'table:rider_presence').detail), 'and which migration to re-apply');
    assert.strictEqual(by(lacking, 'presence-online'), undefined);

    const unreadable = await checkReadiness({ db: fakeDb({ ...FULL, rider_presence: { fails: true } }), env: READY_ENV, now: () => NOW });
    assert.strictEqual(by(unreadable, 'table:rider_presence').level, 'fail', 'a presence table that cannot be read is a failure, not a pass');
    assert.ok(/connection reset/.test(by(unreadable, 'table:rider_presence').detail));
  }

  // RIDER_PRESENCE_TTL_SECONDS: judged the way the server reads it. The effective window is
  // stated, and an unusable value is a warning (the code falls back or clamps), never a blocker.
  {
    const db = fakeDb(FULL);
    const cases = [
      // value,       level,  effective window in seconds, what it says
      [undefined,     'pass', 120,  /default window/],
      ['',            'pass', 120,  /default window/],
      ['   ',         'pass', 120,  /default window/],
      ['120',         'pass', 120,  /window is 120 second/],
      ['90',          'pass', 90,   /window is 90 second/],
      [' 45 ',        'pass', 45,   /window is 45 second/],
      ['15',          'pass', 15,   /window is 15 second/],
      ['3600',        'pass', 3600, /window is 3600 second/],
      ['0',           'warn', 120,  /is not a usable number/],
      ['-30',         'warn', 120,  /is not a usable number/],
      ['soon',        'warn', 120,  /is not a usable number/],
      ['Infinity',    'warn', 120,  /is not a usable number/],
      ['14',          'warn', 15,   /is below the minimum \(15 seconds\)/],
      ['5',           'warn', 15,   /is below the minimum \(15 seconds\)/],
      ['3601',        'warn', 3600, /is above the maximum \(3600 seconds\)/],
      ['99999',       'warn', 3600, /is above the maximum \(3600 seconds\)/]
    ];
    for (const [value, level, effective, says] of cases) {
      const results = await checkReadiness({ db, env: { ...READY_ENV, ...(value === undefined ? {} : { RIDER_PRESENCE_TTL_SECONDS: value }) }, now: () => NOW });
      const r = by(results, 'presence-ttl');
      const label = `RIDER_PRESENCE_TTL_SECONDS=${JSON.stringify(value)}`;
      assert.strictEqual(r.level, level, `${label}: ${r.title}`);
      assert.ok(says.test(r.title), `${label}: title says ${says} (got "${r.title}")`);
      // A warning says in its detail what applies instead (not just in the title, which echoes the value
      // it was given); a pass says it in the title.
      const stated = level === 'warn' ? r.detail : r.title;
      assert.ok(new RegExp(`\\b${effective} seconds?\\b`).test(stated) && (level !== 'warn' || /applies/.test(stated)),
        `${label}: it states the window in force, ${effective} s (got "${stated}")`);
      assert.strictEqual(presenceTtlMsFrom(value) / 1000, effective, `${label}: the window it reports is the one the server uses`);
      assert.ok(!results.some((x) => x.level === 'fail'), `${label}: a bad window never blocks`);
    }
    // The detail of a warning says what applies instead and why 0 is not "never".
    const zero = by(await checkReadiness({ db, env: { ...READY_ENV, RIDER_PRESENCE_TTL_SECONDS: '0' }, now: () => NOW }), 'presence-ttl');
    assert.ok(/default \(120 seconds\) applies/.test(zero.detail) && /never/.test(zero.detail), zero.detail);
    // A window shorter than two beats is allowed, and says why it is fragile.
    const tight = by(await checkReadiness({ db, env: { ...READY_ENV, RIDER_PRESENCE_TTL_SECONDS: '45' }, now: () => NOW }), 'presence-ttl');
    assert.strictEqual(tight.level, 'pass');
    assert.ok(/under two heartbeats/.test(tight.detail), tight.detail);
    assert.strictEqual(by(await checkReadiness({ db, env: { ...READY_ENV, RIDER_PRESENCE_TTL_SECONDS: '90' }, now: () => NOW }), 'presence-ttl').detail, '', 'a sensible window needs no comment');
    assert.deepStrictEqual(db.writes, []);
  }

  // Riders are registered but nobody is online: informational, not a failure.
  {
    const at = (msAgo) => new Date(NOW - msAgo).toISOString();
    const world = (rows, extra = {}) => ({ ...FULL, rider_presence: { rows }, ...extra });
    const quiet = [
      { rider_id: 'rider_1', status: 'offline', last_seen_at: at(1000) },        // recent, but not online
      { rider_id: 'rider_2', status: 'paused', last_seen_at: at(1000) },         // on a break
      { rider_id: 'rider_3', status: 'busy', last_seen_at: at(1000) },           // carrying a parcel: not offerable
      { rider_id: 'rider_4', status: 'online', last_seen_at: at(10 * 60 * 1000) } // "online" on paper, silent for ten minutes
    ];

    const db = fakeDb(world(quiet));
    const results = await checkReadiness({ db, env: READY_ENV, now: () => NOW });
    const w = by(results, 'presence-online');
    assert.strictEqual(w.level, 'warn', 'riders exist but none is online: a warning');
    assert.strictEqual(w.title, 'No rider is online right now');
    assert.ok(/normal outside working hours/.test(w.detail), 'worded as information, not as an incident: ' + w.detail);
    assert.ok(/120 seconds/.test(w.detail) && /every 30 seconds/.test(w.detail), 'it says what "online" means here');
    assert.ok(!results.some((r) => r.level === 'fail'), 'it does not block');
    assert.ok(/^READY \(with 2 warning/m.test(formatReport(results)), 'READY, with the warning worth reading: ' + formatReport(results));
    assert.deepStrictEqual(idsAt(results, 'warn'), ['indexes', 'presence-online']);
    // What it asked the database: a read of the presence rows that are online and newer than the window.
    const asked = db.queries.filter((q) => q.table === 'rider_presence' && q.eqs.length);
    assert.strictEqual(asked.length, 1);
    assert.deepStrictEqual(asked[0].eqs, [['status', 'online']], 'online rows only');
    assert.deepStrictEqual(asked[0].gts, [['last_seen_at', at(120 * 1000)]], 'heard from within the window: now minus 120 s');
    assert.deepStrictEqual(db.writes, [], 'and it only read');

    // One rider who is online and was heard from lately clears it.
    const heard = await checkReadiness({ db: fakeDb(world([...quiet, { rider_id: 'rider_5', status: 'online', last_seen_at: at(30 * 1000) }])), env: READY_ENV, now: () => NOW });
    assert.strictEqual(by(heard, 'presence-online').level, 'pass');
    assert.ok(/120 seconds/.test(by(heard, 'presence-online').title), 'and says how fresh "lately" is');
    assert.deepStrictEqual(idsAt(heard, 'warn'), ['indexes']);

    // The edge is the server's: at exactly the window a rider is stale, a millisecond earlier they are not.
    const edgeStale = await checkReadiness({ db: fakeDb(world([{ rider_id: 'rider_1', status: 'online', last_seen_at: at(120 * 1000) }])), env: READY_ENV, now: () => NOW });
    assert.strictEqual(by(edgeStale, 'presence-online').level, 'warn', 'at exactly the window the rider is not online');
    const edgeFresh = await checkReadiness({ db: fakeDb(world([{ rider_id: 'rider_1', status: 'online', last_seen_at: at(120 * 1000 - 1) }])), env: READY_ENV, now: () => NOW });
    assert.strictEqual(by(edgeFresh, 'presence-online').level, 'pass', 'one millisecond earlier they are');

    // It uses the window in force, not a fixed one: a rider heard from 100 s ago is online by default, not with a 60 s window.
    const hundred = [{ rider_id: 'rider_1', status: 'online', last_seen_at: at(100 * 1000) }];
    assert.strictEqual(by(await checkReadiness({ db: fakeDb(world(hundred)), env: READY_ENV, now: () => NOW }), 'presence-online').level, 'pass');
    const shortWindow = await checkReadiness({ db: fakeDb(world(hundred)), env: { ...READY_ENV, RIDER_PRESENCE_TTL_SECONDS: '60' }, now: () => NOW });
    assert.strictEqual(by(shortWindow, 'presence-online').level, 'warn', 'with RIDER_PRESENCE_TTL_SECONDS=60 the same rider is silent');
    assert.ok(/60 seconds/.test(by(shortWindow, 'presence-online').detail));

    // No active rider at all: the existing "no rider is registered" warning says it; this one stays quiet.
    const nobodyRegistered = await checkReadiness({ db: fakeDb(world([], { delivery_drivers: { rows: [] } })), env: READY_ENV, now: () => NOW });
    assert.strictEqual(by(nobodyRegistered, 'riders').level, 'warn');
    assert.strictEqual(by(nobodyRegistered, 'presence-online'), undefined, 'one warning for one cause');
    // Nor does it look when the rider table itself is missing.
    const noRiderTable = await checkReadiness({ db: fakeDb(world(quiet, { delivery_drivers: { missing: true } })), env: READY_ENV, now: () => NOW });
    assert.strictEqual(by(noRiderTable, 'presence-online'), undefined);

    // A presence read that fails once the table has been found is a failure to look, not a pass.
    let calls = 0;
    const flaky = fakeDb(world(quiet));
    const realFrom = flaky.from.bind(flaky);
    flaky.from = (table) => {
      const q = realFrom(table);
      if (table === 'rider_presence' && ++calls > 1) { const limit = q.limit; q.limit = async (n) => { await limit(n); return { data: null, error: { code: 'XX000', message: 'timeout' } }; }; }
      return q;
    };
    const failing = await checkReadiness({ db: flaky, env: READY_ENV, now: () => NOW });
    assert.strictEqual(by(failing, 'table:rider_presence').level, 'pass', 'the table probe worked');
    assert.strictEqual(by(failing, 'presence-online').level, 'fail');
    assert.ok(/timeout/.test(by(failing, 'presence-online').detail));
  }

  // The report puts the new findings where an operator reads them.
  {
    const results = await checkReadiness({ db: fakeDb({ ...FULL, rider_presence: { missing: true } }), env: { ...READY_ENV, RIDER_PRESENCE_TTL_SECONDS: '5' }, now: () => NOW });
    const report = formatReport(results);
    assert.ok(/^FAIL  iam\.rider_presence does not exist/m.test(report), report);
    assert.ok(/^WARN  RIDER_PRESENCE_TTL_SECONDS="5" is below the minimum/m.test(report), report);
    assert.ok(/NOT READY: 1 blocking problem\(s\), 2 warning\(s\)\./.test(report), report);
  }

  // Through all of the above, nothing was ever written (each case also checked its own database).
  {
    const db = fakeDb(FULL);
    for (const env of [READY_ENV, { ...READY_ENV, RIDER_PRESENCE_TTL_SECONDS: 'x' }, {}]) await checkReadiness({ db, env, now: () => NOW });
    assert.deepStrictEqual(db.writes, [], 'a readiness check never writes');
    assert.ok(db.queries.every((q) => typeof q.table === 'string'), 'every call was a read of a named table');
  }

  console.log('    ✓ Readiness: a missing migration (013 or 017) names its fix, an empty or offline circuit warns, the presence window is judged as the server reads it, and nothing is ever written.');
}

module.exports = { run };
