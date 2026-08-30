/**
 * ListingPublishUseCase (06.14 Publish Listing & Section 30 Publishing State Machine)
 * Validates pre-conditions and transitions listing state between DRAFT, PUBLISHED, PAUSED, and ARCHIVED.
 */

const { SupabaseClient } = require('../../../infrastructure/database/SupabaseClient');
const CacheService = require('../../../infrastructure/cache/CacheService');
const ListingTaxonomyUseCase = require('./ListingTaxonomyUseCase');
const { ValidationError } = require('../../../shared/errors/AppError');
const AnalyticsService = require('../../../infrastructure/analytics/AnalyticsService');
const logger = require('../../../shared/logging/logger');

class ListingPublishUseCase {
  static async validateForPublishing(listing) {
    if (!listing.title || listing.title.trim().length < 3) {
      throw new ValidationError('Listing title must be at least 3 characters long.');
    }

    if (!listing.categoryId) {
      throw new ValidationError('A valid commercial category is required.');
    }

    if (listing.pricing.basePriceMinor <= 0 && !listing.hasVariants) {
      throw new ValidationError('Base price must be greater than zero.');
    }

    // Require at least one photo for physical products
    if (listing.listingType === 'PHYSICAL_PRODUCT' && (!listing.media || listing.media.length === 0)) {
      throw new ValidationError('At least one product photograph is required to publish.');
    }

    // Validate dynamic category required attributes
    await ListingTaxonomyUseCase.validateAttributesForCategory(listing.categoryId, listing.attributes);

    return true;
  }

  static async publish(listing, userProfile) {
    await this.validateForPublishing(listing);

    listing.status = 'PUBLISHED';
    listing.publishedAt = listing.publishedAt || new Date().toISOString();
    listing.updatedAt = new Date().toISOString();

    const supabase = SupabaseClient.admin;
    try {
      await supabase.from('iam.listings').update({
        status: 'PUBLISHED',
        published_at: listing.publishedAt,
        updated_at: listing.updatedAt
      }).eq('id', listing.id);
    } catch (err) {
      logger.warn(`[ListingPublish] Supabase update fallback: ${err.message}`);
    }

    await CacheService.del(`listing:${listing.id}`);
    await CacheService.del(`listing:${listing.slug}`);
    await CacheService.del(`listings:store:${listing.storeId}`);
    await CacheService.del('listings:public:all');

    AnalyticsService.track(userProfile.id, 'listing_published', {
      listingId: listing.id,
      storeId: listing.storeId,
      listingType: listing.listingType,
      price: listing.pricing.basePriceMinor
    });

    return listing.toOwnerJSON();
  }

  static async pause(listing) {
    listing.status = 'PAUSED';
    listing.updatedAt = new Date().toISOString();

    const supabase = SupabaseClient.admin;
    try {
      await supabase.from('iam.listings').update({
        status: 'PAUSED',
        updated_at: listing.updatedAt
      }).eq('id', listing.id);
    } catch (err) {
      logger.warn(`[ListingPublish] Pause fallback: ${err.message}`);
    }

    await CacheService.del(`listing:${listing.id}`);
    await CacheService.del(`listing:${listing.slug}`);
    return listing.toOwnerJSON();
  }

  static async archive(listing) {
    listing.status = 'ARCHIVED';
    listing.deletedAt = new Date().toISOString();
    listing.updatedAt = new Date().toISOString();

    const supabase = SupabaseClient.admin;
    try {
      await supabase.from('iam.listings').update({
        status: 'ARCHIVED',
        deleted_at: listing.deletedAt,
        updated_at: listing.updatedAt
      }).eq('id', listing.id);
    } catch (err) {
      logger.warn(`[ListingPublish] Archive fallback: ${err.message}`);
    }

    await CacheService.del(`listing:${listing.id}`);
    await CacheService.del(`listing:${listing.slug}`);
    await CacheService.del(`listings:store:${listing.storeId}`);
    return listing.toOwnerJSON();
  }
}

module.exports = ListingPublishUseCase;
