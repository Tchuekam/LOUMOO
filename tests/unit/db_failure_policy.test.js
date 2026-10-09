/**
 * The database-failure policy: a failed WRITE must never be answered as success.
 * ---------------------------------------------------------------------------
 * `handleDatabaseFailure` lets a failed READ fall back to an empty/in-memory model
 * in production but must throw for a WRITE. It used to decide "read or write" with
 * (a) a list of PostgREST codes (PGRST301/116/204) that counted as a read whatever
 * the operation was, and (b) the substring "get", which is inside "target". So in
 * production:
 *   - an order insert that failed with PGRST204 (a stale schema cache) or PGRST301
 *     (a rotated key) was answered 201 for an order that was never stored;
 *   - a compare-and-swap UPDATE that matched nothing (PGRST116) was reported as a
 *     successful transition, defeating the swap;
 *   - a failed follow/unfollow ("Follow target") was reported as done.
 *
 * Production behaviour can only be seen in a process that started with
 * NODE_ENV=production (the flag is read when the config loads), so the repository
 * scenarios run in a child process in each mode and report back as JSON.
 */
'use strict';

const assert = require('assert');
const path = require('path');
const { spawnSync } = require('child_process');

const CHILD = process.argv.includes('--child');

// ------------------------------------------------------------------ child side
async function childScenarios() {
  const { handleDatabaseFailure } = require('../../server/infrastructure/database/SupabaseClient');
  const { OrderRepository } = require('../../server/modules/commerce/infrastructure/OrderRepository');
  const { Order } = require('../../server/modules/commerce/domain/Order');

  const out = {};
  const attempt = async (name, fn) => {
    try { out[name] = { ok: true, value: await fn() }; }
    catch (e) { out[name] = { ok: false, name: e.constructor && e.constructor.name, code: e.code, message: String(e.message).slice(0, 160) }; }
  };

  // A chainable stand-in for the supabase-js query builder: every modifier returns
  // itself and a terminal call resolves to the envelope for that operation.
  const fakeDb = (results) => ({
    from: () => {
      const make = (envelope) => new Proxy({}, {
        get: (_t, prop) => {
          if (prop === 'then') return (res, rej) => Promise.resolve(envelope).then(res, rej);
          if (prop === 'single' || prop === 'maybeSingle') return () => Promise.resolve(envelope);
          return () => make(envelope);
        }
      });
      return {
        select: () => make(results.select),
        insert: () => make(results.insert),
        update: () => make(results.update)
      };
    }
  });

  const row = {
    id: 'ord_1', buyer_id: 'b1', seller_id: 's1', order_number: 'KM-1', total_amount_xaf: '16500.00',
    items: [{ listingId: 'l1', title: 'Shirt', unitPriceXaf: 15000, quantity: 1, totalLineXaf: 15000, sellerId: 's1', storeId: 'st1', storeName: 'Shop' }],
    shipping_address: { _deliveryMethod: 'HOME_DELIVERY', _subtotalXaf: 15000, _shippingFeeXaf: 1500, _timeline: [] },
    payment_status: 'pending', fulfillment_status: 'processing',
    created_at: new Date().toISOString(), updated_at: new Date().toISOString()
  };

  const newOrder = () => {
    const o = Object.create(Order.prototype);
    Object.assign(o, { id: 'ord_1', buyerId: 'b1', sellerId: 's1', orderNumber: 'KM-1', totalAmountXaf: 16500, items: [], shippingAddress: {}, deliveryMethod: 'HOME_DELIVERY', paymentStatus: 'pending', fulfillmentStatus: 'processing', timeline: [] });
    o.toJSON = () => ({ id: o.id });
    return o;
  };

  for (const code of ['PGRST204', 'PGRST301', 'PGRST116', '23505']) {
    await attempt(`saveOrder:${code}`, async () => {
      const repo = new OrderRepository({ db: fakeDb({ insert: { data: null, error: { code, message: `boom ${code}` } } }) });
      const saved = await repo.saveOrder(newOrder());
      return { returnedAnOrder: Boolean(saved && saved.id) };
    });
  }

  await attempt('cas-fulfillment:nothing-matched', async () => {
    const repo = new OrderRepository({ db: fakeDb({ select: { data: row, error: null }, update: { data: null, error: null } }) });
    const updated = await repo.updateFulfillmentStatusAtomic('ord_1', 'processing', 'in_transit', { updatedBy: 'x' });
    return { status: updated.fulfillmentStatus };
  });

  await attempt('cas-payment:nothing-matched', async () => {
    const repo = new OrderRepository({ db: fakeDb({ select: { data: row, error: null }, update: { data: null, error: null } }) });
    const updated = await repo.updatePaymentStatusAtomic('ord_1', 'pending', 'escrow_held', { updatedBy: 'x' });
    return { status: updated.paymentStatus };
  });

  await attempt('cas-fulfillment:matched', async () => {
    const after = { ...row, fulfillment_status: 'in_transit' };
    const repo = new OrderRepository({ db: fakeDb({ select: { data: row, error: null }, update: { data: after, error: null } }) });
    const updated = await repo.updateFulfillmentStatusAtomic('ord_1', 'processing', 'in_transit', { updatedBy: 'x' });
    return { status: updated.fulfillmentStatus };
  });

  for (const context of ['Follow target', 'Unfollow target', 'Block user', 'OrderRepository.saveOrder']) {
    await attempt(`policy:${context}`, async () => {
      const r = handleDatabaseFailure({ code: 'PGRST204', message: 'x' }, context);
      return { fellBack: r === false };
    });
  }
  for (const context of ['OrderRepository.findListingById', 'DeliveryRepository.listDrivers', 'Get org membership']) {
    await attempt(`policy:${context}`, async () => {
      const r = handleDatabaseFailure({ code: 'PGRST116', message: 'x' }, context);
      return { fellBack: r === false };
    });
  }

  process.stdout.write(`\n@@RESULT@@${JSON.stringify(out)}@@END@@\n`);
}

// ----------------------------------------------------------------- parent side
function runChild(nodeEnv) {
  const r = spawnSync(process.execPath, [__filename, '--child'], {
    env: {
      PATH: process.env.PATH, Path: process.env.Path, SystemRoot: process.env.SystemRoot,
      NODE_ENV: nodeEnv, LOUMOO_NO_DOTENV: '1'
    },
    encoding: 'utf8', timeout: 60000
  });
  const m = /@@RESULT@@(.*)@@END@@/s.exec(r.stdout || '');
  if (!m) throw new Error(`child (${nodeEnv}) produced no result.\nstdout: ${(r.stdout || '').slice(-600)}\nstderr: ${(r.stderr || '').slice(-600)}`);
  return JSON.parse(m[1]);
}

async function run() {
  // 1. The classification itself.
  process.env.LOUMOO_NO_DOTENV = '1';
  require('../setup');
  const { isReadOperation } = require('../../server/infrastructure/database/SupabaseClient');
  const table = [
    // [context, error, isRead]
    ['OrderRepository.saveOrder', { code: 'PGRST204' }, false],
    ['OrderRepository.saveOrder', { code: 'PGRST301' }, false],
    ['OrderRepository.updateFulfillmentStatusAtomic', { code: 'PGRST116' }, false],
    ['Follow target', {}, false],
    ['Unfollow target', {}, false],
    ['Block user', {}, false],
    ['Add org member', {}, false],
    ['ProfileRepository.recordLogin', {}, false],
    ['Update', {}, false],
    ['OrderRepository.findListingById', { code: 'PGRST116' }, true],
    ['DeliveryRepository.listDrivers', {}, true],
    ['Get org membership', {}, true],
    ['Check org slug', {}, true],
    ['Get follow status', {}, true],
    ['Check block status', {}, true],
    ['List following', {}, true],
    ['DeliveryRepository.findDriver', {}, true],
    ['Recalculate follow counts', {}, false],
    ['Query', {}, true],
    ['a widget with a budget', {}, false]
  ];
  for (const [ctx, err, want] of table) {
    assert.strictEqual(isReadOperation(ctx, err), want, `"${ctx}" ${JSON.stringify(err)} should be a ${want ? 'read' : 'write'}`);
  }

  // 2. Production: a failed write throws; a failed read may fall back.
  const prod = runChild('production');
  for (const code of ['PGRST204', 'PGRST301', 'PGRST116', '23505']) {
    const r = prod[`saveOrder:${code}`];
    assert.strictEqual(r.ok, false, `production: an insert that failed with ${code} must throw, not return an unsaved order`);
    assert.strictEqual(r.code, 'INFRASTRUCTURE_ERROR', `production: ${code} surfaces as an infrastructure error`);
  }
  for (const key of ['cas-fulfillment:nothing-matched', 'cas-payment:nothing-matched']) {
    assert.strictEqual(prod[key].ok, false, `production: ${key} must not report a transition that did not happen`);
    assert.strictEqual(prod[key].code, 'CONFLICT', `production: ${key} is a conflict the caller can retry or refuse`);
  }
  assert.strictEqual(prod['cas-fulfillment:matched'].ok, true, 'a swap that matched still succeeds');
  assert.strictEqual(prod['cas-fulfillment:matched'].value.status, 'in_transit');
  for (const c of ['Follow target', 'Unfollow target', 'Block user', 'OrderRepository.saveOrder']) {
    assert.strictEqual(prod[`policy:${c}`].ok, false, `production: a failed "${c}" throws`);
  }
  for (const c of ['OrderRepository.findListingById', 'DeliveryRepository.listDrivers', 'Get org membership']) {
    assert.strictEqual(prod[`policy:${c}`].ok, true, `production: a failed read "${c}" may fall back`);
  }

}
