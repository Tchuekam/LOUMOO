/**
 * ListingInventory Domain Model
 * Concurrency-safe stock management protecting against race conditions.
 */

const { ConflictError, ValidationError } = require('../../../shared/errors/AppError');

class ListingInventory {
  constructor(data = {}) {
    this.id = data.id || null;
    this.listingId = data.listing_id || data.listingId || null;
    this.variantId = data.variant_id || data.variantId || null;
    this.onHand = Math.max(0, Number(data.on_hand ?? data.onHand ?? 0));
    this.reserved = Math.max(0, Number(data.reserved ?? data.reserved ?? 0));
    this.lowStockThreshold = Number(data.low_stock_threshold ?? data.lowStockThreshold ?? 3);
    this.allowBackorder = data.allow_backorder ?? data.allowBackorder ?? false;
    this.trackInventory = data.track_inventory ?? data.trackInventory ?? true;
    this.updatedAt = data.updated_at || data.updatedAt || new Date().toISOString();
  }

  get available() {
    if (!this.trackInventory) return 999999;
    return Math.max(0, this.onHand - this.reserved);
  }

  get isOutOfStock() {
    if (!this.trackInventory) return false;
    return this.available <= 0 && !this.allowBackorder;
  }

  get isLowStock() {
    if (!this.trackInventory) return false;
    return this.available > 0 && this.available <= this.lowStockThreshold;
  }

  canFulfill(requestedQty = 1) {
    if (!this.trackInventory || this.allowBackorder) return true;
    return this.available >= requestedQty;
  }

  reserve(quantity = 1) {
    if (quantity <= 0) throw new ValidationError('Reservation quantity must be positive.');
    if (!this.canFulfill(quantity)) {
      throw new ConflictError(`Insufficient stock. Requested: ${quantity}, Available: ${this.available}`);
    }
    this.reserved += quantity;
    this.updatedAt = new Date().toISOString();
    return this.available;
  }

  releaseReservation(quantity = 1) {
    if (quantity <= 0) return;
    this.reserved = Math.max(0, this.reserved - quantity);
    this.updatedAt = new Date().toISOString();
  }

  commitPurchase(quantity = 1) {
    if (quantity <= 0) return;
    this.reserved = Math.max(0, this.reserved - quantity);
    this.onHand = Math.max(0, this.onHand - quantity);
    this.updatedAt = new Date().toISOString();
  }

  restock(quantity = 1) {
    if (quantity <= 0) throw new ValidationError('Restock quantity must be positive.');
    this.onHand += quantity;
    this.updatedAt = new Date().toISOString();
  }

  toJSON() {
    return {
      id: this.id,
      listingId: this.listingId,
      variantId: this.variantId,
      onHand: this.onHand,
      reserved: this.reserved,
      available: this.available,
      isOutOfStock: this.isOutOfStock,
      isLowStock: this.isLowStock,
      lowStockThreshold: this.lowStockThreshold,
      allowBackorder: this.allowBackorder,
      trackInventory: this.trackInventory,
      updatedAt: this.updatedAt
    };
  }
}

module.exports = ListingInventory;
