/**
 * LOUMOO — Supabase Identity Provider Adapter
 * ---------------------------------------------------------------------------
 * Verifies Supabase Auth session tokens and extracts user identities.
 */

const { createClient } = require('@supabase/supabase-js');
const config = require('../../../config/env');
const logger = require('../../../shared/logging/logger');
const { AuthenticationError, InfrastructureError } = require('../../../shared/errors/AppError');

let supabaseAdmin = null;

if (config.supabase.url && (config.supabase.serviceRoleKey || config.supabase.anonKey)) {
  supabaseAdmin = createClient(config.supabase.url, config.supabase.serviceRoleKey || config.supabase.anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
} else {
  logger.warn('[SupabaseAuth] SUPABASE_URL / keys not configured.');
}

const TEST_TOKEN_PREFIX = 'loumoo_test:';

class SupabaseIdentityProvider {
  static get isConfigured() {
    return Boolean(supabaseAdmin);
  }

  static get client() {
    if (!supabaseAdmin) {
      throw new InfrastructureError('Supabase', 'Supabase client is not configured');
    }
    return supabaseAdmin;
  }

  /**
   * Verifies a session token and returns its claims.
   *
   * @param {string} token  Raw JWT from the `Authorization: Bearer` header.
   * @returns {Promise<{userId:string, email:string, metadata:object, source:string}>}
   */
  static async verifySessionToken(token) {
    if (!token || typeof token !== 'string') {
      throw new AuthenticationError('Authentication required: no session token was presented');
    }

    // Development-only test authentication
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

    if (!supabaseAdmin) {
      throw new InfrastructureError('Supabase', 'Session verification is unavailable: Supabase client is not configured');
    }

    try {
      const { data, error } = await supabaseAdmin.auth.getUser(token);
      if (error || !data || !data.user) {
        throw new AuthenticationError(`Authentication failed: ${error ? error.message : 'invalid token'}`);
      }

      const user = data.user;
      return {
        userId: user.id,
        email: user.email,
        metadata: user.user_metadata || {},
        emailConfirmed: Boolean(user.email_confirmed_at || user.confirmed_at),
        source: 'supabase'
      };
    } catch (err) {
      if (err instanceof AuthenticationError) throw err;
      logger.warn(`[SupabaseAuth] Session token rejected: ${err.message}`);
      throw new AuthenticationError('Session expired or invalid. Please sign in again.');
    }
  }

  static phoneVerificationCapability() {
    return {
      available: false,
      provider: 'none',
      requirement: 'Phone verification is disabled; email OTP is active via Supabase Auth.'
    };
  }
}

module.exports = SupabaseIdentityProvider;
