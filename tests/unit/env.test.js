/**
 * Unit Test: Environment & Configuration
 *
 * Hermetic. This used to assert that the machine running it had real Supabase,
 * Clerk and Redis values in its environment — a deployment-readiness check, not
 * a unit test: it failed on any machine without credentials, and two of its
 * assertions (REDIS_URL, CLERK_SECRET_KEY populated) contradicted the config's
 * own policy, which treats both as optional warnings (see PRODUCTION_WARNINGS in
 * server/config/env.js).
 *
 * It now tests what the config code DOES: each case loads server/config/env in a
 * child process with a minimal, fully controlled environment and an empty
 * working directory, so neither the developer's shell nor a .env file can change
 * the result.
 */

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const { config, envSchema } = require('../../server/config/env');

const ENV_MODULE = path.resolve(__dirname, '..', '..', 'server', 'config', 'env');

/** What a bare `node` needs to start; nothing that could carry a credential. */
function baseEnv() {
  const keep = ['PATH', 'Path', 'SystemRoot', 'SYSTEMROOT', 'TEMP', 'TMP', 'TMPDIR'];
  return Object.fromEntries(keep.filter(k => process.env[k] !== undefined).map(k => [k, process.env[k]]));
}

/**
 * Loads server/config/env in a clean child and returns whatever `script` logs
 * as its last stdout line, parsed as JSON. `script` sees the module as `env`.
 */
function inChild(script, env, cwd) {
  const stdout = execFileSync(process.execPath, [
    '-e',
    `const env = require(${JSON.stringify(ENV_MODULE)}); console.log(JSON.stringify((${script})(env)));`
  ], {
    cwd,
    env: { ...baseEnv(), ...env },
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    timeout: 30000
  });
  const lines = stdout.split('\n').map(l => l.trim()).filter(Boolean);
  return JSON.parse(lines[lines.length - 1]);
}

const PROJECT_FIELDS = `env => ({
  supabase: env.config.supabase,
  clerk: env.config.clerk,
  redisUrl: env.config.redis.url
})`;

function run() {
  console.log('  Testing Environment Configuration...');

  const emptyDir = fs.mkdtempSync(path.join(os.tmpdir(), 'loumoo-env-test-'));
  try {
    // 1. Config object integrity (this process's own config)
    assert.ok(config, 'Config object should be defined');
    assert.strictEqual(typeof config.port, 'number', 'PORT should be a number');
    assert.ok(['development', 'staging', 'production', 'test'].includes(config.nodeEnv), 'Valid NODE_ENV');

    // 2. Variables map onto config fields
    const mapped = inChild(PROJECT_FIELDS, {
      NODE_ENV: 'test',
      SUPABASE_URL: 'https://project-ref.supabase.co',
      SUPABASE_ANON_KEY: 'anon_key_value_123',
      SUPABASE_SERVICE_ROLE_KEY: 'service_role_key_value',
      CLERK_PUBLISHABLE_KEY: 'pk_test_value',
      CLERK_SECRET_KEY: 'sk_test_value',
      REDIS_URL: 'redis://127.0.0.1:6379'
    }, emptyDir);
    assert.strictEqual(mapped.supabase.url, 'https://project-ref.supabase.co', 'SUPABASE_URL should map to supabase.url');
    assert.strictEqual(mapped.supabase.anonKey, 'anon_key_value_123', 'SUPABASE_ANON_KEY should map to supabase.anonKey');
    assert.strictEqual(mapped.supabase.serviceRoleKey, 'service_role_key_value', 'SUPABASE_SERVICE_ROLE_KEY should map to supabase.serviceRoleKey');
    assert.strictEqual(mapped.clerk.publishableKey, 'pk_test_value', 'CLERK_PUBLISHABLE_KEY should map to clerk.publishableKey');
    assert.strictEqual(mapped.clerk.secretKey, 'sk_test_value', 'CLERK_SECRET_KEY should map to clerk.secretKey');
    assert.strictEqual(mapped.redisUrl, 'redis://127.0.0.1:6379', 'REDIS_URL should map to redis.url');

    // 3. The NEXT_PUBLIC_ names are accepted when the plain ones are absent
    const fallbacks = inChild(PROJECT_FIELDS, {
      NODE_ENV: 'test',
      NEXT_PUBLIC_SUPABASE_URL: 'https://public-ref.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'public_anon_key_123',
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: 'pk_test_public'
    }, emptyDir);
    assert.strictEqual(fallbacks.supabase.url, 'https://public-ref.supabase.co');
    assert.strictEqual(fallbacks.supabase.anonKey, 'public_anon_key_123');
    assert.strictEqual(fallbacks.clerk.publishableKey, 'pk_test_public');

    // 4. With nothing set the config still loads and every field is an empty
    //    string, never undefined — the server must be importable credential-free.
    const bare = inChild(PROJECT_FIELDS, { NODE_ENV: 'test' }, emptyDir);
    for (const [name, value] of [
      ['supabase.url', bare.supabase.url],
      ['supabase.anonKey', bare.supabase.anonKey],
      ['supabase.serviceRoleKey', bare.supabase.serviceRoleKey],
      ['clerk.publishableKey', bare.clerk.publishableKey],
      ['clerk.secretKey', bare.clerk.secretKey],
      ['redis.url', bare.redisUrl]
    ]) {
      assert.strictEqual(value, '', `${name} should default to an empty string`);
    }

    // 5. Redis and Clerk are optional in production: absent, they are warnings,
    //    not boot blockers. Only the Supabase credentials are fatal.
    const production = inChild(`env => {
      const problems = env.validateProductionConfig();
      return {
        errors: problems.filter(p => p.severity === 'error').map(p => p.variable),
        warnings: problems.filter(p => p.severity === 'warning').map(p => p.variable)
      };
    }`, {
      NODE_ENV: 'production',
      SUPABASE_URL: 'https://project-ref.supabase.co',
      SUPABASE_ANON_KEY: 'anon_key_value_123',
      SUPABASE_SERVICE_ROLE_KEY: 'service_role_key_value',
      SUPABASE_JWT_SECRET: 'jwt_secret_value_for_validator_only',
      CORS_ORIGINS: 'https://loumoo.cm',
      TRUST_PROXY: '1'
    }, emptyDir);
    assert.deepStrictEqual(production.errors, [], 'Production with the Supabase credentials set must have no fatal problems');
    assert.ok(production.warnings.includes('REDIS_URL'), 'A missing REDIS_URL must be reported as a warning');
    assert.ok(production.warnings.includes('CLERK_SECRET_KEY'), 'A missing CLERK_SECRET_KEY must be reported as a warning');

    // 6. LOUMOO_NO_DOTENV keeps a developer's .env out of a run (tests/run_all.js
    //    sets it unless real services are opted into). The control case proves the
    //    file is read from the working directory, so the flag is what made the
    //    difference.
    fs.writeFileSync(path.join(emptyDir, '.env'), 'SUPABASE_URL=https://from-dotenv.invalid\n');
    const withDotenv = inChild(PROJECT_FIELDS, { NODE_ENV: 'test' }, emptyDir);
    assert.strictEqual(withDotenv.supabase.url, 'https://from-dotenv.invalid', 'Control: .env in the working directory should be loaded');
    const withoutDotenv = inChild(PROJECT_FIELDS, { NODE_ENV: 'test', LOUMOO_NO_DOTENV: '1' }, emptyDir);
    assert.strictEqual(withoutDotenv.supabase.url, '', 'LOUMOO_NO_DOTENV=1 must skip .env entirely');

    // .env.local takes priority over .env in the loader and must be skipped just the same.
    fs.writeFileSync(path.join(emptyDir, '.env.local'), 'SUPABASE_URL=https://from-dotenv-local.invalid\n');
    const withLocal = inChild(PROJECT_FIELDS, { NODE_ENV: 'test' }, emptyDir);
    assert.strictEqual(withLocal.supabase.url, 'https://from-dotenv-local.invalid', 'Control: .env.local should win over .env');
    const withoutLocal = inChild(PROJECT_FIELDS, { NODE_ENV: 'test', LOUMOO_NO_DOTENV: '1' }, emptyDir);
    assert.strictEqual(withoutLocal.supabase.url, '', 'LOUMOO_NO_DOTENV=1 must skip .env.local too');
  } finally {
    fs.rmSync(emptyDir, { recursive: true, force: true });
  }

  // 7. Schema Validation
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
