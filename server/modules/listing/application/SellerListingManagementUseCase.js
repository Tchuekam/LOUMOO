/**
 * SellerListingManagementUseCase — the merchant's own listings.
 * ---------------------------------------------------------------------------
 * Returns exactly what this store has listed, and nothing else.
 *
 * The previous revision seeded the result with three hardcoded listings
 * belonging to a fictional "Orca Electronics" store, and fell back to them
 * whenever the database query returned nothing. A brand-new seller therefore
 * opened their studio to three MacBooks they had never listed, complete with
 * order counts. A store with no listings now correctly returns none.
 */

const CacheService = require('../../../infrastructure/cache/CacheService');
const ListingRepository = require('../infrastructure/ListingRepository');
const MediaStorageService = require('../../../infrastructure/storage/MediaStorageService');
const { ValidationError } = require('../../../shared/errors/AppError');

const VALID_STATUSES = ['DRAFT', 'PREVIEW', 'READY', 'PENDING_REVIEW', 'PUBLISHED', 'PAUSED', 'ARCHIVED', 'REJECTED'];

class SellerListingManagementUseCase {
  /**
   * @param {object} store    Resolved from the authenticated principal's own
   *                          membership — never from a client-supplied id.
   * @param {object} filters  status | search | page | limit
   */
  static async getSellerListings(store, filters = {}) {
    const status = (filters.status || 'all').toString();
    const search = (filters.search || '').toString().trim();
    const page = Math.max(1, parseInt(filters.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(filters.limit, 10) || 50));

    if (status !== 'all' && !VALID_STATUSES.includes(status.toUpperCase())) {
      throw new ValidationError(`Unknown listing status "${status}".`, {
        fields: [{ field: 'status', message: `Expected one of: all, ${VALID_STATUSES.join(', ')}` }]
      });
    }

    const cacheKey = `listings:store:${store.id}:${status}:${search}:${page}:${limit}`;

    return CacheService.remember(cacheKey, 30, async () => {
      // Every listing for this store, so the tab counts are accurate rather
      // than counts of whatever happened to fit on the current page.
      const all = await this._loadAllForStore(store.id);

      let filtered = all;
      if (status !== 'all') {
        filtered = filtered.filter(l => l.status === status.toUpperCase());
      }
      if (search) {
        const needle = search.toLowerCase();
        filtered = filtered.filter(l =>
          (l.title || '').toLowerCase().includes(needle)
          || (l.brand || '').toLowerCase().includes(needle)
          || (l.model || '').toLowerCase().includes(needle)
        );
      }

      const startIndex = (page - 1) * limit;
      const pageItems = filtered.slice(startIndex, startIndex + limit);

      // Cover images are signed on read; storage is private, so a stale URL
      // would render as a broken thumbnail in the seller's studio.
      const withCovers = await Promise.all(pageItems.map(async listing => {
        const media = await ListingRepository.listMedia(listing.id);
        const cover = media.find(m => m.is_cover) || media[0] || null;
        return {
          ...listing,
          imageCount: media.length,
          coverUrl: cover
            ? (cover.storage_path
              ? (await MediaStorageService.createSignedUrl(cover.storage_path)) || cover.url
              : cover.url)
            : null
        };
      }));

      return {
        listings: withCovers,
        tabCounts: {
          all: all.length,
          live: all.filter(l => l.status === 'PUBLISHED').length,
          drafts: all.filter(l => l.status === 'DRAFT').length,
          sold: all.filter(l => (l.order_count || 0) > 0).length,
          paused: all.filter(l => l.status === 'PAUSED').length,
          archived: all.filter(l => l.status === 'ARCHIVED').length
        },
        total: filtered.length,
        page,
        limit,
        hasMore: startIndex + pageItems.length < filtered.length
      };
    }, 'catalog');
  }

  /** Pages through the repository so a large catalogue is fully counted. */
  static async _loadAllForStore(storeId) {
    const collected = [];
    const pageSize = 200;
    let offset = 0;

    for (;;) {
      const { listings, total } = await ListingRepository.listForStore(storeId, {
        limit: pageSize,
        offset
      });
      collected.push(...listings);
      offset += listings.length;
      if (listings.length === 0 || collected.length >= total) break;
    }

    return collected;
  }
}

module.exports = SellerListingManagementUseCase;
module.exports.VALID_STATUSES = VALID_STATUSES;
