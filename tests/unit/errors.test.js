/**
 * Unit Test: Application Error Hierarchy
 */

const assert = require('assert');
const {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  InfrastructureError,
  IdempotencyError
} = require('../../server/shared/errors/AppError');

function run() {
  console.log('  Testing Error Classes & HTTP Status Codes...');

  // 1. ValidationError
  const valErr = new ValidationError('Invalid phone format', { field: 'phone' });
  assert.strictEqual(valErr.statusCode, 400);
  assert.strictEqual(valErr.code, 'VALIDATION_ERROR');
  assert.deepStrictEqual(valErr.details, { field: 'phone' });

  // 2. AuthenticationError
  const authErr = new AuthenticationError('Expired token');
  assert.strictEqual(authErr.statusCode, 401);
  assert.strictEqual(authErr.code, 'UNAUTHENTICATED');

  // 3. AuthorizationError
  const authzErr = new AuthorizationError('Requires admin role');
  assert.strictEqual(authzErr.statusCode, 403);
  assert.strictEqual(authzErr.code, 'PERMISSION_DENIED');

  // 4. NotFoundError
  const notFound = new NotFoundError('Product', 'prod_123');
  assert.strictEqual(notFound.statusCode, 404);
  assert.strictEqual(notFound.code, 'NOT_FOUND');
  assert.ok(notFound.message.includes('prod_123'));

  // 5. RateLimitError
  const rateLimit = new RateLimitError('Too many attempts', 30);
  assert.strictEqual(rateLimit.statusCode, 429);
  assert.strictEqual(rateLimit.retryAfterSeconds, 30);

  // 6. IdempotencyError
  const idempErr = new IdempotencyError('Duplicate request', 'key_abc');
  assert.strictEqual(idempErr.statusCode, 409);

  // 7. JSON Serialization
  const json = valErr.toJSON();
  assert.ok(json.error);
  assert.strictEqual(json.error.code, 'VALIDATION_ERROR');
  assert.strictEqual(json.error.statusCode, 400);

  console.log('    ✓ Error hierarchy tests passed.');
}

module.exports = { run };
