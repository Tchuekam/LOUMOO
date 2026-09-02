/**
 * LOUMOO — Canonical Listing Validation
 * ---------------------------------------------------------------------------
 * Verifies the one schema that both the API and the listing wizard obey:
 * required fields, cross-field price rules, category-specific attributes, and
 * the refusal to silently accept fields LOUMOO does not define.
 */

require('../setup');
const assert = require('assert');

const ListingValidationService = require('../../server/modules/listing/application/ListingValidationService');
const ListingTaxonomyUseCase = require('../../server/modules/listing/application/ListingTaxonomyUseCase');

const VALID_PHONE_LISTING = {
  categoryId: 'smartphones',
  listingType: 'PHYSICAL_PRODUCT',
  title: 'Samsung Galaxy S24 Ultra 256GB',
  description: 'Brand new sealed Samsung Galaxy S24 Ultra with full warranty and official Cameroon distribution.',
  condition: 'new',
  currency: 'XAF',
  basePriceMinor: 850000,
  city: 'douala',
  attributes: { brand: 'Samsung', model: 'Galaxy S24 Ultra', storage: '256GB', color: 'Black' },
  uploadIds: ['up_1'],
  // A publishable physical product has to tell the buyer how they get it.
  fulfillment: {
    delivery: true, pickup: true, deliveryScope: 'CITY',
    etaText: 'Same day in Douala', pickupAddress: 'Akwa, Douala'
  }
};

async function expectFailure(input, options, predicate, description) {
  try {
    await ListingValidationService.validate(input, options);
    assert.fail(`Expected validation to fail: ${description}`);
  } catch (err) {
    assert.ok(err.details && err.details.fields, `${description}: error must carry structured fields`);
    assert.ok(predicate(err.details.fields),
      `${description}. Got: ${JSON.stringify(err.details.fields)}`);
    return err.details.fields;
  }
}

async function run() {
  /* ── A valid listing passes ───────────────────────────────────────────── */

  const ok = await ListingValidationService.validate(VALID_PHONE_LISTING, {
    forPublish: true, mediaCount: 0
  });
  assert.strictEqual(ok.value.basePriceMinor, 850000);
  assert.strictEqual(ok.value.attributes.storage, '256GB');

  /* ── Unknown fields are an error, never silently discarded ────────────── */

  await expectFailure(
    { ...VALID_PHONE_LISTING, isFeatured: true, sellerId: 'usr_someone_else' },
    { forPublish: true },
    fields => fields.some(f => /isFeatured/.test(f.message) || /sellerId/.test(f.message)),
    'Unknown top-level fields must be named in the error'
  );

  /* ── Publish rules ────────────────────────────────────────────────────── */

  await expectFailure(
    { ...VALID_PHONE_LISTING, title: 'Short' },
    { forPublish: true },
    fields => fields.some(f => f.field === 'title'),
    'A too-short title must be rejected at publish time'
  );

  await expectFailure(
    { ...VALID_PHONE_LISTING, description: 'tiny' },
    { forPublish: true },
    fields => fields.some(f => f.field === 'description'),
    'A too-short description must be rejected at publish time'
  );

  await expectFailure(
    { ...VALID_PHONE_LISTING, basePriceMinor: 0 },
    { forPublish: true },
    fields => fields.some(f => f.field === 'basePriceMinor'),
    'A zero price must be rejected at publish time'
  );

  await expectFailure(
    { ...VALID_PHONE_LISTING, uploadIds: [] },
    { forPublish: true, mediaCount: 0 },
    fields => fields.some(f => f.field === 'images'),
    'Publishing without a photo must be rejected'
  );

  // ...but a draft may be saved with all of those still missing.
  const draft = await ListingValidationService.validate(
    { categoryId: 'smartphones', title: 'Wo' },
    { forPublish: false }
  );
  assert.strictEqual(draft.value.categoryId, 'smartphones',
    'A draft must be saveable long before it is publishable');

  /* ── Cross-field price rules ──────────────────────────────────────────── */

  await expectFailure(
    { ...VALID_PHONE_LISTING, salePriceMinor: 900000 },
    { forPublish: true },
    fields => fields.some(f => f.field === 'salePriceMinor'),
    'A sale price above the base price must be rejected'
  );

  await expectFailure(
    { ...VALID_PHONE_LISTING, compareAtPriceMinor: 100 },
    { forPublish: true },
    fields => fields.some(f => f.field === 'compareAtPriceMinor'),
    'A compare-at price below the listing price must be rejected'
  );

  /* ── Category-specific attributes ─────────────────────────────────────── */

  await expectFailure(
    { ...VALID_PHONE_LISTING, attributes: { brand: 'Samsung' } },
    { forPublish: true },
    fields => fields.some(f => f.field === 'attributes.storage'),
    'A required category attribute must be enforced at publish time'
  );

  await expectFailure(
    { ...VALID_PHONE_LISTING, attributes: { ...VALID_PHONE_LISTING.attributes, mileage: 120000 } },
    { forPublish: true },
    fields => fields.some(f => f.field === 'attributes.mileage'),
    'An attribute belonging to another category must be rejected, not stored as loose JSON'
  );

  await expectFailure(
    { ...VALID_PHONE_LISTING, attributes: { ...VALID_PHONE_LISTING.attributes, storage: '9000TB' } },
    { forPublish: true },
    fields => fields.some(f => f.field === 'attributes.storage'),
    'A value outside the allowed set must be rejected'
  );

  /* ── Listing type must be supported by the category ───────────────────── */

  await expectFailure(
    { ...VALID_PHONE_LISTING, listingType: 'BOOKING' },
    { forPublish: true },
    fields => fields.some(f => f.field === 'listingType'),
    'Smartphones do not support BOOKING listings'
  );

  await expectFailure(
    { ...VALID_PHONE_LISTING, categoryId: 'not-a-real-category' },
    { forPublish: true },
    fields => fields.some(f => f.field === 'categoryId'),
    'An unknown category must be rejected'
  );

  /* ── Verticals beyond electronics validate on their own terms ─────────── */

  const vehicle = await ListingValidationService.validate({
    categoryId: 'cars',
    listingType: 'PHYSICAL_PRODUCT',
    title: 'Toyota Corolla 2018 — Full Option',
    description: 'Well maintained Toyota Corolla 2018, single owner, complete service history, Douala registered.',
    condition: 'used_good',
    basePriceMinor: 9500000,
    city: 'douala',
    attributes: { make: 'Toyota', model: 'Corolla', year: 2018, mileage: 78000, fuel_type: 'Petrol', transmission: 'Automatic' },
    uploadIds: ['up_car'],
    fulfillment: { delivery: false, pickup: true, pickupAddress: 'Bonaberi yard, Douala' }
  }, { forPublish: true });
  assert.strictEqual(vehicle.value.attributes.year, 2018);

  await expectFailure(
    {
      categoryId: 'cars',
      title: 'Toyota Corolla 2018 — Full Option',
      description: 'Well maintained Toyota Corolla 2018, single owner, complete service history, Douala registered.',
      basePriceMinor: 9500000,
      city: 'douala',
      attributes: { make: 'Toyota', model: 'Corolla', year: 1899, mileage: 78000, fuel_type: 'Petrol', transmission: 'Automatic' },
      uploadIds: ['up_car']
    },
    { forPublish: true },
    fields => fields.some(f => f.field === 'attributes.year'),
    'A year outside the allowed range must be rejected'
  );

  const property = await ListingValidationService.validate({
    categoryId: 'residential_property',
    listingType: 'RENTAL',
    title: 'Modern 3-Bedroom Apartment in Bonapriso',
    description: 'Spacious three-bedroom apartment in Bonapriso with secure parking, standby generator and 24/7 security.',
    condition: 'not_applicable',
    basePriceMinor: 450000,
    city: 'douala',
    fulfillmentModel: 'SERVICE_ONSITE',
    attributes: { property_type: 'Apartment', bedrooms: 3, bathrooms: 2, surface_area: 120, neighbourhood: 'Bonapriso' },
    uploadIds: ['up_flat'],
    fulfillment: { delivery: false, pickup: true, pickupAddress: 'Bonapriso, Douala' }
  }, { forPublish: true });
  assert.strictEqual(property.value.attributes.bedrooms, 3);


  /* ── Conditional blocks: a promise the card makes needs backing ───────── */

  // A physical product must say how the buyer receives it.
  await expectFailure(
    { ...VALID_PHONE_LISTING, fulfillment: undefined },
    { forPublish: true },
    fields => fields.some(f => f.field === 'fulfillment'),
    'A physical product with no fulfilment at all must be rejected at publish'
  );

  await expectFailure(
    { ...VALID_PHONE_LISTING, fulfillment: { delivery: false, pickup: false } },
    { forPublish: true },
    fields => fields.some(f => f.field === 'fulfillment'),
    'Neither delivery nor pickup means the buyer cannot receive it'
  );

  // Offering delivery without saying where.
  await expectFailure(
    { ...VALID_PHONE_LISTING, fulfillment: { delivery: true, pickup: false } },
    { forPublish: true },
    fields => fields.some(f => f.field === 'fulfillment.deliveryZones'),
    'Delivery with no scope and no zones must be rejected'
  );

  // Offering pickup without an address.
  await expectFailure(
    { ...VALID_PHONE_LISTING, fulfillment: { delivery: false, pickup: true } },
    { forPublish: true },
    fields => fields.some(f => f.field === 'fulfillment.pickupAddress'),
    'Pickup with no address must be rejected'
  );

  // A free-delivery threshold with delivery switched off is contradictory.
  await expectFailure(
    {
      ...VALID_PHONE_LISTING,
      fulfillment: { delivery: false, pickup: true, pickupAddress: 'Akwa', freeDeliveryOverMinor: 50000 }
    },
    { forPublish: true },
    fields => fields.some(f => f.field === 'fulfillment.freeDeliveryOverMinor'),
    'A free-delivery threshold requires delivery'
  );

  /* ── One price story per listing ──────────────────────────────────────── */

  await expectFailure(
    { ...VALID_PHONE_LISTING, priceMode: 'QUOTE' },
    { forPublish: true },
    fields => fields.some(f => f.field === 'basePriceMinor'),
    'A quote-on-request listing cannot also carry a price'
  );

  await expectFailure(
    { ...VALID_PHONE_LISTING, priceMode: 'FREE' },
    { forPublish: true },
    fields => fields.some(f => f.field === 'basePriceMinor'),
    'A free listing cannot also carry a price'
  );

  await expectFailure(
    { ...VALID_PHONE_LISTING, wholesalePriceMinor: 900000 },
    { forPublish: true },
    fields => fields.some(f => f.field === 'wholesalePriceMinor'),
    'Wholesale above retail is contradictory'
  );

  /* ── Stock that claims to be tracked but is empty ──────────────────────── */

  await expectFailure(
    {
      ...VALID_PHONE_LISTING,
      inventory: { trackInventory: true, quantity: 0, allowBackorder: false }
    },
    { forPublish: true },
    fields => fields.some(f => f.field === 'inventory.quantity'),
    'Tracked-but-empty stock must be rejected unless backorders are allowed'
  );

  const backordered = await ListingValidationService.validate({
    ...VALID_PHONE_LISTING,
    inventory: { trackInventory: true, quantity: 0, allowBackorder: true }
  }, { forPublish: true });
  assert.strictEqual(backordered.value.inventory.allowBackorder, true,
    'Zero stock is fine when the seller accepts backorders');

  /* ── Variant options must be variant-able attributes ──────────────────── */

  await expectFailure(
    { ...VALID_PHONE_LISTING, variantOptions: { battery_health: ['90', '95'] } },
    { forPublish: true },
    fields => fields.some(f => f.field === 'variantOptions.battery_health'),
    'An attribute the category does not mark as a variant option cannot build variants'
  );

  const variants = await ListingValidationService.validate({
    ...VALID_PHONE_LISTING,
    variantOptions: { storage: ['128GB', '256GB'], color: ['Black', 'Gold'] }
  }, { forPublish: true });
  assert.deepStrictEqual(variants.value.variantOptions.storage, ['128GB', '256GB'],
    'Variant-able attributes are accepted');

  /* ── Services carry service rules, products do not ─────────────────────── */

  await expectFailure(
    { ...VALID_PHONE_LISTING, service: { format: 'APPOINTMENT' } },
    { forPublish: true },
    fields => fields.some(f => f.field === 'service'),
    'A physical product must not accept service scheduling'
  );

  const SERVICE_LISTING = {
    categoryId: 'tech_repairs',
    listingType: 'SERVICE',
    title: 'iPhone screen replacement, same day',
    description: 'Genuine-quality OLED replacement done while you wait, with a ninety day guarantee on parts and labour.',
    condition: 'not_applicable',
    currency: 'XAF',
    basePriceMinor: 25000,
    city: 'douala',
    fulfillmentModel: 'SERVICE_ONSITE',
    attributes: { service_type: 'Screen Replacement', duration: '1 - 2 hours', service_mode: 'In-Store Dropoff' },
    uploadIds: ['up_svc']
  };

  await expectFailure(
    SERVICE_LISTING,
    { forPublish: true },
    fields => fields.some(f => f.field === 'service'),
    'A bookable service must describe how it is delivered'
  );

  await expectFailure(
    {
      ...SERVICE_LISTING,
      service: { format: 'APPOINTMENT', durationMinutes: 90, weeklySchedule: {} }
    },
    { forPublish: true },
    fields => fields.some(f => f.field === 'service.weeklySchedule'),
    'An appointment service with no open days must be rejected'
  );

  await expectFailure(
    {
      ...SERVICE_LISTING,
      service: {
        format: 'APPOINTMENT', durationMinutes: 90,
        weeklySchedule: { monday: [{ start: '18:00', end: '08:00' }] }
      }
    },
    { forPublish: true },
    fields => fields.some(f => /monday/i.test(f.field)),
    'A day that closes before it opens must be rejected'
  );

  await expectFailure(
    {
      ...SERVICE_LISTING,
      service: {
        format: 'APPOINTMENT', durationMinutes: 90, locationMode: 'AT_CUSTOMER',
        weeklySchedule: { monday: [{ start: '08:00', end: '18:00' }] }
      }
    },
    { forPublish: true },
    fields => fields.some(f => f.field === 'service.serviceAreas'),
    'A service that travels to the customer must say where it goes'
  );

  const goodService = await ListingValidationService.validate({
    ...SERVICE_LISTING,
    service: {
      format: 'APPOINTMENT', durationMinutes: 90, locationMode: 'AT_SELLER',
      bookingMode: 'INSTANT', leadTimeHours: 2,
      weeklySchedule: {
        monday: [{ start: '08:00', end: '18:00' }],
        saturday: [{ start: '09:00', end: '14:00' }]
      },
      includes: ['Genuine OLED panel', '90-day guarantee']
    }
  }, { forPublish: true });
  assert.strictEqual(goodService.value.service.durationMinutes, 90);
  assert.strictEqual(goodService.value.service.weeklySchedule.saturday[0].end, '14:00');

  /* ── The enums the studio renders from are published ──────────────────── */

  const enums = ListingValidationService.describe().enums;
  assert.ok(enums.priceModes.includes('QUOTE'), 'Price modes must be discoverable by the client');
  assert.ok(enums.serviceFormats.includes('APPOINTMENT'));
  assert.strictEqual(enums.weekdays.length, 7);

  /* ── The schema is publishable to the client ──────────────────────────── */

  const described = ListingValidationService.describe();
  assert.ok(described.fields.title, 'The client must be able to fetch the field rules');
  assert.strictEqual(described.media.minImagesToPublish, 1);
  assert.ok(described.media.acceptedFormats.includes('image/webp'));

  const phoneSchema = await ListingTaxonomyUseCase.getCategoryAttributeSchema('smartphones');
  assert.ok(phoneSchema.attributes.some(a => a.slug === 'storage' && a.isRequired),
    'The category schema served to the wizard must carry the same required flags the server enforces');

  console.log('  ✓ Listing validation: shared schema, category attributes and strict field handling');
}

module.exports = { run };

if (require.main === module) {
  run().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
}
