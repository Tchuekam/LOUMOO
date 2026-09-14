'use strict';

/**
 * Vercel Serverless Function entry point for the LOUMOO Express API.
 * Wraps server/index.js to serve /api/* routes seamlessly.
 */

let app;
let initError = null;

try {
  app = require('../server/index.js');
} catch (err) {
  initError = err;
  console.error('[vercel/api] App initialization error:', err);
}

module.exports = (req, res) => {
  if (initError) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      success: false,
      error: {
        code: 'FUNCTION_INIT_ERROR',
        message: process.env.NODE_ENV === 'production'
          ? 'The API is temporarily unavailable.'
          : (initError.message || String(initError)),
        requestId: 'req_init_error'
      }
    }));
    return;
  }
  return app(req, res);
};
