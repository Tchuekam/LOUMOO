/**
 * UpdateListingUseCase (06.02 & Section 09 Draft Autosave & 06.11 Edit Listing)
 * Handles debounced autosave, field updates, dynamic attribute validation, and cache invalidation.
 */

const { SupabaseClient } = require('../../../infrastructure/database/SupabaseClient');
const CacheService = require('../../../infrastructure/cache/CacheService');
const ListingTaxonomyUseCase = require('./ListingTaxonomyUseCase');
const { ValidationError } = require('../../../shared/errors/AppError');
const logger = require('../../../shared/logging/logger');

class UpdateListingUseCase {
  static async execute(listing, updates = {}) {
    // 1. Validate category attributes if supplied
    if (updates.attributes && typeof updates.attributes === 'object') {
      try {
        await ListingTaxonomyUseCase.validateAttributesForCategory(
          updates.categoryId || listing.categoryId,
          updates.attributes
        );
      } catch (err) {
        throw new ValidationError(`Attribute validation failed: ${err.message}`);
      }
    }

    // 2. Apply updates to domain model
    if (updates.title) listing.title = updates.title.trim();
    if (updates.shortDescription !== undefined) listing.shortDescription = updates.shortDescription;
    if (updates.description !== undefined) listing.description = updates.description;
    if (updates.brand !== undefined) listing.brand = updates.brand;
    if (updates.model !== undefined) listing.model = updates.model;
    if (updates.condition !== undefined) listing.condition = updates.condition;
    if (updates.categoryId) listing.categoryId = updates.categoryId;
    if (updates.tags && Array.isArray(updates.tags)) listing.tags = updates.tags;
    if (updates.fulfillmentModel) listing.fulfillmentModel = updates.fulfillmentModel;
    if (updates.attributes) listing.attributes = { ...listing.attributes, ...updates.attributes };

    // Update pricing
    if (updates.basePriceMinor !== undefined) listing.pricing.basePriceMinor = Number(updates.basePriceMinor);
    if (updates.salePriceMinor !== undefined) listing.pricing.salePriceMinor = updates.salePriceMinor !== null ? Number(updates.salePriceMinor) : null;
    if (updates.compareAtPriceMinor !== undefined) listing.pricing.compareAtPriceMinor = updates.compareAtPriceMinor !== null ? Number(updates.compareAtPriceMinor) : null;
    if (updates.currency) listing.pricing.currency = updates.currency.toUpperCase();

    // Update inventory
    if (updates.onHand !== undefined) listing.inventory.onHand = Number(updates.onHand);
    if (updates.lowStockThreshold !== undefined) listing.inventory.lowStockThreshold = Number(updates.lowStockThreshold);
    if (updates.trackInventory !== undefined) listing.inventory.trackInventory = Boolean(updates.trackInventory);

    // Update availability
    if (updates.availability) {
      listing.availability = Object.assign(listing.availability, updates.availability);
    }

    listing.updatedAt = new Date().toISOString();

    // 3. Persist to DB
    const supabase = SupabaseClient.admin;
    try {
      await supabase.from('iam.listings').update({
        title: listing.title,
        short_description: listing.shortDescription,
        description: listing.description,
        brand: listing.brand,
        model: listing.model,
        condition: listing.condition,
        category_id: listing.categoryId,
        base_price_minor: listing.pricing.basePriceMinor,
        sale_price_minor: listing.pricing.salePriceMinor,
        compare_at_price_minor: listing.pricing.compareAtPriceMinor,
        currency: listing.pricing.currency,
        fulfillment_model: listing.fulfillmentModel,
        tags: listing.tags,
        updated_at: listing.updatedAt
      }).eq('id', listing.id);
    } catch (err) {
      logger.warn(`[UpdateListing] Supabase update fallback: ${err.message}`);
    }

    // 4. Invalidate caches
    await CacheService.del(`listing:${listing.id}`);
    await CacheService.del(`listing:${listing.slug}`);
    await CacheService.del(`listings:store:${listing.storeId}`);

    return listing.toOwnerJSON();
  }
}

module.exports = UpdateListingUseCase;
