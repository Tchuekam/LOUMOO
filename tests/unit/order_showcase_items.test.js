/**
 * LOUMOO Unit Tests - A showcase product is refused, never filed under a fake seller
 * ---------------------------------------------------------------------------
 * The storefront mixes real listings (iam.listings) with curated showcase products
 * (src/data) that have no seller account. Until 2026-10-07 the order repository
 * resolved a bag line it could not find in iam.listings through the curated
 * catalogue and returned it with sellerId 'usr_seller_default'. The insert then
 * failed on orders_seller_id_fkey, the API answered 500, and every such checkout
 * read "LOUMOO is temporarily unavailable". No production order succeeded after
 * 2026-09-16.
 *
 * These checks drive the REAL OrderRepository lookup over a fake database (the
 * in-memory repositories in delivery_contact never reach the catalogue fallback,
 * which is how the bug passed CI):
 *
 *   1. A curated product that the catalogue DOES resolve is still not orderable:
 *      the repository answers null, never an invented seller.
 *   2. A real listing still resolves, with its own seller.
 *   3. A bag holding showcase products is refused with ONE 404 naming each of
 *      them, nothing is saved and nobody is told about an order that does not exist.
 */

require('../setup');
const assert = require('assert');

const { OrderRepository } = require('../../server/modules/commerce/infrastructure/OrderRepository');
const { OrderCreationService } = require('../../server/modules/commerce/application/OrderCreationService');
const CatalogRepository = require('../../server/modules/catalog/infrastructure/CatalogRepository');
const NotificationService = require('../../server/modules/identity/application/NotificationService');

// Two curated storefront products (src/data) of different "stores", as in the bag
// that failed in production, and one real listing.
const CURATED_A = 'phone_google_google_pixel_10_pro_fold_512gb_j';
const CURATED_B = 'phone_tecno_tecno_spark_20_pro_256gb_8gb_ram_';
const REAL_ID = 'lst_real_1';
const REAL_ROW = {
  id: REAL_ID,
  store_id: 'store_real_1',
  seller_id: 'seller_real_1',
  title: 'Galaxy S24 Ultra',
  slug: 'galaxy-s24-ultra',
  status: 'PUBLISHED',
  visibility: 'PUBLIC',
  currency: 'XAF',
  base_price_minor: 890000,
  sale_price_minor: null,
  has_variants: false,
  fulfillment_model: null,
  metadata: {},
  deleted_at: null,
  stores: { id: 'store_real_1', name: 'Amina Electronics', status: 'ACTIVE', owner_id: 'seller_real_1', phone_number: '+237690112233', metadata: {} }
};

/**
 * Just enough of the Supabase query builder for findListingById and
 * checkInventory: iam.listings holds REAL_ROW only, and any write throws so a
 * test fails loudly if an order would have been saved.
 */
function fakeDb(rows) {
  const writes = [];
  const db = {
    writes,
    from(table) {
      const filters = {};
      const q = {
        select() { return q; },
        eq(col, val) { filters[col] = val; return q; },
        is() { return q; },
        in() { return q; },
        order() { return q; },
        limit() { return q; },
        insert(payload) { writes.push({ table, payload }); throw new Error(`unexpected write to ${table}`); },
        update(payload) { writes.push({ table, payload }); throw new Error(`unexpected write to ${table}`); },
        async maybeSingle() {
          if (table !== 'listings') return { data: null, error: null };
          return { data: rows.find((r) => r.id === filters.id) || null, error: null };
        },
        async single() { return q.maybeSingle(); },
        then(resolve) { return Promise.resolve({ data: [], error: null }).then(resolve); }
      };
      return q;
    }
  };
  return db;
}

function recordNotifications() {
  const original = NotificationService.create;
  const sent = [];
  NotificationService.create = async (userId, n) => { sent.push({ userId, ...n }); return null; };
  return { sent, restore() { NotificationService.create = original; } };
}

async function testCuratedProductIsNotAListing() {
  // The premise: the catalogue really does resolve these ids, so the old
  // fallback WOULD have engaged and invented a seller for them.
  const curated = await CatalogRepository.findPublicProductByIdOrSlug(CURATED_A);
  assert.ok(curated && curated.title, 'the curated catalogue resolves the showcase product');
  assert.ok(!curated.sellerId, 'and it has no seller account');

  const repo = new OrderRepository({ db: fakeDb([REAL_ROW]) });
  assert.strictEqual(await repo.findListingById(CURATED_A), null, 'a showcase product is not an orderable listing');
  assert.strictEqual(await repo.findListingById(CURATED_B), null);
}

async function testRealListingStillResolves() {
  const repo = new OrderRepository({ db: fakeDb([REAL_ROW]) });
  const listing = await repo.findListingById(REAL_ID);
  assert.ok(listing, 'a real listing resolves');
  assert.strictEqual(listing.sellerId, 'seller_real_1', 'under its own seller');
  assert.strictEqual(listing.storeName, 'Amina Electronics');
  assert.strictEqual(listing.status, 'PUBLISHED');
}

async function testBagWithShowcaseItemsIsRefusedOnce() {
  const rec = recordNotifications();
  try {
    const db = fakeDb([REAL_ROW]);
    const service = new OrderCreationService(new OrderRepository({ db }), {
      resolveProvider: async () => null
    });
    let error = null;
    try {
      await service.createOrder('buyer_1', {
        items: [
          { id: CURATED_A, listingId: CURATED_A, quantity: 1, unitPriceXaf: 1035000 },
          { id: CURATED_B, listingId: CURATED_B, quantity: 1, unitPriceXaf: 121500 }
        ],
        shippingAddress: { fullName: 'Awa Njoya', phone: '+237622222222', street: 'Rue 1', city: 'Douala' },
        deliveryMethod: 'HOME_DELIVERY'
      });
    } catch (e) { error = e; }

    assert.ok(error, 'the bag is refused');
    assert.strictEqual(error.statusCode, 404, 'as not found, which the checkout explains as a showcase item');
    assert.strictEqual(error.code, 'NOT_FOUND');
    assert.ok(error.message.includes(CURATED_A) && error.message.includes(CURATED_B),
      'one refusal names every showcase item, so the buyer removes them all at once');
    assert.ok(!/usr_seller_default|str_default/.test(JSON.stringify(error)), 'no invented seller or store anywhere');
    assert.strictEqual(db.writes.length, 0, 'nothing was written');
    assert.strictEqual(rec.sent.length, 0, 'nobody was told about an order that does not exist');
  } finally {
    rec.restore();
  }
}

async function run() {
  await testCuratedProductIsNotAListing();
  await testRealListingStillResolves();
  await testBagWithShowcaseItemsIsRefusedOnce();
  console.log('order_showcase_items: 3 checks passed');
}

if (require.main === module) {
  run().then(() => process.exit(0), (e) => { console.error(e); process.exit(1); });
}

module.exports = { run };
