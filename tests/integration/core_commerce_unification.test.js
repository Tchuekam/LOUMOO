/**
 * LOUMOO — Core Commerce Unification Integration Test Suite
 * ---------------------------------------------------------------------------
 * Validates the canonical end-to-end commerce loop:
 *   Real Seller Listing -> PostgreSQL (iam.listings) -> Catalog API ->
 *   Buyer Discovery -> Product Detail Page (PDP)
 */

require('../setup');
const assert = require('assert');
const harness = require('../helpers/harness');
const CacheService = require('../../server/infrastructure/cache/CacheService');

async function run() {
  await harness.start();

  console.log('  Testing Canonical Core Commerce Loop (Seller Listing -> PostgreSQL -> Catalog -> PDP)...');

  try {
    await CacheService.flush();

    // 1. Provision a real SELLER_READY account with a real Store
    const seller = await harness.createUser({ stage: 'seller_ready' });
    const store = await harness.createStore(seller, { status: 'ACTIVE' });

    // 2. Upload valid product image
    const uploadRes = await harness.request('POST', '/api/v1/uploads/listing-media', {
      token: seller.token,
      raw: harness.makePng(800, 600),
      headers: { 'Content-Type': 'image/png' }
    });

    assert.strictEqual(uploadRes.status, 201, `Image upload failed: ${JSON.stringify(uploadRes.body)}`);
    const uploadId = uploadRes.body.data.uploadId;
    assert.ok(uploadId, 'Upload session ID must be returned');

    // 3. Create real listing in PostgreSQL via POST /api/v1/listings
    const createListingRes = await harness.request('POST', '/api/v1/listings', {
      token: seller.token,
      body: {
        title: 'Apple iPhone 15 Pro Max (Natural Titanium) — 256GB / 8GB RAM',
        categoryId: 'smartphones',
        brand: 'Apple',
        model: 'iPhone 15 Pro Max',
        condition: 'new',
        city: 'Douala',
        basePriceMinor: 890000,
        currency: 'XAF',
        fulfillmentModel: 'DELIVERY_OR_PICKUP',
        description: 'Brand new in sealed retail packaging with 1-year warranty. 256GB Storage, Natural Titanium finish.',
        uploadIds: [uploadId],
        attributes: {
          brand: 'Apple',
          model: 'iPhone 15 Pro Max',
          color: 'Titanium Natural',
          storage: '256GB',
          ram: '8GB'
        }
      }
    });

    assert.strictEqual(createListingRes.status, 201, `Listing creation failed: ${JSON.stringify(createListingRes.body)}`);
    const listingId = createListingRes.body.data.id;
    assert.ok(listingId, 'Listing ID must be returned');
    assert.strictEqual(createListingRes.body.data.status, 'DRAFT', 'Newly created listing must be DRAFT');

    // 4. Verify DRAFT listing is NOT visible to public buyers on /api/v1/products
    await CacheService.flush();
    const draftDiscovery = await harness.request('GET', '/api/v1/products');
    assert.strictEqual(draftDiscovery.status, 200);
    const draftItems = (draftDiscovery.body.data && draftDiscovery.body.data.items) || [];
    const foundDraft = draftItems.find(p => p.id === listingId);
    assert.strictEqual(foundDraft, undefined, 'DRAFT listings must never appear in public catalog discovery');

    // 5. Verify DRAFT listing returns 404 for anonymous shopper on /api/v1/products/:id
    const draftDetail = await harness.request('GET', `/api/v1/products/${listingId}`);
    assert.strictEqual(draftDetail.status, 404, 'DRAFT listing must return 404 for public shopper');

    // 6. Publish the listing via POST /api/v1/listings/:id/publish
    const publishRes = await harness.request('POST', `/api/v1/listings/${listingId}/publish`, {
      token: seller.token
    });
    assert.strictEqual(publishRes.status, 200, `Publishing failed: ${JSON.stringify(publishRes.body)}`);
    assert.strictEqual(publishRes.body.data.status, 'PUBLISHED', 'Listing status must be PUBLISHED');

    // 7. Verify listing appears in real /api/v1/products discovery
    await CacheService.flush();
    const catalogRes = await harness.request('GET', '/api/v1/products');
    assert.strictEqual(catalogRes.status, 200, 'Catalog query must return 200');
    const items = (catalogRes.body.data && catalogRes.body.data.items) || [];
    const publicProduct = items.find(p => p.id === listingId);
    assert.ok(publicProduct, 'Published listing must appear in /api/v1/products discovery items');
    assert.strictEqual(publicProduct.title, 'Apple iPhone 15 Pro Max (Natural Titanium) — 256GB / 8GB RAM');
    assert.strictEqual(publicProduct.brand, 'Apple');
    assert.strictEqual(publicProduct.priceNumeric, 890000);
    assert.ok(publicProduct.merchant, 'Merchant name must be populated');
    assert.ok(publicProduct.image, 'Cover image URL must be populated');

    // 8. Verify listing can be queried by search term
    const searchRes = await harness.request('GET', '/api/v1/products?search=Titanium');
    assert.strictEqual(searchRes.status, 200);
    const searchItems = (searchRes.body.data && searchRes.body.data.items) || [];
    assert.ok(searchItems.some(p => p.id === listingId), 'Search for "Titanium" must find the published listing');

    // 9. Verify single product detail on /api/v1/products/:id (PDP endpoint)
    const pdpRes = await harness.request('GET', `/api/v1/products/${listingId}`);
    assert.strictEqual(pdpRes.status, 200, 'PDP endpoint must return 200 for published listing');
    const pdpData = pdpRes.body.data;
    assert.strictEqual(pdpData.id, listingId);
    assert.strictEqual(pdpData.title, 'Apple iPhone 15 Pro Max (Natural Titanium) — 256GB / 8GB RAM');
    assert.strictEqual(pdpData.priceNumeric, 890000);
    assert.strictEqual(pdpData.description, 'Brand new in sealed retail packaging with 1-year warranty. 256GB Storage, Natural Titanium finish.');
    assert.ok(pdpData.media && pdpData.media.length > 0, 'Media gallery must have at least 1 image');
    assert.ok(pdpData.store, 'Store object must be attached to PDP');
    assert.strictEqual(pdpData.attributes.color, 'Titanium Natural');

    // 10. Pause the listing and verify it disappears from public catalog
    const pauseRes = await harness.request('POST', `/api/v1/listings/${listingId}/pause`, {
      token: seller.token
    });
    assert.strictEqual(pauseRes.status, 200);
    assert.strictEqual(pauseRes.body.data.status, 'PAUSED');

    await CacheService.flush();
    const pausedDiscovery = await harness.request('GET', '/api/v1/products');
    const pausedItems = (pausedDiscovery.body.data && pausedDiscovery.body.data.items) || [];
    assert.strictEqual(pausedItems.find(p => p.id === listingId), undefined, 'Paused listing must not be in discovery');

    const pausedDetail = await harness.request('GET', `/api/v1/products/${listingId}`);
    assert.strictEqual(pausedDetail.status, 404, 'Paused listing must return 404 for public shopper');

    // 11. Security Check: An attacker cannot publish or modify another seller's listing
    const attacker = await harness.createUser({ stage: 'seller_ready' });
    const hackRes = await harness.request('POST', `/api/v1/listings/${listingId}/publish`, {
      token: attacker.token
    });
    assert.ok([403, 404].includes(hackRes.status), 'Unauthorized seller must be rejected with 403 or 404 anti-enumeration');

    console.log('    ✓ Canonical Core Commerce Loop passed all assertions.');
  } finally {
    await harness.cleanup();
  }
}

if (require.main === module) {
  run().catch(err => {
    console.error('Test Failed:', err);
    process.exit(1);
  });
}

module.exports = { run };
