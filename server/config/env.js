/**
 * LOUMOO Typed Environment Configuration
 * Validates public and server-only variables with Zod schemas
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
  DATABASE_DIRECT_HOST: z.string().optional(),

  // Clerk
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().optional(),
  CLERK_PUBLISHABLE_KEY: z.string().optional(),
  CLERK_SECRET_KEY: z.string().optional(),
  CLERK_APP_ID: z.string().optional(),
  CLERK_WEBHOOK_SECRET: z.string().optional(),

  // Redis
  REDIS_URL: z.string().optional(),

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

const config = {
  port: env.PORT || 8080,
  nodeEnv: env.NODE_ENV || 'development',
  isProduction: env.NODE_ENV === 'production',
  isDevelopment: env.NODE_ENV === 'development',
  isTest: env.NODE_ENV === 'test',
  appName: env.APP_NAME || 'LOUMOO Universal Commerce Platform',
  baseUrl: env.APP_BASE_URL || 'http://localhost:8080',
  corsOrigins: env.CORS_ORIGINS || ['*'],

  supabase: {
    url: env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL || 'https://vhojbhvaasjvolcfkobz.supabase.co',
    anonKey: env.SUPABASE_ANON_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY || '',
    projectRef: env.SUPABASE_PROJECT_REF || 'vhojbhvaasjvolcfkobz',
    publishableKey: env.SUPABASE_PUBLISHABLE_KEY || '',
    jwtSecret: env.SUPABASE_JWT_SECRET || '',
    directHost: env.DATABASE_DIRECT_HOST || 'db.vhojbhvaasjvolcfkobz.supabase.co:5432'
  },

  clerk: {
    publishableKey: env.CLERK_PUBLISHABLE_KEY || env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || '',
    secretKey: env.CLERK_SECRET_KEY || '',
    appId: env.CLERK_APP_ID || '',
    webhookSecret: env.CLERK_WEBHOOK_SECRET || ''
  },

  redis: {
    url: env.REDIS_URL || ''
  },

  aisstream: {
    apiKey: env.AISSTREAM_API_KEY || ''
  },

  google: {
    appPassword: env.GOOGLE_APP_PASSWORD || ''
  },

  elevenlabs: {
    apiKey: env.ELEVENLABS_API_KEY || ''
  },

  posthog: {
    apiKey: env.POSTHOG_API_KEY || '',
    host: env.POSTHOG_HOST || 'https://us.i.posthog.com'
  },

  github: {
    token: env.GITHUB_TOKEN || ''
  },

  netlify: {
    token: env.NETLIFY_AUTH_TOKEN || ''
  },

  sentry: {
    dsn: env.SENTRY_DSN || ''
  },

  resend: {
    apiKey: env.RESEND_API_KEY || ''
  }
};

module.exports = config;
module.exports.config = config;
module.exports.envSchema = envSchema;
