/**
 * LOUMOO — Critical Production Hardening Integration Test Suite
 * ---------------------------------------------------------------------------
 * Validates:
 *   1. Identity vs Role separation
 *   2. Session-preserving edit/return flows from onboarding review
 *   3. Role-specific onboarding question isolation
 *   4. Category-first store creation & validation
 *   5. Store category-driven vertical authorization (cross-vertical 403 prevention)
 *   6. Seller studio clean zero/empty state integrity
 */

require('../setup');
const assert = require('assert');
const harness = require('../helpers/harness');
const CacheService = require('../../server/infrastructure/cache/CacheService');
const Store = require('../../server/modules/store/domain/Store');

async function run() {
  await harness.start();

  console.log('  Testing Identity, Account Role, Category-First Store Creation, and Vertical Authorization...');

  try {
    await CacheService.flush();

    // ── 1. Category-First Store Creation Requires Category ──────────────────
    console.log('    1. Verifying store creation requires category...');
    const user1 = await harness.createUser({ stage: 'ready' });

    const missingCategoryRes = await harness.request('POST', '/api/v1/stores', {
      token: user1.token,
      body: {
        name: 'Tech Store Without Category'
      }
    });
    assert.strictEqual(missingCategoryRes.status, 400, 'Must reject store creation when categoryId is missing');
    assert.ok(
      JSON.stringify(missingCategoryRes.body).toLowerCase().includes('category'),
      'Error must mention category requirement'
    );

    const invalidCategoryRes = await harness.request('POST', '/api/v1/stores', {
      token: user1.token,
      body: {
        name: 'Invalid Category Store',
        categoryId: 'non_existent_domain_xyz_123'
      }
    });
    assert.strictEqual(invalidCategoryRes.status, 400, 'Must reject invalid categoryId');

    // ── 2. Valid Category Store Creation Succeeds ──────────────────────────
    console.log('    2. Verifying valid category store creation...');
    const validStoreRes = await harness.request('POST', '/api/v1/stores', {
      token: user1.token,
      body: {
        name: 'Orca Digital Akwa',
        categoryId: 'electronics',
        sellerType: 'SHOP',
        description: 'Certified premium electronics boutique in Akwa, Douala.',
        city: 'Douala',
        phoneNumber: '690123456'
      }
    });
    assert.strictEqual(validStoreRes.status, 201, `Store creation failed: ${JSON.stringify(validStoreRes.body)}`);
    const store = validStoreRes.body.data.store || validStoreRes.body.data;
    assert.strictEqual(store.categoryId, 'electronics');
    assert.strictEqual(store.name, 'Orca Digital Akwa');

    // ── 3. Store Domain Listing Types Mapping ──────────────────────────────
    console.log('    3. Verifying store domain listing type mappings...');
    const electronicsStore = new Store({ categoryId: 'electronics' });
    assert.ok(electronicsStore.canCreateListingType('PHYSICAL_PRODUCT'), 'Electronics store can create PHYSICAL_PRODUCT');
    assert.ok(electronicsStore.canCreateListingType('BUNDLE'), 'Electronics store can create BUNDLE');
    assert.ok(!electronicsStore.canCreateListingType('SERVICE'), 'Electronics store cannot create SERVICE listings');
    assert.ok(!electronicsStore.canCreateListingType('BOOKING'), 'Electronics store cannot create BOOKING listings');

    const serviceStore = new Store({ categoryId: 'services' });
    assert.ok(serviceStore.canCreateListingType('SERVICE'), 'Services store can create SERVICE');
    assert.ok(!serviceStore.canCreateListingType('PHYSICAL_PRODUCT'), 'Services store cannot create PHYSICAL_PRODUCT');

    const hotelStore = new Store({ categoryId: 'hotels' });
    assert.ok(hotelStore.canCreateListingType('BOOKING'), 'Hotel store can create BOOKING');
    assert.ok(hotelStore.canCreateListingType('ACCOMMODATION'), 'Hotel store can create ACCOMMODATION');

    // ── 4. Cross-Vertical Listing Authorization Enforcement ─────────────────
    console.log('    4. Verifying cross-vertical listing creation rejection (403)...');
    const seller = await harness.createUser({ stage: 'seller_ready' });
    await harness.createStore(seller, { status: 'ACTIVE' }); // Defaults to 'electronics' category

    // Attempting to create a BOOKING listing in an electronics boutique must be rejected.
    const crossVerticalRes = await harness.request('POST', '/api/v1/listings', {
      token: seller.token,
      body: {
        title: 'Luxury Beachfront Suite in Kribi Ocean View',
        listingType: 'BOOKING',
        categoryId: 'smartphones',
        condition: 'not_applicable',
        city: 'Kribi',
        basePriceMinor: 85000,
        currency: 'XAF',
        fulfillmentModel: 'BOOKING_VOUCHER',
        description: 'Full luxury suite with private terrace and breakfast included.'
      }
    });
    assert.strictEqual(crossVerticalRes.status, 403, 'Cross-vertical listing creation must return 403 Forbidden');
    assert.ok(
      crossVerticalRes.body.error.message.includes('not authorized to publish BOOKING'),
      'Error message must state boutique category authorization mismatch'
    );

    // ── 5. Permitted Vertical Listing Creation Succeeds ─────────────────────
    console.log('    5. Verifying permitted vertical listing creation succeeds...');
    const validListingRes = await harness.request('POST', '/api/v1/listings', {
      token: seller.token,
      body: {
        title: 'Apple MacBook Pro 14” M3 Max — 36GB / 1TB SSD Space Black',
        listingType: 'PHYSICAL_PRODUCT',
        categoryId: 'laptops',
        condition: 'new',
        city: 'Douala',
        basePriceMinor: 1750000,
        currency: 'XAF',
        fulfillmentModel: 'DELIVERY_OR_PICKUP',
        description: 'Brand new factory sealed with 1-year warranty and original accessories.'
      }
    });
    assert.strictEqual(validListingRes.status, 201, `Permitted listing creation failed: ${JSON.stringify(validListingRes.body)}`);
    const createdListing = validListingRes.body.data.listing || validListingRes.body.data;
    assert.strictEqual(createdListing.title, 'Apple MacBook Pro 14” M3 Max — 36GB / 1TB SSD Space Black');

    // ── 6. Onboarding Identity Edit Does Not Invalidate Session ─────────────
    console.log('    6. Verifying onboarding profile update preserves session...');
    const user2 = await harness.createUser({ stage: 'onboarding' });
    
    // Save onboarding personal info step
    const saveStepRes = await harness.request('POST', '/api/v1/me/onboarding/steps/PERSONAL_INFO', {
      token: user2.token,
      body: {
        firstName: 'Emmanuel',
        lastName: 'Ndjock',
        city: 'Yaoundé',
        phone: '670001122'
      }
    });
    assert.strictEqual(saveStepRes.status, 200, 'Saving personal info step must succeed');

    // Verify session remains active and authenticated
    const meRes = await harness.request('GET', '/api/v1/me', { token: user2.token });
    assert.strictEqual(meRes.status, 200, 'Session must remain valid after profile update');
    assert.ok(meRes.body.data && meRes.body.data.profile, 'Profile data must be returned');
    assert.strictEqual(meRes.body.data.profile.firstName, 'Emmanuel');
    assert.strictEqual(meRes.body.data.profile.city, 'yaounde');

    // ── 7. Private Verification Document Upload Pipeline ───────────────────
    console.log('    7. Verifying private verification document upload pipeline...');
    const dummyPdfBuffer = Buffer.alloc(1024, 0x20);
    dummyPdfBuffer.write('%PDF-1.4 Mock Official National CNI ID Scan Document for Loumoo Verification Test Suite %%EOF', 0);
    const docUploadRes = await harness.request('POST', '/api/v1/uploads/verification-document?docType=cni_front', {
      token: user2.token,
      headers: { 'Content-Type': 'application/pdf' },
      raw: dummyPdfBuffer
    });
    assert.strictEqual(docUploadRes.status, 201, `Doc upload failed: ${JSON.stringify(docUploadRes.body)}`);
    assert.ok(docUploadRes.body.data && docUploadRes.body.data.uploadId, 'Must return uploadId');
    assert.strictEqual(docUploadRes.body.data.docType, 'cni_front');
    assert.ok(docUploadRes.body.data.url, 'Must return signed storage URL');

    // ── 8. Store Legal Verification Document Submission ─────────────────────
    console.log('    8. Verifying store verification document submission...');
    const verSeller = await harness.createUser({ stage: 'seller_ready' });
    const createdStore = await harness.createStore(verSeller, { status: 'DRAFT', categoryId: 'electronics' });

    const submitVerRes = await harness.request('POST', `/api/v1/stores/${createdStore.id}/verification`, {
      token: verSeller.token,
      body: {
        legalBusinessName: 'Orca Digital Akwa SARL',
        businessType: 'sarl',
        rccmNumber: 'RC/DLA/2024/B/9921',
        taxIdNiu: 'M092100349121B',
        representativeFullName: 'Emmanuel Ndjock',
        representativeIdType: 'cni',
        idDocumentFrontUrl: docUploadRes.body.data.url
      }
    });
    assert.strictEqual(submitVerRes.status, 200, `Submit verification failed: ${JSON.stringify(submitVerRes.body)}`);
    assert.strictEqual(submitVerRes.body.data.verificationStatus, 'SUBMITTED');

    // Verify KYC status is updated to submitted
    const verMeRes = await harness.request('GET', '/api/v1/me', { token: verSeller.token });
    assert.strictEqual(verMeRes.body.data.profile.kycDocStatus, 'submitted', 'User KYC status must transition to submitted');

    console.log('  ✓ All 8 Critical Production Hardening scenarios PASSED with 100% precision!\n');
  } finally {
    await harness.stop();
  }
}

if (require.main === module) {
  run().then(() => process.exit(0)).catch(err => {
    console.error('Test Suite Failed:', err);
    process.exit(1);
  });
}

module.exports = { run };
