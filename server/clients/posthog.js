/**
 * PostHog Server-Side Telemetry & Analytics Client
 */

const config = require('../config');

let posthog = null;

try {
  const { PostHog } = require('posthog-node');

  if (config.posthog.apiKey) {
    posthog = new PostHog(config.posthog.apiKey, {
      host: config.posthog.host,
      flushAt: 1,
      flushInterval: 0
    });
  }
} catch (err) {
  console.warn('[PostHog] posthog-node library not installed yet.');
}

function trackEvent(distinctId, event, properties = {}) {
  if (posthog) {
    posthog.capture({
      distinctId,
      event,
      properties: {
        ...properties,
        app: config.appName,
        environment: config.nodeEnv,
        timestamp: new Date().toISOString()
      }
    });
  }
}

module.exports = {
  posthog,
  trackEvent
};
