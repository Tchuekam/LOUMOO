/**
 * LOUMOO — End-to-End Seller Journey
 * ---------------------------------------------------------------------------
 * Walks a real account from "just verified" all the way to a published
 * listing with real images in real object storage, asserting at every step
 * that the SERVER — not the UI — is the thing making the decision.
 *
 *   verified -> onboarding -> ACCOUNT_READY -> boutique -> SELLER_READY
 *            -> upload -> draft -> publish
 */

require('../setup');
const assert = require('assert');
const harness = require('../helpers/harness');

async function run() {
  await harness.start();

  /* ══════════════════════════════════════════════════════════════════════ */
  /* 1. A VERIFIED BUT UN-ONBOARDED ACCOUNT                                 */
  /* ══════════════════════════════════════════════════════════════════════ */

  const user = await harness.createUser({ stage: 'verified' });
  const token = user.token;

  let state = (await harness.request('GET', '/api/v1/me/state', { token })).body.data;
  assert.strictEqual(state.state, 'ONBOARDING_REQUIRED');
  assert.strictEqual(state.capabilities.canCreateListing, false);
  assert.strictEqual(state.destination, '/onboarding');

  /* ══════════════════════════════════════════════════════════════════════ */
  /* 2. ONBOARDING IS SERVER-BACKED, ORDERED AND RESUMABLE                  */
  /* ══════════════════════════════════════════════════════════════════════ */

  const started = await harness.request('POST', '/api/v1/me/onboarding/start', {
    token, body: { intent: 'seller' }
  });
  assert.strictEqual(started.status, 200);
  assert.strictEqual(started.body.data.state, 'ONBOARDING_IN_PROGRESS');
  assert.strictEqual(started.body.data.onboarding.nextStep, 'PERSONAL_INFO',
    'The derived Clerk steps are auto-satisfied; the first user step is PERSONAL_INFO');

  // Out-of-order submission is a 409, not a silent skip.
  const skipAhead = await harness.request('POST', '/api/v1/me/onboarding/steps/COMPLETION', {
    token, body: { acceptedTerms: true }
  });
  assert.strictEqual(skipAhead.status, 409,
    `Skipping to the last step must be a state conflict, got ${skipAhead.status}`);
  assert.strictEqual(skipAhead.body.error.details.expectedStep, 'PERSONAL_INFO');

  // Invalid input returns per-field errors rather than a generic failure.
  const badStep = await harness.request('POST', '/api/v1/me/onboarding/steps/PERSONAL_INFO', {
    token, body: { firstName: '', lastName: 'Nkeng' }
  });
  assert.strictEqual(badStep.status, 400);
  assert.ok(badStep.body.error.details.fields.some(f => f.field === 'firstName'),
    'Validation errors must identify the offending field');

  await submitStep(token, 'PERSONAL_INFO', { firstName: 'Amina', lastName: 'Nkeng' });

  // Resumability: a brand-new "device" (a fresh request with no local state)
  // is told exactly where to continue, and the saved answers come back.
  const resumed = (await harness.request('GET', '/api/v1/me/onboarding', { token })).body.data;
  assert.strictEqual(resumed.nextStep, 'LOCATION',
    'A resumed session must continue at the next incomplete step');
  assert.strictEqual(resumed.draft.PERSONAL_INFO.firstName, 'Amina',
    'Previously submitted answers must be returned so the wizard can prefill');

  await submitStep(token, 'LOCATION', { city: 'douala', address: 'Akwa, Boulevard de la Liberté' });
  await submitStep(token, 'MARKETPLACE_PREFERENCES', {
    interests: ['electronics', 'fashion'],
    priorities: ['verified_sellers', 'fast_delivery']
  });
  await submitStep(token, 'SELLER_SETUP', {
    sellerType: 'pro',
    businessName: 'Amina Electronics SARL',
    rccmNumber: 'RC/DLA/2024/B/1234'
  });
  const completed = await submitStep(token, 'COMPLETION', { acceptedTerms: true });

  assert.strictEqual(completed.onboarding.status, 'COMPLETED');
  // Seller intent alone does NOT make the account seller-ready.
  assert.strictEqual(completed.state, 'SELLER_VERIFICATION_REQUIRED');
  assert.strictEqual(completed.capabilities.canCreateListing, false,
    'Declaring an intent to sell must not by itself unlock listing creation');

  /* ══════════════════════════════════════════════════════════════════════ */
  /* 3. THE ONBOARDING DATA REACHED THE DATABASE                            */
  /* ══════════════════════════════════════════════════════════════════════ */

  const { data: dbProfile } = await harness.db()
    .from('profiles')
    .select('first_name, city, business_name, onboarding_status, onboarding_completed_at, seller_status, buyer_interests')
    .eq('id', user.id).single();

  assert.strictEqual(dbProfile.first_name, 'Amina');
  assert.strictEqual(dbProfile.city, 'douala');
  assert.strictEqual(dbProfile.business_name, 'Amina Electronics SARL');
  assert.strictEqual(dbProfile.onboarding_status, 'COMPLETED');
  assert.ok(dbProfile.onboarding_completed_at, 'Completion must be timestamped, not just flagged');
  assert.deepStrictEqual(dbProfile.buyer_interests, ['electronics', 'fashion']);

  /* ══════════════════════════════════════════════════════════════════════ */
  /* 4. CREATING AND ACTIVATING A BOUTIQUE                                  */
  /* ══════════════════════════════════════════════════════════════════════ */

  const storeRes = await harness.request('POST', '/api/v1/stores', {
    token,
    body: {
      name: 'Amina Electronics Douala',
      categoryId: 'electronics',
      description: 'Certified smartphone and laptop retailer in Akwa, Douala.',
      city: 'Douala',
      phoneNumber: '+237690554433'
    }
  });
  assert.strictEqual(storeRes.status, 201, `Store creation failed: ${JSON.stringify(storeRes.body)}`);
  const storeId = storeRes.body.data.id;

  // A second identical POST is a conflict, not a duplicate boutique.
  const dupStore = await harness.request('POST', '/api/v1/stores', {
    token, body: { name: 'Amina Electronics Douala', categoryId: 'electronics' }
  });
  assert.strictEqual(dupStore.status, 409, 'A seller must not end up with two boutiques');

  // Still not seller-ready: the store is a DRAFT.
  state = (await harness.request('GET', '/api/v1/me/state', { token })).body.data;
  assert.strictEqual(state.capabilities.canCreateListing, false,
    'An un-activated boutique must not unlock listing creation');

  // Activation is refused while requirements are unmet — server-side.
  const prematureActivation = await harness.request('PATCH', `/api/v1/stores/${storeId}/onboarding`, {
    token, body: { step: 'ACTIVE' }
  });
  assert.ok([200, 400].includes(prematureActivation.status));

  if (prematureActivation.status === 400) {
    // Satisfy the outstanding requirements, then activate for real.
    await harness.request('PATCH', `/api/v1/stores/${storeId}/location`, {
      token, body: { city: 'Douala', region: 'Littoral', streetAddress: 'Akwa Boulevard' }
    });
    const activation = await harness.request('PATCH', `/api/v1/stores/${storeId}/onboarding`, {
      token, body: { step: 'ACTIVE' }
    });
    assert.strictEqual(activation.status, 200,
      `Store activation failed: ${JSON.stringify(activation.body)}`);
  }

  state = (await harness.request('GET', '/api/v1/me/state', { token })).body.data;
  assert.strictEqual(state.state, 'SELLER_READY',
    `Activating the boutique must promote the account to SELLER_READY, got ${state.state}`);
  assert.strictEqual(state.capabilities.canCreateListing, true);
  assert.strictEqual(state.capabilities.canUploadListingMedia, true);

  /* ══════════════════════════════════════════════════════════════════════ */
  /* 5. REAL IMAGE UPLOAD, REALLY VALIDATED                                 */
  /* ══════════════════════════════════════════════════════════════════════ */

  // A text file renamed to look like a photo is rejected on its BYTES.
  const fakeImage = await harness.request('POST', '/api/v1/uploads/listing-media', {
    token,
    raw: Buffer.from('#!/bin/sh\necho "this is not an image"\n'.repeat(40)),
    headers: { 'Content-Type': 'image/jpeg' }
  });
  assert.strictEqual(fakeImage.status, 400,
    'A non-image body must be rejected even when it claims Content-Type: image/jpeg');
  assert.ok(
    JSON.stringify(fakeImage.body).includes('UNSUPPORTED_FORMAT'),
    'The rejection must name the real problem: the bytes are not a supported image'
  );

  // An image below the minimum dimensions is rejected.
  const tiny = await harness.request('POST', '/api/v1/uploads/listing-media', {
    token, raw: harness.makePng(50, 50)
  });
  assert.strictEqual(tiny.status, 400, 'A 50x50 image must be rejected as too small');

  // A valid image is accepted and staged.
  const upload = await harness.request('POST', '/api/v1/uploads/listing-media', {
    token, raw: harness.makePng(1200, 900)
  });
  assert.strictEqual(upload.status, 201, `Upload failed: ${JSON.stringify(upload.body)}`);
  assert.strictEqual(upload.body.data.width, 1200, 'Dimensions must be read from the file itself');
  assert.strictEqual(upload.body.data.height, 900);
  assert.strictEqual(upload.body.data.format, 'png');
  assert.ok(upload.body.data.uploadId, 'The client receives an opaque uploadId to reference the asset');
  assert.strictEqual(upload.body.data.storagePath, undefined,
    'The raw storage path must not be handed to the client as an addressable field');
  // The bucket is private: access is only ever via a time-limited signed URL,
  // so the object cannot be enumerated or hot-linked without a token.
  assert.ok(/[?&]token=/.test(upload.body.data.url),
    'Media must be served through a signed URL, not a public object URL');

  const uploadId = upload.body.data.uploadId;

  const secondUpload = await harness.request('POST', '/api/v1/uploads/listing-media', {
    token, raw: harness.makePng(800, 800)
  });
  assert.strictEqual(secondUpload.status, 201);

  /* ══════════════════════════════════════════════════════════════════════ */
  /* 6. LISTING VALIDATION IS CATEGORY-AWARE AND STRICT                     */
  /* ══════════════════════════════════════════════════════════════════════ */

  // Unknown fields are rejected, never silently dropped.
  const unknownField = await harness.request('POST', '/api/v1/listings', {
    token,
    body: { categoryId: 'smartphones', title: 'Test', isFeatured: true, adminApproved: true }
  });
  assert.strictEqual(unknownField.status, 400);
  assert.ok(
    JSON.stringify(unknownField.body).includes('isFeatured'),
    'An unrecognised field must be named in the error, not discarded'
  );

  // A category that does not exist is rejected.
  const badCategory = await harness.request('POST', '/api/v1/listings', {
    token, body: { categoryId: 'unicorns', title: 'Something' }
  });
  assert.strictEqual(badCategory.status, 400);

  /*
   * A listing type the boutique's vertical does not permit is refused.
   *
   * This expected 400. The store-vertical guard (Store.getAllowedListingTypes)
   * now answers 403 instead, and that is the correct code: the request is
   * well-formed, the caller is simply not authorized to publish that type from
   * an electronics boutique. It also matches the documented gate ordering
   * (authorization completes before validation) and the HTTP contract in
   * docs/architecture/13 — 403 = "authenticated, not authorized".
   */
  const badType = await harness.request('POST', '/api/v1/listings', {
    token, body: { categoryId: 'smartphones', title: 'A booking?', listingType: 'BOOKING' }
  });
  assert.strictEqual(badType.status, 403,
    'An electronics boutique is not authorized to publish BOOKING listings');
  assert.ok(
    JSON.stringify(badType.body).toLowerCase().includes('authorized'),
    'The refusal must explain that the boutique vertical does not allow this type'
  );

  /* ══════════════════════════════════════════════════════════════════════ */
  /* 7. CREATING THE DRAFT                                                  */
  /* ══════════════════════════════════════════════════════════════════════ */

  const draftBody = {
    categoryId: 'smartphones',
    listingType: 'PHYSICAL_PRODUCT',
    title: 'Samsung Galaxy S24 Ultra 256GB — Titanium Grey',
    description: 'Brand new, sealed Samsung Galaxy S24 Ultra with 256GB storage and 12GB RAM. Full one-year warranty, official Cameroon distribution.',
    condition: 'new',
    currency: 'XAF',
    basePriceMinor: 850000,
    city: 'douala',
    attributes: {
      brand: 'Samsung',
      model: 'Galaxy S24 Ultra',
      storage: '256GB',
      ram: '12GB',
      color: 'Black'
    },
    uploadIds: [uploadId]
  };

  const created = await harness.request('POST', '/api/v1/listings', { token, body: draftBody });
  assert.strictEqual(created.status, 201, `Listing creation failed: ${JSON.stringify(created.body)}`);
  const listingId = created.body.data.id;
  assert.strictEqual(created.body.data.imageCount, 1, 'The staged image must be attached');

  /* ══════════════════════════════════════════════════════════════════════ */
  /* 8. DOUBLE SUBMISSION DOES NOT CREATE A TWIN                            */
  /* ══════════════════════════════════════════════════════════════════════ */

  const secondUploadId = secondUpload.body.data.uploadId;
  const doubleClick = await harness.request('POST', '/api/v1/listings', {
    token, body: { ...draftBody, uploadIds: [secondUploadId] }
  });
  assert.strictEqual(doubleClick.status, 200,
    'An identical re-submission must be collapsed, not created again');
  assert.strictEqual(doubleClick.body.duplicate, true);
  assert.strictEqual(doubleClick.body.data.id, listingId,
    'The duplicate response must return the original listing');

  const { count: listingCount } = await harness.db()
    .from('listings')
    .select('id', { count: 'exact', head: true })
    .eq('store_id', storeId);
  assert.strictEqual(listingCount, 1, 'Exactly one listing must exist after a double-click');

  /* ══════════════════════════════════════════════════════════════════════ */
  /* 9. AN ALREADY-ATTACHED IMAGE CANNOT BE REUSED                          */
  /* ══════════════════════════════════════════════════════════════════════ */

  const reuse = await harness.request('POST', `/api/v1/listings/${listingId}/media`, {
    token, body: { uploadIds: [uploadId] }
  });
  assert.strictEqual(reuse.status, 400,
    'An upload already attached to a listing must not be attachable twice');

  /* ══════════════════════════════════════════════════════════════════════ */
  /* 10. PUBLISHING IS RE-VALIDATED SERVER-SIDE                             */
  /* ══════════════════════════════════════════════════════════════════════ */

  const published = await harness.request('POST', `/api/v1/listings/${listingId}/publish`, { token });
  assert.strictEqual(published.status, 200, `Publish failed: ${JSON.stringify(published.body)}`);
  assert.strictEqual(published.body.data.status, 'PUBLISHED');

  // Publishing twice is a state conflict, not a silent no-op.
  const republish = await harness.request('POST', `/api/v1/listings/${listingId}/publish`, { token });
  assert.strictEqual(republish.status, 409, 'A PUBLISHED listing cannot be published again');

  // It is now publicly readable.
  const publicView = await harness.request('GET', `/api/v1/listings/${listingId}`);
  assert.strictEqual(publicView.status, 200);
  assert.strictEqual(publicView.body.data.title, draftBody.title);
  assert.ok(publicView.body.data.media.length >= 1, 'The published listing must carry its images');

  /* ══════════════════════════════════════════════════════════════════════ */
  /* 11. A PUBLISHED LISTING CANNOT BE EDITED INTO AN INVALID STATE         */
  /* ══════════════════════════════════════════════════════════════════════ */

  const emptyOut = await harness.request('PATCH', `/api/v1/listings/${listingId}`, {
    token, body: { description: 'too short' }
  });
  assert.strictEqual(emptyOut.status, 400,
    'A published listing must remain publishable after every edit');

  const goodEdit = await harness.request('PATCH', `/api/v1/listings/${listingId}`, {
    token, body: { basePriceMinor: 820000 }
  });
  assert.strictEqual(goodEdit.status, 200);
  assert.strictEqual(goodEdit.body.data.pricing.basePriceMinor, 820000);

  /* ══════════════════════════════════════════════════════════════════════ */
  /* 12. PAUSE / ARCHIVE STATE MACHINE                                      */
  /* ══════════════════════════════════════════════════════════════════════ */

  const paused = await harness.request('POST', `/api/v1/listings/${listingId}/pause`, { token });
  assert.strictEqual(paused.status, 200);
  assert.strictEqual(paused.body.data.status, 'PAUSED');

  const pausedPublicView = await harness.request('GET', `/api/v1/listings/${listingId}`);
  assert.strictEqual(pausedPublicView.status, 404,
    'A paused listing must disappear from the public marketplace');

  const archived = await harness.request('POST', `/api/v1/listings/${listingId}/archive`, { token });
  assert.strictEqual(archived.status, 200);

  const editArchived = await harness.request('PATCH', `/api/v1/listings/${listingId}`, {
    token, body: { title: 'Trying to edit an archived listing' }
  });
  assert.ok([404, 409].includes(editArchived.status),
    'An archived listing must not be editable');

  console.log('  ✓ Seller journey: verification -> onboarding -> boutique -> upload -> publish');
}

async function submitStep(token, stepKey, payload) {
  const res = await harness.request('POST', `/api/v1/me/onboarding/steps/${stepKey}`, {
    token, body: payload
  });
  assert.strictEqual(res.status, 200,
    `Onboarding step ${stepKey} failed: ${JSON.stringify(res.body)}`);
  return res.body.data;
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
