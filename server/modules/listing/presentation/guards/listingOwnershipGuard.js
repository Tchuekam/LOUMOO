/**
 * LOUMOO — Listing Ownership Guard (IDOR defence)
 * ---------------------------------------------------------------------------
 * Loads the addressed listing from the database and proves the authenticated
 * principal is entitled to mutate it.
 *
 * The identity used for the check comes ONLY from `req.principal`, which was
 * derived from a cryptographically verified session. `userId`, `sellerId` and
 * `ownerId` in the body, query or URL are ignored entirely — they are inputs
 * an attacker controls and have no bearing on who the caller is.
 */

const ListingRepository = require('../../infrastructure/ListingRepository');
const StoreRepository = require('../../../store/infrastructure/StoreRepository');
const Store = require('../../../store/domain/Store');
const {
  AuthenticationError,
  AuthorizationError,
  NotFoundError
} = require('../../../../shared/errors/AppError');
const logger = require('../../../../shared/logging/logger');

/**
 * @param {object} options
 * @param {string} options.permission Store permission the action needs
 *        (e.g. 'listing.edit', 'listing.publish', 'listing.delete').
 */
function requireListingOwnership({ permission = 'listing.edit' } = {}) {
  return async function (req, res, next) {
    try {
      if (!req.principal) {
        throw new AuthenticationError('Authentication required.');
      }

      const listingId = req.params.id || req.params.listingId;
      if (!listingId) {
        throw new NotFoundError('Listing', 'undefined');
      }

      const listing = await ListingRepository.findById(listingId);
      if (!listing) {
        throw new NotFoundError('Listing', listingId);
      }

      const store = await StoreRepository.findByIdOrSlug(listing.store_id);
      if (!store) {
        // A listing whose store has vanished is not editable by anyone.
        throw new NotFoundError('Store', listing.store_id);
      }

      const isPlatformAdmin = ['admin', 'super_admin'].includes(req.principal.primaryRole);
      const membership = await StoreRepository.resolveMembership(store, req.principal.id);

      if (!membership && !isPlatformAdmin) {
        logger.warn('[ListingGuard] Ownership denied', {
          requestId: req.requestId,
          userId: req.principal.id,
          listingId,
          listingOwner: listing.seller_id,
          storeId: listing.store_id,
          path: req.originalUrl
        });
        // 404, not 403: a stranger must not be able to confirm that a given
        // listing id exists by comparing status codes.
        throw new NotFoundError('Listing', listingId);
      }

      const permissions = membership ? membership.permissions : ['*'];
      const hasPermission = permissions.includes('*') || permissions.includes(permission);
      if (!hasPermission) {
        throw new AuthorizationError(`Your role on this boutique does not allow '${permission}'.`);
      }

      req.listingRow = listing;
      req.store = new Store(store);
      req.storeRow = store;
      req.storeRole = membership ? membership.role : 'platform_admin';
      req.storePermissions = permissions;

      next();
    } catch (err) {
      next(err);
    }
  };
}

module.exports = { requireListingOwnership };
