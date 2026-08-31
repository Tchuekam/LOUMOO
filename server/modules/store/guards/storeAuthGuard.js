/**
 * LOUMOO — Store Authorization Guard
 * ---------------------------------------------------------------------------
 * Multi-tenant isolation for storefronts: seller A must never be able to touch
 * seller B's store, products or orders, no matter what ids they put in the URL.
 *
 * Store identity is resolved from the database and matched against the
 * authenticated principal. Nothing is inferred from the id's format, and no
 * store is ever created as a side effect of asking about one.
 */

const StoreRepository = require('../infrastructure/StoreRepository');
const Store = require('../domain/Store');
const {
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ValidationError
} = require('../../../shared/errors/AppError');
const logger = require('../../../shared/logging/logger');

/**
 * Where a store identifier may come from. Deliberately excludes the request
 * BODY for path-scoped routes: `:storeId` in the URL is the resource being
 * addressed, and letting a body field override it is how IDOR bugs happen.
 */
function extractStoreIdentifier(req) {
  return (req.params && (req.params.storeId || req.params.id))
    || (req.query && req.query.storeId)
    || null;
}

/**
 * Reads `storeId` from the body when there is one. Guarded because the media
 * upload route runs these guards BEFORE its raw body parser — authorization
 * must be settled before a single byte is buffered — so `req.body` is
 * legitimately undefined at that point.
 */
function bodyStoreId(req) {
  return (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body))
    ? req.body.storeId || null
    : null;
}

/**
 * Resolves the addressed store WITHOUT any authorization check.
 * For public reads (a storefront page, follow/unfollow) where existence is all
 * that matters.
 */
function resolveStore({ optional = false } = {}) {
  return async function (req, res, next) {
    try {
      const identifier = extractStoreIdentifier(req);
      if (!identifier) {
        if (optional) return next();
        throw new ValidationError('A store identifier is required for this request.');
      }

      const storeRow = await StoreRepository.findByIdOrSlug(identifier);
      if (!storeRow) {
        throw new NotFoundError('Store', identifier);
      }

      req.store = new Store(storeRow);
      req.storeRow = storeRow;
      next();
    } catch (err) {
      next(err);
    }
  };
}

/**
 * Requires the authenticated principal to hold `requiredPermission` on the
 * addressed store.
 *
 * @param {string} requiredPermission e.g. 'listing.create', 'store.manage'
 */
function requireStoreAccess(requiredPermission = 'store.view') {
  return async function (req, res, next) {
    try {
      if (!req.principal || !req.principal.id) {
        throw new AuthenticationError('Authentication required to manage a store.');
      }

      // The store may come from the URL, or — for collection routes such as
      // `POST /listings` — from the body, since there is no path segment for it.
      const identifier = extractStoreIdentifier(req) || bodyStoreId(req);
      if (!identifier) {
        throw new ValidationError('A storeId is required for this request.');
      }

      const storeRow = req.storeRow && req.storeRow.id === identifier
        ? req.storeRow
        : await StoreRepository.findByIdOrSlug(identifier);

      if (!storeRow) {
        // 404 rather than 403: a non-member must not be able to probe which
        // store ids exist by comparing error codes.
        throw new NotFoundError('Store', identifier);
      }

      const membership = await StoreRepository.resolveMembership(storeRow, req.principal.id);

      const isPlatformAdmin = ['admin', 'super_admin'].includes(req.principal.primaryRole);

      if (!membership && !isPlatformAdmin) {
        logger.warn('[StoreGuard] Store access denied', {
          requestId: req.requestId,
          userId: req.principal.id,
          storeId: storeRow.id,
          requiredPermission,
          path: req.originalUrl
        });
        throw new AuthorizationError('You do not have permission to manage this store.');
      }

      const permissions = isPlatformAdmin && !membership ? ['*'] : membership.permissions;
      const role = isPlatformAdmin && !membership ? 'platform_admin' : membership.role;

      const hasPermission = permissions.includes('*') || permissions.includes(requiredPermission);
      if (!hasPermission) {
        logger.warn('[StoreGuard] Missing store permission', {
          requestId: req.requestId,
          userId: req.principal.id,
          storeId: storeRow.id,
          role,
          requiredPermission
        });
        throw new AuthorizationError(`Your role on this store does not allow '${requiredPermission}'.`);
      }

      req.store = new Store(storeRow);
      req.storeRow = storeRow;
      req.storeRole = role;
      req.storePermissions = permissions;

      next();
    } catch (err) {
      next(err);
    }
  };
}

/**
 * Resolves the principal's OWN store when no id is supplied.
 * Used by seller routes such as "create a listing" where the store is implied
 * by who is asking — the safest possible source, since it can't be forged.
 */
function resolveOwnStore({ required = true } = {}) {
  return async function (req, res, next) {
    try {
      if (!req.principal) throw new AuthenticationError('Authentication required.');

      const explicit = extractStoreIdentifier(req) || bodyStoreId(req);
      if (explicit) {
        return requireStoreAccess(req._requiredStorePermission || 'store.view')(req, res, next);
      }

      const owned = await StoreRepository.findOwnedBy(req.principal.id);
      const store = owned.find(s => s.status === 'ACTIVE') || owned[0] || null;

      if (!store) {
        if (!required) return next();
        throw new AuthorizationError(
          'You need a LOUMOO boutique before you can do this. Set one up to start selling.',
          { resolveAt: '/seller/onboarding', resolveScreen: 'createStore' }
        );
      }

      req.store = new Store(store);
      req.storeRow = store;
      req.storeRole = 'owner';
      req.storePermissions = ['*'];
      next();
    } catch (err) {
      next(err);
    }
  };
}

module.exports = {
  requireStoreAccess,
  resolveStore,
  resolveOwnStore
};
