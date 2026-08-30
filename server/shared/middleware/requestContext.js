/**
 * Request Context Middleware
 * Generates unique correlation request IDs, captures timing, and binds context
 */

const crypto = require('crypto');

function requestContext(req, res, next) {
  // Extract or generate requestId
  const incomingId = req.headers['x-request-id'] || req.headers['x-correlation-id'];
  const requestId = (typeof incomingId === 'string' && incomingId.trim()) 
    ? incomingId.trim() 
    : crypto.randomUUID();

  req.requestId = requestId;
  req.startTime = Date.now();

  // Attach header to outgoing response for traceability
  res.setHeader('X-Request-Id', requestId);

  // Measure response duration
  res.on('finish', () => {
    const durationMs = Date.now() - req.startTime;
    req.durationMs = durationMs;
  });

  next();
}

module.exports = requestContext;
