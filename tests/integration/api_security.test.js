/**
 * LOUMOO — Direct API Bypass Suite
 * ---------------------------------------------------------------------------
 * These tests exist to prove one claim:
 *
 *       UI bypass  !=  authorization bypass
 *
 * Every request here is a raw HTTP call against the real server — the sort of
 * thing curl, Postman or modified JavaScript would send. None of them go
 * through a screen, and none of them are allowed to succeed.
 */

require('../setup');
const assert = require('assert');
const harness = require('../helpers/harness');

const SELL_ENDPOINTS = [
  ['POST', '/api/v1/listings'],
  ['GET', '/api/v1/listings/seller'],
  ['POST', '/api/v1/uploads/listing-media']
];

async function run() {
  await harness.start();

  /* ══════════════════════════════════════════════════════════════════════ */
  /* 1. UNAUTHENTICATED REQUESTS                                            */
  /* ══════════════════════════════════════════════════════════════════════ */

  for (const [method, path] of SELL_ENDPOINTS) {
    const res = await harness.request(method, path, { body: {} });
    assert.strictEqual(res.status, 401,
      `${method} ${path} must reject an unauthenticated request with 401, got ${res.status}`);
  }

  const meRes = await harness.request('GET', '/api/v1/me/state');
  assert.strictEqual(meRes.status, 401, 'Account state must require authentication');

  /* ══════════════════════════════════════════════════════════════════════ */
  /* 2. FORGED TOKENS                                                       */
  /*    The previous guard trusted any token starting with `user_` and fell  */
  /*    back to a demo identity for everything else. Both are now 401.       */
  /* ══════════════════════════════════════════════════════════════════════ */

  const forgedTokens = [
    'user_admin',
    'user_2abcDEFghiJKLmnoPQR',
    'usr_someone_else',
    'sess_1a2b3c_user_victim',
    'Bearer',
    'null',
    'eyJhbGciOiJub25lIn0.eyJzdWIiOiJ1c2VyX3ZpY3RpbSJ9.',
    'loumoo_test:wrong-secret:user_victim',
    'loumoo_test::user_victim'
  ];

  for (const token of forgedTokens) {
    const res = await harness.request('GET', '/api/v1/me/state', { token });
    assert.strictEqual(res.status, 401,
      `Forged token "${token.slice(0, 24)}..." must be rejected with 401, got ${res.status}`);
    assert.ok(
      !res.body || !res.body.data || !res.body.data.user,
      'A rejected token must never return a user object'
    );
  }

  /* ══════════════════════════════════════════════════════════════════════ */
  /* 3. AUTHENTICATED BUT UNVERIFIED                                        */
  /* ══════════════════════════════════════════════════════════════════════ */

  const unverified = await harness.createUser({ stage: 'unverified' });

  const unverifiedState = await harness.request('GET', '/api/v1/me/state', { token: unverified.token });
  assert.strictEqual(unverifiedState.status, 200, 'An unverified user still has a readable state');
  assert.strictEqual(unverifiedState.body.data.state, 'CONTACT_VERIFICATION_REQUIRED');
  assert.strictEqual(unverifiedState.body.data.capabilities.canCreateListing, false);
  assert.strictEqual(unverifiedState.body.data.capabilities.canPurchase, false);

  const unverifiedCreate = await harness.request('POST', '/api/v1/listings', {
    token: unverified.token,
    body: { categoryId: 'smartphones', title: 'Bypass attempt' }
  });
  assert.strictEqual(unverifiedCreate.status, 403,
    `An unverified account must be refused listing creation with 403, got ${unverifiedCreate.status}`);
  assert.ok(unverifiedCreate.body.error.details.resolveAt,
    'A 403 must tell the client where the user can resolve the block');

  const unverifiedUpload = await harness.request('POST', '/api/v1/uploads/listing-media', {
    token: unverified.token,
    raw: harness.makePng()
  });
  assert.strictEqual(unverifiedUpload.status, 403,
    'Upload must be refused BEFORE any bytes are stored');

  /* ══════════════════════════════════════════════════════════════════════ */
  /* 4. VERIFIED BUT NOT ONBOARDED                                          */
  /* ══════════════════════════════════════════════════════════════════════ */

  const onboarding = await harness.createUser({ stage: 'onboarding' });
  const onbState = await harness.request('GET', '/api/v1/me/state', { token: onboarding.token });
  assert.strictEqual(onbState.body.data.state, 'ONBOARDING_IN_PROGRESS');
  assert.strictEqual(onbState.body.data.capabilities.canCreateListing, false);

  const onbCreate = await harness.request('POST', '/api/v1/listings', {
    token: onboarding.token,
    body: { categoryId: 'smartphones', title: 'Bypass attempt' }
  });
  assert.strictEqual(onbCreate.status, 403, 'Incomplete onboarding must block listing creation');

  /* ══════════════════════════════════════════════════════════════════════ */
  /* 5. BUYER (ACCOUNT_READY) IS NOT A SELLER                               */
  /* ══════════════════════════════════════════════════════════════════════ */

  const buyer = await harness.createUser({ stage: 'ready' });
  const buyerState = await harness.request('GET', '/api/v1/me/state', { token: buyer.token });
  assert.strictEqual(buyerState.body.data.state, 'ACCOUNT_READY');
  assert.strictEqual(buyerState.body.data.capabilities.canPurchase, true,
    'A fully onboarded buyer can buy');
  assert.strictEqual(buyerState.body.data.capabilities.canCreateListing, false,
    'A buyer without a seller account cannot create listings');
  assert.strictEqual(buyerState.body.data.capabilities.canStartSelling, true,
    'A buyer may start the seller journey');

  const buyerCreate = await harness.request('POST', '/api/v1/listings', {
    token: buyer.token,
    body: { categoryId: 'smartphones', title: 'Buyer bypass attempt' }
  });
  assert.strictEqual(buyerCreate.status, 403, 'A buyer must not be able to create a listing');

  /* ══════════════════════════════════════════════════════════════════════ */
  /* 6. SELLER OWNERSHIP / IDOR                                             */
  /* ══════════════════════════════════════════════════════════════════════ */

  const sellerA = await harness.createUser({ stage: 'seller_ready', suffix: 'a' });
  const storeA = await harness.createStore(sellerA);
  const listingA = await harness.createListing(sellerA, storeA);

  const sellerB = await harness.createUser({ stage: 'seller_ready', suffix: 'b' });
  const storeB = await harness.createStore(sellerB);

  // Seller B tries every mutation against seller A's listing.
  const idorAttempts = [
    ['PATCH', `/api/v1/listings/${listingA.id}`, { title: 'Hijacked by seller B' }],
    ['POST', `/api/v1/listings/${listingA.id}/publish`, {}],
    ['POST', `/api/v1/listings/${listingA.id}/pause`, {}],
    ['POST', `/api/v1/listings/${listingA.id}/archive`, {}],
    ['DELETE', `/api/v1/listings/${listingA.id}`, undefined],
    ['POST', `/api/v1/listings/${listingA.id}/media`, { uploadIds: ['anything'] }],
    ['PATCH', `/api/v1/listings/${listingA.id}/inventory`, { onHand: 999 }]
  ];

  for (const [method, path, body] of idorAttempts) {
    const res = await harness.request(method, path, { token: sellerB.token, body });
    assert.ok([403, 404].includes(res.status),
      `${method} ${path} by a non-owner must be refused (403/404), got ${res.status}`);
  }

  // The listing must be untouched.
  const stillOwned = await harness.request('GET', `/api/v1/listings/${listingA.id}`, { token: sellerA.token });
  assert.strictEqual(stillOwned.status, 200);
  assert.notStrictEqual(stillOwned.body.data.title, 'Hijacked by seller B',
    'A rejected IDOR attempt must not have modified the resource');

  /* ══════════════════════════════════════════════════════════════════════ */
  /* 7. IDENTITY CANNOT BE OVERRIDDEN BY REQUEST DATA                       */
  /*    Body-supplied sellerId/userId/ownerId/storeId must be ignored.       */
  /* ══════════════════════════════════════════════════════════════════════ */

  const spoofed = await harness.request('POST', '/api/v1/listings', {
    token: sellerB.token,
    body: {
      categoryId: 'smartphones',
      title: 'Spoofed ownership attempt',
      // Every one of these is attacker-controlled and must have no effect.
      sellerId: sellerA.id,
      userId: sellerA.id,
      ownerId: sellerA.id,
      storeId: storeA.id
    }
  });

  if (spoofed.status === 201 || spoofed.status === 200) {
    assert.strictEqual(spoofed.body.data.storeId, storeB.id,
      'A body-supplied storeId must never move a listing into another seller\'s boutique');
    await harness.db().from('listings').delete().eq('id', spoofed.body.data.id);
  } else {
    // Rejected outright (unknown field) — equally acceptable, and stricter.
    assert.ok([400, 403, 404].includes(spoofed.status),
      `Spoofed ownership must be rejected, got ${spoofed.status}: ${JSON.stringify(spoofed.body)}`);
  }

  /* ══════════════════════════════════════════════════════════════════════ */
  /* 8. STORE TENANT ISOLATION                                              */
  /* ══════════════════════════════════════════════════════════════════════ */

  const foreignStoreRead = await harness.request('GET', `/api/v1/stores/${storeA.id}`, { token: sellerB.token });
  assert.ok([403, 404].includes(foreignStoreRead.status),
    `Seller B must not read seller A's private store dashboard, got ${foreignStoreRead.status}`);

  const foreignStorePatch = await harness.request('PATCH', `/api/v1/stores/${storeA.id}`, {
    token: sellerB.token,
    body: { name: 'Taken over' }
  });
  assert.ok([403, 404].includes(foreignStorePatch.status),
    'Seller B must not be able to rename seller A\'s store');

  // The old guard invented a store owned by the caller for any `store_*` id.
  const inventedStore = await harness.request('GET', '/api/v1/stores/store_orca_electronics', {
    token: sellerB.token
  });
  assert.strictEqual(inventedStore.status, 404,
    'A store id that does not exist must be 404, never fabricated into existence');

  /* ══════════════════════════════════════════════════════════════════════ */
  /* 9. UNPUBLISHED LISTINGS ARE NOT PUBLICLY READABLE                      */
  /* ══════════════════════════════════════════════════════════════════════ */

  const anonDraftRead = await harness.request('GET', `/api/v1/listings/${listingA.id}`);
  assert.strictEqual(anonDraftRead.status, 404,
    'A DRAFT listing must not be readable by an anonymous visitor');

  const otherSellerDraftRead = await harness.request('GET', `/api/v1/listings/${listingA.id}`, {
    token: sellerB.token
  });
  assert.strictEqual(otherSellerDraftRead.status, 404,
    'A DRAFT listing must not be readable by another seller');

  /* ══════════════════════════════════════════════════════════════════════ */
  /* 10. RETIRED CREDENTIAL ENDPOINTS NO LONGER MINT SESSIONS               */
  /* ══════════════════════════════════════════════════════════════════════ */

  const fakeSignIn = await harness.request('POST', '/api/v1/auth/signin', {
    body: { identifier: 'victim@loumoo.cm' }
  });
  assert.strictEqual(fakeSignIn.status, 501,
    'Passwordless sign-in by identifier must no longer be possible');
  assert.ok(!fakeSignIn.body.data || !fakeSignIn.body.data.token,
    'The retired sign-in endpoint must never return a session token');

  const fakeEmailVerify = await harness.request('POST', '/api/v1/auth/email/verify', { body: {} });
  assert.strictEqual(fakeEmailVerify.status, 401,
    'Email verification must require an authenticated session, not return a blanket success');

  /* ══════════════════════════════════════════════════════════════════════ */
  /* 11. WEBHOOKS REJECT UNSIGNED PAYLOADS                                  */
  /* ══════════════════════════════════════════════════════════════════════ */

  const forgedWebhook = await harness.request('POST', '/api/v1/webhooks/clerk', {
    raw: JSON.stringify({ type: 'user.deleted', data: { id: sellerA.clerkUserId } }),
    headers: { 'Content-Type': 'application/json' }
  });
  // 401 = secret configured, signature verification failed (the test env may
  // carry CLERK_WEBHOOK_SECRET from .env.local). 503 = secret not configured,
  // endpoint refuses to process ANY unsigned identity event. Both are the
  // same guarantee: unsigned payloads never reach profile mutation.
  assert.ok([401, 503].includes(forgedWebhook.status),
    `An unsigned Clerk webhook must be refused, got ${forgedWebhook.status}`);
  if (forgedWebhook.status === 503) {
    assert.strictEqual(forgedWebhook.body.error.code, 'WEBHOOK_NOT_CONFIGURED',
      'The 503 must carry the machine-readable WEBHOOK_NOT_CONFIGURED code');
  }

  // ...and seller A must still exist.
  const sellerAStill = await harness.request('GET', '/api/v1/me/state', { token: sellerA.token });
  assert.strictEqual(sellerAStill.status, 200,
    'A forged user.deleted webhook must not have deleted the account');

  /* ══════════════════════════════════════════════════════════════════════ */
  /* 12. SECURITY HEADERS ARE PRESENT ON EVERY RESPONSE                     */
  /* ══════════════════════════════════════════════════════════════════════ */

  const guarded = await harness.request('GET', '/api/v1/health');
  assert.strictEqual(guarded.status, 200);

  assert.strictEqual(guarded.headers['x-content-type-options'], 'nosniff',
    'X-Content-Type-Options: nosniff must be set');
  assert.strictEqual(guarded.headers['x-frame-options'], 'DENY',
    'X-Frame-Options: DENY must be set');
  assert.strictEqual(guarded.headers['referrer-policy'], 'strict-origin-when-cross-origin',
    'Referrer-Policy must be set to strict-origin-when-cross-origin');

  const csp = guarded.headers['content-security-policy'];
  assert.ok(csp && csp.includes("default-src 'self'"), 'CSP must default to self');
  assert.ok(csp && !csp.includes("script-src 'self' 'unsafe-inline'"),
    'CSP script-src must NOT allow unsafe-inline');
  assert.ok(csp && csp.includes('frame-ancestors'), 'CSP must lock down framing');
  assert.ok(csp && csp.includes('object-src'), 'CSP must disable plugins');

  // Plain HTTP must NOT receive HSTS, but an https request through the trusted
  // proxy must. This proves the HSTS logic is conditional on TLS.
  assert.strictEqual(guarded.headers['strict-transport-security'], undefined,
    'HSTS must not be sent over plain http');

  const tlsProxied = await harness.request('GET', '/api/v1/health', {
    headers: { 'X-Forwarded-Proto': 'https' }
  });
  assert.ok(
    tlsProxied.headers['strict-transport-security'] &&
    tlsProxied.headers['strict-transport-security'].startsWith('max-age=31536000'),
    'HSTS must be present when the request arrives via https (trust proxy)'
  );

  console.log('  ✓ Direct API bypass suite: all 11 attack classes rejected + security headers verified');
}

module.exports = { run };

if (require.main === module) {
  run()
    .then(() => harness.cleanup())
    .then(() => process.exit(0))
    .catch(async err => {
      console.error(err);
      await harness.cleanup().catch(() => null);
      process.exit(1);
    });
}
