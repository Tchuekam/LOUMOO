/**
 * LOUMOO Health and Diagnostics Routes
 */

const express = require('express');
const router = express.Router();
const config = require('../config');
const { redis } = require('../clients/redis');

// Liveness probe
router.get('/healthz', (req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() });
});

// Readiness probe
router.get('/readyz', async (req, res) => {
  const checks = {
    server: 'healthy',
    database: 'unknown',
    redis: 'unknown'
  };

  try {
    if (redis) {
      await redis.ping();
      checks.redis = 'connected';
    } else {
      checks.redis = 'not_configured_or_uninitialized';
    }
  } catch (e) {
    checks.redis = `error: ${e.message}`;
  }

  try {
    if (config.supabase.url) {
      const response = await fetch(`${config.supabase.url}/rest/v1/`, {
        headers: {
          apikey: config.supabase.anonKey,
          Authorization: `Bearer ${config.supabase.anonKey}`
        }
      });
      checks.database = response.ok ? 'connected' : `status_${response.status}`;
    }
  } catch (e) {
    checks.database = `error: ${e.message}`;
  }

  const isReady = checks.redis !== 'error' && checks.database !== 'error';
  res.status(isReady ? 200 : 503).json({
    status: isReady ? 'ready' : 'degraded',
    checks,
    timestamp: new Date().toISOString()
  });
});

// Master System Status Endpoint
router.get('/api/status', (req, res) => {
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

module.exports = router;
