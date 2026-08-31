/**
 * LOUMOO — Authentication & Account-State Guards
 * ---------------------------------------------------------------------------
 * Every authenticated request enters the application through this file.
 *
 * The chain is always the same, in this order:
 *
 *      authenticate  ->  resolve account state  ->  authorize  ->  handler
 *
 * What this guard will NOT do, because earlier revisions did and each was an
 * outright authentication bypass:
 *   - infer a user id from the SHAPE of a bearer token (`user_...` prefixes)
 *   - fall back to a "demo"/"guest" identity when verification fails
 *   - accept a userId, sellerId or ownerId from the request body, query or URL
 *   - trust anything the browser stored about itself
 */

const SupabaseIdentityProvider = require('../../infrastructure/SupabaseIdentityProvider');
const AccountStateService = require('../../application/AccountStateService');
const ProfileRepository = require('../../infrastructure/ProfileRepository');
const UserProfile = require('../../entities/UserProfile');
const { ACCOUNT_STATES, isAtLeast } = require('../../domain/AccountState');
const {
  AuthenticationError,
  AuthorizationError
} = require('../../../../shared/errors/AppError');
const logger = require('../../../../shared/logging/logger');

function extractBearerToken(req) {
  const header = req.headers.authorization;
  if (!header || typeof header !== 'string') return null;
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  return match ? match[1].trim() : null;
}

/**
 * Attaches the resolved principal to the request.
 * `req.userProfile` is kept as a `UserProfile` entity for the existing use
 * cases; `req.principal` and `req.accountState` are the canonical additions.
 */
function attachPrincipal(req, { principal, accountState, auth }) {
  req.auth = auth;
  req.principal = principal;
  req.accountState = accountState;
  req.userProfile = principal ? UserProfile.fromPrincipal(principal) : null;
  req.userId = principal ? principal.id : null;
}

/**
 * Mandatory authentication. Rejects with 401 unless a cryptographically
 * verified session maps to a live LOUMOO account.
 */
async function requireAuth(req, res, next) {
  try {
    const token = extractBearerToken(req);
    if (!token) {
      throw new AuthenticationError('Authentication required. Sign in to continue.');
    }

    const claims = await SupabaseIdentityProvider.verifySessionToken(token);

    const { principal, accountState } = await AccountStateService.resolve(claims.userId, {
      source: claims.source
    });

    if (!principal) {
      throw new AuthenticationError('Your account is no longer available. Please sign in again.');
    }

    if (accountState.state === ACCOUNT_STATES.DELETED) {
      throw new AuthenticationError('This account has been deleted and cannot be accessed.');
    }
    if (accountState.state === ACCOUNT_STATES.SUSPENDED) {
      throw new AuthorizationError('This account has been suspended. Contact LOUMOO support.');
    }

    attachPrincipal(req, {
      principal,
      accountState,
      auth: {
        clerkUserId: claims.userId, email: claims.email, metadata: claims.metadata,
        sessionId: claims.sessionId,
        source: claims.source,
        userId: principal.id
      }
    });

    next();
  } catch (err) {
    if (err instanceof AuthenticationError) {
      logger.warn('[AuthGuard] Rejected request', {
        path: req.originalUrl,
        method: req.method,
        requestId: req.requestId,
        reason: err.details && err.details.reason ? err.details.reason : err.code
      });
    }
    next(err);
  }
}

/**
 * Optional authentication for public endpoints that personalise their
 * response. An invalid token here is treated as "no session" rather than an
 * error, but it is never treated as a valid one.
 */
async function optionalAuth(req, res, next) {
  const token = extractBearerToken(req);
  if (!token) {
    attachPrincipal(req, { principal: null, accountState: AccountStateService.derive(null), auth: null });
    return next();
  }

  try {
    const claims = await SupabaseIdentityProvider.verifySessionToken(token);
    const { principal, accountState } = await AccountStateService.resolve(claims.userId, {
      source: claims.source
    });
    attachPrincipal(req, {
      principal,
      accountState,
      auth: principal ? { clerkUserId: claims.userId, email: claims.email, metadata: claims.metadata, sessionId: claims.sessionId, source: claims.source, userId: principal.id } : null
    });
  } catch (err) {
    logger.debug(`[AuthGuard] Optional auth ignored an unusable token: ${err.message}`);
    attachPrincipal(req, { principal: null, accountState: AccountStateService.derive(null), auth: null });
  }

  next();
}

/**
 * Authorization by capability. This is the ONLY authorization primitive route
 * handlers should reach for — capabilities come from the account state machine,
 * so a rule change happens in exactly one place.
 *
 *   router.post('/', requireAuth, requireCapability('canCreateListing'), handler)
 */
function requireCapability(capability, options = {}) {
  return (req, res, next) => {
    const state = req.accountState;
    if (!state || !req.principal) {
      return next(new AuthenticationError('Authentication required.'));
    }

    if (state.capabilities[capability]) {
      return next();
    }

    logger.warn('[AuthGuard] Capability denied', {
      requestId: req.requestId,
      userId: req.principal.id,
      capability,
      accountState: state.state,
      path: req.originalUrl
    });

    return next(new AuthorizationError(
      options.message || messageForDeniedCapability(capability, state),
      {
        requiredCapability: capability,
        currentState: state.state,
        // Tells the client exactly where to send the user to become eligible —
        // this is what makes the frontend guard loop-free.
        resolveAt: state.destination,
        resolveScreen: state.screen,
        onboarding: state.onboarding
      }
    ));
  };
}

/** Authorization by minimum lifecycle stage. */
function requireAccountState(minimumState, options = {}) {
  return (req, res, next) => {
    const state = req.accountState;
    if (!state || !req.principal) {
      return next(new AuthenticationError('Authentication required.'));
    }
    if (isAtLeast(state.state, minimumState)) {
      return next();
    }
    return next(new AuthorizationError(
      options.message || `This action requires your account to reach '${minimumState}'.`,
      {
        currentState: state.state,
        requiredState: minimumState,
        resolveAt: state.destination,
        resolveScreen: state.screen
      }
    ));
  };
}

/** Administrative access. Role, unlike capability, is not part of the ladder. */
function requireAdmin(req, res, next) {
  if (!req.principal) return next(new AuthenticationError('Authentication required.'));
  if (['admin', 'super_admin'].includes(req.principal.primaryRole)) return next();
  return next(new AuthorizationError('Administrator access is required for this action.'));
}

function messageForDeniedCapability(capability, state) {
  switch (state.state) {
    case ACCOUNT_STATES.CONTACT_VERIFICATION_REQUIRED:
      return 'Verify your email address before continuing.';
    case ACCOUNT_STATES.ONBOARDING_REQUIRED:
      return 'Finish setting up your LOUMOO account to continue.';
    case ACCOUNT_STATES.ONBOARDING_IN_PROGRESS:
      return `Finish onboarding to continue${state.onboarding.nextStep ? ` (next step: ${state.onboarding.nextStep})` : ''}.`;
    case ACCOUNT_STATES.ACCOUNT_READY:
      return 'Set up your seller boutique before you can sell on LOUMOO.';
    case ACCOUNT_STATES.SELLER_VERIFICATION_REQUIRED:
      return 'Complete your seller setup before you can list items.';
    default:
      return `You do not have permission to perform this action (${capability}).`;
  }
}

module.exports = {
  requireAuth,
  optionalAuth,
  requireCapability,
  requireAccountState,
  requireAdmin,
  extractBearerToken
};
