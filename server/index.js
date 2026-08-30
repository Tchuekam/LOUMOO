/**
 * LOUMOO Universal Commerce Platform — Master Enterprise API Gateway
 * Modular Monolith routing pipeline
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const { config } = require('./config/env');
const { Sentry } = require('./clients/sentry');
const logger = require('./shared/logging/logger');
const requestContext = require('./shared/middleware/requestContext');
const errorHandler = require('./shared/middleware/errorHandler');
const RateLimitService = require('./infrastructure/cache/RateLimitService');
const IdempotencyService = require('./infrastructure/cache/IdempotencyService');

// Domain Route Modules
const healthRoutes = require('./modules/system/routes/healthRoutes');
const identityRoutes = require('./modules/identity/presentation/routes/identityRoutes');
const catalogRoutes = require('./modules/catalog/routes/catalogRoutes');
const storeRoutes = require('./modules/store/presentation/routes/storeRoutes');
const listingRoutes = require('./modules/listing/presentation/routes/listingRoutes');

const app = express();

// Trust reverse proxies (Cloudflare / Netlify / Nginx)
app.set('trust proxy', 1);

// 1. Global Request Context & Tracing
app.use(requestContext);

// 2. CORS & Parser Middlewares
app.use(cors({
  origin: config.corsOrigins.includes('*') ? '*' : config.corsOrigins,
  credentials: true,
  exposedHeaders: ['X-Request-Id', 'X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 3. Global Sliding-Window Rate Limiting (120 req/min standard)
app.use(RateLimitService.middleware({ maxRequests: 120, windowSeconds: 60 }));

// 4. Idempotency Support for Mutation Requests
app.use(IdempotencyService.middleware());

// 5. Versioned API Routes (/api/v1)
const v1Router = express.Router();
v1Router.use('/', healthRoutes);
v1Router.use('/', identityRoutes);
v1Router.use('/', catalogRoutes);
v1Router.use('/stores', storeRoutes);
v1Router.use('/listings', listingRoutes);

app.use('/api/v1', v1Router);

// Root Health Fallbacks for Cloud Load Balancers
app.use('/', healthRoutes);

// Public Client Configuration Bridge (For Browser Runtime)
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
    }
  });
});

// 6. Serve Static Frontend Prototype Assets (Zero UI Disruption)
app.use(express.static(path.resolve(__dirname, '..')));

// Serve the main application on root /, /index.html, and /app
app.get(['/', '/index.html', '/app'], (req, res) => {
  res.sendFile(path.resolve(__dirname, '..', 'Commerce App.dc.html'));
});

// 7. Sentry Express Error Handler
if (Sentry && Sentry.setupExpressErrorHandler) {
  Sentry.setupExpressErrorHandler(app);
}

// 8. Centralized Operational & Unhandled Error Handler
app.use(errorHandler);

// Standalone Server Initialization
if (require.main === module) {
  app.listen(config.port, () => {
    logger.info(`🚀 LOUMOO Enterprise Gateway running at http://localhost:${config.port}`);
    logger.info(`   - Liveness Probe:   http://localhost:${config.port}/api/v1/health`);
    logger.info(`   - Readiness Probe:  http://localhost:${config.port}/api/v1/readyz`);
    logger.info(`   - Platform Status:  http://localhost:${config.port}/api/v1/status`);
    logger.info(`   - Products API:     http://localhost:${config.port}/api/v1/products`);
    logger.info(`   - Frontend App:     http://localhost:${config.port}/Commerce%20App.dc.html\n`);
  });
}

module.exports = app;
