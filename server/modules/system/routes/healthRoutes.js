/**
 * System Module — Health & Diagnostics Routes
 */

const express = require('express');
const router = express.Router();
const { config } = require('../../../config/env');
const RedisConnection = require('../../../infrastructure/cache/RedisConnection');
const { SupabaseDatabase } = require('../../../infrastructure/database/SupabaseClient');

// Liveness probe (GET /api/v1/health & GET /healthz)
router.get(['/health', '/healthz'], (req, res) => {
  const payload = {
    status: 'ok',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString()
  };
  if (!config.isProduction) payload.environment = config.nodeEnv;
  res.status(200).json(payload);
});

// Readiness probe (GET /api/v1/readyz & GET /readyz)
router.get(['/readyz', '/ready'], async (req, res) => {
  const checks = {
    server: 'healthy',
    database: 'checking',
    redis: 'checking'
  };

  const redis = RedisConnection.getInstance();
  try {
    if (redis && redis.status === 'ready') {
      checks.redis = 'connected';
    } else {
      checks.redis = config.isProduction ? 'unavailable' : 'degraded_or_fallback';
    }
  } catch (e) {
    checks.redis = 'unavailable';
  }

  try {
    const dbHealth = await SupabaseDatabase.checkHealth();
    checks.database = dbHealth.healthy ? 'connected' : 'unreachable';
  } catch (e) {
    checks.database = 'unreachable';
  }

  const isReady = checks.server === 'healthy' &&
    checks.database === 'connected' &&
    (!config.isProduction || checks.redis === 'connected');
  res.status(isReady ? 200 : 503).json({
    status: isReady ? 'ready' : 'degraded',
    checks,
    timestamp: new Date().toISOString()
  });
});

// Platform Status & Integrations Roster (GET /api/v1/status)
router.get('/status', (req, res) => {
  if (config.isProduction) {
    return res.json({
      platform: config.appName,
      version: '1.0.0',
      status: 'ok',
      timestamp: new Date().toISOString()
    });
  }

  res.json({
    platform: config.appName,
    version: '1.0.0',
    environment: config.nodeEnv,
    integrations: {
      supabase: Boolean(config.supabase.url && config.supabase.anonKey),
      supabaseAdmin: Boolean(config.supabase.serviceRoleKey),
      clerk: Boolean(config.clerk.publishableKey && config.clerk.secretKey),
      redis: Boolean(config.redis.url),
      sentry: Boolean(config.sentry.dsn),
      resend: Boolean(config.resend.apiKey),
      elevenlabs: Boolean(config.elevenlabs.apiKey),
      posthog: Boolean(config.posthog.apiKey),
      aisstream: Boolean(config.aisstream.apiKey),
      github: Boolean(config.github.token),
      netlify: Boolean(config.netlify.token)
    },
    timestamp: new Date().toISOString()
  });
});

// Feature Flags (GET /api/v1/features)
router.get('/features', (req, res) => {
  res.json({
    success: true,
    data: {
      black_freeday_active: true,
      voice_notes_enabled: Boolean(config.elevenlabs.apiKey),
      maritime_tracking: Boolean(config.aisstream.apiKey),
      clerk_auth_active: Boolean(config.clerk.publishableKey)
    }
  });
});

module.exports = router;
