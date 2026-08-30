/**
 * CreateListingUseCase (06.02 & Section 08 Create Listing)
 * Initializes a new universal listing draft bound to the merchant's store.
 */

const { SupabaseClient } = require('../../../infrastructure/database/SupabaseClient');
const { ValidationError } = require('../../../shared/errors/AppError');
const Listing = require('../domain/Listing');
const ListingType = require('../domain/ListingType');
const ListingTaxonomyUseCase = require('./ListingTaxonomyUseCase');
const AnalyticsService = require('../../../infrastructure/analytics/AnalyticsService');
const logger = require('../../../shared/logging/logger');

class CreateListingUseCase {
  static async execute(store, userProfile, input = {}) {
    const listingType = input.listingType || ListingType.TYPES.PHYSICAL_PRODUCT;
    if (!ListingType.isValid(listingType)) {
      throw new ValidationError(`Invalid listing type: ${listingType}`);
    }

    const categoryId = input.categoryId || 'smartphones';
    const category = await ListingTaxonomyUseCase.findCategoryById(categoryId);
    if (!category) {
      throw new ValidationError(`Category "${categoryId}" is not recognized in the marketplace taxonomy.`);
    }

    const title = (input.title || 'Untitled Draft Listing').trim();
    const listing = new Listing({
      store_id: store.id,
      seller_id: userProfile.id,
      listing_type: listingType,
      category_id: category.id,
      title: title,
      short_description: input.shortDescription || '',
      description: input.description || '',
      brand: input.brand || null,
      model: input.model || null,
      condition: input.condition || 'new',
      status: 'DRAFT',
      visibility: 'PUBLIC',
      currency: input.currency || 'XAF',
      base_price_minor: Number(input.basePriceMinor ?? 0),
      sale_price_minor: input.salePriceMinor ? Number(input.salePriceMinor) : null,
      fulfillment_model: input.fulfillmentModel || 'DELIVERY_OR_PICKUP',
      attributes: input.attributes || {},
      metadata: { createdVia: 'web_listing_wizard', ...input.metadata }
    });

    const supabase = SupabaseClient.admin;
    try {
      await supabase.from('iam.listings').insert({
        id: listing.id,
        store_id: listing.storeId,
        seller_id: listing.sellerId,
        listing_type: listing.listingType,
        category_id: listing.categoryId,
        title: listing.title,
        slug: listing.slug,
        short_description: listing.shortDescription,
        description: listing.description,
        brand: listing.brand,
        model: listing.model,
        condition: listing.condition,
        status: listing.status,
        visibility: listing.visibility,
        currency: listing.pricing.currency,
        base_price_minor: listing.pricing.basePriceMinor,
        sale_price_minor: listing.pricing.salePriceMinor,
        fulfillment_model: listing.fulfillmentModel,
        metadata: listing.metadata,
        created_at: listing.createdAt,
        updated_at: listing.updatedAt
      });
    } catch (err) {
      logger.warn(`[CreateListing] Supabase insert fallback: ${err.message}`);
    }

    AnalyticsService.track(userProfile.id, 'listing_draft_created', {
      listingId: listing.id,
      storeId: store.id,
      listingType: listing.listingType,
      categoryId: listing.categoryId
    });

    return listing.toOwnerJSON();
  }
}

module.exports = CreateListingUseCase;
