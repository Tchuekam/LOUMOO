/**
 * ListingVariantsUseCase (06.07 Product Variants & Section 17 Variant Architecture)
 * Generates and manages combinatorial variants (SKU, price, stock) across arbitrary option dimensions.
 */

const ListingVariant = require('../domain/ListingVariant');
const CacheService = require('../../../infrastructure/cache/CacheService');
const { ValidationError, NotFoundError } = require('../../../shared/errors/AppError');

class ListingVariantsUseCase {
  static generateCartesianCombinations(optionsMap = {}) {
    // optionsMap: { color: ['Black', 'Silver'], storage: ['128GB', '256GB'] }
    const keys = Object.keys(optionsMap);
    if (keys.length === 0) return [];

    let results = [{}];
    keys.forEach(key => {
      const values = optionsMap[key];
      if (!Array.isArray(values) || values.length === 0) return;
      const nextResults = [];
      results.forEach(res => {
        values.forEach(val => {
          nextResults.push({ ...res, [key]: val });
        });
      });
      results = nextResults;
    });

    return results;
  }

  static async generateVariants(listing, optionsMap = {}, basePriceMinor = null) {
    const combinations = this.generateCartesianCombinations(optionsMap);
    if (combinations.length === 0) {
      throw new ValidationError('At least one option with values is required to generate variants.');
    }

    const priceMinor = basePriceMinor !== null ? Number(basePriceMinor) : listing.pricing.basePriceMinor;
    const variants = combinations.map((combo, idx) => {
      const title = Object.values(combo).join(' · ');
      const sku = `${(listing.brand || 'LM').toUpperCase()}-${(listing.model || 'PROD').toUpperCase()}-${idx + 1}`;
      return new ListingVariant({
        listing_id: listing.id,
        title: title,
        sku: sku,
        options_summary: combo,
        price_minor: priceMinor,
        currency: listing.pricing.currency,
        stock_quantity: 5
      });
    });

    listing.variants = variants;
    listing.hasVariants = true;
    listing.updatedAt = new Date().toISOString();

    await CacheService.del(`listing:${listing.id}`);
    return variants.map(v => v.toJSON());
  }

  static async updateVariant(listing, variantId, updates = {}) {
    const variant = listing.variants.find(v => v.id === variantId);
    if (!variant) {
      throw new NotFoundError('ListingVariant', variantId);
    }

    if (updates.priceMinor !== undefined) variant.priceMinor = Number(updates.priceMinor);
    if (updates.compareAtPriceMinor !== undefined) variant.compareAtPriceMinor = Number(updates.compareAtPriceMinor);
    if (updates.stockQuantity !== undefined) variant.stockQuantity = Number(updates.stockQuantity);
    if (updates.sku !== undefined) variant.sku = updates.sku;
    if (updates.imageUrl !== undefined) variant.imageUrl = updates.imageUrl;
    if (updates.isActive !== undefined) variant.isActive = Boolean(updates.isActive);

    variant.updatedAt = new Date().toISOString();
    listing.updatedAt = new Date().toISOString();

    await CacheService.del(`listing:${listing.id}`);
    return variant.toJSON();
  }
}

module.exports = ListingVariantsUseCase;
