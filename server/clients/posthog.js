/**
 * PostHog Server-Side Telemetry & Analytics Client
 */

const config = require('../config');

let posthog = null;

// PostHog capture only accepts PROJECT keys (`phc_...`). Personal keys
// (`phx_...`) are rejected by the capture endpoint with HTTP 401 per event.
const isProjectKey = key => typeof key === 'string' && key.startsWith('phc_');

try {
  const { PostHog } = require('posthog-node');

  if (!config.posthog.apiKey) {
    console.warn('[PostHog] POSTHOG_API_KEY not configured — telemetry is DISABLED (events are not sent).');
  } else if (!isProjectKey(config.posthog.apiKey)) {
    console.warn(
      '[PostHog] POSTHOG_API_KEY is not a project key (expected "phc_" prefix) — ' +
      'capture endpoint rejects personal keys with 401. Telemetry is DISABLED.'
    );
  } else {
    posthog = new PostHog(config.posthog.apiKey, {
      host: config.posthog.host,
      flushAt: 1,
      flushInterval: 0
    });
    console.log('[PostHog] Client initialized against', config.posthog.host);
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
