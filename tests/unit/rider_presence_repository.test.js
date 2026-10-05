/**
 * LOUMOO — Rider presence repository queries
 * ---------------------------------------------------------------------------
 * The queries behind a rider's availability (iam.rider_presence, migration 017),
 * driven through a stand-in for the Supabase query builder over plain rows. The
 * stand-in RECORDS every query's filter chain, so this proves the exact thing the
 * repository asks the database for (which table, which filters in which order,
 * which ordering and limit), and applies those filters to rows the way SQL does
 * (a comparison against NULL is never true, a bound is strict or inclusive as the
 * method says), so a wrong boundary fails. It then runs the same cases through the
 * in-memory backend, which must answer identically.
 *
 * What it proves:
 *   - ensurePresence is "insert an offline row if there is none, leave an existing
 *     one alone"; transitionPresence is ONE conditional update (rider, expected
 *     statuses and, optionally, heartbeat / write-age bounds), never read-then-write;
 *   - the reads that decide who is offered a job ask only for the right rows;
 *   - rows come back as camelCase records with real numbers;
 *   - probe() tells an operator that migration 017 is missing;
 *   - the failure policy: in production a missing table is a clear 503 on every
 *     path, a failed read that decides who is offered a job is an error and not
 *     "nobody is online", and a write never silently lands in memory; outside
 *     production everything degrades to the in-memory store.
 *
 * It does NOT prove PostgREST or Postgres semantics (tests/delivery/migrations.test.js
 * is the check for the table itself, on a real engine).
 */

require('../setup');

const assert = require('assert');
const logger = require('../../server/shared/logging/logger');
const config = require('../../server/config/env');
const { DeliveryRepository, DeliveryNotReadyError } = require('../../server/modules/delivery/infrastructure/DeliveryRepository');
const { ValidationError, InfrastructureError } = require('../../server/shared/errors/AppError');
const { WORKLOAD_STATUSES } = require('../../server/modules/delivery/domain/Delivery');
const { STORED_PRESENCE_STATUSES, BUSY_DELIVERY_STATUSES } = require('../../server/modules/delivery/domain/RiderPresence');

const T0 = Date.parse('2026-10-03T10:00:00.000Z');
/** The ISO time `seconds` after (or, negative, before) 10:00:00. */
const at = (seconds) => new Date(T0 + seconds * 1000).toISOString();

const MISSING = { code: 'PGRST205', message: "Could not find the table 'iam.rider_presence' in the schema cache" };
const MISSING_PG = { code: '42P01', message: 'relation "iam.rider_presence" does not exist' };
const TIMEOUT = { code: '57014', message: 'canceling statement due to statement timeout' };

/**
 * Minimal Supabase query-builder stand-in for the two tables presence touches. It
 * records each query as `{ table, op, columns, patch, row, options, filters, ordering,
 * max, terminal, returning }` and answers the way PostgREST does: `update` returns
 * the changed rows only after `.select()`, `maybeSingle()` is null for no row and an
 * error for several, `upsert` honours `onConflict` / `ignoreDuplicates`.
 *
 * `errors[table]` is an error (or `(query) => error | null`) every query on that
 * table answers with; `riders`, when given, is the set of ids that exist in
 * delivery_drivers (an upsert for any other id answers 23503, like the foreign key).
 */
function fakeSupabase({ presence = [], deliveries = [], riders = null, errors = {} } = {}) {
  const tables = { rider_presence: presence, deliveries };
  const queries = [];

  const matches = (row, [op, column, a, b]) => {
    const have = row[column];
    switch (op) {
      case 'eq': return have !== null && have !== undefined && have === a;
      case 'in': return a.includes(have);
      case 'gt': return have !== null && have !== undefined && Date.parse(have) > Date.parse(a);
      case 'lte': return have !== null && have !== undefined && Date.parse(have) <= Date.parse(a);
      case 'not':
        assert.strictEqual(a, 'is', 'only "not ... is null" is stubbed');
        assert.strictEqual(b, null);
        return have !== null && have !== undefined;
      default: throw new Error(`unstubbed filter ${op}`);
    }
  };
  const project = (row, columns) => {
    if (columns === '*') return { ...row };
    return Object.fromEntries(columns.split(',').map((c) => c.trim()).map((c) => [c, row[c]]));
  };

  const db = {
    queries,
    tables,
    last: () => queries[queries.length - 1],
    from(table) {
      assert.ok(Object.prototype.hasOwnProperty.call(tables, table), `unexpected table ${table}`);
      const q = {
        table, op: 'select', columns: '*', returning: null, patch: null, row: null, options: null,
        filters: [], ordering: null, max: null, terminal: null
      };
      queries.push(q);
      const add = (...f) => { q.filters.push(f); return q; };
      q.select = (cols) => {
        const value = cols === undefined ? '*' : cols;
        if (q.op === 'select') q.columns = value; else q.returning = value;
        return q;
      };
      q.upsert = (row, options) => { q.op = 'upsert'; q.row = row; q.options = options; return q; };
      q.update = (patch) => { q.op = 'update'; q.patch = patch; return q; };
      q.eq = (c, v) => add('eq', c, v);
      q.in = (c, v) => add('in', c, v);
      q.gt = (c, v) => add('gt', c, v);
      q.lte = (c, v) => add('lte', c, v);
      q.not = (c, op, v) => add('not', c, op, v);
      q.order = (c, o = {}) => { q.ordering = { column: c, ascending: o.ascending !== false }; return q; };
      q.limit = (n) => { q.max = n; return q; };

      const execute = () => {
        const failure = typeof errors[table] === 'function' ? errors[table](q) : errors[table];
        if (failure) return Promise.resolve({ data: null, error: failure });
        const rows = tables[table];

        if (q.op === 'upsert') {
          if (riders && !riders.has(q.row.rider_id)) {
            return Promise.resolve({ data: null, error: { code: '23503', message: 'violates foreign key constraint "rider_presence_rider_id_fkey"' } });
          }
          assert.ok(q.options && q.options.onConflict, 'an upsert names its conflict column');
          const existing = rows.find((r) => r[q.options.onConflict] === q.row[q.options.onConflict]);
          if (existing) {
            if (!q.options.ignoreDuplicates) Object.assign(existing, q.row);
          } else {
            rows.push({ rider_id: null, status: 'offline', latitude: null, longitude: null, accuracy: null, last_seen_at: null, updated_at: null, ...q.row });
          }
          return Promise.resolve({ data: null, error: null });
        }

        let hit = rows.filter((r) => q.filters.every((f) => matches(r, f)));
        if (q.op === 'update') {
          for (const r of hit) Object.assign(r, q.patch);
          if (!q.returning) return Promise.resolve({ data: null, error: null });
          hit = hit.map((r) => project(r, q.returning));
        } else {
          if (q.ordering) {
            const { column, ascending } = q.ordering;
            hit = [...hit].sort((a, b) => (Date.parse(a[column]) - Date.parse(b[column])) * (ascending ? 1 : -1));
          }
          if (q.max != null) hit = hit.slice(0, q.max);
          hit = hit.map((r) => project(r, q.columns));
        }
        if (q.terminal === 'maybeSingle') {
          if (hit.length > 1) return Promise.resolve({ data: null, error: { code: 'PGRST116', message: 'multiple rows returned' } });
          return Promise.resolve({ data: hit[0] || null, error: null });
        }
        return Promise.resolve({ data: hit, error: null });
      };
      q.maybeSingle = () => { q.terminal = 'maybeSingle'; return execute(); };
      q.then = (resolve, reject) => execute().then(resolve, reject);
      return q;
    }
  };
  return db;
}

/** A db whose every call throws (a dropped connection), carrying `error`'s code as a driver would. */
function throwingDb(error) {
  return { from() { throw Object.assign(new Error(error.message), { code: error.code }); } };
}

/** A presence row as the database returns it (snake_case). */
const presenceRow = (id, status, { seen = null, updated = at(0), lat = null, lng = null, acc = null } = {}) => ({
  rider_id: id, status, latitude: lat, longitude: lng, accuracy: acc, last_seen_at: seen, updated_at: updated
});

/** The record the repository must turn that row into. */
const record = (id, status, { seen = null, updated = at(0), lat = null, lng = null, acc = null } = {}) => ({
  riderId: id, status, latitude: lat, longitude: lng, accuracy: acc, lastSeenAt: seen, updatedAt: updated
});

/** A delivery row, for the workload count. */
const deliveryRow = (id, status, driverId) => ({ id, status, driver_id: driverId });

/**
 * The shared data set. Cut-offs used below: heartbeats are "fresh" when strictly newer
 * than at(-120); "stale" when at or before it. Busy rows are "old" when written at or
 * before at(-30).
 */
function dataset() {
  return [
    presenceRow('r_fresh', 'online', { seen: at(0), updated: at(0), lat: '4.0511', lng: '9.7679', acc: '12.5' }),
    presenceRow('r_edge', 'online', { seen: at(-120), updated: at(-120) }),
    presenceRow('r_stale', 'online', { seen: at(-600), updated: at(-600) }),
    presenceRow('r_never', 'online', { seen: null, updated: at(-600) }),
    presenceRow('r_paused', 'paused', { seen: at(0), updated: at(0) }),
    presenceRow('r_offline', 'offline', { seen: at(0), updated: at(0) }),
    presenceRow('r_busy_old', 'busy', { seen: at(-3600), updated: at(-3600) }),
    presenceRow('r_busy_edge', 'busy', { seen: at(-30), updated: at(-30) }),
    presenceRow('r_busy_new', 'busy', { seen: at(-10), updated: at(-10) })
  ];
}

const ids = (list) => list.map((r) => r.riderId);
const sorted = (list) => [...list].sort();

/** Puts the same rows into an in-memory repository, through its public methods. */
async function seedMemory(repo, rows) {
  const num = (v) => (v === null || v === undefined ? null : Number(v));
  for (const r of rows) {
    await repo.ensurePresence(r.rider_id, r.updated_at);
    await repo.transitionPresence(r.rider_id, ['offline'], {
      status: r.status, latitude: num(r.latitude), longitude: num(r.longitude), accuracy: num(r.accuracy),
      lastSeenAt: r.last_seen_at, updatedAt: r.updated_at
    });
  }
}

async function caught(fn) {
  try {
    await fn();
    return null;
  } catch (e) {
    return e;
  }
}

async function run() {
  console.log('  Testing Rider presence repository queries...');
  // Whatever this suite sets on the shared config is put back as it found it, not as "false".
  const wasProduction = config.isProduction;

  // ------------------------------------------------- rows map to camelCase records
  {
    const db = fakeSupabase({
      presence: [
        presenceRow('r1', 'online', { seen: at(0), updated: at(1), lat: '4.0511', lng: '9.7679', acc: '12.5' }),
        presenceRow('r2', 'online', { seen: at(0), updated: at(1), lat: 4.0511, lng: 9.7679, acc: 12.5 }),
        presenceRow('r3', 'offline', { updated: at(2) }),
        presenceRow('r4', 'online', { seen: at(0), updated: at(1), lat: '0', lng: '0', acc: '0' }),
        { rider_id: 'r5', status: 'paused' } // a database that left the optional columns out
      ]
    });
    const repo = new DeliveryRepository({ db });

    const strings = await repo.findPresence('r1');
    assert.deepStrictEqual(strings,
      { riderId: 'r1', status: 'online', latitude: 4.0511, longitude: 9.7679, accuracy: 12.5, lastSeenAt: at(0), updatedAt: at(1) },
      'a row comes back as a camelCase record, with exactly these keys');
    for (const key of ['latitude', 'longitude', 'accuracy']) {
      assert.strictEqual(typeof strings[key], 'number', `${key} is a number even when the database sent a string`);
    }
    assert.deepStrictEqual(await repo.findPresence('r2'), { ...strings, riderId: 'r2' }, 'numbers that were already numbers are left alone');
    assert.deepStrictEqual(await repo.findPresence('r3'), record('r3', 'offline', { updated: at(2) }), 'no position and no heartbeat stay null (not 0, not undefined)');
    const zeros = await repo.findPresence('r4');
    assert.deepStrictEqual([zeros.latitude, zeros.longitude, zeros.accuracy], [0, 0, 0], 'a position on the equator and the prime meridian is 0, not "no position"');
    const sparse = await repo.findPresence('r5');
    assert.deepStrictEqual(sparse, record('r5', 'paused', { updated: null }), 'columns the database did not send are null');
    assert.deepStrictEqual(Object.keys(sparse).sort(), ['accuracy', 'lastSeenAt', 'latitude', 'longitude', 'riderId', 'status', 'updatedAt']);

    // The query itself.
    const q = db.queries.find((x) => x.filters.some((f) => f[2] === 'r1'));
    assert.strictEqual(q.table, 'rider_presence');
    assert.deepStrictEqual(q.filters, [['eq', 'rider_id', 'r1']], 'it asks for one rider by rider_id and nothing else');
    assert.strictEqual(q.terminal, 'maybeSingle', 'as a single row');
    assert.strictEqual(q.columns, '*');
    assert.strictEqual(await repo.findPresence('nobody'), null, 'a rider who never had a row has none (null), which reads as offline');
    const before = db.queries.length;
    assert.strictEqual(await repo.findPresence(''), null);
    assert.strictEqual(await repo.findPresence(undefined), null);
    assert.strictEqual(db.queries.length, before, 'no id, no query');
  }

  // ------------------------------------------------------------------ ensurePresence
  {
    const db = fakeSupabase({ presence: [presenceRow('r_there', 'online', { seen: at(0), updated: at(0), lat: 4.05, lng: 9.76 })] });
    const repo = new DeliveryRepository({ db });

    await repo.ensurePresence('r_new', at(5));
    const q = db.last();
    assert.strictEqual(q.table, 'rider_presence');
    assert.strictEqual(q.op, 'upsert', 'ensurePresence is an upsert');
    assert.deepStrictEqual(q.row, { rider_id: 'r_new', status: 'offline', updated_at: at(5) },
      'of a row that is OFFLINE (nobody becomes available by being registered), with no heartbeat and no position');
    assert.deepStrictEqual(q.options, { onConflict: 'rider_id', ignoreDuplicates: true },
      'on the rider id, ignoring duplicates: "make sure it exists", never "overwrite it"');
    assert.deepStrictEqual(q.filters, [], 'it has no filter of its own: the conflict clause is the race guard');
    assert.deepStrictEqual(db.tables.rider_presence.find((r) => r.rider_id === 'r_new'),
      presenceRow('r_new', 'offline', { updated: at(5) }), 'and the new row is exactly that');

    await repo.ensurePresence('r_there', at(99));
    assert.deepStrictEqual(db.tables.rider_presence.find((r) => r.rider_id === 'r_there'),
      presenceRow('r_there', 'online', { seen: at(0), updated: at(0), lat: 4.05, lng: 9.76 }),
      'a rider who already has a row is left exactly as they were (it does not knock an online rider offline)');
    await repo.ensurePresence('r_new', at(50));
    assert.strictEqual(db.tables.rider_presence.filter((r) => r.rider_id === 'r_new').length, 1, 'two first calls make one row');
    assert.strictEqual(db.tables.rider_presence.find((r) => r.rider_id === 'r_new').updated_at, at(5), 'and the second did not rewrite it');

    const t0 = Date.now();
    await repo.ensurePresence('r_default');
    const stamped = db.tables.rider_presence.find((r) => r.rider_id === 'r_default').updated_at;
    assert.ok(Math.abs(Date.parse(stamped) - t0) < 5000, 'without a time it stamps the row with now');

    // A rider id that is not in delivery_drivers is refused by the foreign key: a clear 400, never a memory row.
    const strict = fakeSupabase({ riders: new Set(['r_ok']) });
    const strictRepo = new DeliveryRepository({ db: strict });
    await strictRepo.ensurePresence('r_ok', at(0));
    assert.strictEqual(strict.tables.rider_presence.length, 1);
    for (const production of [false, true]) {
      config.isProduction = production;
      try {
        const err = await caught(() => strictRepo.ensurePresence('not_a_rider', at(0)));
        assert.ok(err instanceof ValidationError, `${production ? 'production' : 'dev'}: an unregistered id is a ValidationError, not a database error`);
        assert.strictEqual(err.statusCode, 400);
        assert.strictEqual(strict.tables.rider_presence.length, 1, 'and no row was made');
      } finally {
        config.isProduction = wasProduction;
      }
    }
  }

  // --------------------------------------------------------------- transitionPresence
  {
    const seeded = () => fakeSupabase({
      presence: [
        presenceRow('r1', 'online', { seen: at(0), updated: at(0), lat: 4.05, lng: 9.76, acc: 8 }),
        presenceRow('r2', 'online', { seen: at(0), updated: at(0) })
      ]
    });

    // One conditional UPDATE: the rider, the statuses it may start from, and nothing else.
    {
      const db = seeded();
      const repo = new DeliveryRepository({ db });
      const done = await repo.transitionPresence('r1', ['online', 'busy'],
        { status: 'paused', latitude: null, longitude: null, accuracy: null, updatedAt: at(30) });
      const q = db.last();
      assert.strictEqual(db.queries.length, 1, 'a transition is ONE query: no read before it, no read after it');
      assert.strictEqual(q.table, 'rider_presence');
      assert.strictEqual(q.op, 'update');
      assert.deepStrictEqual(q.patch, { status: 'paused', latitude: null, longitude: null, accuracy: null, updated_at: at(30) },
        'the patch is written with column names, and null clears a column');
      assert.deepStrictEqual(q.filters, [['eq', 'rider_id', 'r1'], ['in', 'status', ['online', 'busy']]],
        'guarded by the rider and the statuses they must still be in');
      assert.strictEqual(q.returning, '*', 'and it asks for the changed row back');
      assert.strictEqual(q.terminal, 'maybeSingle');
      assert.deepStrictEqual(done, record('r1', 'paused', { seen: at(0), updated: at(30) }), 'the answer is the updated row as a camelCase record');
      assert.deepStrictEqual(db.tables.rider_presence[1], presenceRow('r2', 'online', { seen: at(0), updated: at(0) }), 'only the named rider changed');
    }

    // Each optional bound is its own filter, in this order, on the right column.
    {
      const db = seeded();
      const repo = new DeliveryRepository({ db });
      await repo.transitionPresence('r1', ['online'], { status: 'busy', updatedAt: at(1) }, { seenSince: at(-60) });
      assert.deepStrictEqual(db.last().filters, [['eq', 'rider_id', 'r1'], ['in', 'status', ['online']], ['gt', 'last_seen_at', at(-60)]],
        'seenSince: only while the last heartbeat is NEWER than that instant (gt on last_seen_at)');
      await repo.transitionPresence('r1', ['busy'], { status: 'offline', updatedAt: at(2) }, { staleAt: at(10) });
      assert.deepStrictEqual(db.last().filters, [['eq', 'rider_id', 'r1'], ['in', 'status', ['busy']], ['lte', 'last_seen_at', at(10)]],
        'staleAt: only while the last heartbeat is at or BEFORE that instant (lte on last_seen_at)');
      await repo.transitionPresence('r1', ['offline'], { status: 'online', updatedAt: at(3) }, { updatedBefore: at(20) });
      assert.deepStrictEqual(db.last().filters, [['eq', 'rider_id', 'r1'], ['in', 'status', ['offline']], ['lte', 'updated_at', at(20)]],
        'updatedBefore: only while nothing has written to the row since that instant (lte on updated_at)');
      await repo.transitionPresence('r1', ['online'], { status: 'busy', updatedAt: at(4) }, { seenSince: at(-60), staleAt: at(60), updatedBefore: at(60) });
      assert.deepStrictEqual(db.last().filters, [
        ['eq', 'rider_id', 'r1'], ['in', 'status', ['online']],
        ['gt', 'last_seen_at', at(-60)], ['lte', 'last_seen_at', at(60)], ['lte', 'updated_at', at(60)]
      ], 'all three together, each on its own column');
      await repo.transitionPresence('r1', ['busy'], { status: 'online', updatedAt: at(5) });
      assert.strictEqual(db.last().filters.length, 2, 'with no bounds there are only the two base filters');
    }

    // The set of starting statuses is passed through whole, whatever kind of list it is.
    {
      const db = seeded();
      const repo = new DeliveryRepository({ db });
      await repo.transitionPresence('r1', STORED_PRESENCE_STATUSES, { status: 'offline', updatedAt: at(1) });
      assert.deepStrictEqual(db.last().filters[1], ['in', 'status', ['offline', 'online', 'busy', 'paused']], 'a frozen list of all four stored statuses is accepted and used as is');
      assert.strictEqual(db.tables.rider_presence[0].status, 'offline');
    }

    // Fields a patch leaves out are left alone; only an explicit null clears.
    {
      const db = seeded();
      const repo = new DeliveryRepository({ db });
      await repo.transitionPresence('r1', ['online'], { status: 'busy', lastSeenAt: at(7), updatedAt: at(7), latitude: undefined });
      const q = db.last();
      assert.deepStrictEqual(Object.keys(q.patch).sort(), ['last_seen_at', 'status', 'updated_at'], 'undefined is not sent: it would not be "clear the position", it would be nothing');
      const row = db.tables.rider_presence[0];
      assert.deepStrictEqual([row.latitude, row.longitude, row.accuracy], [4.05, 9.76, 8], 'so a claim keeps the rider\'s position');
      assert.deepStrictEqual([row.status, row.last_seen_at], ['busy', at(7)]);
    }

    // A patch with no time of its own is stamped with now, so updated_at always moves.
    {
      const db = seeded();
      const repo = new DeliveryRepository({ db });
      const t0 = Date.now();
      await repo.transitionPresence('r1', ['online'], { status: 'paused' });
      assert.ok(Math.abs(Date.parse(db.last().patch.updated_at) - t0) < 5000, 'updated_at defaults to now');
    }

    // No row matches: null, and nothing changes. Each guard, on its boundary.
    {
      const db = seeded();
      const repo = new DeliveryRepository({ db });
      const snapshot = () => JSON.stringify(db.tables.rider_presence);
      const untouched = snapshot();
      assert.strictEqual(await repo.transitionPresence('r1', ['paused'], { status: 'online', updatedAt: at(1) }), null, 'wrong starting status: null');
      assert.strictEqual(await repo.transitionPresence('ghost', ['online'], { status: 'busy', updatedAt: at(1) }), null, 'no such rider: null');
      assert.strictEqual(await repo.transitionPresence('r1', ['online'], { status: 'busy', updatedAt: at(1) }, { seenSince: at(0) }), null, 'a heartbeat exactly at seenSince is NOT newer: null');
      assert.strictEqual(await repo.transitionPresence('r1', ['online'], { status: 'busy', updatedAt: at(1) }, { seenSince: at(1) }), null, 'a heartbeat older than seenSince: null');
      assert.strictEqual(await repo.transitionPresence('r1', ['online'], { status: 'offline', updatedAt: at(1) }, { staleAt: at(-1) }), null, 'a heartbeat newer than staleAt (the rider beat since): null');
      assert.strictEqual(await repo.transitionPresence('r1', ['online'], { status: 'online', updatedAt: at(1) }, { updatedBefore: at(-1) }), null, 'written since updatedBefore: null');
      assert.strictEqual(snapshot(), untouched, 'none of those refusals changed a row');

      const oneMsBefore = new Date(T0 - 1).toISOString();
      const claimed = await repo.transitionPresence('r1', ['online'], { status: 'busy', updatedAt: at(1) }, { seenSince: oneMsBefore });
      assert.ok(claimed && claimed.status === 'busy', 'a heartbeat one millisecond newer than seenSince is fresh: the claim applies');
      assert.ok(await repo.transitionPresence('r1', ['busy'], { status: 'online', updatedAt: at(2) }, { staleAt: at(0), updatedBefore: at(1) }),
        'a heartbeat exactly AT staleAt and a write exactly AT updatedBefore both still match (inclusive)');
    }

    // Two transitions at once: the database's single conditional update lets exactly one win.
    {
      const db = seeded();
      const repo = new DeliveryRepository({ db });
      const results = await Promise.all(Array.from({ length: 5 }, (_, i) =>
        repo.transitionPresence('r1', ['online'], { status: 'busy', updatedAt: at(10 + i) }, { seenSince: at(-60) })));
      assert.strictEqual(results.filter(Boolean).length, 1, 'five simultaneous claims of an online rider: exactly one is applied');
      assert.strictEqual(db.tables.rider_presence[0].status, 'busy');
    }
  }

  // ------------------------------------------------------------------- the reads
  {
    const db = fakeSupabase({ presence: dataset() });
    const repo = new DeliveryRepository({ db });
    const FRESH_AFTER = at(-120);

    // listFreshOnlinePresence: the pool an offer is chosen from.
    const fresh = await repo.listFreshOnlinePresence(FRESH_AFTER);
    assert.deepStrictEqual(db.last().filters, [['eq', 'status', 'online'], ['gt', 'last_seen_at', FRESH_AFTER]],
      'fresh online riders: status = online AND last_seen_at strictly after the cut-off');
    assert.strictEqual(db.last().table, 'rider_presence');
    assert.strictEqual(db.last().max, 1000, 'bounded by the platform row limit by default');
    assert.deepStrictEqual(ids(fresh), ['r_fresh'], 'only the rider heard from since the cut-off; the one exactly AT it, the silent one, the one with no heartbeat, and every non-online rider are out');
    assert.deepStrictEqual(fresh[0], record('r_fresh', 'online', { seen: at(0), updated: at(0), lat: 4.0511, lng: 9.7679, acc: 12.5 }), 'rows are mapped');
    assert.deepStrictEqual(sorted(ids(await repo.listFreshOnlinePresence(at(-121)))), ['r_edge', 'r_fresh'], 'a cut-off one second earlier lets the edge rider in');
    assert.deepStrictEqual(ids(await repo.listFreshOnlinePresence(at(-60), { limit: 1 })), ['r_fresh']);
    assert.strictEqual(db.last().max, 1, 'the limit is the caller\'s when given');
    await repo.listFreshOnlinePresence(FRESH_AFTER, { limit: 7 });
    assert.strictEqual(db.last().max, 7);
    await repo.listFreshOnlinePresence('2026-10-03T09:58:00Z'); // no milliseconds
    assert.strictEqual(db.last().filters[1][2], '2026-10-03T09:58:00.000Z', 'the bound is normalised to a full ISO instant');
    const asked = db.queries.length;
    assert.deepStrictEqual(await repo.listFreshOnlinePresence('not a date'), [], 'an unparseable cut-off matches nobody');
    assert.deepStrictEqual(await repo.listFreshOnlinePresence(undefined), []);
    assert.strictEqual(db.queries.length, asked, 'and does not even query');

    // findStalePresence: the sweeper's list.
    const stale = await repo.findStalePresence(FRESH_AFTER);
    assert.deepStrictEqual(db.last().filters, [['eq', 'status', 'online'], ['lte', 'last_seen_at', FRESH_AFTER]],
      'stale online riders: status = online AND last_seen_at at or before the cut-off');
    assert.deepStrictEqual(db.last().ordering, { column: 'last_seen_at', ascending: true }, 'oldest first');
    assert.strictEqual(db.last().max, 50, 'bounded: a backlog is worked off over several sweeps');
    assert.deepStrictEqual(ids(stale), ['r_stale', 'r_edge'], 'silent riders oldest first; the one exactly AT the cut-off is stale (inclusive); a null heartbeat is never "stale"; busy/paused/offline are not the sweeper\'s');
    assert.deepStrictEqual(ids(await repo.findStalePresence(FRESH_AFTER, { limit: 1 })), ['r_stale'], 'the limit applies after the ordering');
    assert.strictEqual(db.last().max, 1);
    assert.deepStrictEqual(ids(await repo.findStalePresence(at(-601))), [], 'nothing is stale before the oldest beat');
    assert.deepStrictEqual(ids(await repo.findStalePresence(at(-600))), ['r_stale'], 'the cut-off itself is inclusive');
    const askedStale = db.queries.length;
    assert.deepStrictEqual(await repo.findStalePresence('garbage'), []);
    assert.strictEqual(db.queries.length, askedStale, 'an unparseable cut-off does not query');

    // findStaleBusyPresence: the janitor's list.
    const busyOld = await repo.findStaleBusyPresence(at(-30));
    assert.deepStrictEqual(db.last().filters, [['eq', 'status', 'busy'], ['lte', 'updated_at', at(-30)]],
      'busy rows nothing has written to since the cut-off: status = busy AND updated_at at or before it');
    assert.deepStrictEqual(db.last().ordering, { column: 'updated_at', ascending: true });
    assert.strictEqual(db.last().max, 50);
    assert.deepStrictEqual(ids(busyOld), ['r_busy_old', 'r_busy_edge'], 'oldest write first; exactly at the cut-off counts; a younger claim (maybe still in flight) does not');
    assert.deepStrictEqual(ids(await repo.findStaleBusyPresence(at(-30), { limit: 1 })), ['r_busy_old']);
    const askedBusy = db.queries.length;
    assert.deepStrictEqual(await repo.findStaleBusyPresence(null), []);
    assert.strictEqual(db.queries.length, askedBusy);

    // listPresence: the administrator's roster.
    const all = await repo.listPresence();
    assert.deepStrictEqual(db.last().filters, [], 'every row, no filter');
    assert.strictEqual(db.last().max, 1000);
    assert.strictEqual(all.length, 9);
    assert.deepStrictEqual(all.find((r) => r.riderId === 'r_busy_new'), record('r_busy_new', 'busy', { seen: at(-10), updated: at(-10) }));
    assert.strictEqual((await repo.listPresence({ limit: 4 })).length, 4);
    assert.strictEqual(db.last().max, 4);
  }

  // ------------------------------------------------- countOpenByDriver({ statuses })
  {
    const rows = [
      deliveryRow('d1', 'assigned', 'rider_1'),
      deliveryRow('d2', 'accepted', 'rider_1'),
      deliveryRow('d3', 'picked_up', 'rider_2'),
      deliveryRow('d4', 'arrived', 'rider_2'),
      deliveryRow('d5', 'arrived', 'rider_3'),
      deliveryRow('d6', 'assigned', 'rider_4'),
      deliveryRow('d7', 'failed', 'rider_2'),
      deliveryRow('d8', 'delivered', 'rider_1'),
      deliveryRow('d9', 'pending_assignment', null)
    ];
    const db = fakeSupabase({ deliveries: rows });
    const repo = new DeliveryRepository({ db });

    const busy = await repo.countOpenByDriver({ statuses: BUSY_DELIVERY_STATUSES });
    const q = db.last();
    assert.strictEqual(q.table, 'deliveries');
    assert.deepStrictEqual(q.filters[0], ['in', 'status', ['accepted', 'picked_up', 'arrived']], 'it counts exactly the statuses it was given: the ones that make a rider busy');
    assert.deepStrictEqual(q.filters[1], ['not', 'driver_id', 'is', null], 'and only deliveries somebody holds');
    assert.strictEqual(q.columns, 'driver_id', 'reading only the driver id');
    assert.deepStrictEqual([...busy.entries()].sort(), [['rider_1', 1], ['rider_2', 2], ['rider_3', 1]],
      'a rider holding only an OFFER (rider_4: assigned) is not busy; failed and delivered are not busy either');
    assert.strictEqual(busy.get('rider_4'), undefined, 'rider_4 is absent, not 0');

    const workload = await repo.countOpenByDriver();
    assert.deepStrictEqual(db.last().filters[0], ['in', 'status', [...WORKLOAD_STATUSES]], 'with no statuses it is the whole workload, as before');
    assert.strictEqual(workload.get('rider_4'), 1, 'which does include an offer');
    assert.strictEqual(workload.get('rider_1'), 2);

    const mine = ['accepted'];
    await repo.countOpenByDriver({ statuses: mine });
    assert.deepStrictEqual(mine, ['accepted'], 'the list passed in is not modified');
    assert.deepStrictEqual([...(await repo.countOpenByDriver({ statuses: ['accepted'] })).entries()], [['rider_1', 1]]);

    const memory = new DeliveryRepository({ db: null });
    for (const r of rows) {
      await memory.insertDelivery({
        id: r.id, orderId: `ord_${r.id}`, buyerId: 'b', sellerId: 's', driverId: r.driver_id, status: r.status,
        pickup: {}, dropoff: {}, createdAt: 't', updatedAt: 't'
      });
    }
    assert.deepStrictEqual([...(await memory.countOpenByDriver({ statuses: BUSY_DELIVERY_STATUSES })).entries()].sort(),
      [['rider_1', 1], ['rider_2', 2], ['rider_3', 1]], 'memory counts the same subset');
  }

  // --------------------------------------- the in-memory backend answers identically
  {
    const memory = new DeliveryRepository({ db: null });
    await seedMemory(memory, dataset());
    const FRESH_AFTER = at(-120);

    assert.deepStrictEqual(ids(await memory.listFreshOnlinePresence(FRESH_AFTER)), ['r_fresh'], 'memory: fresh online riders');
    assert.deepStrictEqual(sorted(ids(await memory.listFreshOnlinePresence(at(-121)))), ['r_edge', 'r_fresh']);
    assert.deepStrictEqual(await memory.listFreshOnlinePresence('nope'), []);
    assert.deepStrictEqual(ids(await memory.findStalePresence(FRESH_AFTER)), ['r_stale', 'r_edge'], 'memory: stale online riders, oldest first, inclusive');
    assert.deepStrictEqual(ids(await memory.findStalePresence(FRESH_AFTER, { limit: 1 })), ['r_stale']);
    assert.deepStrictEqual(await memory.findStalePresence('nope'), []);
    assert.deepStrictEqual(ids(await memory.findStaleBusyPresence(at(-30))), ['r_busy_old', 'r_busy_edge'], 'memory: busy rows nothing has written to');
    assert.deepStrictEqual(await memory.findStaleBusyPresence(undefined), []);
    assert.strictEqual((await memory.listPresence()).length, 9);
    assert.strictEqual((await memory.listPresence({ limit: 4 })).length, 4);
    assert.deepStrictEqual(await memory.findPresence('r_fresh'),
      record('r_fresh', 'online', { seen: at(0), updated: at(0), lat: 4.0511, lng: 9.7679, acc: 12.5 }), 'memory: the same record shape, with numbers');
    assert.strictEqual(await memory.findPresence('nobody'), null);

    // Records are copies: changing one never changes the store.
    const copy = await memory.findPresence('r_fresh');
    copy.status = 'offline';
    (await memory.listPresence()).forEach((r) => { r.status = 'offline'; });
    assert.strictEqual((await memory.findPresence('r_fresh')).status, 'online', 'a caller cannot edit a rider\'s presence through a record it was handed');

    // ensurePresence leaves an existing row alone; a new one is offline.
    await memory.ensurePresence('r_fresh', at(500));
    assert.strictEqual((await memory.findPresence('r_fresh')).status, 'online');
    await memory.ensurePresence('r_made', at(500));
    assert.deepStrictEqual(await memory.findPresence('r_made'), record('r_made', 'offline', { updated: at(500) }));
    // The record a transition answers with is a copy as well: a caller that edits it does not edit the store.
    const answered = await memory.transitionPresence('r_made', ['offline'], { status: 'paused', updatedAt: at(501) });
    assert.strictEqual(answered.status, 'paused');
    answered.status = 'online';
    answered.lastSeenAt = at(9999);
    assert.deepStrictEqual(await memory.findPresence('r_made'), record('r_made', 'paused', { updated: at(501) }), 'editing the answer of a transition leaves the stored row as it was');

    // The guards, on their boundaries, the same as in the database path.
    await memory.transitionPresence('r_fresh', ['online'], { status: 'online', lastSeenAt: at(0), updatedAt: at(0) });
    assert.strictEqual(await memory.transitionPresence('r_fresh', ['paused'], { status: 'busy' }), null, 'memory: wrong starting status');
    assert.strictEqual(await memory.transitionPresence('ghost', ['online'], { status: 'busy' }), null, 'memory: no such rider');
    assert.strictEqual(await memory.transitionPresence('r_fresh', ['online'], { status: 'busy', updatedAt: at(1) }, { seenSince: at(0) }), null, 'memory: a beat exactly at seenSince is not newer');
    assert.strictEqual(await memory.transitionPresence('r_fresh', ['online'], { status: 'offline', updatedAt: at(1) }, { staleAt: at(-1) }), null, 'memory: a beat after staleAt');
    assert.strictEqual(await memory.transitionPresence('r_fresh', ['online'], { status: 'online', updatedAt: at(1) }, { updatedBefore: at(-1) }), null, 'memory: written since updatedBefore');
    assert.strictEqual((await memory.findPresence('r_fresh')).status, 'online', 'none of those changed the rider');
    const claimed = await memory.transitionPresence('r_fresh', ['online'], { status: 'busy', updatedAt: at(2) }, { seenSince: at(-1) });
    assert.deepStrictEqual([claimed.status, claimed.latitude, claimed.longitude], ['busy', 4.0511, 9.7679], 'memory: a claim keeps the position');
    assert.ok(await memory.transitionPresence('r_fresh', ['busy'], { status: 'offline', updatedAt: at(3), latitude: null, longitude: null, accuracy: null }, { staleAt: at(0), updatedBefore: at(2) }),
      'memory: inclusive on staleAt and updatedBefore');
    const cleared = await memory.findPresence('r_fresh');
    assert.deepStrictEqual([cleared.status, cleared.latitude, cleared.longitude, cleared.accuracy], ['offline', null, null, null], 'memory: null clears the position');

    const racers = await Promise.all(Array.from({ length: 5 }, (_, i) =>
      memory.transitionPresence('r_edge', ['online'], { status: 'busy', updatedAt: at(10 + i) })));
    assert.strictEqual(racers.filter(Boolean).length, 1, 'memory: five simultaneous claims, exactly one wins');
  }

  // ------------------------------------------------------------------------ probe()
  {
    const healthy = fakeSupabase();
    assert.deepStrictEqual(await new DeliveryRepository({ db: healthy }).probe(), { ready: true }, 'both tables there: ready');
    assert.deepStrictEqual(healthy.queries.map((q) => [q.table, q.columns, q.max]), [['deliveries', 'id', 1], ['rider_presence', 'rider_id', 1]],
      'it checks the deliveries table, then the presence table, one row each');

    for (const [label, error] of [['PostgREST schema cache', MISSING], ['direct Postgres', MISSING_PG]]) {
      const noPresence = fakeSupabase({ errors: { rider_presence: error } });
      const answer = await new DeliveryRepository({ db: noPresence }).probe();
      assert.strictEqual(answer.ready, false, `${label}: a missing presence table is NOT ready (dispatch could not offer anything)`);
      assert.ok(/iam\.rider_presence/.test(answer.reason) && /017_rider_presence\.sql/.test(answer.reason),
        `${label}: the reason names the table and migration 017 (${answer.reason})`);
      assert.ok(!/013|014/.test(answer.reason), 'and does not blame the delivery migrations');
    }

    const noDeliveries = fakeSupabase({ errors: { deliveries: MISSING } });
    assert.deepStrictEqual(await new DeliveryRepository({ db: noDeliveries }).probe(),
      { ready: false, reason: 'iam.deliveries does not exist: apply migrations 013 and 014' },
      'a missing deliveries table answers exactly as it did before presence existed');
    assert.strictEqual(noDeliveries.queries.length, 1, 'and the presence table is not even asked about');

    // Only a MISSING table is "not ready": a timeout on the presence table is not a verdict about migrations.
    const flaky = await new DeliveryRepository({ db: fakeSupabase({ errors: { rider_presence: TIMEOUT } }) }).probe();
    assert.strictEqual(flaky.ready, true, 'a flaky presence query is not "migration 017 is missing"');
    const flakyDeliveries = await new DeliveryRepository({ db: fakeSupabase({ errors: { deliveries: TIMEOUT } }) }).probe();
    assert.strictEqual(flakyDeliveries.ready, true);
    assert.ok(/could not check/.test(flakyDeliveries.reason));
    const dropped = await new DeliveryRepository({ db: throwingDb(TIMEOUT) }).probe();
    assert.deepStrictEqual([dropped.ready, /could not check/.test(dropped.reason)], [true, true], 'a dropped connection: ready, with the reason');
    assert.deepStrictEqual(await new DeliveryRepository({ db: null }).probe(), { ready: true, reason: 'in-memory store (no database client)' }, 'no database client: the in-memory store');

    // probe never throws, in production too.
    config.isProduction = true;
    const originalError = logger.error;
    logger.error = () => {};
    try {
      const prod = await new DeliveryRepository({ db: fakeSupabase({ errors: { rider_presence: MISSING } }) }).probe();
      assert.strictEqual(prod.ready, false, 'production: still answers (not ready) instead of throwing');
    } finally {
      config.isProduction = wasProduction;
      logger.error = originalError;
    }
  }

  // --------------------------------------------------------------- failure policy
  {
    const T = at(0);
    const CUT = at(-120);
    const calls = {
      findPresence: (r) => r.findPresence('r1'),
      listPresence: (r) => r.listPresence(),
      listFreshOnlinePresence: (r) => r.listFreshOnlinePresence(CUT),
      findStalePresence: (r) => r.findStalePresence(CUT),
      findStaleBusyPresence: (r) => r.findStaleBusyPresence(CUT),
      countOpenByDriver: (r) => r.countOpenByDriver({ statuses: BUSY_DELIVERY_STATUSES }),
      ensurePresence: (r) => r.ensurePresence('r1', T),
      transitionPresence: (r) => r.transitionPresence('r1', ['online'], { status: 'busy', updatedAt: T })
    };
    const WRITES = ['ensurePresence', 'transitionPresence'];
    // The reads that decide who is offered a job: an error must not be read as "nobody".
    const RANKING = ['listPresence', 'listFreshOnlinePresence', 'countOpenByDriver'];
    // Housekeeping and single-rider reads keep the platform's read fallback.
    const FALLBACK = ['findPresence', 'findStalePresence', 'findStaleBusyPresence'];

    const failures = [];
    const originals = { prod: config.isProduction, error: logger.error, warn: logger.warn };
    logger.error = (m) => failures.push(String(m));
    logger.warn = () => {};
    try {
      // ---- production, table missing: a clear 503 on every path, reads included
      config.isProduction = true;
      for (const [code, error] of [['PGRST205', MISSING], ['42P01', MISSING_PG]]) {
        for (const [shape, make] of [
          ['an error response', () => fakeSupabase({ errors: { rider_presence: error, deliveries: error } })],
          ['a thrown error', () => throwingDb(error)]
        ]) {
          for (const [name, call] of Object.entries(calls)) {
            const repo = new DeliveryRepository({ db: make() });
            const err = await caught(() => call(repo));
            assert.ok(err instanceof DeliveryNotReadyError, `production, ${code} as ${shape}: ${name} answers DeliveryNotReadyError (got ${err && err.constructor.name}: ${err && err.message})`);
            assert.strictEqual(err.code, 'DELIVERY_NOT_READY', `${name}: code`);
            assert.strictEqual(err.statusCode, 503, `${name}: a 503, not a 500 and not an empty answer`);
            assert.ok(!/rider_presence|migration|PGRST|42P01/i.test(err.message), `${name}: the client is told nothing about the schema (${err.message})`);
          }
        }
      }
      assert.ok(failures.some((m) => /017/.test(m)), 'the operator\'s log says which migrations to apply, including 017');
      failures.length = 0;

      // ---- production, any other failure
      for (const [shape, make] of [
        ['an error response', () => fakeSupabase({ errors: { rider_presence: TIMEOUT, deliveries: TIMEOUT } })],
        ['a thrown error', () => throwingDb(TIMEOUT)]
      ]) {
        for (const name of [...RANKING, ...WRITES]) {
          const repo = new DeliveryRepository({ db: make() });
          const err = await caught(() => calls[name](repo));
          assert.ok(err instanceof InfrastructureError, `production + ${shape}: ${name} throws (not an empty list, not a silent memory write); got ${err && err.constructor.name}`);
          assert.strictEqual(err.code, 'INFRASTRUCTURE_ERROR', `${name}: code`);
          assert.strictEqual(err.statusCode, 500);
          assert.ok(!(err instanceof DeliveryNotReadyError), `${name}: a timeout is not "migrations missing"`);
        }
        for (const name of FALLBACK) {
          const repo = new DeliveryRepository({ db: make() });
          const threw = await caught(() => calls[name](repo));
          assert.strictEqual(threw, null, `production + ${shape}: ${name} did not throw (the next sweep retries; a rider with no row reads as offline)`);
        }
      }
      const emptyAnswers = {
        findPresence: null, findStalePresence: [], findStaleBusyPresence: []
      };
      for (const name of FALLBACK) {
        const repo = new DeliveryRepository({ db: fakeSupabase({ errors: { rider_presence: TIMEOUT } }) });
        assert.deepStrictEqual(await calls[name](repo), emptyAnswers[name], `production: ${name} degrades to ${JSON.stringify(emptyAnswers[name])}, towards offline and never towards online`);
      }

      // A write that failed in production left nothing in memory to be read back later.
      {
        const repo = new DeliveryRepository({ db: fakeSupabase({ errors: { rider_presence: TIMEOUT } }) });
        assert.ok(await caught(() => repo.ensurePresence('r1', T)));
        assert.ok(await caught(() => repo.transitionPresence('r1', ['offline'], { status: 'online', lastSeenAt: T, updatedAt: T })));
        config.isProduction = false;
        assert.strictEqual(await repo.findPresence('r1'), null, 'the failed production writes did not land in the in-memory store (a later fallback would otherwise "remember" an online rider)');
        config.isProduction = true;
      }

      // A healthy database in production is unaffected.
      {
        const repo = new DeliveryRepository({ db: fakeSupabase({ presence: dataset(), deliveries: [deliveryRow('d', 'accepted', 'r_fresh')] }) });
        assert.deepStrictEqual(ids(await repo.listFreshOnlinePresence(CUT)), ['r_fresh'], 'production, healthy: the read works');
        assert.strictEqual((await repo.countOpenByDriver({ statuses: BUSY_DELIVERY_STATUSES })).get('r_fresh'), 1);
        assert.ok(await repo.transitionPresence('r_fresh', ['online'], { status: 'busy', updatedAt: T }, { seenSince: CUT }), 'and so is the write');
      }

      // ---- outside production: everything degrades to the in-memory store, and the store works
      config.isProduction = false;
      for (const [label, make] of [
        ['a failing query', () => fakeSupabase({ errors: { rider_presence: TIMEOUT, deliveries: TIMEOUT } })],
        ['a missing table', () => fakeSupabase({ errors: { rider_presence: MISSING, deliveries: MISSING } })],
        ['a thrown error', () => throwingDb(TIMEOUT)],
        ['a thrown missing-table error', () => throwingDb(MISSING_PG)]
      ]) {
        const repo = new DeliveryRepository({ db: make() });
        for (const name of Object.keys(calls)) {
          const err = await caught(() => calls[name](new DeliveryRepository({ db: make() })));
          assert.strictEqual(err, null, `dev + ${label}: ${name} does not throw`);
        }
        // The fallback is a working store: a rider can go online in it and be found.
        await repo.ensurePresence('r1', T);
        assert.deepStrictEqual(await repo.findPresence('r1'), record('r1', 'offline', { updated: T }), `dev + ${label}: ensurePresence landed in memory`);
        const on = await repo.transitionPresence('r1', ['offline'], { status: 'online', lastSeenAt: T, updatedAt: T });
        assert.strictEqual(on.status, 'online', `dev + ${label}: the transition ran against memory`);
        assert.deepStrictEqual(ids(await repo.listFreshOnlinePresence(CUT)), ['r1'], `dev + ${label}: listFreshOnlinePresence reads memory`);
        assert.deepStrictEqual(ids(await repo.listPresence()), ['r1'], `dev + ${label}: listPresence reads memory`);
        assert.deepStrictEqual(ids(await repo.findStalePresence(at(60))), ['r1'], `dev + ${label}: findStalePresence reads memory`);
        assert.strictEqual(await repo.transitionPresence('r1', ['paused'], { status: 'busy', updatedAt: T }), null, `dev + ${label}: and the guards still hold in memory`);
      }
    } finally {
      config.isProduction = originals.prod;
      logger.error = originals.error;
      logger.warn = originals.warn;
    }
  }

  console.log('    ✓ Rider presence repository: exact queries, boundaries, mapping, probe and failure policy hold; memory and database paths agree.');
}

module.exports = { run };
