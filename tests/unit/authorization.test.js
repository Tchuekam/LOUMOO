/**
 * Unit Test: Role & Authorization Guards
 */

const assert = require('assert');
const { Role, ROLES, PERMISSIONS } = require('../../server/modules/identity/value-objects/Role');

function run() {
  console.log('  Testing RBAC Hierarchy & Permissions...');

  // 1. Role Hierarchy Verification
  assert.strictEqual(Role.hasRole(ROLES.CUSTOMER, ROLES.CUSTOMER), true);
  assert.strictEqual(Role.hasRole(ROLES.CUSTOMER, ROLES.SELLER), false);
  assert.strictEqual(Role.hasRole(ROLES.SELLER, ROLES.CUSTOMER), true);
  assert.strictEqual(Role.hasRole(ROLES.ADMIN, ROLES.SELLER), true);
  assert.strictEqual(Role.hasRole(ROLES.SUPER_ADMIN, ROLES.ADMIN), true);

  // 2. Permission Verification
  assert.strictEqual(Role.hasPermission(ROLES.CUSTOMER, PERMISSIONS.PRODUCT_READ), true);
  assert.strictEqual(Role.hasPermission(ROLES.CUSTOMER, PERMISSIONS.PRODUCT_CREATE), false);

  assert.strictEqual(Role.hasPermission(ROLES.SELLER, PERMISSIONS.PRODUCT_CREATE), true);
  assert.strictEqual(Role.hasPermission(ROLES.SELLER, PERMISSIONS.PAYOUT_REQUEST), true);
  assert.strictEqual(Role.hasPermission(ROLES.SELLER, PERMISSIONS.CONTENT_MODERATE), false);

  assert.strictEqual(Role.hasPermission(ROLES.ADMIN, PERMISSIONS.CONTENT_MODERATE), true);
  assert.strictEqual(Role.hasPermission(ROLES.ADMIN, PERMISSIONS.SYSTEM_CONFIG), true);

  console.log('    ✓ Authorization & RBAC tests passed.');
}

module.exports = { run };
