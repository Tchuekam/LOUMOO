/**
 * LOUMOO — Listing Media Use Case
 * ---------------------------------------------------------------------------
 * Attaches, removes and reorders the images on a listing the caller owns.
 *
 * Media rows are always scoped by `listing_id` at the database level, so a
 * request to delete media X from listing A cannot reach media X of listing B
 * even if the ids are guessed correctly.
 */

const ListingRepository = require('../infrastructure/ListingRepository');
const MediaStorageService = require('../../../infrastructure/storage/MediaStorageService');
const CreateListingUseCase = require('./CreateListingUseCase');
const CacheService = require('../../../infrastructure/cache/CacheService');
const logger = require('../../../shared/logging/logger');
const {
  ValidationError,
  NotFoundError,
  AuthorizationError
} = require('../../../shared/errors/AppError');

const MAX_IMAGES = MediaStorageService.limits.maxImagesPerListing;

class ListingMediaUseCase {
  /**
   * Attaches previously staged uploads to a listing.
   *
   * The uploads must belong to the caller and to the same boutique — an id
   * from someone else's staging area is a 403, not a silent success.
   */
  static async attach({ listingRow, principal, uploadIds }) {
    if (!Array.isArray(uploadIds) || uploadIds.length === 0) {
      throw new ValidationError('Provide at least one uploadId to attach.', {
        fields: [{ field: 'uploadIds', message: 'Required' }]
      });
    }

    const existing = await ListingRepository.listMedia(listingRow.id);
    if (existing.length + uploadIds.length > MAX_IMAGES) {
      throw new ValidationError(
        `A listing can have at most ${MAX_IMAGES} images. This one already has ${existing.length}.`,
        { fields: [{ field: 'images', message: `Limit is ${MAX_IMAGES}` }] }
      );
    }

    const staged = await MediaStorageService.loadOwnedStaged(uploadIds, principal.id);

    for (const upload of staged) {
      if (upload.store_id && upload.store_id !== listingRow.store_id) {
        throw new AuthorizationError('One of those images was uploaded for a different boutique.');
      }
    }

    let inserted;
    try {
      inserted = await CreateListingUseCase._attachMedia(listingRow.id, staged, principal.id);
    } catch (err) {
      // The images were never linked, so release them instead of leaving the
      // seller with storage consumed by assets no listing references.
      await MediaStorageService.discard(staged.map(u => u.id), 'media attach failed');
      throw err;
    }

    await CacheService.delete(`listing:${listingRow.id}`, 'catalog').catch(() => null);
    logger.info(`[ListingMedia] listing=${listingRow.id} attached ${inserted.length} image(s)`);

    return {
      attached: inserted.length,
      media: await this.list(listingRow.id)
    };
  }

  static async list(listingId) {
    const media = await ListingRepository.listMedia(listingId);
    // Signed URLs expire; re-sign on read so a returning seller always sees
    // their own photos rather than a wall of broken images.
    return Promise.all(media.map(async m => ({
      id: m.id,
      url: m.storage_path ? (await MediaStorageService.createSignedUrl(m.storage_path)) || m.url : m.url,
      thumbnailUrl: m.thumbnail_url,
      isCover: m.is_cover,
      displayOrder: m.display_order,
      width: m.width,
      height: m.height,
      mimeType: m.mime_type,
      fileSizeBytes: m.file_size_bytes
    })));
  }

  /** Removes one image and the object behind it. */
  static async remove({ listingRow, mediaId }) {
    const removed = await ListingRepository.deleteMedia(listingRow.id, mediaId);
    if (!removed) {
      throw new NotFoundError('MediaAsset', mediaId);
    }

    if (removed.upload_session_id) {
      await MediaStorageService.discard([removed.upload_session_id], 'media removed by seller');
    } else if (removed.storage_path) {
      await MediaStorageService.db.storage
        .from(removed.storage_bucket || MediaStorageService.bucket)
        .remove([removed.storage_path])
        .catch(err => logger.warn(`[ListingMedia] Object cleanup failed for ${removed.storage_path}: ${err.message}`));
    }

    // Keep display_order contiguous and guarantee a cover always exists.
    const remaining = await ListingRepository.listMedia(listingRow.id);
    if (remaining.length > 0) {
      await ListingRepository.setMediaOrder(listingRow.id, remaining.map(m => m.id));
    }

    await CacheService.delete(`listing:${listingRow.id}`, 'catalog').catch(() => null);
    logger.info(`[ListingMedia] listing=${listingRow.id} removed media=${mediaId}`);

    return { success: true, remainingCount: remaining.length };
  }

  /**
   * Reorders images. The submitted ids must be exactly the listing's own set —
   * a foreign id in the array is rejected rather than ignored.
   */
  static async reorder({ listingRow, orderedMediaIds }) {
    if (!Array.isArray(orderedMediaIds) || orderedMediaIds.length === 0) {
      throw new ValidationError('Provide the full ordered list of media ids.');
    }

    const current = await ListingRepository.listMedia(listingRow.id);
    const currentIds = new Set(current.map(m => m.id));

    const foreign = orderedMediaIds.filter(id => !currentIds.has(id));
    if (foreign.length > 0) {
      throw new ValidationError('That media does not belong to this listing.', {
        fields: [{ field: 'mediaIds', message: `Unknown for this listing: ${foreign.join(', ')}` }]
      });
    }
    if (orderedMediaIds.length !== current.length) {
      throw new ValidationError('Send every image id exactly once when reordering.', {
        fields: [{ field: 'mediaIds', message: `Expected ${current.length} ids, received ${orderedMediaIds.length}` }]
      });
    }

    await ListingRepository.setMediaOrder(listingRow.id, orderedMediaIds);
    await CacheService.delete(`listing:${listingRow.id}`, 'catalog').catch(() => null);
    return { media: await this.list(listingRow.id) };
  }

  static async setCover({ listingRow, mediaId }) {
    const current = await ListingRepository.listMedia(listingRow.id);
    if (!current.some(m => m.id === mediaId)) {
      throw new NotFoundError('MediaAsset', mediaId);
    }
    const reordered = [mediaId, ...current.filter(m => m.id !== mediaId).map(m => m.id)];
    await ListingRepository.setMediaOrder(listingRow.id, reordered);
    await CacheService.delete(`listing:${listingRow.id}`, 'catalog').catch(() => null);
    return { media: await this.list(listingRow.id) };
  }
}

module.exports = ListingMediaUseCase;
