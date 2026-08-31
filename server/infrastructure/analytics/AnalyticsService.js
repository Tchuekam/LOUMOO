/**
 * Centralized Product Analytics Service (PostHog Provider)
 * Tracks user actions, commerce conversion funnels, and feature usage safely
 */

const { PostHog } = require('posthog-node');
const { config } = require('../../config/env');
const logger = require('../../shared/logging/logger');

let posthogClient = null;

/**
 * PostHog ingestion requires a PROJECT API key (`phc_...`). A personal API key
 * (`phx_...`) is for the management API and is rejected by the capture
 * endpoint with a 401 on every single event. Detecting it here means one clear
 * warning at boot instead of an error per tracked action.
 */
const isProjectKey = key => typeof key === 'string' && key.startsWith('phc_');

let analyticsDisabledReason = null;

if (!config.posthog.apiKey) {
  analyticsDisabledReason = 'POSTHOG_API_KEY is not configured';
  logger.warn(
    '[Analytics] POSTHOG_API_KEY is not configured — product analytics are DISABLED. ' +
    'Tracked events are NOT persisted anywhere.'
  );
} else if (!isProjectKey(config.posthog.apiKey)) {
  analyticsDisabledReason = 'POSTHOG_API_KEY is not a project key (expected "phc_" prefix)';
  logger.warn(
    '[Analytics] POSTHOG_API_KEY does not look like a project key (expected a "phc_" prefix) — ' +
    'the live capture endpoint rejects personal ("phx_") keys with 401. ' +
    'Product analytics are DISABLED. Copy the Project API Key from PostHog → Settings → Project.'
  );
} else {
  try {
    posthogClient = new PostHog(config.posthog.apiKey, {
      host: config.posthog.host,
      flushAt: 20,
      flushInterval: 10000
    });
    // Suppress unhandled network rejections for test environments
    if (typeof posthogClient.on === 'function') {
      posthogClient.on('error', (err) => logger.debug(`[PostHog] Client status: ${err.message}`));
    }
    logger.info('[Analytics] PostHog provider initialized successfully.');
  } catch (err) {
    analyticsDisabledReason = `PostHog client initialization failed: ${err.message}`;
    logger.error('[Analytics] Failed to initialize PostHog provider', err);
  }
}

class AnalyticsService {
  /**
   * Track a strongly-named domain event (Supports both track(distinctId, eventName, properties) and track(eventName, options))
   */
  track(arg1, arg2, arg3 = {}) {
    let distinctId = 'anonymous';
    let eventName = '';
    let properties = {};

    if (typeof arg2 === 'string') {
      distinctId = String(arg1);
      eventName = arg2;
      properties = arg3 || {};
    } else if (typeof arg1 === 'string') {
      eventName = arg1;
      if (typeof arg2 === 'object' && arg2 !== null) {
        distinctId = String(arg2.distinctId || arg2.userId || 'anonymous');
        properties = arg2.properties || arg2;
      }
    }

    if (!eventName) return;

    try {
      if (posthogClient) {
        posthogClient.capture({
          distinctId,
          event: eventName,
          properties: {
            ...properties,
            platform: 'LOUMOO Universal Commerce',
            environment: config.nodeEnv,
            timestamp: new Date().toISOString()
          }
        });
      } else {
        // Honest degradation: the event was NOT persisted anywhere. This is a
        // loud, unambiguous marker — never a pretend success.
        logger.debug(
          `[Analytics] Event NOT persisted (analytics disabled — ${analyticsDisabledReason}): ` +
          `${eventName} for ${distinctId}`,
          properties
        );
      }
    } catch (err) {
      // Analytics failures must NEVER break critical user flows
      logger.debug(`[Analytics] Note on event ${eventName}: ${err.message}`);
    }
  }

  /**
   * Identify a user and associate profile traits
   */
  identify(distinctId, userProperties = {}) {
    if (!distinctId) return;

    try {
      if (posthogClient) {
        posthogClient.identify({
          distinctId: String(distinctId),
          properties: {
            ...userProperties,
            identifiedAt: new Date().toISOString()
          }
        });
      }
    } catch (err) {
      logger.warn(`[Analytics] Failed identifying user ${distinctId}: ${err.message}`);
    }
  }
}

module.exports = new AnalyticsService();
