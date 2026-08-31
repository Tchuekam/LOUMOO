/**
 * LOUMOO — Update Listing Use Case (edit + wizard autosave)
 * ---------------------------------------------------------------------------
 * Applies a partial update to a listing the caller has already been proven to
 * own (see `requireListingOwnership`).
 *
 * A published listing keeps working while it is edited: the update is applied
 * to the stored row, and only fields the client actually sent are touched, so
 * an autosave of step 2 cannot blank out what step 4 already captured.
 */

const ListingRepository = require('../infrastructure/ListingRepository');
const ListingValidationService = require('./ListingValidationService');
const CreateListingUseCase = require('./CreateListingUseCase');
const AnalyticsService = require('../../../infrastructure/analytics/AnalyticsService');
const CacheService = require('../../../infrastructure/cache/CacheService');
const logger = require('../../../shared/logging/logger');
const { ValidationError, ConflictError } = require('../../../shared/errors/AppError');

/** Columns the client may influence, mapped to their database names. */
const FIELD_MAP = Object.freeze({
  title: 'title',
  shortDescription: 'short_description',
  description: 'description',
  brand: 'brand',
  model: 'model',
  sku: 'sku',
  condition: 'condition',
  currency: 'currency',
  basePriceMinor: 'base_price_minor',
  salePriceMinor: 'sale_price_minor',
  compareAtPriceMinor: 'compare_at_price_minor',
  fulfillmentModel: 'fulfillment_model',
  visibility: 'visibility',
  tags: 'tags',
  listingType: 'listing_type',
  categoryId: 'category_id'
});

class UpdateListingUseCase {
  /**
   * @param {object} ctx
   * @param {object} ctx.listingRow  The row loaded by the ownership guard.
   * @param {object} ctx.principal
   * @param {object} ctx.input       Untrusted partial body.
   */
  static async execute({ listingRow, principal, input = {} }) {
    if (listingRow.status === 'ARCHIVED') {
      throw new ConflictError('Archived listings cannot be edited. Duplicate it into a new draft instead.');
    }

    // Merge the submitted patch over the stored state, then validate the WHOLE
    // resulting listing. Validating only the patch would let a listing drift
    // into an invalid combination one field at a time.
    const existingAttributes = await ListingRepository.listAttributes(listingRow.id);
    const media = await ListingRepository.listMedia(listingRow.id);

    const merged = {
      listingType: listingRow.listing_type,
      categoryId: listingRow.category_id,
      title: listingRow.title,
      shortDescription: listingRow.short_description,
      description: listingRow.description,
      brand: listingRow.brand,
      model: listingRow.model,
      sku: listingRow.sku,
      condition: listingRow.condition,
      currency: listingRow.currency,
      basePriceMinor: listingRow.base_price_minor,
      salePriceMinor: listingRow.sale_price_minor,
      compareAtPriceMinor: listingRow.compare_at_price_minor,
      fulfillmentModel: listingRow.fulfillment_model,
      visibility: listingRow.visibility,
      tags: listingRow.tags || [],
      attributes: existingAttributes,
      city: (listingRow.metadata && listingRow.metadata.city) || null,
      neighbourhood: (listingRow.metadata && listingRow.metadata.neighbourhood) || null,
      contactPhone: (listingRow.metadata && listingRow.metadata.contactPhone) || null,
      uploadIds: [],
      ...stripUndefined(input)
    };

    // A published listing must stay valid for publication after every edit.
    const forPublish = listingRow.status === 'PUBLISHED';

    const { value } = await ListingValidationService.validate(merged, {
      forPublish,
      mediaCount: media.length
    });

    const patch = {};
    for (const [clientField, column] of Object.entries(FIELD_MAP)) {
      if (value[clientField] !== undefined) patch[column] = value[clientField];
    }

    patch.metadata = {
      ...(listingRow.metadata || {}),
      city: value.city ?? (listingRow.metadata || {}).city ?? null,
      neighbourhood: value.neighbourhood ?? (listingRow.metadata || {}).neighbourhood ?? null,
      contactPhone: value.contactPhone ?? (listingRow.metadata || {}).contactPhone ?? null,
      lastEditedAt: new Date().toISOString()
    };

    const updated = await ListingRepository.update(listingRow.id, patch);

    if (input.attributes !== undefined) {
      await ListingRepository.replaceAttributes(updated.id, value.categoryId, value.attributes);
    }

    await CacheService.delete(`listing:${updated.id}`, 'catalog').catch(() => null);

    AnalyticsService.track(principal.id, 'listing_updated', {
      listingId: updated.id,
      storeId: updated.store_id,
      fields: Object.keys(stripUndefined(input))
    });

    logger.info(`[UpdateListing] user=${principal.id} listing=${updated.id} updated`);
    return CreateListingUseCase.hydrate(updated);
  }
}

function stripUndefined(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj || {})) {
    if (v !== undefined) out[k] = v;
  }
  return out;
}

module.exports = UpdateListingUseCase;
module.exports.FIELD_MAP = FIELD_MAP;
