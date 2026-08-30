/**
 * Unit Test: Purchase History & Orders (04.06)
 */

const assert = require('assert');
const PurchaseHistoryUseCase = require('../../server/modules/identity/application/PurchaseHistoryUseCase');
const { AuthorizationError } = require('../../server/shared/errors/AppError');

async function run() {
  console.log('  Testing Purchase History & Order Domain Integration...');

  const buyerId = `usr_buyer_history_${Date.now()}`;

  // 1. Get purchase history
  const history = await PurchaseHistoryUseCase.getPurchaseHistory(buyerId, { limit: 10, offset: 0 });
  assert.ok(Array.isArray(history.orders), 'Orders must be returned as an array');
  assert.ok(history.orders.length >= 1, 'Should have at least 1 order representation');

  const firstOrder = history.orders[0];
  assert.strictEqual(firstOrder.buyerId, buyerId);
  assert.ok(firstOrder.totalAmountXaf > 0);
  assert.ok(firstOrder.items.length > 0);

  // 2. Get Single Order Details
  const orderDetails = await PurchaseHistoryUseCase.getOrderDetails(buyerId, firstOrder.id);
  assert.strictEqual(orderDetails.id, firstOrder.id);
  assert.strictEqual(orderDetails.buyerId, buyerId);

  console.log('    ✓ Purchase history tests passed.');
}

module.exports = { run };
