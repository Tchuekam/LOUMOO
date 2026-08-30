/**
 * Guard: Resource Ownership & Multi-Tenant Isolation (02.10)
 * Ensures Seller A cannot modify Seller B's storefront, products, or orders,
 * and Buyer A cannot read Buyer B's private cart or orders.
 */

const { AuthorizationError } = require('../../../../shared/errors/AppError');
const logger = require('../../../../shared/logging/logger');

function requireResourceOwner(extractOwnerIdFn) {
  return (req, res, next) => {
    try {
      const user = req.userProfile;
      if (!user) {
        throw new AuthorizationError('Authentication required to access this resource');
      }

      // Administrators have platform-wide access
      if (user.isAdmin && user.isAdmin()) {
        return next();
      }

      const resourceOwnerId = typeof extractOwnerIdFn === 'function' ? extractOwnerIdFn(req) : req.params[extractOwnerIdFn || 'userId'];

      if (!resourceOwnerId) {
        logger.warn(`[OwnershipGuard] Resource owner ID could not be determined for path: ${req.path}`);
        throw new AuthorizationError('Resource owner validation failed');
      }

      // Match internal user ID or Clerk user ID
      const isOwner = user.id === resourceOwnerId || user.clerkUserId === resourceOwnerId;
      if (!isOwner) {
        logger.warn(`[OwnershipGuard] Access denied: User ${user.id} attempted to access resource owned by ${resourceOwnerId}`);
        throw new AuthorizationError('You do not have permission to access or modify this resource.');
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}

module.exports = {
  requireResourceOwner
};
