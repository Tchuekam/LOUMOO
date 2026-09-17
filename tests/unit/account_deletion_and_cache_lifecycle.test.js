/**
 * Unit Test Suite: Account Deletion, KYC Transitions & Cache Lifecycle
 * ---------------------------------------------------------------------------
 * Validates:
 * 1. CacheService batch deletion (deleteMany / delMany) in Redis and memory fallback.
 * 2. CacheService delPattern escaping regex metacharacters properly.
 * 3. UserProfile KYC state machine transitions (user submission vs admin review & revocation).
 * 4. Account Deletion complete PII erasure (bio, headline, social_links, username, kyc_doc_type).
 * 5. Account Deletion owned store deactivation and store/listing cache purging.
 * 6. Account Deletion user-scoped cache purging (dashboard, addresses, saved items, user activity).
 */

require('../setup');
const assert = require('assert');
const CacheService = require('../../server/infrastructure/cache/CacheService');
const UserProfile = require('../../server/modules/identity/entities/UserProfile');
const DeleteAccountUseCase = require('../../server/modules/identity/application/DeleteAccountUseCase');
const harness = require('../helpers/harness');

async function run() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  TEST: ACCOUNT DELETION, KYC TRANSITIONS & CACHE LIFECYCLE');
  console.log('═══════════════════════════════════════════════════════════════\n');

  // ── 1. CacheService deleteMany and delMany ──
  console.log('[1/5] Verifying CacheService batch deletion (deleteMany / delMany)...');
  await CacheService.set('batch_k1', { val: 1 }, 60, 'test_ns');
  await CacheService.set('batch_k2', { val: 2 }, 60, 'test_ns');
  await CacheService.set('batch_k3', { val: 3 }, 60, 'test_ns');

  assert.deepStrictEqual(await CacheService.get('batch_k1', 'test_ns'), { val: 1 });
  assert.deepStrictEqual(await CacheService.get('batch_k2', 'test_ns'), { val: 2 });
  assert.deepStrictEqual(await CacheService.get('batch_k3', 'test_ns'), { val: 3 });

  await CacheService.deleteMany(['batch_k1', 'batch_k2'], 'test_ns');
  assert.strictEqual(await CacheService.get('batch_k1', 'test_ns'), null, 'batch_k1 should be deleted');
  assert.strictEqual(await CacheService.get('batch_k2', 'test_ns'), null, 'batch_k2 should be deleted');
  assert.deepStrictEqual(await CacheService.get('batch_k3', 'test_ns'), { val: 3 }, 'batch_k3 should remain');

  await CacheService.delMany(['batch_k3'], 'test_ns');
  assert.strictEqual(await CacheService.get('batch_k3', 'test_ns'), null, 'batch_k3 should be deleted via delMany');
  console.log('  ✓ CacheService batch deletion works across storage tiers');

  // ── 2. CacheService delPattern Regex Escaping ──
  console.log('\n[2/5] Verifying CacheService delPattern regex metacharacter escaping...');
  await CacheService.set('user+tag[1]:itemA', { item: 'A' }, 60, 'test_regex');
  await CacheService.set('user+tag[2]:itemB', { item: 'B' }, 60, 'test_regex');

  await CacheService.delPattern('user+tag[1]:*', 'test_regex');

  assert.strictEqual(await CacheService.get('user+tag[1]:itemA', 'test_regex'), null, 'Targeted pattern must be deleted');
  assert.deepStrictEqual(await CacheService.get('user+tag[2]:itemB', 'test_regex'), { item: 'B' }, 'Non-matching pattern with metacharacters must be preserved');

  await CacheService.delPattern('*', 'test_regex');
  console.log('  ✓ CacheService delPattern safely handles regex metacharacters');

  // ── 3. KYC State Machine & Admin Transitions ──
  console.log('\n[3/5] Verifying UserProfile KYC state machine transitions...');
  const regularUser = new UserProfile({
    id: 'usr_reg_1',
    kycDocStatus: 'pending',
    primaryRole: 'buyer'
  });

  // Regular user transitions
  assert.strictEqual(regularUser.canTransitionKycStatus('submitted', { isAdmin: false }).valid, true);
  assert.strictEqual(regularUser.canTransitionKycStatus('verified', { isAdmin: false }).valid, false);

  // Rejected regular user can resubmit
  const rejectedUser = new UserProfile({
    id: 'usr_rej_1',
    kycDocStatus: 'rejected',
    primaryRole: 'seller'
  });
  assert.strictEqual(rejectedUser.canTransitionKycStatus('submitted', { isAdmin: false }).valid, true);
  assert.strictEqual(rejectedUser.canTransitionKycStatus('verified', { isAdmin: false }).valid, false);

  // Admin transitions: approval, revocation, and re-review
  const submittedUser = new UserProfile({
    id: 'usr_sub_1',
    kycDocStatus: 'submitted',
    primaryRole: 'seller'
  });
  assert.strictEqual(submittedUser.canTransitionKycStatus('verified', { isAdmin: true }).valid, true);
  assert.strictEqual(submittedUser.canTransitionKycStatus('rejected', { isAdmin: true }).valid, true);

  const verifiedUser = new UserProfile({
    id: 'usr_ver_1',
    kycDocStatus: 'verified',
    primaryRole: 'seller'
  });
  // Admin revoking verification upon finding fraudulent document
  assert.strictEqual(verifiedUser.canTransitionKycStatus('rejected', { isAdmin: true }).valid, true);
  assert.strictEqual(verifiedUser.canTransitionKycStatus('pending', { isAdmin: true }).valid, true);
  // Non-admin cannot revoke or alter verified status
  assert.strictEqual(verifiedUser.canTransitionKycStatus('rejected', { isAdmin: false }).valid, false);
  console.log('  ✓ KYC state transitions validated for both users and compliance admins');

  // ── 4. Account Deletion: Exhaustive PII Erasure ──
  console.log('\n[4/5] Verifying Account Deletion complete PII erasure & store deactivation...');
  const created = await harness.createUser({ stage: 'ready' });
  const userId = created.id;
  const db = harness.db();

  // Populate rich PII and owned boutique
  await db.from('profiles').update({
    username: 'testuser_' + Date.now(),
    bio: 'Experienced electronics importer in Akwa Douala',
    headline: 'Certified Merchant',
    social_links: { twitter: 'https://x.com/testuser', whatsapp: '+237690112233' },
    buyer_interests: ['tech', 'electronics'],
    shopping_priorities: ['verified', 'warranty'],
    kyc_doc_type: 'cni',
    kyc_doc_status: 'submitted'
  }).eq('id', userId);

  // Create an owned store for this user using harness
  const storeRow = await harness.createStore(created);
  assert.ok(storeRow && storeRow.id, 'Store created for test user');

  // Seed user caches
  await CacheService.set(`store:public:${storeRow.id}`, { name: 'Test Boutique Akwa' }, 300);
  await CacheService.set(`store:public:${storeRow.slug}`, { name: 'Test Boutique Akwa' }, 300);
  await CacheService.set(`listings:store:${storeRow.id}:live`, [{ id: 'p1' }], 300, 'catalog');
  await CacheService.set(`dashboard:${userId}`, { overview: true }, 300);
  await CacheService.set(`addresses:${userId}`, [{ id: 'addr_1' }], 300);
  await CacheService.set(`identity:privacy:${userId}`, { share: false }, 300);
  await CacheService.set(`notif_prefs:${userId}`, { email: true }, 300);
  await CacheService.set(`user_activity:${userId}:all`, [{ act: 1 }], 300);
  await CacheService.set(`saved_items:${userId}:all`, [{ item: 1 }], 300);

  // Execute account deletion
  const deleteResult = await DeleteAccountUseCase.execute(
    { id: userId, clerkUserId: created.clerk_user_id },
    { confirmText: 'DELETE', reason: 'Hardened privacy audit test' }
  );

  assert.strictEqual(deleteResult.success, true);

  // Verify profile row in database
  const { data: deletedRow } = await db
    .from('profiles')
    .select('first_name, last_name, email, phone_number, username, bio, headline, social_links, buyer_interests, shopping_priorities, kyc_doc_type, kyc_doc_status, account_status')
    .eq('id', userId)
    .single();

  assert.strictEqual(deletedRow.first_name, 'Anonymized');
  assert.strictEqual(deletedRow.last_name, 'User');
  assert.strictEqual(deletedRow.username, null, 'Username must be cleared');
  assert.strictEqual(deletedRow.bio, null, 'Bio must be cleared');
  assert.strictEqual(deletedRow.headline, null, 'Headline must be cleared');
  assert.deepStrictEqual(deletedRow.social_links, {}, 'Social links must be reset');
  assert.strictEqual(deletedRow.buyer_interests, null, 'Buyer interests must be cleared');
  assert.strictEqual(deletedRow.shopping_priorities, null, 'Shopping priorities must be cleared');
  assert.strictEqual(deletedRow.kyc_doc_type, null, 'KYC document type must be cleared');
  assert.strictEqual(deletedRow.kyc_doc_status, 'pending', 'KYC doc status must be reset to pending');
  assert.strictEqual(deletedRow.account_status, 'anonymized');

  // Verify owned store in database
  const { data: storeAfter, error: storeErr } = await db.from('stores').select('status, visibility, deleted_at').eq('id', storeRow.id).maybeSingle();
  if (storeErr) console.error('store query error:', storeErr);
  assert.ok(storeAfter, 'storeAfter must not be null');
  assert.strictEqual(storeAfter.status, 'CLOSED', 'Owned store must be marked CLOSED');
  assert.strictEqual(storeAfter.visibility, 'PRIVATE', 'Owned store visibility must be PRIVATE');
  assert.ok(storeAfter.deleted_at, 'Owned store must have deleted_at set');
  console.log('  ✓ Database PII and owned stores cleanly erased/closed');

  // ── 5. User-Scoped & Store Cache Invalidation ──
  console.log('\n[5/5] Verifying user-scoped and store cache invalidation...');
  assert.strictEqual(await CacheService.get(`store:public:${storeRow.id}`), null, 'Store public ID cache must be purged');
  assert.strictEqual(await CacheService.get(`store:public:${storeRow.slug}`), null, 'Store public slug cache must be purged');
  assert.strictEqual(await CacheService.get(`listings:store:${storeRow.id}:live`, 'catalog'), null, 'Store catalog listings cache must be purged');
  assert.strictEqual(await CacheService.get(`dashboard:${userId}`), null, 'Dashboard cache must be purged');
  assert.strictEqual(await CacheService.get(`addresses:${userId}`), null, 'Addresses cache must be purged');
  assert.strictEqual(await CacheService.get(`identity:privacy:${userId}`), null, 'Privacy prefs cache must be purged');
  assert.strictEqual(await CacheService.get(`notif_prefs:${userId}`), null, 'Notification prefs cache must be purged');
  assert.strictEqual(await CacheService.get(`user_activity:${userId}:all`), null, 'User activity cache must be purged');
  assert.strictEqual(await CacheService.get(`saved_items:${userId}:all`), null, 'Saved items cache must be purged');
  console.log('  ✓ All user-scoped, boutique, and catalog caches verified purged');

  // Cleanup store
  await db.from('stores').delete().eq('id', storeRow.id);

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  ALL ACCOUNT DELETION & CACHE LIFECYCLE TESTS PASSED (5/5)!');
  console.log('═══════════════════════════════════════════════════════════════\n');
}

module.exports = { run };

if (require.main === module) {
  run()
    .then(() => harness.cleanup())
    .then(() => process.exit(0))
    .catch(async err => {
      console.error('Test execution failed:', err);
      await harness.cleanup().catch(() => null);
      process.exit(1);
    });
}
