/**
 * LOUMOO Universal Commerce Platform — Enterprise API Gateway
 * Modular monolith routing pipeline.
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./config/env');
const { assertProductionConfig, validateProductionConfig } = require('./config/env');
const { Sentry } = require('./clients/sentry');
const logger = require('./shared/logging/logger');
const requestContext = require('./shared/middleware/requestContext');
const errorHandler = require('./shared/middleware/errorHandler');
const { securityHeaders } = require('./shared/middleware/securityHeaders');
const RateLimitService = require('./infrastructure/cache/RateLimitService');
const IdempotencyService = require('./infrastructure/cache/IdempotencyService');
const OutboxService = require('./infrastructure/events/OutboxService');
const { MediaStorageService } = require('./infrastructure/storage/MediaStorageService');

// Domain route modules
const healthRoutes = require('./modules/system/routes/healthRoutes');
const identityRoutes = require('./modules/identity/presentation/routes/identityRoutes');
const catalogRoutes = require('./modules/catalog/routes/catalogRoutes');
const storeRoutes = require('./modules/store/presentation/routes/storeRoutes');
const listingRoutes = require('./modules/listing/presentation/routes/listingRoutes');
const uploadRoutes = require('./modules/listing/presentation/routes/uploadRoutes');
const adaptiveRoutes = require('./modules/adaptive/presentation/routes/adaptiveRoutes');
const announcementRoutes = require('./modules/announcement/presentation/routes/announcementRoutes');

// Fail fast rather than boot a production server that cannot enforce its own
// security model. In development the same problems are logged as warnings.
assertProductionConfig();
if (!config.isProduction) {
  const problems = validateProductionConfig();
  for (const p of problems) {
    const label = p.severity === 'warning' ? 'warning' : 'ERROR';
    logger.warn(`[Config] (${label}) ${p.variable}: ${p.reason}`);
  }
}

const app = express();

// Trust reverse proxies (Cloudflare / Netlify / Nginx) for correct client IPs.
app.set('trust proxy', 1);

// 0. Security headers (before anything can write a response).
app.use(securityHeaders);

// 1. Request context & tracing
app.use(requestContext);

// 2. CORS
app.use(cors({
  origin: config.corsOrigins.includes('*') ? '*' : config.corsOrigins,
  credentials: true,
  exposedHeaders: ['X-Request-Id', 'X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset']
}));

/**
 * 3. Body parsing.
 *
 * Two routes MUST NOT be JSON-parsed:
 *   - the Clerk webhook, whose Svix signature covers the exact raw bytes
 *   - binary media upload, which carries an image rather than JSON
 * Parsing them here would consume the stream and leave the route's own raw
 * parser with nothing to read.
 */
const RAW_BODY_PATHS = [
  '/api/v1/webhooks/clerk',
  '/api/v1/uploads/listing-media'
];

function skipRawBodyRoutes(parser) {
  return (req, res, next) => {
    if (RAW_BODY_PATHS.some(p => req.path === p || req.path.startsWith(`${p}/`))) {
      return next();
    }
    return parser(req, res, next);
  };
}

app.use(skipRawBodyRoutes(express.json({ limit: '2mb' })));
app.use(skipRawBodyRoutes(express.urlencoded({ extended: true, limit: '2mb' })));

// 4. Global sliding-window rate limiting
app.use(RateLimitService.middleware({ maxRequests: 120, windowSeconds: 60 }));

// 5. Idempotency support for mutating requests
app.use(IdempotencyService.middleware());

// 6. Versioned API routes
const v1Router = express.Router();
v1Router.use('/', healthRoutes);
v1Router.use('/', identityRoutes);
v1Router.use('/', catalogRoutes);
v1Router.use('/', adaptiveRoutes);
v1Router.use('/stores', storeRoutes);
v1Router.use('/listings', listingRoutes);
v1Router.use('/uploads', uploadRoutes);
v1Router.use('/announcements', announcementRoutes);

app.use('/api/v1', v1Router);

// Root health fallbacks for cloud load balancers
app.use('/', healthRoutes);

/**
 * Public client bootstrap.
 *
 * Contains ONLY values that are safe in a browser: publishable/anon keys and
 * public DSNs. Server secrets (service role key, Clerk secret key, webhook
 * secret) are never included — a public key is designed to be seen; a secret
 * key grants full administrative access.
 */
app.get('/api/config', (req, res) => {
  res.json({
    supabase: {
      url: config.supabase.url,
      anonKey: config.supabase.anonKey,
      publishableKey: config.supabase.publishableKey
    },
    clerk: {
      publishableKey: config.clerk.publishableKey,
      appId: config.clerk.appId
    },
    posthog: {
      apiKey: config.posthog.apiKey,
      host: config.posthog.host
    },
    sentry: {
      dsn: config.sentry.dsn
    },
    verification: {
      emailProvider: config.verification.emailProvider,
      phoneProvider: config.verification.phoneProvider,
      phoneEnabled: config.verification.phoneEnabled
    }
  });
});

app.get(['/', '/index.html', '/app'], (req, res) => {
  res.sendFile(path.resolve(__dirname, '..', 'Commerce App.dc.html'));
});

// 7. Static frontend assets (registered after the explicit frontend routes so
// that '/' serves the generated single-file app, not the legacy index.html stub)
app.use(express.static(path.resolve(__dirname, '..')));

// 7b. API 404 — unknown /api routes answer JSON, never Express's HTML "Cannot GET" page.
// The frontend must always be able to parse an error response.
app.use('/api', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `No route matches ${req.method} ${req.originalUrl}`,
      details: null,
      requestId: req.requestId || 'req_unknown'
    }
  });
});

// 8. Sentry error handler
if (Sentry && Sentry.setupExpressErrorHandler) {
  Sentry.setupExpressErrorHandler(app);
}

// 9. Centralized error handler
app.use(errorHandler);

if (require.main === module) {
  const server = app.listen(config.port, () => {
    logger.info(`LOUMOO Enterprise Gateway running at http://localhost:${config.port}`);
    logger.info(`   - Health:        http://localhost:${config.port}/api/v1/health`);
    logger.info(`   - Account state: http://localhost:${config.port}/api/v1/me/state`);
    logger.info(`   - Listings:      http://localhost:${config.port}/api/v1/listings/taxonomy`);
    logger.info(`   - Frontend:      http://localhost:${config.port}/`);
  });

  // ── Background workers (only when the process owns the listen socket) ──────
  // The transactional outbox must deliver, and orphaned staging media must be
  // swept. Both run on unref'd timers so they never keep the process alive.
  const workers = [];

  const outboxTimer = setInterval(async () => {
    try {
      const { processed } = await OutboxService.processPendingBatch(50);
      if (processed > 0) logger.debug(`[OutboxWorker] dispatched ${processed} event(s)`);
    } catch (err) {
      logger.error(`[OutboxWorker] tick failed: ${err.message}`);
    }
  }, 15_000);
  outboxTimer.unref();
  workers.push(outboxTimer);

  const sweepTimer = setInterval(async () => {
    try {
      const res = await MediaStorageService.sweepOrphans({ limit: 200 });
      const swept = res.swept || res.removed || 0;
      if (swept > 0) logger.info(`[MediaSweep] swept ${swept} orphaned staging object(s)`);
    } catch (err) {
      logger.error(`[MediaSweep] sweep failed: ${err.message}`);
    }
  }, 60 * 60 * 1000); // hourly
  sweepTimer.unref();
  workers.push(sweepTimer);

  // Graceful shutdown — Railway / Kubernetes / Docker send SIGTERM before
  // killing the process. Drained in-flight requests, stopped workers, closed
  // Redis and exited cleanly so no event is half-written.
  let shuttingDown = false;
  async function shutdown(signal) {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info(`[Shutdown] Received ${signal} — draining connections (max 10s).`);
    const timer = setTimeout(() => {
      logger.error('[Shutdown] Drain timeout exceeded — forcing exit.');
      process.exit(1);
    }, 10_000);
    timer.unref();
    server.close(async () => {
      logger.info('[Shutdown] HTTP server closed.');
      for (const t of workers) clearInterval(t);
      try {
        const RedisConnection = require('./infrastructure/cache/RedisConnection');
        const redis = RedisConnection.getInstance();
        if (redis && redis.status === 'ready') await redis.quit();
      } catch (_) { /* Redis optional at shutdown */ }
      logger.info('[Shutdown] Complete. Bye.');
      process.exit(0);
    });
  }
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

module.exports = app;
