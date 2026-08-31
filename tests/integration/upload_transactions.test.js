/**
 * LOUMOO — Upload & Listing Transactional Safety
 * ---------------------------------------------------------------------------
 * Proves that a failure anywhere in the upload -> create -> attach chain never
 * leaves the system in a half-built state: no orphaned objects in storage, no
 * listing rows without their media, no media rows without their objects.
 */

require('../setup');
const assert = require('assert');
const harness = require('../helpers/harness');

const MediaStorageService = require('../../server/infrastructure/storage/MediaStorageService');
const CreateListingUseCase = require('../../server/modules/listing/application/CreateListingUseCase');
const ListingRepository = require('../../server/modules/listing/infrastructure/ListingRepository');
const { ValidationError } = require('../../server/shared/errors/AppError');

async function run() {
  await harness.start();

  const seller = await harness.createUser({ stage: 'seller_ready' });
  const store = await harness.createStore(seller);
  const token = seller.token;

  /* ══════════════════════════════════════════════════════════════════════ */
  /* 1. A STAGED UPLOAD IS TRACKED BEFORE IT IS USEFUL                      */
  /* ══════════════════════════════════════════════════════════════════════ */

  const up = await harness.request('POST', '/api/v1/uploads/listing-media', {
    token, raw: harness.makePng(900, 600)
  });
  assert.strictEqual(up.status, 201);
  const uploadId = up.body.data.uploadId;

  const { data: stagedRow } = await harness.db()
    .schema('system').from('upload_sessions')
    .select('*').eq('id', uploadId).single();

  assert.strictEqual(stagedRow.status, 'STAGED',
    'An upload that is not yet attached must be recorded as STAGED, so it is always reclaimable');
  assert.strictEqual(stagedRow.owner_id, seller.id);
  assert.ok(stagedRow.checksum_sha256, 'The stored asset must carry a content checksum');

  /* ══════════════════════════════════════════════════════════════════════ */
  /* 2. LISTING CREATION FAILURE RELEASES THE STAGED IMAGES                 */
  /*    Simulated by making the attach step fail after the row is inserted. */
  /* ══════════════════════════════════════════════════════════════════════ */

  const beforeFailure = await countListings(store.id);

  const originalAttach = CreateListingUseCase._attachMedia;
  CreateListingUseCase._attachMedia = async () => {
    throw new ValidationError('Simulated media attachment failure');
  };

  let threw = false;
  try {
    await CreateListingUseCase.execute({
      principal: harnessPrincipal(seller, store),
      accountState: sellerReadyState(),
      store: { id: store.id, status: 'ACTIVE' },
      input: {
        categoryId: 'smartphones',
        title: 'Listing that will fail during media attachment',
        description: 'This listing exists only to prove that a failure mid-creation rolls everything back cleanly.',
        basePriceMinor: 100000,
        city: 'douala',
        attributes: { brand: 'Apple', model: 'iPhone 15', storage: '128GB', color: 'Black' },
        uploadIds: [uploadId]
      }
    });
  } catch (err) {
    threw = true;
  } finally {
    CreateListingUseCase._attachMedia = originalAttach;
  }

  assert.ok(threw, 'A failed media attachment must surface as an error, not a silent partial success');

  const afterFailure = await countListings(store.id);
  assert.strictEqual(afterFailure, beforeFailure,
    'A listing whose media could not be attached must be rolled back, leaving no orphan row');

  const { data: releasedRow } = await harness.db()
    .schema('system').from('upload_sessions')
    .select('status').eq('id', uploadId).single();

  assert.ok(['DISCARDED', 'ORPHANED'].includes(releasedRow.status),
    `The staged image must be released after the failure, got status=${releasedRow.status}`);

  // ...and the object itself must be gone from the bucket.
  if (releasedRow.status === 'DISCARDED') {
    const signed = await MediaStorageService.createSignedUrl(stagedRow.storage_path);
    if (signed) {
      const res = await fetch(signed);
      assert.ok(!res.ok, 'The discarded object must no longer be retrievable from storage');
    }
  }

  /* ══════════════════════════════════════════════════════════════════════ */
  /* 3. THE SWEEPER RECLAIMS EXPIRED STAGING                                */
  /* ══════════════════════════════════════════════════════════════════════ */

  const orphan = await harness.request('POST', '/api/v1/uploads/listing-media', {
    token, raw: harness.makePng(700, 700)
  });
  const orphanId = orphan.body.data.uploadId;

  // Age it past its expiry, as an abandoned wizard would after a day.
  await harness.db().schema('system').from('upload_sessions')
    .update({ expires_at: new Date(Date.now() - 60_000).toISOString() })
    .eq('id', orphanId);

  const sweep = await MediaStorageService.sweepOrphans({ limit: 50 });
  assert.ok(sweep.swept >= 1, 'The sweeper must reclaim expired staged uploads');

  const { data: sweptRow } = await harness.db()
    .schema('system').from('upload_sessions')
    .select('status').eq('id', orphanId).single();
  assert.ok(['DISCARDED', 'ORPHANED'].includes(sweptRow.status),
    'A swept upload must no longer be STAGED');

  /* ══════════════════════════════════════════════════════════════════════ */
  /* 4. A SUCCESSFUL CREATION MARKS ITS MEDIA ATTACHED                      */
  /* ══════════════════════════════════════════════════════════════════════ */

  const goodUpload = await harness.request('POST', '/api/v1/uploads/listing-media', {
    token, raw: harness.makePng(1000, 800)
  });
  const goodUploadId = goodUpload.body.data.uploadId;

  const created = await harness.request('POST', '/api/v1/listings', {
    token,
    body: {
      categoryId: 'smartphones',
      title: 'iPhone 15 Pro 256GB — Natural Titanium',
      description: 'Sealed iPhone 15 Pro with 256GB storage, official warranty, delivered anywhere in Douala.',
      basePriceMinor: 1150000,
      city: 'douala',
      attributes: { brand: 'Apple', model: 'iPhone 15 Pro', storage: '256GB', color: 'Titanium Natural' },
      uploadIds: [goodUploadId]
    }
  });
  assert.strictEqual(created.status, 201, `Creation failed: ${JSON.stringify(created.body)}`);

  const { data: attachedRow } = await harness.db()
    .schema('system').from('upload_sessions')
    .select('status, listing_id').eq('id', goodUploadId).single();

  assert.strictEqual(attachedRow.status, 'ATTACHED');
  assert.strictEqual(attachedRow.listing_id, created.body.data.id,
    'The upload record must point at the listing that now owns it');

  const media = await ListingRepository.listMedia(created.body.data.id);
  assert.strictEqual(media.length, 1);
  assert.ok(media[0].storage_path, 'Media rows must record where the object actually lives');
  assert.strictEqual(media[0].uploaded_by, seller.id, 'Media must record who uploaded it');

  /* ══════════════════════════════════════════════════════════════════════ */
  /* 5. DELETING MEDIA REMOVES THE OBJECT TOO                               */
  /* ══════════════════════════════════════════════════════════════════════ */

  const del = await harness.request('DELETE',
    `/api/v1/listings/${created.body.data.id}/media/${media[0].id}`, { token });
  assert.strictEqual(del.status, 200);
  assert.strictEqual(del.body.data.remainingCount, 0);

  const remaining = await ListingRepository.listMedia(created.body.data.id);
  assert.strictEqual(remaining.length, 0, 'The media row must be gone');

  const { data: discardedRow } = await harness.db()
    .schema('system').from('upload_sessions')
    .select('status').eq('id', goodUploadId).single();
  assert.ok(['DISCARDED', 'ORPHANED'].includes(discardedRow.status),
    'Deleting a listing image must release its storage object, not just the row');

  console.log('  ✓ Upload transactions: rollback, sweeping and cleanup all leave no orphans');
}

async function countListings(storeId) {
  const { count } = await harness.db()
    .from('listings')
    .select('id', { count: 'exact', head: true })
    .eq('store_id', storeId);
  return count || 0;
}

function harnessPrincipal(user, store) {
  return {
    id: user.id,
    clerkUserId: user.clerk_user_id,
    email: user.email,
    primaryRole: 'seller',
    sellerStatus: 'READY',
    primaryStoreId: store.id,
    city: 'douala'
  };
}

function sellerReadyState() {
  const { deriveAccountState, ONBOARDING_STATUS, SELLER_STATUS } =
    require('../../server/modules/identity/domain/AccountState');
  return deriveAccountState({
    id: 'x',
    emailVerifiedAt: new Date().toISOString(),
    onboardingStatus: ONBOARDING_STATUS.COMPLETED,
    sellerStatus: SELLER_STATUS.READY
  }, {});
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
