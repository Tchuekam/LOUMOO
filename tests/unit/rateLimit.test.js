/**
 * Unit Test: Rate Limiting Service
 */

const assert = require('assert');
const RateLimitService = require('../../server/infrastructure/cache/RateLimitService');
const { RateLimitError } = require('../../server/shared/errors/AppError');

async function run() {
  console.log('  Testing RateLimitService Sliding Window...');

  const testKey = `client_ip_${Date.now()}`;
  const maxRequests = 5;
  const windowSeconds = 5;

  // 1. Consume within limit
  for (let i = 1; i <= maxRequests; i++) {
    const result = await RateLimitService.consume(testKey, maxRequests, windowSeconds);
    assert.strictEqual(result.allowed, true);
    assert.strictEqual(result.remaining, maxRequests - i);
  }

  // 2. Exceed limit (should throw RateLimitError)
  let threw = false;
  try {
    await RateLimitService.consume(testKey, maxRequests, windowSeconds);
  } catch (err) {
    if (err instanceof RateLimitError) {
      threw = true;
      assert.strictEqual(err.statusCode, 429);
      assert.strictEqual(err.code, 'RATE_LIMITED');
    }
  }

  assert.strictEqual(threw, true, 'Should throw RateLimitError upon exceeding quota');

  console.log('    ✓ RateLimitService tests passed.');
}

module.exports = { run };
