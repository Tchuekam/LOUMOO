/**
 * Sentry Error Monitoring and Distributed APM Tracing
 */

const config = require('../config');

let Sentry = null;

try {
  Sentry = require('@sentry/node');

  if (config.sentry.dsn) {
    Sentry.init({
      dsn: config.sentry.dsn,
      environment: config.nodeEnv,
      tracesSampleRate: config.nodeEnv === 'production' ? 0.2 : 1.0,
      sendDefaultPii: true
    });
    console.log('[Sentry] Initialized Sentry Node SDK successfully.');
  }
} catch (err) {
  console.warn('[Sentry] @sentry/node library not installed yet.');
}

module.exports = {
  Sentry
};
