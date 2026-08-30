/**
 * ListingMedia Domain Model
 * Media asset management for product photos, videos, and documentation.
 */

class ListingMedia {
  constructor(data = {}) {
    this.id = data.id || `med_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    this.listingId = data.listing_id || data.listingId || null;
    this.mediaType = (data.media_type || data.mediaType || 'IMAGE').toUpperCase(); // IMAGE, VIDEO, DOCUMENT
    this.url = data.url || '';
    this.thumbnailUrl = data.thumbnail_url || data.thumbnailUrl || data.url || '';
    this.displayOrder = Number(data.display_order ?? data.displayOrder ?? 0);
    this.isCover = data.is_cover ?? data.isCover ?? false;
    this.width = data.width ? Number(data.width) : null;
    this.height = data.height ? Number(data.height) : null;
    this.fileSizeBytes = data.file_size_bytes ? Number(data.file_size_bytes) : null;
    this.mimeType = data.mime_type || data.mimeType || 'image/jpeg';
    this.altText = data.alt_text || data.altText || '';
    this.createdAt = data.created_at || data.createdAt || new Date().toISOString();
  }

  toJSON() {
    return {
      id: this.id,
      listingId: this.listingId,
      mediaType: this.mediaType,
      url: this.url,
      thumbnailUrl: this.thumbnailUrl,
      displayOrder: this.displayOrder,
      isCover: this.isCover,
      width: this.width,
      height: this.height,
      fileSizeBytes: this.fileSizeBytes,
      mimeType: this.mimeType,
      altText: this.altText,
      createdAt: this.createdAt
    };
  }
}

module.exports = ListingMedia;
