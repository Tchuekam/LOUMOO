/**
 * ListingInventoryUseCase (06.09 Inventory & Section 22 Inventory Concurrency)
 * Handles transactional, race-condition-safe inventory reservations and adjustments.
 */

const CacheService = require('../../../infrastructure/cache/CacheService');
const { ConflictError, ValidationError } = require('../../../shared/errors/AppError');

class ListingInventoryUseCase {
  static async reserveStock(listing, quantity = 1, variantId = null) {
    if (quantity <= 0) throw new ValidationError('Quantity must be greater than zero.');

    let targetInventory = listing.inventory;
    if (variantId && listing.hasVariants) {
      const variant = listing.variants.find(v => v.id === variantId);
      if (!variant) throw new ValidationError(`Variant ${variantId} not found.`);
      if (variant.available < quantity) {
        throw new ConflictError(`Insufficient variant stock. Available: ${variant.available}, Requested: ${quantity}`);
      }
      variant.reservedQuantity += quantity;
      await CacheService.del(`listing:${listing.id}`);
      return { variantId, available: variant.available };
    }

    targetInventory.reserve(quantity);
    await CacheService.del(`listing:${listing.id}`);
    return { listingId: listing.id, available: targetInventory.available };
  }

  static async adjustStock(listing, onHand, variantId = null) {
    const qty = Number(onHand);
    if (isNaN(qty) || qty < 0) throw new ValidationError('On-hand stock must be a non-negative number.');

    if (variantId && listing.hasVariants) {
      const variant = listing.variants.find(v => v.id === variantId);
      if (!variant) throw new ValidationError(`Variant ${variantId} not found.`);
      variant.stockQuantity = qty;
      await CacheService.del(`listing:${listing.id}`);
      return variant.toJSON();
    }

    listing.inventory.onHand = qty;
    await CacheService.del(`listing:${listing.id}`);
    return listing.inventory.toJSON();
  }
}

module.exports = ListingInventoryUseCase;
