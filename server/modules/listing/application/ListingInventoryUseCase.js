/**
 * LOUMOO — Listing Inventory
 * ---------------------------------------------------------------------------
 * Stock is state other systems transact against, so it lives in
 * `iam.listing_inventory` (listing level) and `iam.listing_variants.stock_quantity`
 * (per combination), never in a JSON blob.
 *
 * The reservation helpers below operate on a loaded `ListingInventory` entity
 * so the concurrency rules stay in the domain model; `adjustStock` is the
 * seller-facing write and goes straight to the repository.
 */

const ListingRepository = require('../infrastructure/ListingRepository');
const ListingInventory = require('../domain/ListingInventory');
const CacheService = require('../../../infrastructure/cache/CacheService');
const { ConflictError, ValidationError, NotFoundError } = require('../../../shared/errors/AppError');

class ListingInventoryUseCase {
  /**
   * Sets the on-hand quantity, either for the listing or for one variant.
   *
   * @param {object} ctx
   * @param {object} ctx.listingRow          Loaded by the ownership guard.
   * @param {number} ctx.onHand
   * @param {string} [ctx.variantId]         Adjust one combination instead.
   * @param {number} [ctx.lowStockThreshold]
   * @param {boolean} [ctx.allowBackorder]
   * @param {boolean} [ctx.trackInventory]
   */
  static async adjustStock({
    listingRow,
    onHand,
    variantId = null,
    lowStockThreshold,
    allowBackorder,
    trackInventory
  }) {
    const qty = Number(onHand);
    if (!Number.isFinite(qty) || qty < 0) {
      throw new ValidationError('On-hand stock must be a non-negative number.', {
        fields: [{ field: 'onHand', message: 'Use zero or more.' }]
      });
    }

    if (variantId) {
      const updated = await ListingRepository.updateVariant(listingRow.id, variantId, {
        stockQuantity: qty
      });
      if (!updated) throw new NotFoundError('ListingVariant', variantId);
      await CacheService.delete(`listing:${listingRow.id}`, 'catalog').catch(() => null);
      return {
        variantId: updated.id,
        title: updated.title,
        options: updated.options_summary || {},
        stockQuantity: updated.stock_quantity
      };
    }

    const existing = await ListingRepository.getInventory(listingRow.id);

    const row = await ListingRepository.upsertInventory(listingRow.id, {
      onHand: qty,
      lowStockThreshold: lowStockThreshold ?? (existing ? existing.low_stock_threshold : 3),
      allowBackorder: allowBackorder ?? (existing ? existing.allow_backorder : false),
      trackInventory: trackInventory ?? (existing ? existing.track_inventory : true)
    });

    await CacheService.delete(`listing:${listingRow.id}`, 'catalog').catch(() => null);
    await CacheService.delPattern(`listings:store:${listingRow.store_id}:*`, 'catalog').catch(() => null);

    return new ListingInventory(row).toJSON();
  }

  /** Reads the listing-level stock record, or null when nothing is tracked. */
  static async get(listingId) {
    const row = await ListingRepository.getInventory(listingId);
    return row ? new ListingInventory(row).toJSON() : null;
  }

  /**
   * Holds stock for an in-flight order. The domain entity owns the rule about
   * what "available" means; this only persists the outcome.
   */
  static async reserveStock(listingId, quantity = 1) {
    if (quantity <= 0) throw new ValidationError('Quantity must be greater than zero.');

    const row = await ListingRepository.getInventory(listingId);
    if (!row) throw new ConflictError('This listing does not track stock.');

    const inventory = new ListingInventory(row);
    inventory.reserve(quantity);   // throws ConflictError when it cannot

    const saved = await ListingRepository.upsertInventory(listingId, {
      onHand: inventory.onHand,
      reserved: inventory.reserved,
      lowStockThreshold: inventory.lowStockThreshold,
      allowBackorder: inventory.allowBackorder,
      trackInventory: inventory.trackInventory
    });

    await CacheService.delete(`listing:${listingId}`, 'catalog').catch(() => null);
    return new ListingInventory(saved).toJSON();
  }
}

module.exports = ListingInventoryUseCase;
