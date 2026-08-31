/**
 * Service: Account Security & Session Management
 * ---------------------------------------------------------------------------
 * Lists a user's real Clerk sessions, revokes them, and records the audit
 * trail.
 *
 * Three lies were removed from this file, each of which mattered:
 *   - a fabricated "current session" was returned whenever Clerk was
 *     unreachable, so the security screen showed a device list that was
 *     invented rather than observed
 *   - `revokeSession` swallowed Clerk failures and answered "revoked
 *     successfully", so a user could believe they had signed a stolen device
 *     out when they had not
 *   - revocation did not check that the session belonged to the caller, so any
 *     authenticated user could sign out any other user by guessing a session id
 */

const ClerkIdentityProvider = require('../infrastructure/ClerkIdentityProvider');
const { SupabaseDatabase } = require('../../../infrastructure/database/SupabaseClient.js');
const {
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  InfrastructureError
} = require('../../../shared/errors/AppError');
const logger = require('../../../shared/logging/logger');

/** High-risk actions require the session to have authenticated recently. */
const RECENT_AUTH_WINDOW_MS = 15 * 60 * 1000;

class AccountSecurityService {
  get clerk() {
    return ClerkIdentityProvider.client;
  }

  /**
   * The user's active sessions, as Clerk reports them.
   *
   * @param {string} clerkUserId
   * @param {string|null} currentSessionId  Marks which row is "this device".
   */
  async getActiveSessions(clerkUserId, currentSessionId = null) {
    if (!ClerkIdentityProvider.isConfigured) {
      throw new InfrastructureError('Clerk', 'Session management is unavailable: CLERK_SECRET_KEY is not configured');
    }

    let sessionList;
    try {
      sessionList = await this.clerk.sessions.getSessionList({ userId: clerkUserId, status: 'active' });
    } catch (err) {
      // Surfacing the failure is the point: an empty or invented list would
      // tell the user nothing is signed in when something might be.
      logger.error(`[AccountSecurity] Could not list sessions for ${clerkUserId}: ${err.message}`);
      throw new InfrastructureError('Clerk', 'Could not load your active sessions. Try again shortly.', err);
    }

    const sessions = (sessionList && sessionList.data) || [];

    return sessions.map(s => ({
      id: s.id,
      status: s.status,
      lastActiveAt: s.lastActiveAt ? new Date(s.lastActiveAt).toISOString() : null,
      expireAt: s.expireAt ? new Date(s.expireAt).toISOString() : null,
      createdAt: s.createdAt ? new Date(s.createdAt).toISOString() : null,
      isCurrent: Boolean(currentSessionId) && s.id === currentSessionId,
      device: describeDevice(s)
    }));
  }

  /**
   * Revokes one session.
   *
   * Ownership is verified against Clerk before anything is revoked, and a
   * failure is reported as a failure — never as a success.
   */
  async revokeSession(clerkUserId, sessionId, { currentSessionId = null } = {}) {
    if (!sessionId) throw new NotFoundError('Session', 'undefined');

    if (!ClerkIdentityProvider.isConfigured) {
      throw new InfrastructureError('Clerk', 'Session revocation is unavailable: CLERK_SECRET_KEY is not configured');
    }

    let session;
    try {
      session = await this.clerk.sessions.getSession(sessionId);
    } catch (err) {
      throw new NotFoundError('Session', sessionId);
    }

    // The ownership check. Without it, a session id from anywhere would do.
    if (!session || session.userId !== clerkUserId) {
      logger.warn('[AccountSecurity] Session revocation denied', {
        requestedBy: clerkUserId,
        sessionId,
        sessionOwner: session ? session.userId : null
      });
      throw new NotFoundError('Session', sessionId);
    }

    try {
      await this.clerk.sessions.revokeSession(sessionId);
    } catch (err) {
      logger.error(`[AccountSecurity] Revocation failed for ${sessionId}: ${err.message}`);
      throw new InfrastructureError('Clerk', 'We could not sign that device out. Please try again.', err);
    }

    await this.logSecurityEvent({
      userId: null,
      clerkUserId,
      eventType: 'session_revoked',
      metadata: { revokedSessionId: sessionId, wasCurrentSession: sessionId === currentSessionId }
    });

    logger.info(`[AccountSecurity] user=${clerkUserId} revoked session=${sessionId}`);

    return {
      success: true,
      sessionId,
      wasCurrentSession: sessionId === currentSessionId,
      message: sessionId === currentSessionId
        ? 'This device has been signed out.'
        : 'That device has been signed out.'
    };
  }

  /**
   * Requires the session to have authenticated recently, for destructive
   * actions such as account deletion.
   *
   * The previous implementation accepted the literal string
   * `'valid_credential'` — a hardcoded skeleton key. Recency is now read from
   * the session itself, which the caller cannot influence.
   */
  async assertRecentAuthentication(principal, sessionId) {
    if (!principal) throw new AuthenticationError('Authentication required');

    if (!sessionId) {
      throw new AuthorizationError(
        'For your security, sign in again before making this change.',
        { reason: 'REAUTHENTICATION_REQUIRED' }
      );
    }

    if (!ClerkIdentityProvider.isConfigured) {
      throw new InfrastructureError('Clerk', 'Re-authentication cannot be verified: CLERK_SECRET_KEY is not configured');
    }

    let session;
    try {
      session = await this.clerk.sessions.getSession(sessionId);
    } catch (err) {
      throw new AuthenticationError('Your session could not be verified. Please sign in again.');
    }

    if (!session || session.userId !== principal.clerkUserId || session.status !== 'active') {
      throw new AuthenticationError('Your session is no longer valid. Please sign in again.');
    }

    const authenticatedAt = session.lastActiveAt || session.createdAt;
    const age = Date.now() - new Date(authenticatedAt).getTime();

    if (!Number.isFinite(age) || age > RECENT_AUTH_WINDOW_MS) {
      throw new AuthorizationError(
        'For your security, sign in again before making this change.',
        { reason: 'REAUTHENTICATION_REQUIRED', maxAgeSeconds: RECENT_AUTH_WINDOW_MS / 1000 }
      );
    }

    return true;
  }

  /**
   * Appends to the immutable security audit trail.
   * Best-effort: an audit write must never block the action it records, but it
   * is logged loudly when it fails so the gap is visible.
   */
  async logSecurityEvent({ userId = null, clerkUserId = null, eventType, ipAddress = null, userAgent = null, metadata = {} }) {
    try {
      const db = SupabaseDatabase.getAdmin();
      const { error } = await db.schema('system').from('account_security_events').insert({
        user_id: userId,
        event_type: eventType,
        ip_address: ipAddress,
        user_agent: userAgent,
        // Never record credentials, codes or tokens — only what happened.
        metadata: { ...metadata, clerkUserId },
        created_at: new Date().toISOString()
      });
      if (error) throw error;
    } catch (err) {
      logger.warn(`[SecurityAudit] Could not persist "${eventType}": ${err.message}`);
    }

    logger.info(`[SecurityAudit] ${eventType}`, { userId, clerkUserId, ...metadata });
  }
}

/** A human-readable device label from whatever Clerk reports. */
function describeDevice(session) {
  const activity = session.latestActivity || session.latest_activity;
  if (!activity) return 'Unknown device';

  const browser = activity.browserName || activity.browser_name;
  const os = activity.deviceType || activity.device_type;
  const city = activity.city;
  const country = activity.country;

  const parts = [];
  if (browser) parts.push(browser);
  if (os) parts.push(os);
  const where = [city, country].filter(Boolean).join(', ');
  if (where) parts.push(where);

  return parts.length ? parts.join(' · ') : 'Unknown device';
}

module.exports = new AccountSecurityService();
module.exports.RECENT_AUTH_WINDOW_MS = RECENT_AUTH_WINDOW_MS;
