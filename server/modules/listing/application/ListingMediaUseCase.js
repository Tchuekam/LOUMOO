/**
 * ListingMediaUseCase (06.03 Image Upload, 06.04 Camera, 06.05 Processing)
 * Manages media attachments, covers, display ordering, and asset metadata.
 */

const { SupabaseClient } = require('../../../infrastructure/database/SupabaseClient');
const ListingMedia = require('../domain/ListingMedia');
const CacheService = require('../../../infrastructure/cache/CacheService');
const { ValidationError, NotFoundError } = require('../../../shared/errors/AppError');
const logger = require('../../../shared/logging/logger');

class ListingMediaUseCase {
  static async addMedia(listing, mediaPayload = {}) {
    const url = (mediaPayload.url || '').trim();
    if (!url) {
      throw new ValidationError('Media asset URL is required.');
    }

    const isFirstImage = (listing.media || []).length === 0;
    const isCover = mediaPayload.isCover !== undefined ? Boolean(mediaPayload.isCover) : isFirstImage;

    const media = new ListingMedia({
      listing_id: listing.id,
      url: url,
      thumbnail_url: mediaPayload.thumbnailUrl || url,
      media_type: mediaPayload.mediaType || 'IMAGE',
      display_order: listing.media.length,
      is_cover: isCover,
      width: mediaPayload.width,
      height: mediaPayload.height,
      file_size_bytes: mediaPayload.fileSizeBytes,
      mime_type: mediaPayload.mimeType || 'image/jpeg',
      alt_text: mediaPayload.altText || listing.title
    });

    if (isCover) {
      listing.media.forEach(m => { m.isCover = false; });
    }

    listing.media.push(media);

    const supabase = SupabaseClient.admin;
    try {
      await supabase.from('iam.listing_media').insert({
        id: media.id,
        listing_id: media.listingId,
        media_type: media.mediaType,
        url: media.url,
        thumbnail_url: media.thumbnailUrl,
        display_order: media.displayOrder,
        is_cover: media.isCover,
        width: media.width,
        height: media.height,
        file_size_bytes: media.fileSizeBytes,
        mime_type: media.mimeType,
        alt_text: media.altText
      });
    } catch (err) {
      logger.warn(`[ListingMedia] Supabase insert fallback: ${err.message}`);
    }

    await CacheService.del(`listing:${listing.id}`);
    return media.toJSON();
  }

  static async removeMedia(listing, mediaId) {
    const index = listing.media.findIndex(m => m.id === mediaId);
    if (index === -1) {
      throw new NotFoundError('MediaAsset', mediaId);
    }

    const wasCover = listing.media[index].isCover;
    listing.media.splice(index, 1);

    // If removed cover, make the first remaining image the cover
    if (wasCover && listing.media.length > 0) {
      listing.media[0].isCover = true;
    }

    const supabase = SupabaseClient.admin;
    try {
      await supabase.from('iam.listing_media').delete().eq('id', mediaId);
    } catch (err) {
      logger.warn(`[ListingMedia] Supabase delete fallback: ${err.message}`);
    }

    await CacheService.del(`listing:${listing.id}`);
    return { success: true, remainingCount: listing.media.length };
  }

  static async setCover(listing, mediaId) {
    const media = listing.media.find(m => m.id === mediaId);
    if (!media) {
      throw new NotFoundError('MediaAsset', mediaId);
    }

    listing.media.forEach(m => {
      m.isCover = m.id === mediaId;
    });

    await CacheService.del(`listing:${listing.id}`);
    return { success: true, coverId: mediaId };
  }
}

module.exports = ListingMediaUseCase;
