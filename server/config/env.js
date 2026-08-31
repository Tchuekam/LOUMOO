/**
 * LOUMOO Typed Environment Configuration
 * ---------------------------------------------------------------------------
 * THE single place environment variables are read. `server/config/index.js`
 * re-exports this module — there is intentionally only one config object.
 *
 * Production policy: the server refuses to boot when a credential that
 * security depends on is missing. A misconfigured production deployment must
 * fail loudly at startup, never degrade silently into a permissive mode.
 */

const { z } = require('zod');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Priority load order: .env.local -> .env
const envLocalPath = path.resolve(process.cwd(), '.env.local');
const envPath = path.resolve(process.cwd(), '.env');

if (fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath });
} else if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config();
}

const envSchema = z.object({
  // Server
  PORT: z.string().default('8080').transform(val => parseInt(val, 10)),
  NODE_ENV: z.enum(['development', 'staging', 'production', 'test']).default('development'),
  APP_NAME: z.string().default('LOUMOO Universal Commerce Platform'),
  APP_BASE_URL: z.string().default('http://localhost:8080'),
  CORS_ORIGINS: z.string().default('*').transform(val => val.split(',').map(o => o.trim()).filter(Boolean)),

  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(10).optional(),
  SUPABASE_ANON_KEY: z.string().min(10).optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(10).optional(),
  SUPABASE_PROJECT_REF: z.string().optional(),
  SUPABASE_PUBLISHABLE_KEY: z.string().optional(),
  SUPABASE_JWT_SECRET: z.string().optional(),
  SUPABASE_MANAGEMENT_TOKEN: z.string().optional(),
  DATABASE_DIRECT_HOST: z.string().optional(),

  // Object storage (listing media)
  SUPABASE_STORAGE_BUCKET: z.string().default('listing-media'),

  // Clerk — the identity provider
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().optional(),
  CLERK_PUBLISHABLE_KEY: z.string().optional(),
  CLERK_SECRET_KEY: z.string().optional(),
  CLERK_APP_ID: z.string().optional(),
  CLERK_WEBHOOK_SECRET: z.string().optional(),
  // Comma-separated list of origins Clerk session tokens may be presented from.
  CLERK_AUTHORIZED_PARTIES: z.string().optional(),

  // Phone verification provider. LOUMOO never fakes an SMS: when this is unset
  // the phone verification endpoints answer 503 PHONE_VERIFICATION_NOT_CONFIGURED.
  //   'clerk'  -> phone numbers are verified through the Clerk identity provider
  //   'none'   -> phone verification is unavailable in this deployment
  PHONE_VERIFICATION_PROVIDER: z.enum(['clerk', 'none']).default('none'),

  // Redis
  REDIS_URL: z.string().optional(),

  // Development-only authentication bypass for the automated test suite.
  // Hard-disabled when NODE_ENV=production regardless of value (see below).
  LOUMOO_TEST_AUTH_SECRET: z.string().optional(),

  // AISStream
  AISSTREAM_API_KEY: z.string().optional(),

  // Google SMTP / App Password
  GOOGLE_APP_PASSWORD: z.string().optional(),

  // ElevenLabs
  ELEVENLABS_API_KEY: z.string().optional(),

  // PostHog
  POSTHOG_API_KEY: z.string().optional(),
  POSTHOG_HOST: z.string().default('https://us.i.posthog.com'),

  // GitHub & Netlify
  GITHUB_TOKEN: z.string().optional(),
  NETLIFY_AUTH_TOKEN: z.string().optional(),

  // Sentry
  SENTRY_DSN: z.string().optional(),

  // Resend
  RESEND_API_KEY: z.string().optional()
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('[EnvValidation] Critical environment configuration errors:');
  parsedEnv.error.issues.forEach(issue => {
    console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
  });
}

const env = parsedEnv.success ? parsedEnv.data : process.env;

const nodeEnv = env.NODE_ENV || 'development';
const isProduction = nodeEnv === 'production';
const isTest = nodeEnv === 'test';

const config = {
  port: env.PORT || 8080,
  nodeEnv,
  isProduction,
  isDevelopment: nodeEnv === 'development',
  isTest,
  appName: env.APP_NAME || 'LOUMOO Universal Commerce Platform',
  baseUrl: env.APP_BASE_URL || 'http://localhost:8080',
  corsOrigins: env.CORS_ORIGINS || ['*'],

  supabase: {
    url: env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL || '',
    anonKey: env.SUPABASE_ANON_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY || '',
    projectRef: env.SUPABASE_PROJECT_REF || '',
    publishableKey: env.SUPABASE_PUBLISHABLE_KEY || '',
    jwtSecret: env.SUPABASE_JWT_SECRET || '',
    managementToken: env.SUPABASE_MANAGEMENT_TOKEN || '',
    directHost: env.DATABASE_DIRECT_HOST || '',
    storageBucket: env.SUPABASE_STORAGE_BUCKET || 'listing-media'
  },

  clerk: {
    publishableKey: env.CLERK_PUBLISHABLE_KEY || env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || '',
    secretKey: env.CLERK_SECRET_KEY || '',
    appId: env.CLERK_APP_ID || '',
    webhookSecret: env.CLERK_WEBHOOK_SECRET || '',
    authorizedParties: (env.CLERK_AUTHORIZED_PARTIES || '')
      .split(',').map(o => o.trim()).filter(Boolean)
  },

  verification: {
    // Email verification is always owned by Clerk (the identity provider).
    emailProvider: 'clerk',
    phoneProvider: env.PHONE_VERIFICATION_PROVIDER || 'none',
    get phoneEnabled() {
      return this.phoneProvider !== 'none';
    }
  },

  redis: {
    url: env.REDIS_URL || ''
  },

  /**
   * Development-only test authentication.
   *
   * Enabled ONLY when: NODE_ENV is not production AND a secret is configured.
   * The production check is not a policy that can be overridden by an env var —
   * `enabled` is false in production even if the secret is present.
   */
  testAuth: {
    secret: env.LOUMOO_TEST_AUTH_SECRET || '',
    enabled: !isProduction && Boolean(env.LOUMOO_TEST_AUTH_SECRET)
  },

  aisstream: { apiKey: env.AISSTREAM_API_KEY || '' },
  google: { appPassword: env.GOOGLE_APP_PASSWORD || '' },
  elevenlabs: { apiKey: env.ELEVENLABS_API_KEY || '' },

  posthog: {
    apiKey: env.POSTHOG_API_KEY || '',
    host: env.POSTHOG_HOST || 'https://us.i.posthog.com'
  },

  github: { token: env.GITHUB_TOKEN || '' },
  netlify: { token: env.NETLIFY_AUTH_TOKEN || '' },
  sentry: { dsn: env.SENTRY_DSN || '' },
  resend: { apiKey: env.RESEND_API_KEY || '' }
};

/**
 * Credentials without which LOUMOO cannot enforce its own security model.
 * Missing any of these in production is a fatal misconfiguration, not a
 * warning: running without them would mean running without authentication.
 */
const PRODUCTION_REQUIRED = [
  ['CLERK_SECRET_KEY', config.clerk.secretKey, 'Session verification is impossible without it.'],
  ['CLERK_PUBLISHABLE_KEY', config.clerk.publishableKey, 'Required to resolve the Clerk frontend API and validate token issuers.'],
  ['CLERK_WEBHOOK_SECRET', config.clerk.webhookSecret, 'Unsigned webhooks would let anyone forge identity events.'],
  ['SUPABASE_URL', config.supabase.url, 'No database means no authoritative account state.'],
  ['SUPABASE_SERVICE_ROLE_KEY', config.supabase.serviceRoleKey, 'The API cannot read or write account state without it.']
];

/**
 * Returns the list of misconfigurations. Always safe to call — it never
 * includes secret VALUES, only variable names.
 */
function validateProductionConfig() {
  const problems = [];

  for (const [name, value, why] of PRODUCTION_REQUIRED) {
    if (!value) problems.push({ variable: name, reason: `Missing. ${why}` });
  }

  if (config.corsOrigins.includes('*')) {
    problems.push({
      variable: 'CORS_ORIGINS',
      reason: 'Wildcard "*" is not permitted in production; list the exact origins.'
    });
  }

  if (env.LOUMOO_TEST_AUTH_SECRET) {
    problems.push({
      variable: 'LOUMOO_TEST_AUTH_SECRET',
      reason: 'The test authentication bypass secret must never be set in production.'
    });
  }

  return problems;
}

/** Throws in production when required configuration is absent. */
function assertProductionConfig() {
  if (!config.isProduction) return [];
  const problems = validateProductionConfig();
  if (problems.length > 0) {
    const detail = problems.map(p => `  - ${p.variable}: ${p.reason}`).join('\n');
    throw new Error(
      `[LOUMOO] Refusing to start in production with an insecure configuration:\n${detail}\n` +
      'See .env.example for the full list of required variables.'
    );
  }
  return problems;
}

module.exports = config;
module.exports.config = config;
module.exports.envSchema = envSchema;
module.exports.validateProductionConfig = validateProductionConfig;
module.exports.assertProductionConfig = assertProductionConfig;
