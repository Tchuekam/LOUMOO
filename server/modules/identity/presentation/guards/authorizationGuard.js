/**
 * Identity Module — Authorization Policy Guard
 * Enforces Role-Based and Resource-Level Access Control policies
 */

const { Role, ROLES } = require('../../value-objects/Role');
const { AuthorizationError, AuthenticationError } = require('../../../../shared/errors/AppError');

/**
 * Guard: Require a minimum role in the hierarchy
 * @param {string} minimumRole - e.g. 'seller', 'admin'
 */
function requireRole(minimumRole) {
  return (req, res, next) => {
    if (!req.userProfile) {
      return next(new AuthenticationError('Authentication required to verify authorization'));
    }

    const userRole = req.userProfile.primaryRole || ROLES.CUSTOMER;

    if (!Role.hasRole(userRole, minimumRole)) {
      return next(new AuthorizationError(`Action requires '${minimumRole}' role. Current role: '${userRole}'`));
    }

    next();
  };
}

/**
 * Guard: Require a specific permission string
 * @param {string} permission - e.g. 'product:create', 'payout:request'
 */
function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.userProfile) {
      return next(new AuthenticationError('Authentication required to verify permissions'));
    }

    const userRole = req.userProfile.primaryRole || ROLES.CUSTOMER;

    if (!Role.hasPermission(userRole, permission)) {
      return next(new AuthorizationError(`Missing required permission: '${permission}'`));
    }

    next();
  };
}

/**
 * Guard: Require resource ownership (e.g. user matching ownerId or admin)
 */
function requireResourceOwner(extractOwnerIdFn) {
  return (req, res, next) => {
    if (!req.userProfile) {
      return next(new AuthenticationError('Authentication required'));
    }

    if (req.userProfile.isAdmin()) {
      return next(); // Admins bypass resource ownership
    }

    const ownerId = extractOwnerIdFn(req);
    if (req.userProfile.id !== ownerId && req.userProfile.clerkUserId !== ownerId) {
      return next(new AuthorizationError('You do not have permission to access or modify this resource'));
    }

    next();
  };
}

module.exports = {
  requireRole,
  requirePermission,
  requireResourceOwner
};
