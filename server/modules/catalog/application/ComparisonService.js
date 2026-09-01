/**
 * Catalog Comparison Service
 * Application Service coordinating product resolution, candidate suggestions,
 * and multi-seller marketplace options.
 */

const { products: rawProducts } = require('../dataLoader');
const { ComparisonEngine } = require('../domain/ComparisonEngine');
const { NotFoundError, ValidationError } = require('../../../shared/errors/AppError');

// Flatten all catalog products
function getAllProducts() {
  return [
    ...(rawProducts.electronics || []).map(p => ({ ...p, vertical: 'electronics' })),
    ...(rawProducts.hotels || []).map(p => ({ ...p, vertical: 'hotels' })),
    ...(rawProducts.services || []).map(p => ({ ...p, vertical: 'services' })),
    ...(rawProducts.education || []).map(p => ({ ...p, vertical: 'education' }))
  ];
}

class ComparisonService {
  /**
   * Retrieves head-to-head comparison for a list of product IDs
   */
  static getComparison(productIds, userPriorities = {}) {
    if (!Array.isArray(productIds) || productIds.length === 0) {
      throw new ValidationError('Product IDs are required for comparison.', [
        { field: 'ids', message: 'Provide 2 to 4 product IDs.' }
      ]);
    }

    const all = getAllProducts();
    const resolvedProducts = [];

    for (const id of productIds) {
      const found = all.find(p => p.id === id || p.slug === id);
      if (found) {
        resolvedProducts.push(found);
      }
    }

    if (resolvedProducts.length === 0) {
      throw new NotFoundError('Products', productIds.join(', '));
    }

    return ComparisonEngine.run(resolvedProducts, userPriorities);
  }

  /**
   * Suggests candidate products to add to comparison
   */
  static getCompareCandidates({ category, currentProductId, search, limit = 8 }) {
    const all = getAllProducts();
    let candidates = [...all];

    // Exclude current product if provided
    if (currentProductId) {
      candidates = candidates.filter(p => p.id !== currentProductId);
    }

    // Filter by category or subCategory
    if (category) {
      const catLower = category.toLowerCase();
      candidates = candidates.filter(p => 
        p.category?.toLowerCase() === catLower ||
        p.subCategory?.toLowerCase().includes(catLower) ||
        p.vertical?.toLowerCase() === catLower
      );
    }

    // Search query filter
    if (search) {
      const q = search.toLowerCase();
      candidates = candidates.filter(p =>
        p.title?.toLowerCase().includes(q) ||
        p.brand?.toLowerCase().includes(q) ||
        p.merchant?.toLowerCase().includes(q) ||
        p.subCategory?.toLowerCase().includes(q)
      );
    }

    const sliced = candidates.slice(0, Number(limit) || 8);

    return {
      total: candidates.length,
      items: sliced.map(p => ({
        id: p.id,
        title: p.title,
        brand: p.brand,
        category: p.category,
        subCategory: p.subCategory,
        price: p.price,
        priceNumeric: p.priceNumeric,
        rating: p.rating,
        reviewsCount: p.reviewsCount,
        merchant: p.merchant,
        merchantCity: p.merchantCity,
        verified: p.verified,
        badge: p.badge,
        badgeClass: p.badgeClass,
        valueScore: ComparisonEngine.calculateValueScore(p)
      }))
    };
  }
}

module.exports = ComparisonService;
