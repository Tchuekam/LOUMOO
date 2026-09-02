/**
 * LOUMOO — Listing Composition
 * ---------------------------------------------------------------------------
 * A listing is not one row. It is a row plus stock, plus availability, plus a
 * variant matrix, plus the fulfilment and trust promises attached to it.
 *
 * This file is the ONE place that knows how the validated publishing payload
 * maps onto those tables, and how they map back. Create, edit and publish all
 * go through it, so a field cannot be persisted one way by the wizard and read
 * back another way by the editor.
 *
 * Where each block lands:
 *
 *     inventory       -> iam.listing_inventory      (variant_id IS NULL row)
 *     service         -> iam.listing_availability   + metadata.service
 *     variantOptions  -> iam.listing_variants       (regenerated matrix)
 *     fulfillment     -> metadata.fulfillment
 *     trust           -> metadata.trust
 *     price mode etc. -> metadata.pricing
 *
 * `metadata` carries the blocks that describe intent rather than state. They
 * are read on every render but never counted against, so a JSONB column is the
 * honest home for them; stock and schedule are state other systems transact
 * against, so those get real tables.
 */

const ListingRepository = require('../infrastructure/ListingRepository');
const ListingType = require('../domain/ListingType');

/** Maps a service format onto the availability strategy the DB understands. */
const STRATEGY_FOR_FORMAT = Object.freeze({
  ONE_TIME: 'UNLIMITED',
  APPOINTMENT: 'TIME_SLOT',
  BOOKING: 'DATE_RANGE',
  RECURRING: 'TIME_SLOT',
  QUOTE: 'UNLIMITED',
  ON_DEMAND: 'CAPACITY'
});

class ListingCompositionService {
  /**
   * Writes every structured block the payload actually carried.
   *
   * Absent blocks are left alone rather than reset: an autosave of the pricing
   * step must not wipe the availability the seller entered two steps earlier.
   */
  static async persistBlocks(listingId, value = {}, { categorySchema = null } = {}) {
    const caps = ListingType.getCapabilities(value.listingType);

    if (value.inventory && caps.hasInventory) {
      await ListingRepository.upsertInventory(listingId, {
        onHand: value.inventory.quantity,
        lowStockThreshold: value.inventory.lowStockThreshold,
        allowBackorder: value.inventory.allowBackorder,
        trackInventory: value.inventory.trackInventory
      });
    }

    if (value.service && (caps.hasServiceSchedule || caps.hasBookingDates)) {
      await ListingRepository.upsertAvailability(listingId, {
        strategy: STRATEGY_FOR_FORMAT[value.service.format] || 'TIME_SLOT',
        leadTimeHours: value.service.leadTimeHours,
        minDurationUnits: 1,
        maxDurationUnits: 30,
        capacityPerSlot: value.service.capacity || 1,
        weeklySchedule: value.service.weeklySchedule || {},
        blackoutDates: value.service.blackoutDates || []
      });
    }

    if (value.variantOptions !== undefined && caps.hasVariants) {
      const variants = this.buildVariantMatrix(value, categorySchema);
      await ListingRepository.replaceVariants(listingId, variants);
      await ListingRepository.update(listingId, { has_variants: variants.length > 0 });
    }
  }

  /**
   * Expands the chosen option values into the full combination matrix.
   *
   * Every variant starts at the listing price; the seller adjusts individual
   * rows afterwards. Stock for a combination that already existed is preserved
   * by the repository, so re-saving the step does not empty the shelf.
   */
  static buildVariantMatrix(value = {}, categorySchema = null) {
    const optionsMap = value.variantOptions || {};
    const keys = Object.keys(optionsMap).filter(k => (optionsMap[k] || []).length > 0);
    if (keys.length === 0) return [];

    const labelFor = new Map(
      ((categorySchema && categorySchema.attributes) || []).map(a => [a.slug, a.name])
    );

    let combos = [{}];
    for (const key of keys) {
      const next = [];
      for (const combo of combos) {
        for (const val of optionsMap[key]) {
          next.push({ ...combo, [key]: val });
        }
      }
      combos = next;
    }

    const skuRoot = (value.sku || value.brand || 'LM')
      .toString().toUpperCase().replace(/[^A-Z0-9]+/g, '').slice(0, 8) || 'LM';

    return combos.map((combo, i) => ({
      title: keys.map(k => combo[k]).join(' · '),
      sku: `${skuRoot}-${String(i + 1).padStart(3, '0')}`,
      optionsSummary: combo,
      priceMinor: value.salePriceMinor || value.basePriceMinor || 0,
      currency: value.currency || 'XAF',
      compareAtPriceMinor: value.compareAtPriceMinor ?? null,
      // Stock per combination is set on the inventory step; a fresh
      // combination starts empty rather than pretending to be in stock.
      stockQuantity: undefined,
      isActive: true,
      optionLabels: keys.map(k => labelFor.get(k) || k)
    }));
  }

  /**
   * The inverse of persistBlocks: rebuilds the publishing payload's structured
   * blocks from storage so the editor opens on exactly what was saved.
   */
  static async loadBlocks(listingRow) {
    const metadata = listingRow.metadata || {};
    const caps = ListingType.getCapabilities(listingRow.listing_type);

    const [inventoryRow, availabilityRow, variantRows] = await Promise.all([
      caps.hasInventory ? ListingRepository.getInventory(listingRow.id) : null,
      (caps.hasServiceSchedule || caps.hasBookingDates)
        ? ListingRepository.getAvailability(listingRow.id)
        : null,
      caps.hasVariants ? ListingRepository.listVariants(listingRow.id) : []
    ]);

    const service = metadata.service
      ? {
        ...metadata.service,
        leadTimeHours: availabilityRow ? availabilityRow.lead_time_hours : metadata.service.leadTimeHours,
        capacity: availabilityRow ? availabilityRow.capacity_per_slot : metadata.service.capacity,
        weeklySchedule: availabilityRow ? availabilityRow.weekly_schedule : metadata.service.weeklySchedule,
        blackoutDates: availabilityRow ? availabilityRow.blackout_dates : metadata.service.blackoutDates
      }
      : null;

    return {
      pricing: metadata.pricing || null,
      fulfillment: metadata.fulfillment || null,
      trust: metadata.trust || null,
      service,
      inventory: inventoryRow
        ? {
          trackInventory: inventoryRow.track_inventory,
          quantity: inventoryRow.on_hand,
          reserved: inventoryRow.reserved,
          lowStockThreshold: inventoryRow.low_stock_threshold,
          allowBackorder: inventoryRow.allow_backorder
        }
        : null,
      variantOptions: metadata.variantOptions || null,
      variants: (variantRows || []).map(v => ({
        id: v.id,
        title: v.title,
        sku: v.sku,
        options: v.options_summary || {},
        priceMinor: v.price_minor,
        currency: v.currency,
        compareAtPriceMinor: v.compare_at_price_minor,
        stockQuantity: v.stock_quantity,
        imageUrl: v.image_url,
        isActive: v.is_active
      }))
    };
  }

  /**
   * Folds the intent-describing blocks into the row's metadata column.
   *
   * Only the keys the caller actually sent are replaced — the same partial-save
   * rule persistBlocks follows, for the same reason.
   */
  static mergeMetadata(existingMetadata = {}, value = {}) {
    const metadata = { ...(existingMetadata || {}) };

    metadata.city = value.city ?? metadata.city ?? null;
    metadata.neighbourhood = value.neighbourhood ?? metadata.neighbourhood ?? null;
    metadata.contactPhone = value.contactPhone ?? metadata.contactPhone ?? null;

    metadata.pricing = {
      ...(metadata.pricing || {}),
      priceMode: value.priceMode ?? (metadata.pricing || {}).priceMode ?? 'FIXED',
      negotiable: value.negotiable ?? (metadata.pricing || {}).negotiable ?? false,
      taxIncluded: value.taxIncluded ?? (metadata.pricing || {}).taxIncluded ?? true,
      minOrderQuantity: value.minOrderQuantity ?? (metadata.pricing || {}).minOrderQuantity ?? null,
      wholesalePriceMinor: value.wholesalePriceMinor ?? (metadata.pricing || {}).wholesalePriceMinor ?? null
    };

    if (value.fulfillment !== undefined) {
      metadata.fulfillment = value.fulfillment;
    } else if (!metadata.fulfillment && value.fulfillmentModel) {
      const isDelivery = value.fulfillmentModel === 'DELIVERY' || value.fulfillmentModel === 'DELIVERY_OR_PICKUP';
      const isPickup = value.fulfillmentModel === 'PICKUP' || value.fulfillmentModel === 'DELIVERY_OR_PICKUP';
      metadata.fulfillment = {
        delivery: isDelivery,
        pickup: isPickup,
        deliveryScope: isDelivery ? 'CITY' : null,
        deliveryZones: isDelivery && value.city ? [value.city] : (isDelivery ? ['National'] : []),
        pickupAddress: isPickup ? (value.neighbourhood ? `${value.neighbourhood}, ${value.city || ''}` : (value.city || 'Store pickup')) : null
      };
    }
    if (value.trust !== undefined) metadata.trust = value.trust;
    if (value.service !== undefined) metadata.service = value.service;
    if (value.variantOptions !== undefined) metadata.variantOptions = value.variantOptions;

    metadata.lastEditedAt = new Date().toISOString();
    return metadata;
  }

  /**
   * Rebuilds the flat payload the validator expects from a stored row plus its
   * blocks. Publish and edit both re-validate the WHOLE listing, so they need
   * the stored state in the shape the schema describes.
   */
  static toValidationPayload(listingRow, blocks, attributes) {
    const metadata = listingRow.metadata || {};
    const pricing = blocks.pricing || {};

    let fulfillment = blocks.fulfillment;
    if (!fulfillment && listingRow.fulfillment_model) {
      const fm = listingRow.fulfillment_model;
      const isDelivery = fm === 'DELIVERY' || fm === 'DELIVERY_OR_PICKUP';
      const isPickup = fm === 'PICKUP' || fm === 'DELIVERY_OR_PICKUP';
      fulfillment = {
        delivery: isDelivery,
        pickup: isPickup,
        deliveryScope: isDelivery ? 'CITY' : null,
        deliveryZones: isDelivery && metadata.city ? [metadata.city] : (isDelivery ? ['National'] : []),
        pickupAddress: isPickup ? (metadata.neighbourhood ? `${metadata.neighbourhood}, ${metadata.city || ''}` : (metadata.city || 'Store pickup')) : null
      };
    }

    return {
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
      attributes,
      city: metadata.city || null,
      neighbourhood: metadata.neighbourhood || null,
      contactPhone: metadata.contactPhone || null,
      uploadIds: [],
      priceMode: pricing.priceMode || 'FIXED',
      negotiable: pricing.negotiable || false,
      taxIncluded: pricing.taxIncluded !== false,
      minOrderQuantity: pricing.minOrderQuantity ?? null,
      wholesalePriceMinor: pricing.wholesalePriceMinor ?? null,
      ...(blocks.inventory ? { inventory: stripNulls(blocks.inventory, ['reserved']) } : {}),
      ...(fulfillment ? { fulfillment } : {}),
      ...(blocks.service ? { service: blocks.service } : {}),
      ...(blocks.trust ? { trust: blocks.trust } : {}),
      ...(blocks.variantOptions ? { variantOptions: blocks.variantOptions } : {})
    };
  }
}

/** Drops read-only companions the strict schema would reject as unknown keys. */
function stripNulls(obj, drop = []) {
  const out = {};
  for (const [k, v] of Object.entries(obj || {})) {
    if (drop.includes(k) || v === null || v === undefined) continue;
    out[k] = v;
  }
  return out;
}

module.exports = ListingCompositionService;
module.exports.STRATEGY_FOR_FORMAT = STRATEGY_FOR_FORMAT;
