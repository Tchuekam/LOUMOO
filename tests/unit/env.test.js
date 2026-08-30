/**
 * Unit Test: Environment & Configuration
 */

const assert = require('assert');
const { config, envSchema } = require('../../server/config/env');

function run() {
  console.log('  Testing Environment Configuration...');

  // 1. Config Object Integrity
  assert.ok(config, 'Config object should be defined');
  assert.strictEqual(typeof config.port, 'number', 'PORT should be a number');
  assert.ok(['development', 'staging', 'production', 'test'].includes(config.nodeEnv), 'Valid NODE_ENV');
  
  // 2. Supabase Configuration
  assert.ok(config.supabase.url, 'Supabase URL should be populated');
  assert.ok(config.supabase.anonKey, 'Supabase Anon Key should be populated');
  assert.ok(config.supabase.serviceRoleKey, 'Supabase Service Role Key should be populated');

  // 3. Clerk Configuration
  assert.ok(config.clerk.publishableKey, 'Clerk publishable key should be populated');
  assert.ok(config.clerk.secretKey, 'Clerk secret key should be populated');

  // 4. Redis Configuration
  assert.ok(config.redis.url, 'Redis URL should be populated');

  // 5. Schema Validation
  const testEnv = {
    PORT: '3000',
    NODE_ENV: 'production'
  };
  const parsed = envSchema.safeParse(testEnv);
  assert.ok(parsed.success, 'Schema should successfully parse valid env');
  assert.strictEqual(parsed.data.PORT, 3000, 'PORT string should transform to number');

  console.log('    ✓ Environment validation tests passed.');
}

module.exports = { run };
