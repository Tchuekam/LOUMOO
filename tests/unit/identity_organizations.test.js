/**
 * LOUMOO Unit Tests — Identity Organizations & Team Memberships
 */

require('../setup');
const assert = require('assert');
const { Organization, OrganizationMember, ORG_ROLES, ROLE_PERMISSIONS } = require('../../server/modules/identity/domain/Organization');
const { ValidationError } = require('../../server/shared/errors/AppError');

async function run() {
  console.log('  Testing Identity Organizations & Domain Models...');

  // 1. Validation
  assert.throws(() => {
    Organization.validate({ name: 'A' });
  }, ValidationError);

  assert.throws(() => {
    Organization.validate({ name: 'Valid Name', orgType: 'INVALID_TYPE' });
  }, ValidationError);

  Organization.validate({ name: 'Orca Tech Ltd', orgType: 'COMPANY' });

  // 2. Slug generation
  const slug1 = Organization.slugify('Orca Tech Douala');
  assert.strictEqual(slug1, 'orca-tech-douala');

  const slug2 = Organization.slugify('Épicerie Fine & Co!');
  assert.strictEqual(slug2, 'epicerie-fine-co');

  // 3. Permission hierarchy across all 7 roles
  const owner = new OrganizationMember({
    organization_id: 'org_1',
    user_id: 'usr_1',
    role: ORG_ROLES.OWNER
  });
  assert.strictEqual(owner.hasPermission('org.manage'), true);
  assert.strictEqual(owner.hasPermission('anything.at.all'), true);

  const admin = new OrganizationMember({
    organization_id: 'org_1',
    user_id: 'usr_2',
    role: ORG_ROLES.ADMIN,
    permissions: ROLE_PERMISSIONS[ORG_ROLES.ADMIN]
  });
  assert.strictEqual(admin.hasPermission('org.manage_members'), true);
  assert.strictEqual(admin.hasPermission('store.manage_products'), true);
  assert.strictEqual(admin.hasPermission('store.manage_orders'), true);

  const manager = new OrganizationMember({
    organization_id: 'org_1',
    user_id: 'usr_3',
    role: ORG_ROLES.MANAGER,
    permissions: ROLE_PERMISSIONS[ORG_ROLES.MANAGER]
  });
  assert.strictEqual(manager.hasPermission('store.manage_products'), true);
  assert.strictEqual(manager.hasPermission('store.manage_orders'), true);
  assert.strictEqual(manager.hasPermission('org.manage_members'), false);

  const staff = new OrganizationMember({
    organization_id: 'org_1',
    user_id: 'usr_4',
    role: ORG_ROLES.STAFF,
    permissions: ROLE_PERMISSIONS[ORG_ROLES.STAFF]
  });
  assert.strictEqual(staff.hasPermission('store.manage_orders'), true);
  assert.strictEqual(staff.hasPermission('store.manage_products'), false);

  const editor = new OrganizationMember({
    organization_id: 'org_1',
    user_id: 'usr_5',
    role: ORG_ROLES.EDITOR,
    permissions: ROLE_PERMISSIONS[ORG_ROLES.EDITOR]
  });
  assert.strictEqual(editor.hasPermission('store.manage_products'), true);
  assert.strictEqual(editor.hasPermission('store.manage_orders'), false);

  const support = new OrganizationMember({
    organization_id: 'org_1',
    user_id: 'usr_6',
    role: ORG_ROLES.SUPPORT,
    permissions: ROLE_PERMISSIONS[ORG_ROLES.SUPPORT]
  });
  assert.strictEqual(support.hasPermission('store.customer_support'), true);
  assert.strictEqual(support.hasPermission('store.manage_products'), false);

  const member = new OrganizationMember({
    organization_id: 'org_1',
    user_id: 'usr_7',
    role: ORG_ROLES.MEMBER,
    permissions: ROLE_PERMISSIONS[ORG_ROLES.MEMBER]
  });
  assert.strictEqual(member.hasPermission('org.view'), true);
  assert.strictEqual(member.hasPermission('store.manage_products'), false);

  console.log('    ✓ Organization & permissions unit tests passed.');
}

if (require.main === module) {
  run().catch(err => {
    console.error('FAILED:', err);
    process.exit(1);
  });
}

module.exports = { run };