/**
 * PublicListingUseCase — buyer-facing listing detail (PDP).
 * ---------------------------------------------------------------------------
 * Serves ONLY listings that actually exist in the database.
 *
 * The previous revision, when the query returned nothing, fabricated a
 * "MacBook Air M2" belonging to a hardcoded seller id and served it with a
 * 200. A shopper could therefore be shown, and try to buy, a product that had
 * never been listed by anyone. A missing listing is now a 404.
 */

const CacheService = require('../../../infrastructure/cache/CacheService');
const AnalyticsService = require('../../../infrastructure/analytics/AnalyticsService');
const ListingRepository = require('../infrastructure/ListingRepository');
const StoreRepository = require('../../store/infrastructure/StoreRepository');
const MediaStorageService = require('../../../infrastructure/storage/MediaStorageService');
const { NotFoundError } = require('../../../shared/errors/AppError');
const Listing = require('../domain/Listing');
const ListingCompositionService = require('./ListingCompositionService');

class PublicListingUseCase {
  /**
   * @param {object|string} listingOrId  A row already loaded by the route (so
   *        the visibility check happens once, in one place), or an id/slug.
   * @param {string} userId  For analytics attribution only — never for access.
   */
  static async getListingDetail(listingOrId, userId = 'anonymous') {
    const row = typeof listingOrId === 'string'
      ? (await ListingRepository.findById(listingOrId)) || (await ListingRepository.findBySlug(listingOrId))
      : listingOrId;

    if (!row) {
      throw new NotFoundError('Listing', String(listingOrId));
    }

    const detail = await CacheService.remember(`listing:public:${row.id}`, 120, async () => {
      const [media, attributes, store, blocks] = await Promise.all([
        ListingRepository.listMedia(row.id),
        ListingRepository.listAttributes(row.id),
        StoreRepository.findByIdOrSlug(row.store_id),
        ListingCompositionService.loadBlocks(row)
      ]);

      const listing = new Listing(row);

      const images = await Promise.all(media.map(async m => ({
        id: m.id,
        url: m.storage_path
          ? (await MediaStorageService.createSignedUrl(m.storage_path)) || m.url
          : m.url,
        isCover: m.is_cover,
        displayOrder: m.display_order,
        width: m.width,
        height: m.height,
        altText: m.alt_text
      })));

      const metadata = row.metadata || {};

      return {
        ...listing.toPublicJSON(),
        attributes,
        media: images,
        coverImage: images.find(i => i.isCover) || images[0] || null,

        // The blocks a buyer needs in order to decide: how it reaches them,
        // what is promised with it, when it can be booked, whether it is in
        // stock. These are the same structures the seller filled in, so the
        // card a seller previewed is the card a buyer gets.
        pricingOptions: blocks.pricing,
        fulfillment: blocks.fulfillment,
        trust: blocks.trust,
        service: blocks.service,
        availability: blocks.inventory
          ? {
            inStock: !blocks.inventory.trackInventory
              || blocks.inventory.allowBackorder
              || (blocks.inventory.quantity - (blocks.inventory.reserved || 0)) > 0,
            // The exact count is the seller's business; buyers get the signal.
            lowStock: blocks.inventory.trackInventory
              && (blocks.inventory.quantity - (blocks.inventory.reserved || 0)) > 0
              && (blocks.inventory.quantity - (blocks.inventory.reserved || 0)) <= blocks.inventory.lowStockThreshold
          }
          : null,
        variants: (blocks.variants || []).filter(v => v.isActive).map(v => ({
          id: v.id, title: v.title, options: v.options,
          priceMinor: v.priceMinor, currency: v.currency,
          inStock: v.stockQuantity > 0, imageUrl: v.imageUrl
        })),
        location: { city: metadata.city || null, neighbourhood: metadata.neighbourhood || null },
        // A public storefront card only — never the merchant's private contact
        // details or verification internals.
        store: store
          ? {
            id: store.id,
            name: store.name,
            slug: store.slug,
            logoUrl: store.logo_url,
            isVerified: store.is_verified,
            verificationTier: store.verification_tier,
            rating: store.rating,
            ratingCount: store.rating_count,
            followerCount: store.follower_count
          }
          : null
      };
    }, 'catalog');

    AnalyticsService.track(userId, 'listing_viewed', {
      listingId: detail.id,
      title: detail.title,
      storeId: row.store_id
    });

    // View counting is best-effort telemetry; a failure must not break the PDP.
    ListingRepository.update(row.id, { view_count: (row.view_count || 0) + 1 }).catch(() => null);

    return detail;
  }
}

module.exports = PublicListingUseCase;
