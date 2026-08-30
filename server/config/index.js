/**
 * LOUMOO Master Backend Configuration Module
 * Loads and validates environment variables from .env.local / .env
 */

const fs = require('fs');
const path = require('path');
// Priority load order: .env.local -> .env (Zero-dependency fallback if dotenv is not yet installed)
function loadEnv(filePath) {
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf-8');
    content.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        let val = trimmed.slice(idx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    });
  }
}

try {
  const dotenv = require('dotenv');
  const envLocalPath = path.resolve(process.cwd(), '.env.local');
  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envLocalPath)) {
    dotenv.config({ path: envLocalPath });
  } else if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  } else {
    dotenv.config();
  }
} catch (e) {
  loadEnv(path.resolve(process.cwd(), '.env.local'));
  loadEnv(path.resolve(process.cwd(), '.env'));
}


const config = {
  // Server
  port: parseInt(process.env.PORT || '8080', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  appName: process.env.APP_NAME || 'LOUMOO Universal Commerce Platform',
  baseUrl: process.env.APP_BASE_URL || 'http://localhost:8080',
  corsOrigins: (process.env.CORS_ORIGINS || '*')
    .split(',')
    .map(o => o.trim())
    .filter(Boolean),

  // Supabase
  supabase: {
    url: process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    projectRef: process.env.SUPABASE_PROJECT_REF,
    publishableKey: process.env.SUPABASE_PUBLISHABLE_KEY,
    jwtSecret: process.env.SUPABASE_JWT_SECRET,
    directHost: process.env.DATABASE_DIRECT_HOST
  },

  // Clerk
  clerk: {
    publishableKey: process.env.CLERK_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    secretKey: process.env.CLERK_SECRET_KEY,
    appId: process.env.CLERK_APP_ID
  },

  // Redis
  redis: {
    url: process.env.REDIS_URL
  },

  // AISStream
  aisstream: {
    apiKey: process.env.AISSTREAM_API_KEY
  },

  // Google / SMTP App Password
  google: {
    appPassword: process.env.GOOGLE_APP_PASSWORD
  },

  // ElevenLabs
  elevenlabs: {
    apiKey: process.env.ELEVENLABS_API_KEY
  },

  // PostHog
  posthog: {
    apiKey: process.env.POSTHOG_API_KEY,
    host: process.env.POSTHOG_HOST || 'https://us.i.posthog.com'
  },

  // GitHub
  github: {
    token: process.env.GITHUB_TOKEN
  },

  // Netlify
  netlify: {
    token: process.env.NETLIFY_AUTH_TOKEN
  },

  // Sentry
  sentry: {
    dsn: process.env.SENTRY_DSN
  },

  // Resend
  resend: {
    apiKey: process.env.RESEND_API_KEY
  }
};

module.exports = config;
