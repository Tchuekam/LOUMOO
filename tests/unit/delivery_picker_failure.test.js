/**
 * The checkout's delivery picker must not turn a database failure into "no riders".
 * ---------------------------------------------------------------------------
 * GET /deliveries/providers reads the active riders (`delivery_drivers`) and two
 * counts from `deliveries`. In production a failure confined to the rider read — a
 * missing grant, a row-level-security change, an unexpected column error — used to
 * fall back to the repository's EMPTY in-memory map: the endpoint answered 200 with
 * `providers: []`, the buyer saw "No delivery providers list your area yet", and the
 * operator saw one log line. Production now fails visibly (a 5xx the picker shows
 * with a retry); development and test keep their in-memory fallback.
 *
 * Production behaviour is only observable in a process that started with
 * NODE_ENV=production, so the scenarios run in a child process in each mode.
 */
'use strict';

const assert = require('assert');
const { spawnSync } = require('child_process');

const CHILD = process.argv.includes('--child');

async function childScenarios() {
  const { DeliveryRepository } = require('../../server/modules/delivery/infrastructure/DeliveryRepository');
  const { DeliveryService } = require('../../server/modules/delivery/application/DeliveryService');

  // Chainable query-builder stand-in; each table answers with its own envelope.
  const fakeDb = (tables) => ({
    from: (table) => {
      const envelope = tables[table] || { data: [], error: null };
      const make = () => new Proxy({}, {
        get: (_t, prop) => {
          if (prop === 'then') return (res, rej) => Promise.resolve(envelope).then(res, rej);
          if (prop === 'single' || prop === 'maybeSingle') return () => Promise.resolve(envelope);
          return () => make();
        }
      });
      return { select: () => make(), insert: () => make(), update: () => make(), upsert: () => make(), delete: () => make() };
    }
  });

  const riderRow = {
    profile_id: 'rider-1', display_name: 'Rex Rider', phone: '+237670000303', status: 'active', created_by: 'admin-1',
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    photo_url: null, vehicle_type: 'motorbike', service_areas: ['douala'], base_fee_xaf: 1500,
    rating_avg: null, rating_count: 0, is_agency: false, organization_id: null
  };
  const caller = { userId: 'buyer-1', userRole: 'customer' };
  const out = {};
  const attempt = async (name, tables) => {
    try {
      const svc = new DeliveryService({ repository: new DeliveryRepository({ db: fakeDb(tables) }) });
      const r = await svc.listAvailableProviders(caller, { city: 'douala' });
      out[name] = { ok: true, providers: r.providers.map((p) => p.id) };
    } catch (e) {
      out[name] = { ok: false, name: e.constructor && e.constructor.name, code: e.code, status: e.statusCode };
    }
  };

  await attempt('healthy', { delivery_drivers: { data: [riderRow], error: null }, deliveries: { data: [], error: null } });
  // The scenario that mattered: ONLY the rider read fails (the two delivery reads succeed).
  await attempt('riders-read-fails', { delivery_drivers: { data: null, error: { code: '42501', message: 'permission denied for table delivery_drivers' } }, deliveries: { data: [], error: null } });
  await attempt('everything-fails', { delivery_drivers: { data: null, error: { code: '57014', message: 'canceling statement due to statement timeout' } }, deliveries: { data: null, error: { code: '57014', message: 'timeout' } } });
  await attempt('no-riders-registered', { delivery_drivers: { data: [], error: null }, deliveries: { data: [], error: null } });

  process.stdout.write(`\n@@RESULT@@${JSON.stringify(out)}@@END@@\n`);
}

function runChild(nodeEnv) {
  const r = spawnSync(process.execPath, [__filename, '--child'], {
    env: { PATH: process.env.PATH, Path: process.env.Path, SystemRoot: process.env.SystemRoot, NODE_ENV: nodeEnv, LOUMOO_NO_DOTENV: '1' },
    encoding: 'utf8', timeout: 90000
  });
  const m = /@@RESULT@@(.*)@@END@@/s.exec(r.stdout || '');
  if (!m) throw new Error(`child (${nodeEnv}) produced no result.\nstdout: ${(r.stdout || '').slice(-700)}\nstderr: ${(r.stderr || '').slice(-700)}`);
  return JSON.parse(m[1]);
}
