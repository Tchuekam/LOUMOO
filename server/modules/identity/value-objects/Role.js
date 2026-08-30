/**
 * Identity Module — Role Value Object & Permissions Matrix
 */

const ROLES = {
  CUSTOMER: 'customer',
  SELLER: 'seller',
  SELLER_STAFF: 'seller_staff',
  MODERATOR: 'moderator',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin'
};

const ROLE_HIERARCHY = {
  [ROLES.CUSTOMER]: 1,
  [ROLES.SELLER]: 2,
  [ROLES.SELLER_STAFF]: 2,
  [ROLES.MODERATOR]: 3,
  [ROLES.ADMIN]: 4,
  [ROLES.SUPER_ADMIN]: 5
};

const PERMISSIONS = {
  // Products
  PRODUCT_READ: 'product:read',
  PRODUCT_CREATE: 'product:create',
  PRODUCT_UPDATE_OWN: 'product:update_own',
  PRODUCT_DELETE_OWN: 'product:delete_own',
  PRODUCT_MANAGE_ALL: 'product:manage_all',

  // Cart & Orders
  CART_MANAGE: 'cart:manage',
  ORDER_CREATE: 'order:create',
  ORDER_READ_OWN: 'order:read_own',
  ORDER_MANAGE_OWN: 'order:manage_own',
  ORDER_MANAGE_ALL: 'order:manage_all',

  // Storefront & Payouts
  SELLER_PROFILE: 'seller:profile',
  PAYOUT_REQUEST: 'payout:request',
  PAYOUT_APPROVE: 'payout:approve',

  // Moderation & Admin
  CONTENT_MODERATE: 'content:moderate',
  USER_SUSPEND: 'user:suspend',
  SYSTEM_CONFIG: 'system:config'
};

const ROLE_PERMISSIONS = {
  [ROLES.CUSTOMER]: [
    PERMISSIONS.PRODUCT_READ,
    PERMISSIONS.CART_MANAGE,
    PERMISSIONS.ORDER_CREATE,
    PERMISSIONS.ORDER_READ_OWN
  ],
  [ROLES.SELLER]: [
    PERMISSIONS.PRODUCT_READ,
    PERMISSIONS.PRODUCT_CREATE,
    PERMISSIONS.PRODUCT_UPDATE_OWN,
    PERMISSIONS.PRODUCT_DELETE_OWN,
    PERMISSIONS.ORDER_MANAGE_OWN,
    PERMISSIONS.SELLER_PROFILE,
    PERMISSIONS.PAYOUT_REQUEST
  ],
  [ROLES.SELLER_STAFF]: [
    PERMISSIONS.PRODUCT_READ,
    PERMISSIONS.PRODUCT_UPDATE_OWN,
    PERMISSIONS.ORDER_MANAGE_OWN
  ],
  [ROLES.MODERATOR]: [
    PERMISSIONS.PRODUCT_READ,
    PERMISSIONS.CONTENT_MODERATE,
    PERMISSIONS.USER_SUSPEND
  ],
  [ROLES.ADMIN]: Object.values(PERMISSIONS),
  [ROLES.SUPER_ADMIN]: Object.values(PERMISSIONS)
};

class Role {
  static isValidRole(role) {
    return Object.values(ROLES).includes(role);
  }

  static hasRole(userRole, requiredRole) {
    const userLevel = ROLE_HIERARCHY[userRole] || 0;
    const requiredLevel = ROLE_HIERARCHY[requiredRole] || 99;
    return userLevel >= requiredLevel;
  }

  static hasPermission(userRole, requiredPermission) {
    if (userRole === ROLES.SUPER_ADMIN || userRole === ROLES.ADMIN) return true;
    const permissions = ROLE_PERMISSIONS[userRole] || [];
    return permissions.includes(requiredPermission);
  }

  static getRoleHierarchy(userRole) {
    return ROLE_PERMISSIONS[userRole] || [];
  }
}

// Attach constants directly to Role
Role.ROLES = ROLES;
Role.CUSTOMER = ROLES.CUSTOMER;
Role.SELLER = ROLES.SELLER;
Role.SELLER_STAFF = ROLES.SELLER_STAFF;
Role.MODERATOR = ROLES.MODERATOR;
Role.ADMIN = ROLES.ADMIN;
Role.SUPER_ADMIN = ROLES.SUPER_ADMIN;
Role.PERMISSIONS = PERMISSIONS;
Role.ROLE_PERMISSIONS = ROLE_PERMISSIONS;
Role.ROLE_HIERARCHY = ROLE_HIERARCHY;

module.exports = Role;
module.exports.Role = Role;
module.exports.ROLES = ROLES;
module.exports.PERMISSIONS = PERMISSIONS;
module.exports.ROLE_HIERARCHY = ROLE_HIERARCHY;
