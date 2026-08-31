/**
 * Centralized Application Error Handling Middleware
 * Redacts internal stack traces/PII in production and captures unhandled exceptions in Sentry
 */

const { AppError } = require('../errors/AppError');
const logger = require('../logging/logger');
const { Sentry } = require('../../clients/sentry');

/**
 * Some >=500 responses are the CORRECT, expected answer to a well-formed
 * request rather than a server fault: a retired endpoint pointing the client
 * at Clerk, or a capability the deployment has not been configured for. They
 * are logged at WARN without a stack so real 500s stay visible.
 */
const EXPECTED_5XX_CODES = new Set([
  'USE_CLERK_AUTHENTICATION',
  'PHONE_VERIFICATION_NOT_CONFIGURED'
]);

function errorHandler(err, req, res, next) {
  const requestId = req.requestId || 'req_unknown';

  // 1. Operational Domain Errors (AppError instances)
  if (err instanceof AppError) {
    if (err.statusCode >= 500 && !EXPECTED_5XX_CODES.has(err.code)) {
      logger.error(`[AppError ${err.statusCode}] ${err.message}`, err, {
        requestId,
        path: req.originalUrl,
        method: req.method,
        code: err.code
      });
      if (Sentry && Sentry.captureException) {
        Sentry.captureException(err, {
          tags: { requestId, route: req.originalUrl, code: err.code }
        });
      }
    } else {
      logger.warn(`[ClientError ${err.statusCode}] ${err.message}`, {
        requestId,
        path: req.originalUrl,
        method: req.method,
        code: err.code
      });
    }

    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
        requestId
      }
    });
  }

  // 2. Syntax / JSON Parse Errors from Express Body Parser
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    logger.warn('[JSONParseError] Malformed request JSON', { requestId, path: req.originalUrl });
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_JSON',
        message: 'Malformed request JSON payload',
        details: null,
        requestId
      }
    });
  }

  // 3. Unexpected Server Errors (500)
  logger.error('[UnhandledError] Unexpected runtime exception', err, {
    requestId,
    path: req.originalUrl,
    method: req.method
  });

  if (Sentry && Sentry.captureException) {
    Sentry.captureException(err, {
      tags: { requestId, route: req.originalUrl, unhandled: true },
      extra: { path: req.originalUrl, method: req.method }
    });
  }

  const isDev = process.env.NODE_ENV === 'development';
  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: isDev ? err.message : 'An unexpected internal server error occurred.',
      details: isDev ? { stack: err.stack } : null,
      requestId
    }
  });
}

module.exports = errorHandler;
