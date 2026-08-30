/**
 * ListingVariant Domain Model
 * Supports combinatorial options (Color, Size, Storage, RAM, etc.) with dedicated pricing and inventory.
 */

class ListingVariant {
  constructor(data = {}) {
    this.id = data.id || `var_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    this.listingId = data.listing_id || data.listingId || null;
    this.sku = data.sku || '';
    this.barcode = data.barcode || null;
    this.title = data.title || 'Standard';
    this.optionsSummary = data.options_summary || data.optionsSummary || {};
    this.priceMinor = Number(data.price_minor ?? data.priceMinor ?? 0);
    this.currency = (data.currency || 'XAF').toUpperCase();
    this.compareAtPriceMinor = data.compare_at_price_minor !== undefined || data.compareAtPriceMinor !== undefined
      ? Number(data.compare_at_price_minor ?? data.compareAtPriceMinor)
      : null;
    this.stockQuantity = Number(data.stock_quantity ?? data.stockQuantity ?? 0);
    this.reservedQuantity = Number(data.reserved_quantity ?? data.reservedQuantity ?? 0);
    this.imageUrl = data.image_url || data.imageUrl || null;
    this.weightGrams = data.weight_grams ? Number(data.weight_grams) : null;
    this.isActive = data.is_active ?? data.isActive ?? true;
    this.createdAt = data.created_at || data.createdAt || new Date().toISOString();
    this.updatedAt = data.updated_at || data.updatedAt || new Date().toISOString();
  }

  get available() {
    return Math.max(0, this.stockQuantity - this.reservedQuantity);
  }

  toJSON() {
    return {
      id: this.id,
      listingId: this.listingId,
      sku: this.sku,
      barcode: this.barcode,
      title: this.title,
      optionsSummary: this.optionsSummary,
      priceMinor: this.priceMinor,
      currency: this.currency,
      compareAtPriceMinor: this.compareAtPriceMinor,
      stockQuantity: this.stockQuantity,
      reservedQuantity: this.reservedQuantity,
      available: this.available,
      imageUrl: this.imageUrl,
      weightGrams: this.weightGrams,
      isActive: this.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

module.exports = ListingVariant;
