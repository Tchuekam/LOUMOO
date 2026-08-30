/**
 * Unit Test: Idempotency Service
 */

const assert = require('assert');
const IdempotencyService = require('../../server/infrastructure/cache/IdempotencyService');
const { IdempotencyError } = require('../../server/shared/errors/AppError');

async function run() {
  console.log('  Testing IdempotencyService Lock & Replay...');

  const idempotencyKey = `idemp_order_${Date.now()}`;
  const payload = { amount: 65000, currency: 'XAF', sellerId: 'sel_orca' };

  // 1. Initial lock acquisition
  const firstCheck = await IdempotencyService.checkOrLock(idempotencyKey, payload, 60);
  assert.strictEqual(firstCheck.state, 'ACQUIRED');

  // 2. Concurrent check while in progress -> should throw IdempotencyError
  let threw = false;
  try {
    await IdempotencyService.checkOrLock(idempotencyKey, payload, 60);
  } catch (err) {
    if (err instanceof IdempotencyError) {
      threw = true;
      assert.strictEqual(err.statusCode, 409);
    }
  }
  assert.strictEqual(threw, true, 'Concurrent request with same idempotency key must be rejected');

  // 3. Save completed response
  const mockResponse = { orderId: 'ord_98765', status: 'CONFIRMED' };
  await IdempotencyService.saveResponse(idempotencyKey, 201, mockResponse, 60);

  // 4. Repeated check after completion -> returns cached response directly
  const replayCheck = await IdempotencyService.checkOrLock(idempotencyKey, payload, 60);
  assert.strictEqual(replayCheck.state, 'COMPLETED');
  assert.strictEqual(replayCheck.statusCode, 201);
  assert.deepStrictEqual(replayCheck.responseBody, mockResponse);

  console.log('    ✓ IdempotencyService tests passed.');
}

module.exports = { run };
