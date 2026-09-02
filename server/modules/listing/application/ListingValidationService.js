/**
 * LOUMOO — Canonical Listing Validation
 * ---------------------------------------------------------------------------
 * ONE schema for what a listing is. The server enforces it; the frontend
 * renders its form and its inline errors from the same rules, served over
 * `GET /api/v1/listings/schema` and `GET /api/v1/listings/taxonomy/:id/schema`.
 *
 * Two rules that the previous implementation broke:
 *   - Unknown fields are REJECTED, not silently discarded. A client that sends
 *     `{ isFeatured: true }` gets told the field does not exist rather than
 *     believing it worked.
 *   - Category-specific attributes are validated against the category's own
 *     definition, so `attributes` can never become a bag of arbitrary JSON.
 */

const { z } = require('zod');
const ListingTaxonomyUseCase = require('./ListingTaxonomyUseCase');
const ListingType = require('../domain/ListingType');
const { ValidationError } = require('../../../shared/errors/AppError');

const CONDITIONS = ['new', 'refurbished', 'used_like_new', 'used_good', 'pre_owned', 'not_applicable'];
const CURRENCIES = ['XAF', 'XOF', 'EUR', 'USD'];
const FULFILLMENT_MODELS = [
  'DELIVERY', 'PICKUP', 'DELIVERY_OR_PICKUP', 'DIGITAL_DOWNLOAD',
  'SERVICE_ONSITE', 'SERVICE_REMOTE', 'BOOKING_VOUCHER'
];
const VISIBILITIES = ['PUBLIC', 'PRIVATE', 'UNLISTED'];

/**
 * How the headline number should be read. A listing has exactly ONE of these,
 * which is what stops a card from claiming to be free, 25 000 XAF and "price
 * on request" at the same time.
 */
const PRICE_MODES = ['FIXED', 'FROM', 'HOURLY', 'DAILY', 'PER_PERSON', 'QUOTE', 'FREE'];

/** Where a service is performed. Drives which location fields are asked for. */
const SERVICE_LOCATION_MODES = ['AT_SELLER', 'AT_CUSTOMER', 'REMOTE', 'HYBRID'];

/** How a service is transacted. Drives scheduling, capacity and approval. */
const SERVICE_FORMATS = ['ONE_TIME', 'APPOINTMENT', 'BOOKING', 'RECURRING', 'QUOTE', 'ON_DEMAND'];

const BOOKING_MODES = ['INSTANT', 'REQUEST', 'ENQUIRY'];

const DELIVERY_SCOPES = ['LOCAL', 'CITY', 'REGIONAL', 'NATIONWIDE', 'CROSS_BORDER'];

const RETURN_POLICIES = ['NONE', 'EXCHANGE_ONLY', 'DAYS_3', 'DAYS_7', 'DAYS_14', 'DAYS_30'];

const PAYMENT_METHODS = ['MOMO', 'ORANGE_MONEY', 'CARD', 'CASH_ON_DELIVERY', 'BANK_TRANSFER', 'ESCROW'];

const WEEKDAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

const TimeWindowSchema = z.object({
  start: z.string().regex(HHMM, 'Use a 24-hour time like 08:30'),
  end: z.string().regex(HHMM, 'Use a 24-hour time like 18:00')
}).strict();

const WeeklyScheduleSchema = z.object(
  WEEKDAYS.reduce((shape, day) => {
    shape[day] = z.array(TimeWindowSchema).max(4).optional();
    return shape;
  }, {})
).strict();

/** Stock. Absent entirely for listing types that have no shelf. */
const InventorySchema = z.object({
  trackInventory: z.boolean().default(true),
  quantity: z.coerce.number().int().min(0).max(1_000_000).default(0),
  lowStockThreshold: z.coerce.number().int().min(0).max(10_000).default(3),
  allowBackorder: z.boolean().default(false)
}).strict();

/** How a buyer physically receives a product. */
const FulfillmentSchema = z.object({
  delivery: z.boolean().default(false),
  pickup: z.boolean().default(false),
  deliveryScope: z.enum(DELIVERY_SCOPES).optional().nullable(),
  deliveryZones: z.array(z.string().trim().min(1).max(64)).max(30).default([]),
  etaText: z.string().trim().max(120).optional().nullable(),
  deliveryFeeMinor: z.coerce.number().int().min(0).max(9_999_999).optional().nullable(),
  freeDeliveryOverMinor: z.coerce.number().int().min(0).max(9_999_999_999).optional().nullable(),
  pickupAddress: z.string().trim().max(240).optional().nullable()
}).strict();

/** Everything that makes a service bookable rather than buyable. */
const ServiceSchema = z.object({
  format: z.enum(SERVICE_FORMATS).default('APPOINTMENT'),
  durationMinutes: z.coerce.number().int().min(5).max(60 * 24 * 30).optional().nullable(),
  locationMode: z.enum(SERVICE_LOCATION_MODES).default('AT_SELLER'),
  serviceAreas: z.array(z.string().trim().min(1).max(64)).max(30).default([]),
  includes: z.array(z.string().trim().min(1).max(160)).max(12).default([]),
  excludes: z.array(z.string().trim().min(1).max(160)).max(12).default([]),
  bookingMode: z.enum(BOOKING_MODES).default('REQUEST'),
  capacity: z.coerce.number().int().min(1).max(10_000).optional().nullable(),
  minParticipants: z.coerce.number().int().min(1).max(10_000).optional().nullable(),
  leadTimeHours: z.coerce.number().int().min(0).max(24 * 365).default(2),
  weeklySchedule: WeeklyScheduleSchema.optional(),
  blackoutDates: z.array(z.string().trim().max(32)).max(60).default([]),
  cancellationPolicy: z.string().trim().max(500).optional().nullable()
}).strict();

/** The promises attached to a purchase. */
const TrustSchema = z.object({
  warranty: z.string().trim().max(160).optional().nullable(),
  returnPolicy: z.enum(RETURN_POLICIES).optional().nullable(),
  authenticity: z.string().trim().max(160).optional().nullable(),
  paymentMethods: z.array(z.enum(PAYMENT_METHODS)).max(6).default([]),
  availableFrom: z.string().trim().max(32).optional().nullable()
}).strict();

/**
 * Draft schema — deliberately permissive so a wizard can save progress after
 * the first field. Publishing applies the strict schema below.
 */
const ListingDraftSchema = z.object({
  listingType: z.string().refine(v => ListingType.isValid(v), {
    message: 'Unsupported listing type'
  }).default('PHYSICAL_PRODUCT'),
  categoryId: z.string().trim().min(1, 'Choose a category for your listing'),
  title: z.string().trim().min(1).max(255).optional(),
  shortDescription: z.string().trim().max(500).optional().nullable(),
  description: z.string().trim().max(20000).optional().nullable(),
  brand: z.string().trim().max(128).optional().nullable(),
  model: z.string().trim().max(128).optional().nullable(),
  sku: z.string().trim().max(128).optional().nullable(),
  condition: z.enum(CONDITIONS).default('new'),
  currency: z.enum(CURRENCIES).default('XAF'),
  basePriceMinor: z.coerce.number().int().min(0).max(9_999_999_999).default(0),
  salePriceMinor: z.coerce.number().int().min(0).max(9_999_999_999).optional().nullable(),
  compareAtPriceMinor: z.coerce.number().int().min(0).max(9_999_999_999).optional().nullable(),
  fulfillmentModel: z.enum(FULFILLMENT_MODELS).default('DELIVERY_OR_PICKUP'),
  visibility: z.enum(VISIBILITIES).default('PUBLIC'),
  tags: z.array(z.string().trim().min(1).max(48)).max(20).default([]),
  attributes: z.record(z.string(), z.any()).default({}),
  city: z.string().trim().max(64).optional().nullable(),
  neighbourhood: z.string().trim().max(120).optional().nullable(),
  contactPhone: z.string().trim().max(32).optional().nullable(),
  uploadIds: z.array(z.string().trim().min(1)).max(12).default([]),

  // ── Structured blocks, all optional at draft time ──────────────────────
  priceMode: z.enum(PRICE_MODES).default('FIXED'),
  negotiable: z.boolean().default(false),
  minOrderQuantity: z.coerce.number().int().min(1).max(100_000).optional().nullable(),
  wholesalePriceMinor: z.coerce.number().int().min(0).max(9_999_999_999).optional().nullable(),
  taxIncluded: z.boolean().default(true),
  inventory: InventorySchema.optional(),
  variantOptions: z.record(
    z.string().trim().min(1).max(48),
    z.array(z.string().trim().min(1).max(64)).max(20)
  ).optional(),
  fulfillment: FulfillmentSchema.optional(),
  service: ServiceSchema.optional(),
  trust: TrustSchema.optional()
}).strict();   // <- unknown keys are an error, never dropped

/** Rules a listing must satisfy to become PUBLISHED. */
const ListingPublishSchema = ListingDraftSchema.extend({
  title: z.string().trim().min(8, 'Give your listing a descriptive title (at least 8 characters)').max(255),
  description: z.string().trim().min(30, 'Describe what you are selling in at least 30 characters').max(20000),
  basePriceMinor: z.coerce.number().int().min(1, 'Set a price above zero').max(9_999_999_999),
  city: z.string().trim().min(1, 'Buyers need to know where this listing is located').max(64)
});

class ListingValidationService {
  /**
   * Validates listing input.
   *
   * @param {object} rawInput
   * @param {object} options
   * @param {boolean} options.forPublish  Apply the strict publishing rules.
   * @param {number}  options.mediaCount  Existing images already attached.
   * @returns {Promise<{value:object, schema:object}>}
   * @throws {ValidationError} with `details.fields[]` — always the full list.
   */
  static async validate(rawInput = {}, options = {}) {
    const schema = options.forPublish ? ListingPublishSchema : ListingDraftSchema;
    const parsed = schema.safeParse(rawInput);

    const errors = [];

    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const field = issue.path.join('.') || '_';
        errors.push({
          field,
          message: issue.code === 'unrecognized_keys'
            ? `Unknown field(s): ${(issue.keys || []).join(', ')}. LOUMOO does not accept fields it does not define.`
            : issue.message
        });
      }
      // Without a parseable body we cannot validate attributes meaningfully.
      throw new ValidationError('Some listing details need your attention.', { fields: errors });
    }

    const value = parsed.data;

    // ── Category must exist, and must support this listing type ────────────
    const categorySchema = await ListingTaxonomyUseCase
      .getCategoryAttributeSchema(value.categoryId)
      .catch(() => null);

    if (!categorySchema) {
      throw new ValidationError('Some listing details need your attention.', {
        fields: [{ field: 'categoryId', message: `"${value.categoryId}" is not a category in the LOUMOO marketplace.` }]
      });
    }

    if (!categorySchema.supportedListingTypes.includes(value.listingType)) {
      errors.push({
        field: 'listingType',
        message: `"${categorySchema.categoryName}" does not support ${value.listingType} listings. Supported: ${categorySchema.supportedListingTypes.join(', ')}.`
      });
    }

    // ── Category-specific attributes ───────────────────────────────────────
    // Attributes are only strictly required at publish time; a draft may be
    // saved with them incomplete.
    const attrResult = await ListingTaxonomyUseCase.validateAttributesForCategory(
      value.categoryId,
      value.attributes
    );

    if (options.forPublish) {
      errors.push(...attrResult.errors);
    } else {
      // On a draft, only reject attributes that are unknown or malformed —
      // never the "is required" errors.
      errors.push(...attrResult.errors.filter(e => !/is required/i.test(e.message)));
    }
    value.attributes = attrResult.value;

    // ── Cross-field price rules ────────────────────────────────────────────
    if (value.salePriceMinor != null && value.salePriceMinor >= value.basePriceMinor && value.basePriceMinor > 0) {
      errors.push({
        field: 'salePriceMinor',
        message: 'The sale price must be lower than the regular price.'
      });
    }
    if (value.compareAtPriceMinor != null && value.compareAtPriceMinor < value.basePriceMinor) {
      errors.push({
        field: 'compareAtPriceMinor',
        message: 'The compare-at price cannot be lower than the listing price.'
      });
    }

    // A listing carries ONE price story. QUOTE and FREE do not get to also
    // quote a number, and every other mode needs one.
    if (value.priceMode === 'QUOTE' || value.priceMode === 'FREE') {
      if (value.basePriceMinor > 0) {
        errors.push({
          field: 'basePriceMinor',
          message: value.priceMode === 'FREE'
            ? 'A free listing cannot also carry a price. Remove the price or change the pricing mode.'
            : 'A quote-on-request listing cannot also show a fixed price. Remove the price or change the pricing mode.'
        });
      }
      if (value.salePriceMinor) {
        errors.push({
          field: 'salePriceMinor',
          message: 'A quote or free listing cannot be on sale.'
        });
      }
    }
    if (value.wholesalePriceMinor != null && value.basePriceMinor > 0
        && value.wholesalePriceMinor > value.basePriceMinor) {
      errors.push({
        field: 'wholesalePriceMinor',
        message: 'The wholesale price cannot be higher than the retail price.'
      });
    }

    const caps = ListingType.getCapabilities(value.listingType);

    // ── Blocks that do not belong to this listing type ─────────────────────
    if (value.service && !(caps.hasServiceSchedule || caps.hasBookingDates)) {
      errors.push({
        field: 'service',
        message: `${value.listingType} listings do not take service or booking details.`
      });
    }
    if (value.inventory && !caps.hasInventory && value.inventory.trackInventory) {
      errors.push({
        field: 'inventory.trackInventory',
        message: `${value.listingType} listings do not hold stock.`
      });
    }
    if (value.fulfillment && (value.fulfillment.delivery || value.fulfillment.pickup) && !caps.hasShipping) {
      errors.push({
        field: 'fulfillment',
        message: `${value.listingType} listings are not delivered or collected.`
      });
    }

    // ── Conditional requirements ───────────────────────────────────────────
    // Each one is a promise the buyer-facing card would otherwise make without
    // the information needed to keep it.
    const f = value.fulfillment;
    if (f) {
      if (f.delivery && f.deliveryZones.length === 0 && !f.deliveryScope) {
        errors.push({
          field: 'fulfillment.deliveryZones',
          message: 'You offer delivery — say where you deliver to.'
        });
      }
      if (f.pickup && !f.pickupAddress) {
        errors.push({
          field: 'fulfillment.pickupAddress',
          message: 'You offer pickup — buyers need the address to collect from.'
        });
      }
      if (f.freeDeliveryOverMinor != null && !f.delivery) {
        errors.push({
          field: 'fulfillment.freeDeliveryOverMinor',
          message: 'A free-delivery threshold only makes sense when delivery is offered.'
        });
      }
      if (options.forPublish && caps.hasShipping && !f.delivery && !f.pickup) {
        errors.push({
          field: 'fulfillment',
          message: 'Choose at least one way buyers can receive this: delivery, pickup, or both.'
        });
      }
    } else if (options.forPublish && caps.hasShipping) {
      errors.push({
        field: 'fulfillment',
        message: 'Tell buyers how they will receive this item.'
      });
    }

    const s = value.service;
    if (s) {
      const needsSchedule = s.format === 'APPOINTMENT' || s.format === 'BOOKING' || s.format === 'RECURRING';
      const scheduledDays = Object.values(s.weeklySchedule || {})
        .filter(windows => Array.isArray(windows) && windows.length > 0);

      if (options.forPublish && needsSchedule && scheduledDays.length === 0) {
        errors.push({
          field: 'service.weeklySchedule',
          message: 'A bookable service needs the days and hours you are available.'
        });
      }
      for (const [day, windows] of Object.entries(s.weeklySchedule || {})) {
        for (const w of windows || []) {
          if (w.end <= w.start) {
            errors.push({
              field: `service.weeklySchedule.${day}`,
              message: `${day.charAt(0).toUpperCase()}${day.slice(1)} closes at or before it opens.`
            });
          }
        }
      }
      if ((s.locationMode === 'AT_CUSTOMER' || s.locationMode === 'HYBRID')
          && options.forPublish && s.serviceAreas.length === 0) {
        errors.push({
          field: 'service.serviceAreas',
          message: 'You travel to the customer — say which areas you cover.'
        });
      }
      if (s.minParticipants != null && s.capacity != null && s.minParticipants > s.capacity) {
        errors.push({
          field: 'service.minParticipants',
          message: 'The minimum number of participants cannot exceed the capacity.'
        });
      }
      if (options.forPublish && needsSchedule && !s.durationMinutes) {
        errors.push({
          field: 'service.durationMinutes',
          message: 'How long does one booking last?'
        });
      }
    } else if (options.forPublish && caps.hasServiceSchedule) {
      errors.push({
        field: 'service',
        message: 'Tell buyers how this service is delivered and when you are available.'
      });
    }

    const inv = value.inventory;
    if (inv && inv.trackInventory && options.forPublish && caps.hasInventory) {
      if (inv.quantity <= 0 && !inv.allowBackorder) {
        errors.push({
          field: 'inventory.quantity',
          message: 'Stock is tracked but the quantity is zero. Add stock, allow backorders, or turn tracking off.'
        });
      }
      if (inv.lowStockThreshold > inv.quantity && inv.quantity > 0) {
        errors.push({
          field: 'inventory.lowStockThreshold',
          message: 'The low-stock warning level is higher than the stock you have.'
        });
      }
    }

    // ── Variant options must be attributes the category marks as variant-able
    if (value.variantOptions) {
      const variantable = new Set(
        (categorySchema.attributes || []).filter(a => a.isVariantOption).map(a => a.slug)
      );
      for (const [slug, values] of Object.entries(value.variantOptions)) {
        if (!variantable.has(slug)) {
          errors.push({
            field: `variantOptions.${slug}`,
            message: `"${slug}" cannot be used to build variants in "${categorySchema.categoryName}".`
          });
        }
        if (!values.length) {
          errors.push({
            field: `variantOptions.${slug}`,
            message: `Choose at least one "${slug}" value, or remove it from the variant options.`
          });
        }
      }
      const total = Object.values(value.variantOptions)
        .reduce((n, vals) => n * Math.max(1, vals.length), 1);
      if (total > 100) {
        errors.push({
          field: 'variantOptions',
          message: `Those options would create ${total} variants. Keep it to 100 or fewer.`
        });
      }
    }

    // ── Media rules ────────────────────────────────────────────────────────
    const totalMedia = (options.mediaCount || 0) + (value.uploadIds ? value.uploadIds.length : 0);
    if (options.forPublish && totalMedia < 1) {
      errors.push({ field: 'images', message: 'Add at least one photo before publishing.' });
    }
    if (totalMedia > 12) {
      errors.push({ field: 'images', message: 'A listing can have at most 12 images.' });
    }

    if (errors.length > 0) {
      throw new ValidationError('Some listing details need your attention.', { fields: errors });
    }

    return { value, schema: categorySchema };
  }

  /**
   * The machine-readable description of the listing form, served to the client
   * so its inline validation mirrors the server's exactly.
   */
  static describe() {
    return {
      fields: {
        title: { type: 'string', required: 'publish', minLength: 8, maxLength: 255 },
        description: { type: 'longtext', required: 'publish', minLength: 30, maxLength: 20000 },
        shortDescription: { type: 'string', required: false, maxLength: 500 },
        categoryId: { type: 'category', required: 'draft' },
        listingType: { type: 'enum', required: 'draft', values: ListingType.ALL || Object.values(ListingType.TYPES) },
        condition: { type: 'enum', required: false, values: CONDITIONS, default: 'new' },
        currency: { type: 'enum', required: false, values: CURRENCIES, default: 'XAF' },
        basePriceMinor: { type: 'integer', required: 'publish', min: 1, note: 'Minor units (XAF has no subunit, so 1 = 1 FCFA)' },
        salePriceMinor: { type: 'integer', required: false, mustBeLessThan: 'basePriceMinor' },
        fulfillmentModel: { type: 'enum', required: false, values: FULFILLMENT_MODELS },
        visibility: { type: 'enum', required: false, values: VISIBILITIES },
        city: { type: 'string', required: 'publish', maxLength: 64 },
        tags: { type: 'string[]', required: false, maxItems: 20 },
        attributes: { type: 'category-schema', required: 'publish', note: 'Validated against GET /api/v1/listings/taxonomy/:categoryId/schema' },
        uploadIds: { type: 'string[]', required: 'publish', maxItems: 12, note: 'Ids returned by POST /api/v1/uploads/listing-media' },
        priceMode: { type: 'enum', required: false, values: PRICE_MODES, default: 'FIXED' },
        negotiable: { type: 'boolean', required: false, default: false },
        minOrderQuantity: { type: 'integer', required: false, min: 1 },
        wholesalePriceMinor: { type: 'integer', required: false, mustNotExceed: 'basePriceMinor' },
        inventory: { type: 'block', required: false, appliesWhen: 'capabilities.hasInventory', fields: ['trackInventory', 'quantity', 'lowStockThreshold', 'allowBackorder'] },
        variantOptions: { type: 'map<string,string[]>', required: false, note: 'Keys must be category attributes flagged isVariantOption; at most 100 combinations' },
        fulfillment: { type: 'block', required: 'publish', appliesWhen: 'capabilities.hasShipping', fields: ['delivery', 'pickup', 'deliveryScope', 'deliveryZones', 'etaText', 'deliveryFeeMinor', 'freeDeliveryOverMinor', 'pickupAddress'] },
        service: { type: 'block', required: 'publish', appliesWhen: 'capabilities.hasServiceSchedule', fields: ['format', 'durationMinutes', 'locationMode', 'serviceAreas', 'includes', 'excludes', 'bookingMode', 'capacity', 'minParticipants', 'leadTimeHours', 'weeklySchedule', 'blackoutDates', 'cancellationPolicy'] },
        trust: { type: 'block', required: false, fields: ['warranty', 'returnPolicy', 'authenticity', 'paymentMethods', 'availableFrom'] }
      },
      enums: {
        priceModes: PRICE_MODES,
        serviceFormats: SERVICE_FORMATS,
        serviceLocationModes: SERVICE_LOCATION_MODES,
        bookingModes: BOOKING_MODES,
        deliveryScopes: DELIVERY_SCOPES,
        returnPolicies: RETURN_POLICIES,
        paymentMethods: PAYMENT_METHODS,
        weekdays: WEEKDAYS
      },
      listingTypes: ListingType.getAllTypesWithMetadata(),
      media: {
        maxImages: 12,
        minImagesToPublish: 1,
        acceptedFormats: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
        maxFileSizeBytes: 8 * 1024 * 1024,
        minDimensions: { width: 200, height: 200 },
        maxDimensions: { width: 12000, height: 12000 }
      }
    };
  }
}

module.exports = ListingValidationService;
module.exports.ListingDraftSchema = ListingDraftSchema;
module.exports.ListingPublishSchema = ListingPublishSchema;
module.exports.CONDITIONS = CONDITIONS;
module.exports.CURRENCIES = CURRENCIES;
module.exports.FULFILLMENT_MODELS = FULFILLMENT_MODELS;
module.exports.PRICE_MODES = PRICE_MODES;
module.exports.SERVICE_FORMATS = SERVICE_FORMATS;
module.exports.SERVICE_LOCATION_MODES = SERVICE_LOCATION_MODES;
module.exports.BOOKING_MODES = BOOKING_MODES;
module.exports.DELIVERY_SCOPES = DELIVERY_SCOPES;
module.exports.RETURN_POLICIES = RETURN_POLICIES;
module.exports.PAYMENT_METHODS = PAYMENT_METHODS;
module.exports.WEEKDAYS = WEEKDAYS;
