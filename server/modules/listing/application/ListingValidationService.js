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
  uploadIds: z.array(z.string().trim().min(1)).max(12).default([])
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
        uploadIds: { type: 'string[]', required: 'publish', maxItems: 12, note: 'Ids returned by POST /api/v1/uploads/listing-media' }
      },
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
