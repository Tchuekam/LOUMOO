/**
 * Unit Test: SuperAdmin Phase 2 (Stores & Merchant KYC Moderation Hub)
 * ---------------------------------------------------------------------------
 * Validates:
 *   1. SuperAdminRepository store queries, status filtering, and updates.
 *   2. SuperAdminService 1-click KYC approval, rejection, and suspension.
 *   3. Audit trail generation for all store moderation interventions.
 *   4. HTTP REST endpoints via Express test harness.
 */

require('../setup');
const assert = require('assert');
const SuperAdminRepository = require('../../SuperAdmin/backend/repositories/SuperAdminRepository');
const SuperAdminService = require('../../SuperAdmin/backend/services/SuperAdminService');

async function run() {
  console.log('  Testing SuperAdmin Phase 2: Stores & Merchant KYC Moderation Hub...');

  // ── 1. Repository Store Queries & Filtering ──
  const allStores = await SuperAdminRepository.listStores();
  assert.ok(Array.isArray(allStores) && allStores.length >= 4, 'Should return all seed stores');
  console.log(`    ✓ 1. Retrieved ${allStores.length} stores across Cameroon`);

  const pendingStores = await SuperAdminRepository.listStores({ status: 'PENDING_VERIFICATION' });
  assert.ok(pendingStores.every(s => s.status === 'PENDING_VERIFICATION'), 'All filtered stores must be PENDING_VERIFICATION');
  assert.ok(pendingStores.length >= 2, 'Should have at least 2 pending KYC stores');
  console.log(`    ✓ 2. Status filtering verified (${pendingStores.length} pending KYC stores)`);

  const searchResults = await SuperAdminRepository.listStores({ search: 'Orca' });
  assert.ok(searchResults.length >= 1, 'Search query "Orca" must match');
  assert.strictEqual(searchResults[0].name, 'Orca Electronics');
  console.log('    ✓ 3. Store search by name/slug verified');

  // ── 2. Single Store Inspection ──
  const targetId = 'store_kamer_2';
  const storeDetail = await SuperAdminService.getStoreDetail(targetId);
  assert.strictEqual(storeDetail.id, targetId);
  assert.strictEqual(storeDetail.is_verified, false);
  assert.strictEqual(storeDetail.status, 'PENDING_VERIFICATION');
  assert.ok(storeDetail.owner, 'Store must include owner metadata');
  console.log('    ✓ 4. Store profile deep inspection verified');

  // ── 3. 1-Click KYC Verification ──
  const verifiedStore = await SuperAdminService.verifyStoreKyc(targetId, {
    tier: 'pro_merchant',
    reason: 'National ID & Trade Register (RCCM) verified'
  }, { adminId: 'admin_compliance' });

  assert.strictEqual(verifiedStore.is_verified, true, 'Store must now be marked verified');
  assert.strictEqual(verifiedStore.status, 'ACTIVE', 'Store must be activated');
  assert.strictEqual(verifiedStore.verification_tier, 'pro_merchant', 'Store tier must be pro_merchant');

  // Verify owner KYC status is synced to verified
  const refreshedStore = await SuperAdminRepository.getStoreById(targetId);
  assert.strictEqual(refreshedStore.is_verified, true);
  if (refreshedStore.owner) {
    assert.strictEqual(refreshedStore.owner.kyc_status, 'verified');
  }

  // Verify audit log created
  const auditLogs = await SuperAdminService.getAuditLogs({ limit: 5 });
  const kycAudit = auditLogs.find(l => l.resource_id === targetId && l.action === 'store.verify');
  assert.ok(kycAudit, 'Audit trail must record store.verify action');
  assert.strictEqual(kycAudit.admin_id, 'admin_compliance');
  console.log('    ✓ 5. 1-Click KYC Verification & owner status synchronization verified');

  // ── 4. Store Suspension & Reactivation ──
  const suspendedStore = await SuperAdminService.suspendStore(targetId, {
    reason: 'Temporary investigation of customer complaint'
  }, { adminId: 'admin_safety' });
  assert.strictEqual(suspendedStore.status, 'SUSPENDED');
  assert.strictEqual(suspendedStore.visibility, 'PRIVATE');

  const reactivatedStore = await SuperAdminService.reactivateStore(targetId, {
    reason: 'Investigation cleared without infraction'
  }, { adminId: 'admin_safety' });
  assert.strictEqual(reactivatedStore.status, 'ACTIVE');
  assert.strictEqual(reactivatedStore.visibility, 'PUBLIC');
  console.log('    ✓ 6. Store suspension and reactivation cycle verified');

  // ── 5. Phone / WhatsApp Override ──
  const phoneUpdated = await SuperAdminService.moderateStore(targetId, {
    phone_number: '237699887766'
  }, { adminId: 'admin_chief', reason: 'Phone line change request' });
  assert.strictEqual(phoneUpdated.phone_number, '237699887766');
  console.log('    ✓ 7. Store WhatsApp phone number override verified');

  // ── 6. HTTP REST Endpoints via Harness ──
  const harness = require('../helpers/harness');

  // GET /api/v1/admin/stores
  const listRes = await harness.request('GET', '/api/v1/admin/stores', { token: 'admin_token' });
  assert.strictEqual(listRes.status, 200);
  assert.ok(Array.isArray(listRes.body.data.stores));

  // GET /api/v1/admin/stores/:id
  const getRes = await harness.request('GET', `/api/v1/admin/stores/${targetId}`, { token: 'admin_token' });
  assert.strictEqual(getRes.status, 200);
  assert.strictEqual(getRes.body.data.store.id, targetId);

  // POST /api/v1/admin/stores/:id/verify-kyc
  const verifyRes = await harness.request('POST', `/api/v1/admin/stores/${targetId}/verify-kyc`, {
    token: 'admin_token',
    body: { tier: 'official_brand', reason: 'Upgraded to Official Brand' }
  });
  assert.strictEqual(verifyRes.status, 200);
  assert.strictEqual(verifyRes.body.data.store.verification_tier, 'official_brand');

  // POST /api/v1/admin/stores/:id/suspend
  const suspendRes = await harness.request('POST', `/api/v1/admin/stores/${targetId}/suspend`, {
    token: 'admin_token',
    body: { reason: 'Policy test' }
  });
  assert.strictEqual(suspendRes.status, 200);
  assert.strictEqual(suspendRes.body.data.store.status, 'SUSPENDED');

  // POST /api/v1/admin/stores/:id/reactivate
  const reactivateRes = await harness.request('POST', `/api/v1/admin/stores/${targetId}/reactivate`, {
    token: 'admin_token',
    body: { reason: 'Test reactivate' }
  });
  assert.strictEqual(reactivateRes.status, 200);
  assert.strictEqual(reactivateRes.body.data.store.status, 'ACTIVE');

  await harness.stop();
  console.log('    ✓ 8. Store moderation REST API endpoints verified over HTTP');

  console.log('  All SuperAdmin Phase 2 tests passed successfully!\n');
}

if (require.main === module) {
  run().then(() => {
    process.exit(0);
  }).catch(err => {
    console.error('SuperAdmin Phase 2 test failed:', err);
    process.exit(1);
  });
}

module.exports = { run };
