/**
 * LOUMOO — Listing Variants
 * ---------------------------------------------------------------------------
 * A variant is a real, orderable row: "Black / M — 5 in stock" is a different
 * thing to sell than "Black / L — 12 in stock".
 *
 * The previous revision expanded the matrix in memory, assigned it onto a
 * hydrated plain object and returned the JSON. Nothing was ever written, so the
 * seller saw a variant table that did not survive the next page load, and
 * `listing.pricing.basePriceMinor` threw because `hydrate()` does not return a
 * domain entity. Both are fixed by going through the repository.
 */

const ListingRepository = require('../infrastructure/ListingRepository');
const ListingCompositionService = require('./ListingCompositionService');
const ListingTaxonomyUseCase = require('./ListingTaxonomyUseCase');
const CacheService = require('../../../infrastructure/cache/CacheService');
const { ValidationError, NotFoundError } = require('../../../shared/errors/AppError');

/** Guards against an option matrix nobody could manage or fulfil. */
const MAX_COMBINATIONS = 100;

class ListingVariantsUseCase {
  static generateCartesianCombinations(optionsMap = {}) {
    const keys = Object.keys(optionsMap).filter(k => Array.isArray(optionsMap[k]) && optionsMap[k].length > 0);
    if (keys.length === 0) return [];

    let results = [{}];
    for (const key of keys) {
      const next = [];
      for (const partial of results) {
        for (const value of optionsMap[key]) {
          next.push({ ...partial, [key]: value });
        }
      }
      results = next;
    }
    return results;
  }

  /**
   * Replaces the listing's variant matrix and persists it.
   *
   * @param {object} ctx
   * @param {object} ctx.listingRow      Loaded by the ownership guard.
   * @param {object} ctx.optionsMap      { storage: ['128GB','256GB'], color: [...] }
   * @param {number} [ctx.basePriceMinor] Starting price for every combination.
   */
  static async regenerate({ listingRow, optionsMap = {}, basePriceMinor = null }) {
    const combinations = this.generateCartesianCombinations(optionsMap);
    if (combinations.length === 0) {
      throw new ValidationError(
        'Choose at least one option with values before generating variants.',
        { fields: [{ field: 'optionsMap', message: 'Expected e.g. { "storage": ["128GB", "256GB"] }' }] }
      );
    }
    if (combinations.length > MAX_COMBINATIONS) {
      throw new ValidationError(
        `Those options would create ${combinations.length} variants. Keep it to ${MAX_COMBINATIONS} or fewer.`,
        { fields: [{ field: 'optionsMap', message: `At most ${MAX_COMBINATIONS} combinations.` }] }
      );
    }

    // Only attributes the category itself marks as variant options may build a
    // matrix — otherwise "warranty" becomes a purchasable dimension.
    const categorySchema = await ListingTaxonomyUseCase
      .getCategoryAttributeSchema(listingRow.category_id)
      .catch(() => null);

    const variantable = new Set(
      ((categorySchema && categorySchema.attributes) || [])
        .filter(a => a.isVariantOption).map(a => a.slug)
    );
    const rejected = Object.keys(optionsMap).filter(k => !variantable.has(k));
    if (rejected.length) {
      throw new ValidationError(
        `Those options cannot build variants in this category.`,
        {
          fields: rejected.map(slug => ({
            field: `optionsMap.${slug}`,
            message: `"${slug}" is not a variant option for "${(categorySchema || {}).categoryName || listingRow.category_id}".`
          }))
        }
      );
    }

    const price = basePriceMinor !== null && basePriceMinor !== undefined
      ? Math.max(0, Number(basePriceMinor))
      : (listingRow.sale_price_minor || listingRow.base_price_minor || 0);

    const built = ListingCompositionService.buildVariantMatrix({
      variantOptions: optionsMap,
      sku: listingRow.sku,
      brand: listingRow.brand,
      currency: listingRow.currency,
      basePriceMinor: price,
      compareAtPriceMinor: listingRow.compare_at_price_minor
    }, categorySchema);

    const rows = await ListingRepository.replaceVariants(listingRow.id, built);
    await ListingRepository.update(listingRow.id, {
      has_variants: rows.length > 0,
      metadata: { ...(listingRow.metadata || {}), variantOptions: optionsMap }
    });

    await CacheService.delete(`listing:${listingRow.id}`, 'catalog').catch(() => null);
    await CacheService.delPattern(`listings:store:${listingRow.store_id}:*`, 'catalog').catch(() => null);

    return rows.map(toClientVariant);
  }

  static async list(listingId) {
    const rows = await ListingRepository.listVariants(listingId);
    return rows.map(toClientVariant);
  }

  /** Adjusts one row: its price, its stock, its SKU or whether it is sellable. */
  static async updateVariant(listingId, variantId, updates = {}) {
    if (updates.priceMinor !== undefined && Number(updates.priceMinor) < 0) {
      throw new ValidationError('A variant price cannot be negative.', {
        fields: [{ field: 'priceMinor', message: 'Use zero or more.' }]
      });
    }
    if (updates.stockQuantity !== undefined && Number(updates.stockQuantity) < 0) {
      throw new ValidationError('Variant stock cannot be negative.', {
        fields: [{ field: 'stockQuantity', message: 'Use zero or more.' }]
      });
    }

    const row = await ListingRepository.updateVariant(listingId, variantId, updates);
    if (!row) throw new NotFoundError('ListingVariant', variantId);

    await CacheService.delete(`listing:${listingId}`, 'catalog').catch(() => null);
    return toClientVariant(row);
  }
}

function toClientVariant(row) {
  return {
    id: row.id,
    title: row.title,
    sku: row.sku,
    options: row.options_summary || {},
    priceMinor: row.price_minor,
    currency: row.currency,
    compareAtPriceMinor: row.compare_at_price_minor,
    stockQuantity: row.stock_quantity,
    imageUrl: row.image_url,
    isActive: row.is_active
  };
}

module.exports = ListingVariantsUseCase;
module.exports.MAX_COMBINATIONS = MAX_COMBINATIONS;
