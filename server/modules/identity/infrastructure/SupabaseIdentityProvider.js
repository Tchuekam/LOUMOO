/**
 * LOUMOO — Supabase Identity Provider Adapter
 * ---------------------------------------------------------------------------
 * Verifies Supabase Auth and LOUMOO JWT session tokens using native crypto.
 */

const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');
const config = require('../../../config/env');
const logger = require('../../../shared/logging/logger');
const { AuthenticationError, InfrastructureError } = require('../../../shared/errors/AppError');

let supabaseAdmin = null;

if (config.supabase.url && (config.supabase.serviceRoleKey || config.supabase.anonKey)) {
  supabaseAdmin = createClient(config.supabase.url, config.supabase.serviceRoleKey || config.supabase.anonKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
}

function verifyJwt(token, secret) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [header, body, signature] = parts;
  try {
    const expectedSig = crypto.createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url');
    if (signature !== expectedSig) return null;
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch (e) {
    return null;
  }
}

function decodeJwt(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    return JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
  } catch (e) {
    return null;
  }
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

    // 1. Try local HMAC verification
    const jwtSecret = config.supabase.jwtSecret || 'loumoo-default-jwt-secret-key-2026';
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

    // 3. Fallback: decode unverified token if in development
    if (config.isDevelopment) {
      const decoded = decodeJwt(token);
      if (decoded && decoded.sub) {
        return {
          userId: decoded.sub,
          email: decoded.email || '',
          metadata: decoded.user_metadata || {},
          source: 'supabase'
        };
      }
    }

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
