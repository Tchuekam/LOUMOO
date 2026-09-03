'use strict';

/**
 * Netlify Functions entry point for the LOUMOO Express API.
 *
 * The same `server/index.js` that runs as a long-lived process in Docker/Railway
 * is imported here and adapted to Netlify's Lambda-compatible event model via
 * serverless-http. Because `server/index.js` only starts the HTTP listener and
 * background workers under `require.main === module`, importing it here yields
 * just the configured Express `app` — no dangling listener, no interval timers.
 *
 * Routing: netlify.toml rewrites `/api/*` to this function. We reconstruct the
 * original request path from `event.rawUrl` so Express sees the real
 * `/api/v1/...` path rather than the internal `/.netlify/functions/api/...` one.
 *
 * The Express app is loaded lazily inside the handler so that a configuration
 * error at boot (e.g. a missing production secret, which server/config/env.js
 * turns into a thrown Error) surfaces as a readable JSON 500 in the response and
 * logs, instead of an opaque "function failed to load" crash.
 */

let wrapped;

exports.handler = async (event, context) => {
  // Don't wait for the (unref'd) event loop to drain between invocations.
  context.callbackWaitsForEmptyEventLoop = false;

  try {
    if (!wrapped) {
      const serverless = require('serverless-http');
      const app = require('../../server/index.js');
      wrapped = serverless(app, {
        // Binary media (images, video) must pass through untouched.
        binary: [
          'application/octet-stream',
          'image/*',
          'video/*',
          'audio/*',
          'font/*',
          'application/pdf'
        ]
      });
    }

    // Present Express with the caller-facing path, not the function-internal one.
    if (event.rawUrl) {
      try {
        event.path = new URL(event.rawUrl).pathname;
      } catch (_) {
        /* keep event.path as delivered */
      }
    }

    return await wrapped(event, context);
  } catch (err) {
    const message = err && err.message ? err.message : String(err);
    console.error('[netlify/api] Handler error:', message);
    return {
      statusCode: 500,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        success: false,
        error: {
          code: 'FUNCTION_INIT_ERROR',
          message,
          details: null,
          requestId: 'req_function'
        }
      })
    };
  }
};
