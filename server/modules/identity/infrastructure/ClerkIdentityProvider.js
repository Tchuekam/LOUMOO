/**
 * LOUMOO — Clerk Identity Provider Adapter
 * ---------------------------------------------------------------------------
 * The ONLY place in the server that talks to Clerk.
 *
 * Responsibilities, and nothing else:
 *   1. Verify a session token cryptographically and return the Clerk user id.
 *   2. Read the authoritative verification state of a Clerk user's email/phone.
 *
 * Two rules this module exists to enforce:
 *   - A token that does not verify yields NO identity. There is no "fallback
 *     user", no "inspect the token string and trust its prefix". An
 *     unverifiable token is an unauthenticated request, full stop.
 *   - Clerk owns email/phone verification. LOUMOO reads that state, mirrors it
 *     into its own database for authorization, and never invents it.
 */

const { createClerkClient, verifyToken } = require('@clerk/backend');
const config = require('../../../config/env');
const logger = require('../../../shared/logging/logger');
const { AuthenticationError, InfrastructureError } = require('../../../shared/errors/AppError');

let clerkClient = null;

if (config.clerk.secretKey) {
  clerkClient = createClerkClient({
    secretKey: config.clerk.secretKey,
    publishableKey: config.clerk.publishableKey || undefined
  });
} else {
  logger.warn('[Clerk] CLERK_SECRET_KEY is not configured — session verification is unavailable.');
}

/** Prefix used by the development-only test authentication scheme. */
const TEST_TOKEN_PREFIX = 'loumoo_test:';

class ClerkIdentityProvider {
  static get isConfigured() {
    return Boolean(clerkClient);
  }

  static get client() {
    if (!clerkClient) {
      throw new InfrastructureError('Clerk', 'CLERK_SECRET_KEY is not configured');
    }
    return clerkClient;
  }

  /**
   * Verifies a session token and returns its claims.
   *
   * @param {string} token  Raw JWT from the `Authorization: Bearer` header.
   * @returns {Promise<{userId:string, sessionId:string|null, source:string}>}
   * @throws {AuthenticationError} when the token is absent, malformed, expired
   *         or signed by an issuer this instance does not trust.
   */
  static async verifySessionToken(token) {
    if (!token || typeof token !== 'string') {
      throw new AuthenticationError('Authentication required: no session token was presented');
    }

    // ── Development-only test authentication ────────────────────────────────
    // Format: `loumoo_test:<shared-secret>:<clerk-user-id>`
    // Disabled unconditionally in production (config.testAuth.enabled is false
    // whenever NODE_ENV === 'production', regardless of the secret's value).
    if (token.startsWith(TEST_TOKEN_PREFIX)) {
      if (!config.testAuth.enabled) {
        throw new AuthenticationError('Authentication failed: invalid session token');
      }
      const [, secret, userId] = token.split(':');
      if (!secret || secret !== config.testAuth.secret || !userId) {
        throw new AuthenticationError('Authentication failed: invalid session token');
      }
      return { userId, sessionId: null, source: 'test-harness' };
    }

    if (!clerkClient) {
      throw new InfrastructureError('Clerk', 'Session verification is unavailable: CLERK_SECRET_KEY is not configured');
    }

    try {
      const claims = await verifyToken(token, {
        secretKey: config.clerk.secretKey,
        authorizedParties: config.clerk.authorizedParties.length
          ? config.clerk.authorizedParties
          : undefined
      });

      if (!claims || !claims.sub) {
        throw new AuthenticationError('Authentication failed: session token carries no subject');
      }

      return { userId: claims.sub, sessionId: claims.sid || null, source: 'clerk' };
    } catch (err) {
      if (err instanceof AuthenticationError) throw err;
      // `reason` is Clerk's machine-readable cause (token-expired,
      // token-invalid-signature, ...). It is safe to surface — it contains no
      // secret material — and it is what lets the client decide to refresh.
      const reason = err && (err.reason || err.code) ? String(err.reason || err.code) : 'token-invalid';
      logger.warn(`[Clerk] Session token rejected (${reason})`);
      throw new AuthenticationError('Your session is invalid or has expired. Please sign in again.', { reason });
    }
  }

  /**
   * Fetches the authoritative Clerk user record.
   * @returns {Promise<object|null>} null when the user no longer exists.
   */
  static async getUser(clerkUserId) {
    if (!clerkClient) return null;
    try {
      return await clerkClient.users.getUser(clerkUserId);
    } catch (err) {
      if (err && (err.status === 404 || err.statusCode === 404)) return null;
      logger.warn(`[Clerk] Failed to load user ${clerkUserId}: ${err.message}`);
      throw new InfrastructureError('Clerk', `Could not load identity ${clerkUserId}`, err);
    }
  }

  /**
   * Normalises a Clerk user (from the API or from a webhook payload) into the
   * subset of identity facts LOUMOO stores.
   *
   * Handles both shapes Clerk emits:
   *   - Backend SDK objects  (camelCase: emailAddresses, primaryEmailAddressId)
   *   - Webhook payloads     (snake_case: email_addresses, primary_email_address_id)
   */
  static normalizeUser(user) {
    if (!user) return null;

    const emails = user.emailAddresses || user.email_addresses || [];
    const phones = user.phoneNumbers || user.phone_numbers || [];
    const primaryEmailId = user.primaryEmailAddressId || user.primary_email_address_id || null;
    const primaryPhoneId = user.primaryPhoneNumberId || user.primary_phone_number_id || null;

    const primaryEmail = pickPrimary(emails, primaryEmailId);
    const primaryPhone = pickPrimary(phones, primaryPhoneId);

    return {
      clerkUserId: user.id,
      email: primaryEmail ? (primaryEmail.emailAddress || primaryEmail.email_address || null) : null,
      // A verification is real only when Clerk itself reports status
      // 'verified'. The mere presence of an address proves nothing.
      emailVerified: isVerified(primaryEmail),
      phoneNumber: primaryPhone ? (primaryPhone.phoneNumber || primaryPhone.phone_number || null) : null,
      phoneVerified: isVerified(primaryPhone),
      firstName: user.firstName || user.first_name || '',
      lastName: user.lastName || user.last_name || '',
      avatarUrl: user.imageUrl || user.image_url || user.profileImageUrl || user.profile_image_url || null,
      publicMetadata: user.publicMetadata || user.public_metadata || {},
      bannedOrLocked: Boolean(user.banned || user.locked)
    };
  }

  /**
   * Whether this deployment can actually perform phone verification.
   * Used to answer 503 + a configuration requirement instead of faking an SMS.
   */
  static phoneVerificationCapability() {
    const provider = config.verification.phoneProvider;
    if (provider === 'clerk') {
      return {
        available: Boolean(clerkClient),
        provider: 'clerk',
        requirement: clerkClient
          ? null
          : 'CLERK_SECRET_KEY must be configured for Clerk-backed phone verification.'
      };
    }
    return {
      available: false,
      provider: 'none',
      requirement:
        'Phone verification is not configured for this deployment. Enable a phone ' +
        'number strategy in the Clerk Dashboard (User & Authentication -> Email, ' +
        'Phone, Username) and set PHONE_VERIFICATION_PROVIDER=clerk.'
    };
  }
}

function pickPrimary(list, primaryId) {
  if (!Array.isArray(list) || list.length === 0) return null;
  if (primaryId) {
    const match = list.find(item => item.id === primaryId);
    if (match) return match;
  }
  return list[0];
}

function isVerified(item) {
  if (!item) return false;
  const v = item.verification;
  return Boolean(v && v.status === 'verified');
}

module.exports = ClerkIdentityProvider;
module.exports.TEST_TOKEN_PREFIX = TEST_TOKEN_PREFIX;
