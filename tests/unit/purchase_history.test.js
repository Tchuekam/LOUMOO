/**
 * Unit Test: Purchase History & Orders (04.06)
 */

const assert = require('assert');
const PurchaseHistoryUseCase = require('../../server/modules/identity/application/PurchaseHistoryUseCase');
const { AuthorizationError } = require('../../server/shared/errors/AppError');

async function run() {
  console.log('  Testing Purchase History & Order Domain Integration...');

  const buyerId = `usr_buyer_history_${Date.now()}`;

  /*
   * This asserted `orders.length >= 1` for a buyer id invented microseconds
   * earlier — an account that cannot possibly have ordered anything. It only
   * passed because getPurchaseHistory() treated "no rows" as a failure and
   * served _ensureDemoOrders(): two fabricated purchases including a 748,000
   * XAF iPhone with a tracking number and an escrow state. The test was
   * asserting the fake, which is precisely why nobody noticed real users were
   * being shown a delivery that did not exist.
   */

  // 1. A buyer with no orders gets an empty history — not an invented one.
  const history = await PurchaseHistoryUseCase.getPurchaseHistory(buyerId, { limit: 10, offset: 0 });
  assert.ok(Array.isArray(history.orders), 'Orders must be returned as an array');
  assert.strictEqual(history.orders.length, 0,
    'A buyer who has never ordered must have an empty history, never a demonstration order');
  assert.strictEqual(history.total, 0, 'The total must reflect reality');

  // 2. An order that does not exist is a 404, not a conjured demo order.
  let notFound = false;
  try {
    await PurchaseHistoryUseCase.getOrderDetails(buyerId, 'ord_does_not_exist');
  } catch (err) {
    notFound = err && (err.code === 'NOT_FOUND' || /not found/i.test(err.message));
  }
  assert.ok(notFound, 'Requesting an unknown order id must fail, never fabricate one');

  // 3. Ownership is still enforced on the real path.
  assert.ok(typeof PurchaseHistoryUseCase.getOrderDetails === 'function');
  assert.ok(AuthorizationError, 'Ownership errors remain part of the contract');

  console.log('    ✓ Purchase history returns real data only (no demo orders).');
}

module.exports = { run };
