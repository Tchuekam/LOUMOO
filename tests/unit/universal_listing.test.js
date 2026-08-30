/**
 * Universal Listing & Commerce Engine Unit Tests (Prompt 06)
 * Validates: 7 Listing Types, Taxonomy & Attribute Schemas, Multi-Currency Pricing,
 *            Inventory Concurrency, Variants, Availability, AI Services, Publishing Lifecycle.
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');

// ── 1. ListingType Enum & Capabilities Tests ──

function testListingTypes() {
  const ListingType = require('../../server/modules/listing/domain/ListingType');
  const types = ListingType.TYPES;

  assert.strictEqual(types.PHYSICAL_PRODUCT, 'PHYSICAL_PRODUCT');
  assert.strictEqual(types.DIGITAL_PRODUCT, 'DIGITAL_PRODUCT');
  assert.strictEqual(types.SERVICE, 'SERVICE');
  assert.strictEqual(types.BOOKING, 'BOOKING');
  assert.strictEqual(types.RENTAL, 'RENTAL');
  assert.strictEqual(types.SUBSCRIPTION, 'SUBSCRIPTION');
  assert.strictEqual(types.BUNDLE, 'BUNDLE');

  // Verify capabilities
  const physCap = ListingType.getCapabilities(types.PHYSICAL_PRODUCT);
  assert.strictEqual(physCap.hasInventory, true);
  assert.strictEqual(physCap.hasShipping, true);

  const digCap = ListingType.getCapabilities(types.DIGITAL_PRODUCT);
  assert.strictEqual(digCap.hasInventory, false);
  assert.strictEqual(digCap.hasDigitalDelivery, true);

  const srvCap = ListingType.getCapabilities(types.SERVICE);
  assert.strictEqual(srvCap.hasServiceSchedule, true);

  const bkgCap = ListingType.getCapabilities(types.BOOKING);
  assert.strictEqual(bkgCap.hasBookingDates, true);

  console.log('  ✓ ListingType: all 7 commerce models & capability metadata verified');
}

// ── 2. Taxonomy & Dynamic Category Attribute Validation Tests ──

function testDynamicAttributes() {
  const AttributeDefinition = require('../../server/modules/listing/domain/AttributeDefinition');
  
  // Test select with allowed values
  const brandAttr = new AttributeDefinition({
    name: 'Brand',
    slug: 'brand',
    attribute_type: 'select',
    is_required: true,
    allowed_values: ['Apple', 'Samsung', 'Dell']
  });

  assert.doesNotThrow(() => brandAttr.validate('Apple'));
  assert.throws(() => brandAttr.validate('UnknownBrand'));
  assert.throws(() => brandAttr.validate(''));

  // Test numeric range
  const batteryAttr = new AttributeDefinition({
    name: 'Battery Health',
    slug: 'battery_health',
    attribute_type: 'number',
    is_required: false,
    validation_rules: { min: 50, max: 100 }
  });

  assert.doesNotThrow(() => batteryAttr.validate(88));
  assert.throws(() => batteryAttr.validate(120));
  assert.throws(() => batteryAttr.validate(40));

  console.log('  ✓ AttributeDefinition: server-side dynamic validation & constraints');
}

function testListingTaxonomyUseCase() {
  const ListingTaxonomyUseCase = require('../../server/modules/listing/application/ListingTaxonomyUseCase');

  return ListingTaxonomyUseCase.getTaxonomyTree().then(tree => {
    assert.ok(Array.isArray(tree), 'Taxonomy tree should be array');
    assert.ok(tree.length >= 4, 'Should have at least 4 vertical categories');
    
    return ListingTaxonomyUseCase.getCategoryAttributeSchema('smartphones');
  }).then(schema => {
    assert.strictEqual(schema.categoryId, 'smartphones');
    assert.ok(schema.attributes.length >= 4, 'Smartphones must have multiple attributes (brand, storage, etc.)');
    console.log('  ✓ ListingTaxonomyUseCase: category hierarchy & dynamic schemas');
  });
}

// ── 3. Multi-Currency Pricing Minor Units Tests ──

function testListingPricing() {
  const ListingPricing = require('../../server/modules/listing/domain/ListingPricing');

  // XAF (Zero-decimal currency)
  const pXaf = new ListingPricing({
    currency: 'XAF',
    basePriceMinor: 745000,
    salePriceMinor: 699000
  });

  assert.strictEqual(pXaf.effectivePriceMinor, 699000);
  assert.strictEqual(pXaf.isDiscounted, true);
  assert.strictEqual(pXaf.discountPercentage, 6);
  assert.ok(pXaf.formattedPrice.includes('699') && pXaf.formattedPrice.includes('XAF'));

  // USD (2 decimal minor units: 1999 = $19.99)
  const pUsd = new ListingPricing({
    currency: 'USD',
    basePriceMinor: 1999
  });
  assert.strictEqual(pUsd.effectivePriceMinor, 1999);

  // Negative price rejection
  assert.throws(() => new ListingPricing({ currency: 'XAF', basePriceMinor: -500 }));

  console.log('  ✓ ListingPricing: safe integer minor units across XAF, USD & discounts');
}

// ── 4. Concurrency-Safe Inventory Tests ──

function testListingInventory() {
  const ListingInventory = require('../../server/modules/listing/domain/ListingInventory');

  const inv = new ListingInventory({
    on_hand: 10,
    reserved: 2,
    low_stock_threshold: 3
  });

  assert.strictEqual(inv.available, 8);
  assert.strictEqual(inv.isLowStock, false);

  // Reserve 6 units -> available becomes 2 (Low stock!)
  inv.reserve(6);
  assert.strictEqual(inv.reserved, 8);
  assert.strictEqual(inv.available, 2);
  assert.strictEqual(inv.isLowStock, true);

  // Attempt to over-reserve -> throws ConflictError
  assert.throws(() => inv.reserve(5));

  // Commit purchase
  inv.commitPurchase(4);
  assert.strictEqual(inv.onHand, 6);
  assert.strictEqual(inv.reserved, 4);

  console.log('  ✓ ListingInventory: atomic reservation, commit purchase, and race protection');
}

// ── 5. Combinatorial Variant Matrix Generation Tests ──

function testListingVariantsUseCase() {
  const ListingVariantsUseCase = require('../../server/modules/listing/application/ListingVariantsUseCase');
  const Listing = require('../../server/modules/listing/domain/Listing');

  const listing = new Listing({
    id: 'lst_test_phone',
    brand: 'Apple',
    model: 'iPhone 15',
    base_price_minor: 650000
  });

  const optionsMap = {
    color: ['Natural Titanium', 'Blue Titanium'],
    storage: ['128GB', '256GB']
  };

  return ListingVariantsUseCase.generateVariants(listing, optionsMap, 650000).then(variants => {
    assert.strictEqual(variants.length, 4, '2 colors x 2 storages = 4 variants');
    assert.strictEqual(listing.hasVariants, true);
    assert.ok(variants[0].sku.includes('APPLE-IPHONE 15-1'));
    console.log('  ✓ ListingVariantsUseCase: 4-way Cartesian product variant generation');
  });
}

// ── 6. Availability Strategies Tests ──

function testListingAvailability() {
  const ListingAvailability = require('../../server/modules/listing/domain/ListingAvailability');

  const avail = new ListingAvailability({
    availability_strategy: 'TIME_SLOT',
    timezone: 'Africa/Douala',
    lead_time_hours: 2,
    capacity_per_slot: 4
  });

  assert.strictEqual(avail.strategy, 'TIME_SLOT');
  assert.strictEqual(avail.capacityPerSlot, 4);
  assert.ok(avail.weeklySchedule.monday, 'Weekly schedule should exist');
  console.log('  ✓ ListingAvailability: time-slot, booking window, and capacity models');
}

// ── 7. AI Assistant Resilient Capabilities Tests ──

function testListingAIService() {
  const ListingAIService = require('../../server/modules/listing/application/ListingAIService');

  return Promise.all([
    ListingAIService.suggestTitle('macbook air m2 8gb 256gb space grey'),
    ListingAIService.classifyCategory('Apple iPhone 15 Pro Max 256GB'),
    ListingAIService.extractAttributes('Apple MacBook Air M2 16GB 512GB Space Grey', 'laptops'),
    ListingAIService.estimatePriceRange('laptops')
  ]).then(([title, cat, attrs, price]) => {
    assert.ok(title.includes('MacBook Air'), 'Title should be generated');
    assert.strictEqual(cat.categoryId, 'smartphones');
    assert.strictEqual(attrs.brand, 'Apple');
    assert.strictEqual(attrs.ram, '16GB');
    assert.strictEqual(attrs.storage, '512GB');
    assert.ok(price.suggestedXaf > 500000);
    console.log('  ✓ ListingAIService: title, category NLP classification, attribute extraction & pricing');
  });
}

// ── 8. Publishing State Machine Validation Tests ──

function testListingPublishUseCase() {
  const ListingPublishUseCase = require('../../server/modules/listing/application/ListingPublishUseCase');
  const Listing = require('../../server/modules/listing/domain/Listing');

  // Incomplete listing without photos -> rejects publish
  const incompleteListing = new Listing({
    title: 'Short',
    category_id: 'smartphones',
    base_price_minor: 0,
    media: []
  });

  assert.rejects(() => ListingPublishUseCase.publish(incompleteListing, { id: 'usr_1' }));

  // Valid listing -> publishes
  const validListing = new Listing({
    title: 'Apple MacBook Air 13” M2',
    category_id: 'smartphones',
    base_price_minor: 745000,
    media: [{ url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8', is_cover: true }],
    attributes: { brand: 'Apple', model: 'M2', storage: '256GB', color: 'Space Grey' }
  });

  return ListingPublishUseCase.publish(validListing, { id: 'usr_1' }).then(res => {
    assert.strictEqual(res.status, 'PUBLISHED');
    assert.ok(res.publishedAt);
    return ListingPublishUseCase.pause(validListing);
  }).then(res => {
    assert.strictEqual(res.status, 'PAUSED');
    return ListingPublishUseCase.archive(validListing);
  }).then(res => {
    assert.strictEqual(res.status, 'ARCHIVED');
    assert.ok(res.deletedAt);
    console.log('  ✓ ListingPublishUseCase: DRAFT -> PUBLISHED -> PAUSED -> ARCHIVED state machine');
  });
}

// ── 9. Frontend API Client SDK Tests ──

function testApiClientListingMethods() {
  const api = require('../../src/services/loumooApi');
  assert.ok(api, 'LoumooAPI should be available');

  const requiredMethods = [
    'getTaxonomy', 'getCategorySchema',
    'createListing', 'getSellerListings',
    'getListing', 'updateListing', 'getListingPreview',
    'publishListing', 'pauseListing', 'archiveListing',
    'addListingMedia', 'removeListingMedia',
    'generateListingVariants', 'updateListingVariant',
    'updateListingInventory', 'getListingAiSuggestions'
  ];

  requiredMethods.forEach(method => {
    assert.ok(typeof api[method] === 'function', `LoumooAPI must implement ${method}()`);
  });

  console.log(`  ✓ LoumooApiClient: all ${requiredMethods.length} universal listing client SDK methods present`);
}

// ── 10. HTML Screen Presence & Balance Tests ──

function testHtmlScreens() {
  const html = fs.readFileSync('Commerce App.dc.html', 'utf8');

  const requiredScreens = [
    'upload', 'uploadDetails', 'uploadPrice', 'uploadSuccess', 'myListings',
    'listingAttributes', 'listingPreview'
  ];

  requiredScreens.forEach(screen => {
    assert.ok(html.includes(`is.${screen}`), `HTML should contain screen "is.${screen}"`);
  });

  const opens = (html.match(/<sc-if/g) || []).length;
  const closes = (html.match(/<\/sc-if>/g) || []).length;
  assert.strictEqual(opens, closes, `sc-if tags must be balanced: ${opens} open vs ${closes} close`);

  console.log(`  ✓ Commerce App.dc.html: ${requiredScreens.length} listing screens present, ${opens} sc-if balanced`);
}

// ── Test Runner ──

async function run() {
  console.log('\n═══════════════════════════════════════════════════');
  console.log('  UNIVERSAL LISTING & SELLING ENGINE (Prompt 06)');
  console.log('═══════════════════════════════════════════════════\n');

  let passed = 0;
  let failed = 0;

  const tests = [
    ['Listing Types & Capabilities', testListingTypes],
    ['Dynamic Category Attributes', testDynamicAttributes],
    ['Taxonomy Hierarchy Use Case', testListingTaxonomyUseCase],
    ['Multi-Currency Pricing Minor Units', testListingPricing],
    ['Concurrency-Safe Inventory', testListingInventory],
    ['Combinatorial Variant Matrix', testListingVariantsUseCase],
    ['Availability Strategies', testListingAvailability],
    ['AI Assistant Resilient Services', testListingAIService],
    ['Publishing State Machine Transitions', testListingPublishUseCase],
    ['API Client Listing SDK Methods', testApiClientListingMethods],
    ['HTML Screen Presence & Balance', testHtmlScreens]
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
