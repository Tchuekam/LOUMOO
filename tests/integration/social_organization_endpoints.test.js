/**
 * LOUMOO Integration Tests — Organizations, Social Graph, Reviews, Blocks & Reputation Endpoints
 */

require('../setup');
const assert = require('assert');
const harness = require('../helpers/harness');

async function run() {
  console.log('  Testing Organizations, Social Graph, Reviews & Reputation HTTP endpoints...');

  await harness.start();

  // 1. Authenticate user A, user B, and user C
  const userA = await harness.createUser({ stage: 'ready' });
  const userB = await harness.createUser({ stage: 'ready' });
  const userC = await harness.createUser({ stage: 'ready' });

  /* ── 2. Organizations & Team Memberships ──────────────────────────────── */
  // Create organization by user A
  const createOrgRes = await harness.request('POST', '/api/v1/organizations', {
    token: userA.token,
    body: {
      name: 'Alpha Innovators Agency',
      orgType: 'AGENCY',
      description: 'Creative and digital consulting agency in Douala.'
    }
  });

  assert.strictEqual(createOrgRes.status, 201, 'Organization creation should succeed with 201');
  const org = createOrgRes.body.data.organization;
  assert.ok(org.id);
  assert.strictEqual(org.name, 'Alpha Innovators Agency');
  assert.strictEqual(org.orgType, 'AGENCY');

  // Fetch organization
  const getOrgRes = await harness.request('GET', `/api/v1/organizations/${org.id}`, {
    token: userA.token
  });
  assert.strictEqual(getOrgRes.status, 200);
  assert.strictEqual(getOrgRes.body.data.organization.id, org.id);

  // Update organization (PATCH) by owner
  const patchOrgRes = await harness.request('PATCH', `/api/v1/organizations/${org.id}`, {
    token: userA.token,
    body: {
      legalName: 'Alpha Innovators SARL',
      city: 'Douala (Bonanjo)'
    }
  });
  assert.strictEqual(patchOrgRes.status, 200);
  assert.strictEqual(patchOrgRes.body.data.organization.legalName, 'Alpha Innovators SARL');

  // Add user B as MANAGER to organization
  const addMemberRes = await harness.request('POST', `/api/v1/organizations/${org.id}/members`, {
    token: userA.token,
    body: {
      userId: userB.id,
      role: 'MANAGER'
    }
  });
  assert.strictEqual(addMemberRes.status, 201);
  assert.strictEqual(addMemberRes.body.data.member.role, 'MANAGER');

  // List members
  const listMembersRes = await harness.request('GET', `/api/v1/organizations/${org.id}/members`, {
    token: userA.token
  });
  assert.strictEqual(listMembersRes.status, 200);
  assert(listMembersRes.body.data.members.length >= 2);

  /* ── 3. IDOR Defense on Store Creation ────────────────────────────────── */
  // User C (not in organization) tries to create a store linked to User A's organization
  const idorStoreRes = await harness.request('POST', '/api/v1/stores', {
    token: userC.token,
    body: {
      name: 'Rogue Store Entity',
      sellerType: 'AGENCY',
      organizationId: org.id,
      categoryId: 'electronics'
    }
  });
  assert.ok([401, 403].includes(idorStoreRes.status), 'Unauthorized store linking to foreign organization must be rejected');

  // User A (owner) creates legitimate store linked to organization
  const storeRes = await harness.request('POST', '/api/v1/stores', {
    token: userA.token,
    body: {
      name: 'Alpha Tech Douala',
      sellerType: 'AGENCY',
      organizationId: org.id,
      description: 'Official electronics and gadget hub.',
      categoryId: 'electronics'
    }
  });
  assert.strictEqual(storeRes.status, 201);
  const store = storeRes.body.data;
  assert.strictEqual(store.sellerType, 'AGENCY');
  assert.strictEqual(store.organizationId, org.id);

  /* ── 4. Social Graph: Follows & Self-Follow Prevention ─────────────────── */
  // User A cannot follow self
  const selfFollowRes = await harness.request('POST', '/api/v1/social/follow', {
    token: userA.token,
    body: {
      targetType: 'user',
      targetId: userA.id
    }
  });
  assert.strictEqual(selfFollowRes.status, 400, 'Self follow must be rejected');

  // User B follows User A
  const followRes = await harness.request('POST', '/api/v1/social/follow', {
    token: userB.token,
    body: {
      targetType: 'user',
      targetId: userA.id
    }
  });
  assert.strictEqual(followRes.status, 200);
  assert.strictEqual(followRes.body.data.isFollowing, true);

  // Check follow status
  const statusRes = await harness.request('GET', `/api/v1/social/status/user/${userA.id}`, {
    token: userB.token
  });
  assert.strictEqual(statusRes.status, 200);
  assert.strictEqual(statusRes.body.data.isFollowing, true);

  // List followers of User A
  const followersRes = await harness.request('GET', `/api/v1/social/followers/user/${userA.id}`);
  assert.strictEqual(followersRes.status, 200);
  assert(followersRes.body.data.followers.some(f => f.follower_id === userB.id || (f.user && f.user.id === userB.id)));

  /* ── 5. Social Recommendations & Anti-Self-Endorsement ─────────────────── */
  // User A cannot recommend own store
  const selfRecRes = await harness.request('POST', '/api/v1/social/recommendations', {
    token: userA.token,
    body: {
      targetType: 'seller',
      targetId: store.id,
      note: 'I am the most honest merchant in the country!'
    }
  });
  assert.strictEqual(selfRecRes.status, 400, 'Self-recommendation on own store must be rejected');

  // User B recommends User A
  const recRes = await harness.request('POST', '/api/v1/social/recommendations', {
    token: userB.token,
    body: {
      targetType: 'user',
      targetId: userA.id,
      note: 'Highly skilled and trusted merchant in Central Africa.',
      relationshipContext: 'partner'
    }
  });
  assert.strictEqual(recRes.status, 201);
  assert.ok(recRes.body.data.recommendation.id);

  /* ── 6. Reviews & Rating Attack Defense ────────────────────────────────── */
  // User A cannot review own store
  const selfReviewRes = await harness.request('POST', '/api/v1/reviews', {
    token: userA.token,
    body: {
      targetType: 'seller',
      targetId: store.id,
      rating: 5,
      content: 'Five stars for my own boutique!'
    }
  });
  assert.strictEqual(selfReviewRes.status, 400, 'Self-review on own boutique must be rejected');

  // User B reviews the store
  const reviewRes = await harness.request('POST', '/api/v1/reviews', {
    token: userB.token,
    body: {
      targetType: 'seller',
      targetId: store.id,
      rating: 5,
      title: 'Top notch equipment',
      content: 'Received my items safely and with full warranty.'
    }
  });
  assert.strictEqual(reviewRes.status, 201);
  assert.strictEqual(reviewRes.body.data.review.rating, 5);

  // Duplicate unverified review from User B is rejected
  const dupReviewRes = await harness.request('POST', '/api/v1/reviews', {
    token: userB.token,
    body: {
      targetType: 'seller',
      targetId: store.id,
      rating: 4,
      content: 'Another unverified review attempt.'
    }
  });
  assert.strictEqual(dupReviewRes.status, 409, 'Duplicate unverified review must be rejected with 409 Conflict');

  // Rating summary
  const summaryRes = await harness.request('GET', `/api/v1/reviews/seller/${store.id}/summary`);
  assert.strictEqual(summaryRes.status, 200);
  assert.strictEqual(summaryRes.body.data.summary.average, 5.0);
  assert.strictEqual(summaryRes.body.data.summary.total, 1);

  /* ── 7. Reputation Metrics & Trust Tier Calculation ───────────────────── */
  const repRes = await harness.request('GET', `/api/v1/reputation/${store.slug}`);
  assert.strictEqual(repRes.status, 200);
  assert.ok(repRes.body.data.reputation.score);
  assert.ok(repRes.body.data.reputation.trustTier);

  /* ── 8. Public User Profile & Public Seller Commercial Page ───────────── */
  const pubUserRes = await harness.request('GET', `/api/v1/u/${userA.id}`, {
    token: userB.token
  });
  assert.strictEqual(pubUserRes.status, 200);
  assert.strictEqual(pubUserRes.body.data.profile.id, userA.id);
  assert.strictEqual(pubUserRes.body.data.profile.isFollowing, true);

  const pubSellerRes = await harness.request('GET', `/api/v1/s/${store.slug}`, {
    token: userB.token
  });
  assert.strictEqual(pubSellerRes.status, 200);
  assert.strictEqual(pubSellerRes.body.data.seller.id, store.id);
  assert.strictEqual(pubSellerRes.body.data.seller.sellerType, 'AGENCY');
  assert.ok(pubSellerRes.body.data.seller.organization);
  assert.strictEqual(pubSellerRes.body.data.seller.organization.name, 'Alpha Innovators Agency');

  /* ── 9. Social Blocking & Reciprocal Defense ───────────────────────────── */
  // User A blocks User C
  const blockRes = await harness.request('POST', '/api/v1/social/block', {
    token: userA.token,
    body: { userId: userC.id }
  });
  assert.strictEqual(blockRes.status, 200);

  // List blocked users
  const listBlocksRes = await harness.request('GET', '/api/v1/social/blocks', {
    token: userA.token
  });
  assert.strictEqual(listBlocksRes.status, 200);
  assert(listBlocksRes.body.data.blocks.some(b => b.blockedId === userC.id));

  // User C tries to follow User A (must be rejected)
  const blockedFollowRes = await harness.request('POST', '/api/v1/social/follow', {
    token: userC.token,
    body: { targetType: 'user', targetId: userA.id }
  });
  assert.strictEqual(blockedFollowRes.status, 400, 'Blocked user follow attempt must be rejected');

  // User A unblocks User C
  const unblockRes = await harness.request('POST', '/api/v1/social/unblock', {
    token: userA.token,
    body: { userId: userC.id }
  });
  assert.strictEqual(unblockRes.status, 200);

  console.log('    ✓ All Organizations, Social Graph, Reviews, Blocks & Reputation endpoints passed.');
}

if (require.main === module) {
  run().then(() => harness.stop()).catch(err => {
    console.error('FAILED:', err);
    harness.stop().then(() => process.exit(1));
  });
}

module.exports = { run };