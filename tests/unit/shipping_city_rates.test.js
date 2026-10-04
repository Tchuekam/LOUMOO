/**
 * LOUMOO Unit Tests - The delivery fee the checkout shows is the fee the order gets
 * ---------------------------------------------------------------------------
 * The seeded rate table says "Yaounde" and a buyer's address says "Yaoundé". Neither
 * side used to ignore accents, so for a Yaoundé buyer the checkout showed the Douala
 * fee (1 000) while the server priced the order at its 3 000 default (Yaoundé's own
 * rate is 1 500): the total they agreed to was not the total of their order. One rule
 * now, on both sides, and this pins that they agree for every awkward spelling.
 *
 *   server : PricingEngine.resolveCityRate  (used by OrderCreationService)
 *   browser: resolveCityDeliveryFee         (used by the checkout), read out of the compiled app
 */

require('../setup');
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const { foldCity, resolveCityRate, DEFAULT_STANDARD_SHIPPING_XAF } = require('../../server/modules/commerce/domain/PricingEngine');

// What migration 012 seeds.
const SEEDED = { Douala: 1000, Yaounde: 1500, Bafoussam: 2500, Kribi: 2500, Bamenda: 3000, Garoua: 4000, Maroua: 4500 };

/** The browser's function, pulled out of the compiled app and run on its own. */
function browserFee() {
  const html = fs.readFileSync(path.resolve(__dirname, '../../Commerce App.dc.html'), 'utf8');
  const start = html.indexOf('function resolveCityDeliveryFee(city)');
  assert.ok(start > 0, 'the compiled app contains resolveCityDeliveryFee');
  const end = html.indexOf('\nconst GROUPS = {', start);
  const source = html.slice(start, end > 0 ? end : start + 2500);
  const sandbox = { window: {}, Number, String, Object, Array, Math, JSON };
  vm.createContext(sandbox);
  vm.runInContext(`${source}\nthis.fee = resolveCityDeliveryFee;`, sandbox);
  return { fee: sandbox.fee, settings: (rates) => { sandbox.window.LOUMOO_SYSTEM_SETTINGS = rates ? { shipping_rates_by_city: rates } : undefined; } };
}

async function run() {
  console.log('  Testing the delivery fee rule on the server and in the browser...');

  // ---- the folding rule itself
  assert.strictEqual(foldCity('Yaoundé'), 'yaounde');
  assert.strictEqual(foldCity('  YAOUNDE '), 'yaounde');
  assert.strictEqual(foldCity('Ngaoundéré'), 'ngaoundere');
  assert.strictEqual(foldCity('N’Djamena'), 'ndjamena');
  assert.strictEqual(foldCity('Saint   Louis'), 'saint louis');
  assert.strictEqual(foldCity(null), '');
  assert.strictEqual(foldCity('é'), 'e');

  // ---- the server
  for (const [typed, fee] of [['Douala', 1000], ['douala', 1000], ['DOUALA ', 1000], ['Yaounde', 1500], ['Yaoundé', 1500], ['yaoundé', 1500], ['YAOUNDÉ', 1500], ['Bafoussam', 2500], ['Maroua', 4500]]) {
    assert.strictEqual(resolveCityRate(SEEDED, typed), fee, `server: "${typed}" is ${fee}`);
  }
  assert.strictEqual(resolveCityRate(SEEDED, 'Nkongsamba'), null, 'a city not in the table is null, so the default applies');
  assert.strictEqual(resolveCityRate(SEEDED, ''), null);
  assert.strictEqual(resolveCityRate(SEEDED, undefined), null);
  assert.strictEqual(resolveCityRate(null, 'Douala'), null);
  assert.strictEqual(resolveCityRate({ Douala: 0 }, 'Douala'), 0, 'free delivery (0) is a real rate');
  assert.strictEqual(resolveCityRate({ Douala: -5 }, 'Douala'), null, 'a negative rate is never used');
  assert.strictEqual(resolveCityRate({ Douala: 'free' }, 'Douala'), null, 'nor a non-number');
  assert.strictEqual(resolveCityRate({ 'Yaoundé': 1700 }, 'Yaounde'), 1700, 'the TABLE may be the accented one');

  // ---- the browser, and that it gives the server's answer for every case
  const b = browserFee();
  b.settings(SEEDED);
  const cases = ['Douala', 'douala', 'DOUALA ', 'Yaounde', 'Yaoundé', 'yaoundé', 'YAOUNDÉ', 'Bafoussam', 'Maroua', 'Kribi'];
  for (const typed of cases) {
    assert.strictEqual(b.fee(typed), resolveCityRate(SEEDED, typed), `browser agrees with the server for "${typed}"`);
  }
  assert.strictEqual(b.fee('Nkongsamba'), DEFAULT_STANDARD_SHIPPING_XAF, 'an unlisted city costs the server\'s default, not Douala\'s fee');
  assert.strictEqual(b.fee('Nkongsamba'), 3000);
  assert.strictEqual(b.fee('Yaoundé'), 1500, 'the case that was wrong: the Douala fee was shown');

  // A rate of 0 is free delivery, not "missing".
  b.settings({ Douala: 0, Yaounde: 1500 });
  assert.strictEqual(b.fee('Douala'), 0);
  assert.strictEqual(b.fee('Yaoundé'), 1500);

  // The same table with an accented key, as an administrator might type it.
  b.settings({ 'Yaoundé': 1700, Douala: 1000 });
  assert.strictEqual(b.fee('Yaounde'), resolveCityRate({ 'Yaoundé': 1700, Douala: 1000 }, 'Yaounde'));

  // No address yet (the bag): a Douala preview, never a crash.
  b.settings(SEEDED);
  assert.strictEqual(b.fee(''), 1000);
  assert.strictEqual(b.fee(undefined), 1000);

  // Settings not loaded (offline first paint): the built-in defaults, which are the seeded table.
  b.settings(null);
  for (const typed of cases) assert.strictEqual(b.fee(typed), resolveCityRate(SEEDED, typed), `built-in defaults agree for "${typed}"`);

  console.log('    ✓ Delivery fee: the checkout shows the fee the order is priced at, for every spelling of a city.');
}

module.exports = { run };
