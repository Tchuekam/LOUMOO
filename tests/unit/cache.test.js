/**
 * Unit Test: Cache Service
 */

const assert = require('assert');
const CacheService = require('../../server/infrastructure/cache/CacheService');

async function run() {
  console.log('  Testing CacheService Operations...');

  const testKey = `test_key_${Date.now()}`;
  const testData = { name: 'Sawa Hotel', price: 65000 };

  // 1. Set and Get
  await CacheService.set(testKey, testData, 60, 'test');
  const cached = await CacheService.get(testKey, 'test');
  assert.deepStrictEqual(cached, testData, 'Cached value should match original');

  // 2. Delete
  await CacheService.delete(testKey, 'test');
  const deleted = await CacheService.get(testKey, 'test');
  assert.strictEqual(deleted, null, 'Deleted key should return null');

  // 3. Remember Pattern
  let counter = 0;
  const fetchFn = async () => {
    counter++;
    return { counterValue: counter };
  };

  const firstCall = await CacheService.remember('counter_key', 60, fetchFn, 'test');
  const secondCall = await CacheService.remember('counter_key', 60, fetchFn, 'test');

  assert.strictEqual(firstCall.counterValue, 1);
  assert.strictEqual(secondCall.counterValue, 1, 'Second call should be served from cache without invoking fetchFn');
  assert.strictEqual(counter, 1, 'fetchFn should only be executed once');

  // Clean up
  await CacheService.delete('counter_key', 'test');

  console.log('    ✓ CacheService tests passed.');
}

module.exports = { run };
