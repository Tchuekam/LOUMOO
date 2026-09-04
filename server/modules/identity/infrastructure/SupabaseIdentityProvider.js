/**
 * LOUMOO — Supabase Identity Provider Adapter
 * ---------------------------------------------------------------------------
 * Verifies Supabase Auth and LOUMOO JWT session tokens using native crypto.
 */

const { createClient } = require('@supabase/supabase-js');
const config = require('../../../config/env');
const logger = require('../../../shared/logging/logger');
const SessionToken = require('./SessionToken');
const { AuthenticationError, InfrastructureError } = require('../../../shared/errors/AppError');

let supabaseAdmin = null;

if (config.supabase.url && (config.supabase.serviceRoleKey || config.supabase.anonKey)) {
  supabaseAdmin = createClient(config.supabase.url, config.supabase.serviceRoleKey || config.supabase.anonKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
}

/**
 * Verifies a LOUMOO-issued HS256 session token through the shared trust
 * boundary. The verifier pins the algorithm, checks the signature in constant
 * time, and validates issuer, audience, expiry, not-before and the required
 * `sub` claim — nothing in the payload is read until the signature holds.
 * Returns the verified payload, or null with the failure reason logged at debug
 * level (never surfaced to the client).
 */
function verifyJwt(token, secret) {
  const result = SessionToken.verify(token, secret, {
    issuer: SessionToken.ISSUER,
    audience: SessionToken.AUDIENCE,
    requiredClaims: ['sub']
  });
  if (result.ok) return result.payload;
  logger.debug(`[Identity] Session token rejected: ${result.reason}`);
  return null;
}

const TEST_TOKEN_PREFIX = 'loumoo_test:';

class SupabaseIdentityProvider {
  static get isConfigured() {
    return true;
  }

  static get client() {
    return supabaseAdmin;
  }

  static async verifySessionToken(token) {
    if (!token || typeof token !== 'string') {
      throw new AuthenticationError('Authentication required: no session token was presented');
    }

    if (token.startsWith(TEST_TOKEN_PREFIX)) {
      if (!config.testAuth.enabled) {
        throw new AuthenticationError('Authentication failed: invalid session token');
      }
      const [, secret, userId] = token.split(':');
      if (!secret || secret !== config.testAuth.secret || !userId) {
        throw new AuthenticationError('Authentication failed: invalid session token');
      }
      return { userId, email: `${userId}@test.loumoo.cm`, metadata: {}, source: 'test-harness' };
    }

    // 1. Local HMAC verification against the configured session secret.
    //    There is deliberately no default secret: the previous fallback value
    //    was committed to this repository, so any deployment missing
    //    SUPABASE_JWT_SECRET accepted tokens anybody could forge.
    const jwtSecret = config.supabase.jwtSecret;
    if (!jwtSecret) {
      logger.error('[Identity] SUPABASE_JWT_SECRET is not configured — no session can be verified.');
      throw new AuthenticationError('Authentication is unavailable. Please try again later.');
    }
    const verified = verifyJwt(token, jwtSecret);
    if (verified && verified.sub) {
      return {
        userId: verified.sub,
        email: verified.email || '',
        metadata: verified.user_metadata || {},
        source: 'supabase'
      };
    }

    // 2. Try Supabase Auth API
    if (supabaseAdmin) {
      try {
        const { data, error } = await supabaseAdmin.auth.getUser(token);
        if (!error && data && data.user) {
          const user = data.user;
          return {
            userId: user.id,
            email: user.email,
            metadata: user.user_metadata || {},
            source: 'supabase'
          };
        }
      } catch (e) {}
    }

    // There is deliberately NO third fallback. A previous revision decoded the
    // token WITHOUT verifying its signature whenever NODE_ENV was
    // 'development' — which is the mode this project actually runs in — so any
    // hand-written JWT authenticated as any user id.

    throw new AuthenticationError('Session expired or invalid. Please sign in again.');
  }

  static phoneVerificationCapability() {
    return {
      available: false,
      provider: 'none',
      requirement: 'Phone verification is saved for local delivery and Mobile Money.'
    };
  }
}

module.exports = SupabaseIdentityProvider;
