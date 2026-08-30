/**
 * Master Universal Listing Domain Model (Prompt 06)
 * Single core entity powering physical goods, services, bookings, rentals, digital items, subscriptions & bundles.
 */

const ListingType = require('./ListingType');
const ListingPricing = require('./ListingPricing');
const ListingInventory = require('./ListingInventory');
const ListingAvailability = require('./ListingAvailability');
const ListingMedia = require('./ListingMedia');
const ListingVariant = require('./ListingVariant');

const LISTING_STATUSES = Object.freeze({
  DRAFT: 'DRAFT',
  PREVIEW: 'PREVIEW',
  READY: 'READY',
  PENDING_REVIEW: 'PENDING_REVIEW',
  PUBLISHED: 'PUBLISHED',
  PAUSED: 'PAUSED',
  ARCHIVED: 'ARCHIVED',
  REJECTED: 'REJECTED'
});

class Listing {
  constructor(data = {}) {
    this.id = data.id || `lst_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    this.storeId = data.store_id || data.storeId || null;
    this.sellerId = data.seller_id || data.sellerId || null;
    this.listingType = data.listing_type || data.listingType || ListingType.TYPES.PHYSICAL_PRODUCT;
    this.categoryId = data.category_id || data.categoryId || 'electronics';
    this.title = (data.title || '').trim();
    this.slug = data.slug || Listing.generateSlug(data.title || '');
    this.shortDescription = data.short_description || data.shortDescription || '';
    this.description = data.description || '';
    this.sku = data.sku || null;
    this.barcode = data.barcode || null;
    this.brand = data.brand || null;
    this.model = data.model || null;
    this.condition = data.condition || 'new'; // new, refurbished, used_like_new, used_good, pre_owned, not_applicable
    this.status = data.status || LISTING_STATUSES.DRAFT;
    this.rejectionReason = data.rejection_reason || data.rejectionReason || null;
    this.visibility = data.visibility || 'PUBLIC'; // PUBLIC, PRIVATE, UNLISTED
    this.tags = Array.isArray(data.tags) ? data.tags : [];
    this.hasVariants = data.has_variants ?? data.hasVariants ?? false;
    this.fulfillmentModel = data.fulfillment_model || data.fulfillmentModel || 'DELIVERY_OR_PICKUP';

    // Pricing entity
    this.pricing = new ListingPricing({
      currency: data.currency || (data.pricing && data.pricing.currency) || 'XAF',
      basePriceMinor: data.base_price_minor ?? data.basePriceMinor ?? (data.pricing && data.pricing.basePriceMinor) ?? 0,
      salePriceMinor: data.sale_price_minor ?? data.salePriceMinor ?? (data.pricing && data.pricing.salePriceMinor),
      compareAtPriceMinor: data.compare_at_price_minor ?? data.compareAtPriceMinor ?? (data.pricing && data.pricing.compareAtPriceMinor)
    });

    // Inventory entity
    this.inventory = new ListingInventory({
      listing_id: this.id,
      on_hand: data.on_hand ?? data.onHand ?? (data.inventory && data.inventory.onHand) ?? 10,
      reserved: data.reserved ?? (data.inventory && data.inventory.reserved) ?? 0,
      low_stock_threshold: data.low_stock_threshold ?? (data.inventory && data.inventory.lowStockThreshold) ?? 3,
      track_inventory: data.track_inventory ?? (data.inventory && data.inventory.trackInventory) ?? true
    });

    // Availability entity
    this.availability = new ListingAvailability({
      listing_id: this.id,
      availability_strategy: data.availability_strategy || (data.availability && data.availability.strategy) || 'STOCK',
      ...(data.availability || {})
    });

    // Media & Variants arrays
    this.media = (data.media || []).map(m => (m instanceof ListingMedia ? m : new ListingMedia(m)));
    this.variants = (data.variants || []).map(v => (v instanceof ListingVariant ? v : new ListingVariant(v)));
    this.attributes = data.attributes || {}; // Key-value object { brand: 'Apple', ram: '8GB' }

    // Metrics & Performance
    this.viewCount = Number(data.view_count ?? data.viewCount ?? 0);
    this.saveCount = Number(data.save_count ?? data.saveCount ?? 0);
    this.orderCount = Number(data.order_count ?? data.orderCount ?? 0);
    this.rating = Number(data.rating || 5.0);
    this.ratingCount = Number(data.rating_count ?? data.ratingCount ?? 0);
    this.metadata = data.metadata || {};
    this.publishedAt = data.published_at || data.publishedAt || null;
    this.createdAt = data.created_at || data.createdAt || new Date().toISOString();
    this.updatedAt = data.updated_at || data.updatedAt || new Date().toISOString();
    this.deletedAt = data.deleted_at || data.deletedAt || null;
  }

  static get STATUSES() {
    return LISTING_STATUSES;
  }

  static generateSlug(title) {
    if (!title) return 'item-' + Math.random().toString(36).substring(2, 8);
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '') + '-' + Math.random().toString(36).substring(2, 6);
  }

  get isPublished() {
    return this.status === LISTING_STATUSES.PUBLISHED && !this.deletedAt;
  }

  get isPubliclyVisible() {
    return this.isPublished && this.visibility === 'PUBLIC';
  }

  get coverImage() {
    const cover = this.media.find(m => m.isCover);
    return cover ? cover.url : (this.media[0] ? this.media[0].url : null);
  }

  toPublicJSON() {
    return {
      id: this.id,
      storeId: this.storeId,
      listingType: this.listingType,
      categoryId: this.categoryId,
      title: this.title,
      slug: this.slug,
      shortDescription: this.shortDescription,
      description: this.description,
      brand: this.brand,
      model: this.model,
      condition: this.condition,
      status: this.status,
      pricing: this.pricing.toJSON(),
      inventory: {
        available: this.inventory.available,
        isOutOfStock: this.inventory.isOutOfStock,
        isLowStock: this.inventory.isLowStock
      },
      hasVariants: this.hasVariants,
      variants: this.variants.filter(v => v.isActive).map(v => v.toJSON()),
      media: this.media.map(m => m.toJSON()),
      coverImage: this.coverImage,
      attributes: this.attributes,
      availability: this.availability.toJSON(),
      fulfillmentModel: this.fulfillmentModel,
      rating: this.rating,
      ratingCount: this.ratingCount,
      viewCount: this.viewCount,
      saveCount: this.saveCount,
      publishedAt: this.publishedAt
    };
  }

  toOwnerJSON() {
    return {
      ...this.toPublicJSON(),
      sellerId: this.sellerId,
      sku: this.sku,
      barcode: this.barcode,
      rejectionReason: this.rejectionReason,
      visibility: this.visibility,
      tags: this.tags,
      inventory: this.inventory.toJSON(),
      metadata: this.metadata,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      deletedAt: this.deletedAt
    };
  }
}

module.exports = Listing;
