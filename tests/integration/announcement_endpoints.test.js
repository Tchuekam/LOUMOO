/**
 * LOUMOO Integration Tests — Commercial Distribution & Announcement Endpoints
 */

require('../setup');
const assert = require('assert');
const harness = require('../helpers/harness');

async function run() {
  console.log('  Testing Announcement creation, scheduling, publishing & analytics endpoints...');

  await harness.start();

  // 1. Create Merchant (seller_ready) and Buyer (ready)
  const merchant = await harness.createUser({ stage: 'seller_ready' });
  const buyer = await harness.createUser({ stage: 'ready' });

  // 2. Merchant creates a store
  const storeRes = await harness.request('POST', '/api/v1/stores', {
    token: merchant.token,
    body: {
      name: 'Kamer Tech Solutions',
      sellerType: 'SHOP',
      description: 'Premium laptops and accessories in Douala.',
      categoryId: 'electronics'
    }
  });
  assert.strictEqual(storeRes.status, 201);
  const store = storeRes.body.data;

  // 3. Find a category or create one, then create a listing
  const { data: categories } = await harness.db().from('listing_categories').select('id').limit(1);
  const categoryId = categories && categories.length > 0 ? categories[0].id : 'smartphones';

  const { data: listing, error: listErr } = await harness.db().from('listings').insert({
    store_id: store.id,
    seller_id: merchant.id,
    title: 'MacBook Air M3 Space Gray 16GB',
    slug: 'macbook-air-m3-' + Date.now().toString(36),
    description: 'Brand new in sealed box with 1-year Apple care.',
    base_price_minor: 850000,
    currency: 'XAF',
    category_id: categoryId,
    status: 'PUBLISHED'
  }).select('*').single();

  assert.ok(listing, `Listing creation failed in test setup: ${JSON.stringify(listErr)}`);

  // 4. Create Draft Announcement with Attached Product
  const draftRes = await harness.request('POST', '/api/v1/announcements', {
    token: merchant.token,
    body: {
      storeId: store.id,
      title: 'Flash Sale: MacBook Air M3 In Stock Now!',
      type: 'PROMOTION',
      body: 'Get XAF 50,000 off this weekend only at our Akwa showroom or order online with free express delivery in Douala.',
      highlights: ['Free Delivery', '1 Year Apple Warranty', 'Sealed Box'],
      attachmentType: 'PRODUCT',
      attachmentId: listing.id,
      attachmentPayload: {
        originalPrice: 900000,
        promoPrice: 850000,
        couponCode: 'M3DOUALA'
      },
      ctaType: 'BUY_NOW',
      ctaLabel: 'Order Online Now',
      ctaUrl: `/p/${listing.id}`,
      audienceScope: 'EVERYONE',
      targetCities: ['Douala', 'Yaoundé']
    }
  });

  assert.strictEqual(draftRes.status, 201);
  const draft = draftRes.body.data.announcement;
  assert.ok(draft.id);
  assert.strictEqual(draft.status, 'DRAFT');
  assert.strictEqual(draft.type, 'PROMOTION');
  assert.strictEqual(draft.attachmentType, 'PRODUCT');
  assert.strictEqual(draft.attachmentId, listing.id);

  // 5. Update Draft
  const patchRes = await harness.request('PATCH', `/api/v1/announcements/${draft.id}`, {
    token: merchant.token,
    body: {
      title: 'Exclusive Flash Sale: MacBook Air M3 In Stock!',
      highlights: ['Free Delivery', '1 Year Apple Warranty', 'Special Discount']
    }
  });
  assert.strictEqual(patchRes.status, 200);
  assert.strictEqual(patchRes.body.data.announcement.title, 'Exclusive Flash Sale: MacBook Air M3 In Stock!');

  // 6. Non-owner (Buyer) cannot publish or edit merchant announcement (403/404)
  const roguePatch = await harness.request('PATCH', `/api/v1/announcements/${draft.id}`, {
    token: buyer.token,
    body: { title: 'Hacked Title' }
  });
  assert.ok([401, 403, 404].includes(roguePatch.status));

  // 7. Publish Announcement immediately
  const pubRes = await harness.request('POST', `/api/v1/announcements/${draft.id}/publish`, {
    token: merchant.token
  });
  assert.strictEqual(pubRes.status, 200);
  assert.strictEqual(pubRes.body.data.announcement.status, 'PUBLISHED');
  assert.ok(pubRes.body.data.announcement.publishedAt);

  // 8. Public Feed retrieval (Commercial Feed Screen data boundary)
  const feedRes = await harness.request('GET', '/api/v1/announcements?type=PROMOTION');
  assert.strictEqual(feedRes.status, 200);
  assert(feedRes.body.data.announcements.some(a => a.id === draft.id));

  // 9. Single announcement detail retrieval by slug or ID (Detail screen)
  const detailRes = await harness.request('GET', `/api/v1/announcements/${draft.slug}`);
  assert.strictEqual(detailRes.status, 200);
  assert.strictEqual(detailRes.body.data.announcement.id, draft.id);
  assert.ok(detailRes.body.data.announcement.store);
  assert.strictEqual(detailRes.body.data.announcement.store.name, 'Kamer Tech Solutions');

  // 10. Record View & CTA Click Events
  const viewEventRes = await harness.request('POST', `/api/v1/announcements/${draft.id}/events`, {
    token: buyer.token,
    body: { eventType: 'VIEW' }
  });
  assert.strictEqual(viewEventRes.status, 200);

  const clickEventRes = await harness.request('POST', `/api/v1/announcements/${draft.id}/events`, {
    token: buyer.token,
    body: { eventType: 'CTA_CLICK' }
  });
  assert.strictEqual(clickEventRes.status, 200);

  // 11. Performance Analytics retrieval for single campaign
  const analyticsRes = await harness.request('GET', `/api/v1/announcements/${draft.id}/analytics`, {
    token: merchant.token
  });
  assert.strictEqual(analyticsRes.status, 200);
  assert.strictEqual(analyticsRes.body.data.announcementId, draft.id);
  assert.ok(analyticsRes.body.data.metrics);
  assert(analyticsRes.body.data.metrics.views >= 1);
  assert(analyticsRes.body.data.metrics.ctaClicks >= 1);

  // 12. Buyer cannot view analytics for merchant announcement
  const buyerAnalyticsRes = await harness.request('GET', `/api/v1/announcements/${draft.id}/analytics`, {
    token: buyer.token
  });
  assert.ok([401, 403].includes(buyerAnalyticsRes.status));

  // 13. Campaigns Overview for Store (Dedicated Campaigns & Analytics Screen boundary)
  const overviewRes = await harness.request('GET', `/api/v1/announcements/seller/${store.id}/campaigns-overview`, {
    token: merchant.token
  });
  assert.strictEqual(overviewRes.status, 200);
  assert.strictEqual(overviewRes.body.data.storeId, store.id);
  assert.ok(overviewRes.body.data.summary);
  assert(overviewRes.body.data.summary.totalCampaigns >= 1);
  assert(overviewRes.body.data.summary.totalViews >= 1);
  assert(overviewRes.body.data.summary.totalCtaClicks >= 1);
  assert.ok(Array.isArray(overviewRes.body.data.campaigns));

  // 14. Buyer cannot access Store Campaigns Overview (403 Forbidden)
  const buyerOverviewRes = await harness.request('GET', `/api/v1/announcements/seller/${store.id}/campaigns-overview`, {
    token: buyer.token
  });
  assert.strictEqual(buyerOverviewRes.status, 403);

  // 15. Seller Management List (Publishing Studio data boundary)
  const sellerListRes = await harness.request('GET', `/api/v1/announcements/seller/${store.id}?status=ALL`, {
    token: merchant.token
  });
  assert.strictEqual(sellerListRes.status, 200);
  assert(sellerListRes.body.data.announcements.length >= 1);

  // 16. Archive Announcement
  const archiveRes = await harness.request('POST', `/api/v1/announcements/${draft.id}/archive`, {
    token: merchant.token
  });
  assert.strictEqual(archiveRes.status, 200);
  assert.strictEqual(archiveRes.body.data.announcement.status, 'ARCHIVED');

  console.log('    ✓ All Announcement endpoints, permission guards & analytics passed.');
}

if (require.main === module) {
  run().then(() => harness.stop()).catch(err => {
    console.error('FAILED:', err);
    harness.stop().then(() => process.exit(1));
  });
}

module.exports = { run };
