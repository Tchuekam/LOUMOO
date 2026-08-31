/**
 * Store & Business System Unit Tests (Phase E / Prompt 05)
 * Validates: Use Cases, Domain Entities, Routes, API Client Integration
 */

require('../setup');
const assert = require('assert');

const PATH_PREFIX = '../../server/modules/store';

function testStoreEntity() {
  const Store = require('../../server/modules/store/domain/Store');
  const s = new Store({
    id: 'store_test_1',
    name: 'Test Electronics Douala',
    owner_id: 'user_123',
    category_id: 'electronics',
    city: 'Douala',
    status: 'ACTIVE',
    visibility: 'PUBLIC',
    is_verified: true,
    rating: 4.8,
    follower_count: 120,
    product_count: 45
  });

  assert.strictEqual(s.id, 'store_test_1');
  assert.strictEqual(s.name, 'Test Electronics Douala');
  assert.strictEqual(s.ownerId, 'user_123');
  assert.strictEqual(s.isActive, true);
  assert.strictEqual(s.isPubliclyDiscoverable, true);
  assert.ok(s.slug, 'Slug should be generated');
  assert.ok(s.slug.includes('test-electronics'), 'Slug should be kebab-case');

  const pub = s.toPublicJSON();
  assert.ok(pub.name, 'Public JSON should have name');
  assert.ok(!pub.ownerId, 'Public JSON should NOT expose ownerId');
  assert.ok(pub.slug, 'Public JSON should have slug');

  const owner = s.toOwnerJSON();
  assert.ok(owner.ownerId, 'Owner JSON should expose ownerId');

  console.log('  ✓ Store entity: creation, slug, public/owner projections');
}

function testStoreProfileEntity() {
  const StoreProfile = require('../../server/modules/store/domain/StoreProfile');
  const p = new StoreProfile({
    store_id: 'store_test_1',
    tagline: 'Best electronics in Cameroon',
    bio: 'Founded in 2020',
    return_policy: '14-day returns accepted',
    warranty_policy: '12-month warranty',
    social_links: { whatsapp: '+237690123456' }
  });

  assert.strictEqual(p.storeId, 'store_test_1');
  assert.strictEqual(p.tagline, 'Best electronics in Cameroon');
  assert.ok(p.toJSON().returnPolicy, 'Should have return policy');
  console.log('  ✓ StoreProfile entity: tagline, policies, social links');
}

function testStoreHoursEntity() {
  const StoreHours = require('../../server/modules/store/domain/StoreHours');
  const h = new StoreHours({
    store_id: 'store_test_1',
    timezone: 'Africa/Douala',
    is_always_open: false,
    is_temporarily_closed: false,
    schedule: {
      monday: { open: '08:00', close: '18:30' },
      tuesday: { open: '08:00', close: '18:30' }
    }
  });

  assert.strictEqual(h.timezone, 'Africa/Douala');
  assert.strictEqual(h.isAlwaysOpen, false);
  const json = h.toJSON();
  assert.ok(json.schedule, 'Should have schedule');
  assert.ok(json.currentStatus, 'Should compute current status');
  console.log('  ✓ StoreHours entity: schedule, timezone, status computation');
}

function testStoreLocationEntity() {
  const StoreLocation = require('../../server/modules/store/domain/StoreLocation');
  const loc = new StoreLocation({
    store_id: 'store_test_1',
    country: 'Cameroon',
    region: 'Littoral',
    city: 'Douala',
    district_quarter: 'Akwa',
    street_address: 'Boulevard de la Liberté',
    landmark: 'Near Total roundabout',
    is_public: true,
    latitude: 4.0511,
    longitude: 9.7679
  });

  const pub = loc.toPublicJSON();
  assert.strictEqual(pub.city, 'Douala');
  assert.ok(pub.formattedAddress, 'Should have formatted address');

  const own = loc.toOwnerJSON();
  assert.ok(own.streetAddress, 'Owner view includes street');
  assert.ok(own.latitude, 'Owner view includes coordinates');
  console.log('  ✓ StoreLocation entity: public/owner separation, formatting');
}

function testStoreSettingsEntity() {
  const StoreSettings = require('../../server/modules/store/domain/StoreSettings');
  const settings = new StoreSettings({
    store_id: 'store_test_1',
    currency: 'XAF',
    accepts_escrow: true,
    accepts_momo: true,
    allow_store_pickup: true
  });

  const json = settings.toJSON();
  assert.strictEqual(json.currency, 'XAF');
  assert.strictEqual(json.acceptsEscrow, true);
  assert.strictEqual(json.acceptsMomo, true);
  console.log('  ✓ StoreSettings entity: currency, escrow, payment methods');
}

function testStoreVerificationEntity() {
  const StoreVerification = require('../../server/modules/store/domain/StoreVerification');
  const v = new StoreVerification({
    store_id: 'store_test_1',
    legal_business_name: 'Orca Electronics SARL',
    business_type: 'sarl',
    rccm_number: 'RC/DLA/2023/B/1842',
    tax_id_niu: 'M052112345678A',
    verification_status: 'SUBMITTED',
    id_document_front_url: 'private://docs/cni_front.jpg'
  });

  const json = v.toJSON();
  assert.strictEqual(json.legalBusinessName, 'Orca Electronics SARL');
  assert.strictEqual(json.verificationStatus, 'SUBMITTED');
  assert.ok(json.rccmNumber, 'Should preserve RCCM');
  console.log('  ✓ StoreVerification entity: legal fields, status tracking');
}

// ── Use Case Tests ──

function testStoreCategoryUseCase() {
  const StoreCategoryUseCase = require('../../server/modules/store/application/StoreCategoryUseCase');

  return StoreCategoryUseCase.listCategories().then(categories => {
    assert.ok(Array.isArray(categories), 'Categories should be array');
    assert.ok(categories.length >= 5, 'At least 5 categories');
    const elec = categories.find(c => c.id === 'electronics');
    assert.ok(elec, 'Should have electronics category');
    assert.ok(elec.subcategories.length > 0, 'Electronics should have subcategories');
    console.log('  ✓ StoreCategoryUseCase: list all categories');
    return StoreCategoryUseCase.getCategoryById('fashion');
  }).then(fashion => {
    assert.ok(fashion, 'Should find fashion by ID');
    assert.strictEqual(fashion.slug, 'fashion');
    console.log('  ✓ StoreCategoryUseCase: get category by ID');
  });
}

async function testStoreDiscoveryUseCase() {
  const StoreDiscoveryUseCase = require('../../server/modules/store/application/StoreDiscoveryUseCase');
  const harness = require('../helpers/harness');

  // Discovery returns real, active, public stores only — it no longer merges a
  // curated list of fictional boutiques, which used to lead shoppers to store
  // pages that did not exist. So the test provisions a real one.
  const owner = await harness.createUser({ stage: 'seller_ready', suffix: 'disc' });
  const store = await harness.createStore(owner);
  await harness.db().from('store_locations').insert({
    store_id: store.id, city: 'Kribi', region: 'Sud', street_address: 'Route des Chutes'
  });
  await harness.db().from('stores').update({ is_verified: true }).eq('id', store.id);

  const all = await StoreDiscoveryUseCase.discoverStores({});
  assert.ok(Array.isArray(all.stores), 'Should return a stores array');
  assert.ok(all.total > 0, 'A provisioned active store must be discoverable');
  assert.strictEqual(typeof all.page, 'number');
  assert.strictEqual(typeof all.hasMore, 'boolean');
  console.log('  ✓ StoreDiscoveryUseCase: unfiltered discovery');

  const electronics = await StoreDiscoveryUseCase.discoverStores({ category: 'electronics' });
  assert.ok(electronics.stores.length > 0, 'Electronics filter should return stores');
  electronics.stores.forEach(s => {
    assert.strictEqual(s.category_id, 'electronics', 'All results should be electronics');
  });
  console.log('  ✓ StoreDiscoveryUseCase: category filter');

  const kribi = await StoreDiscoveryUseCase.discoverStores({ city: 'Kribi' });
  assert.ok(kribi.stores.length > 0, 'The Kribi store must be found by its real location');
  kribi.stores.forEach(s => {
    assert.strictEqual((s.city || '').toLowerCase(), 'kribi', 'All should be Kribi');
  });
  console.log('  ✓ StoreDiscoveryUseCase: city filter');

  const verified = await StoreDiscoveryUseCase.discoverStores({ verifiedOnly: true });
  verified.stores.forEach(s => {
    assert.ok(s.is_verified || s.isVerified, 'All should be verified');
  });
  console.log('  ✓ StoreDiscoveryUseCase: verified-only filter');

  // A store that does not exist is absent from discovery, not invented.
  const ghost = await StoreDiscoveryUseCase.discoverStores({ query: 'orca electronics douala' });
  assert.strictEqual(
    ghost.stores.filter(s => s.slug === 'orca-electronics-douala').length, 0,
    'Discovery must not surface a storefront that was never created'
  );
}

function testStoreAnalyticsUseCase() {
  const StoreAnalyticsUseCase = require('../../server/modules/store/application/StoreAnalyticsUseCase');
  const store = { id: 'store_test_1', name: 'Test Store', owner_id: 'usr_test_owner' };

  return StoreAnalyticsUseCase.getAnalytics(store, 'today').then(a => {
    assert.strictEqual(a.period, 'today');
    // REAL analytics: no fabricated metrics. Revenue/orders reflect the actual
    // database (zero for a store with no orders is the honest answer).
    assert.strictEqual(a.dataSource, 'live', 'Analytics must be sourced from the live DB');
    assert.ok(Number.isFinite(a.summary.totalRevenueXaf), 'Revenue must be a number (0 is valid)');
    assert.ok(Array.isArray(a.topSellingProducts), 'Top products must be an array (empty is valid)');
    assert.strictEqual(typeof a.summary.totalStoreViews, 'number');
    assert.strictEqual(a.trackedMetricsAvailable, false, 'Visitor-level metrics must not be faked');
    console.log('  ✓ StoreAnalyticsUseCase: today period (live data contract)');
    return StoreAnalyticsUseCase.getAnalytics(store, '30d');
  }).then(a => {
    assert.strictEqual(a.period, '30d');
    assert.strictEqual(a.dataSource, 'live');
    assert.ok(Number.isFinite(a.summary.totalRevenueXaf), '30d revenue must be a number (0 is valid)');
    assert.ok(Array.isArray(a.topSellingProducts), '30d top products array');
    assert.ok(a.window && a.window.from && a.window.to, 'Has explicit reporting window');
    assert.strictEqual('conversionRate' in a.summary, false, 'No fabricated conversion rate');
    console.log('  ✓ StoreAnalyticsUseCase: 30d period with live window');
  });
}

// ── Frontend API Client Tests ──

function testApiClientStoreMethods() {
  const api = require('../../src/services/loumooApi');
  assert.ok(api, 'LoumooAPI should be available');

  const requiredMethods = [
    'createStore', 'getStore', 'updateStore',
    'getStoreProfile', 'updateStoreProfile',
    'getStoreOnboarding', 'updateStoreOnboarding',
    'getStoreVerification', 'submitStoreVerification',
    'getStoreAnalytics',
    'getStoreSettings', 'updateStoreSettings',
    'getStoreHours', 'updateStoreHours',
    'getStoreLocation', 'updateStoreLocation',
    'discoverStores', 'getStoreCategories',
    'followStoreById', 'unfollowStoreById', 'getStoreFollowStatus'
  ];

  requiredMethods.forEach(method => {
    assert.ok(typeof api[method] === 'function', `API client should have ${method}()`);
  });

  console.log(`  ✓ LoumooApiClient: all ${requiredMethods.length} store methods present`);
}

// ── HTML Screen Presence Tests ──

function testScreensInHtml() {
  const fs = require('fs');
  const html = fs.readFileSync('Commerce App.dc.html', 'utf8');

  const requiredScreens = [
    'createStore', 'storeOnboarding', 'storeSettings',
    'storeVerification', 'storeAnalytics'
  ];

  requiredScreens.forEach(screen => {
    const pattern = `is.${screen}`;
    assert.ok(html.includes(pattern), `HTML should contain screen "${screen}"`);
  });

  const opens = (html.match(/<sc-if/g) || []).length;
  const closes = (html.match(/<\/sc-if>/g) || []).length;
  assert.strictEqual(opens, closes, `sc-if tags must be balanced: ${opens} open vs ${closes} close`);

  console.log(`  ✓ Commerce App.dc.html: ${requiredScreens.length} Phase E screens present, ${opens} sc-if balanced`);
}

// ── Test Runner ──

async function run() {
  console.log('\n═══════════════════════════════════════════════════');
  console.log('  STORE & BUSINESS SYSTEM TESTS (Phase E / P05)');
  console.log('═══════════════════════════════════════════════════\n');

  let passed = 0;
  let failed = 0;

  const tests = [
    ['Store Entity', testStoreEntity],
    ['StoreProfile Entity', testStoreProfileEntity],
    ['StoreHours Entity', testStoreHoursEntity],
    ['StoreLocation Entity', testStoreLocationEntity],
    ['StoreSettings Entity', testStoreSettingsEntity],
    ['StoreVerification Entity', testStoreVerificationEntity],
    ['StoreCategoryUseCase', testStoreCategoryUseCase],
    ['StoreDiscoveryUseCase', testStoreDiscoveryUseCase],
    ['StoreAnalyticsUseCase', testStoreAnalyticsUseCase],
    ['API Client Store Methods', testApiClientStoreMethods],
    ['HTML Screen Presence', testScreensInHtml]
  ];

  for (const [name, fn] of tests) {
    try {
      await fn();
      passed++;
    } catch (err) {
      failed++;
      console.error(`  ✗ ${name}: ${err.message}`);
    }
  }

  console.log(`\n───────────────────────────────────────────────────`);
  console.log(`  RESULTS: ${passed} passed, ${failed} failed, ${tests.length} total`);
  console.log(`───────────────────────────────────────────────────\n`);

  if (failed > 0) process.exit(1);
}

module.exports = { run };
if (require.main === module) run();
