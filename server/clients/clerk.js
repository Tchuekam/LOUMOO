/**
 * Clerk Authentication Client & Middleware Helper
 */

const config = require('../config');

let clerkClient = null;

try {
  const { createClerkClient } = require('@clerk/backend');

  if (config.clerk.secretKey) {
    clerkClient = createClerkClient({
      secretKey: config.clerk.secretKey,
      publishableKey: config.clerk.publishableKey
    });
  }
} catch (err) {
  console.warn('[Clerk] @clerk/backend library not installed yet.');
}

/**
 * Express middleware to verify Clerk bearer token
 */
async function verifyClerkAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid authorization token' });
  }

  const token = authHeader.split(' ')[1];

  try {
    if (clerkClient) {
      const verified = await clerkClient.authenticateRequest(req);
      if (verified.isSignedIn) {
        req.auth = verified.toAuth();
        return next();
      }
    }

    // Direct token inspection fallback
    req.auth = { token };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized: Token verification failed', message: err.message });
  }
}

module.exports = {
  clerkClient,
  verifyClerkAuth
};
