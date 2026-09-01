/**
 * Catalog Comparison Service
 * ---------------------------------------------------------------------------
 * Coordinates product resolution, candidate suggestions, and multi-seller
 * marketplace options across canonical database listings and seed benchmarks.
 */

const { products: rawProducts } = require('../dataLoader');
const { ComparisonEngine } = require('../domain/ComparisonEngine');
const { NotFoundError, ValidationError } = require('../../../shared/errors/AppError');
const CatalogRepository = require('../infrastructure/CatalogRepository');

// Flatten all catalog products
function getAllSeedProducts() {
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
  static async getComparison(productIds, userPriorities = {}) {
    if (!Array.isArray(productIds) || productIds.length === 0) {
      throw new ValidationError('Product IDs are required for comparison.', [
        { field: 'ids', message: 'Provide 2 to 4 product IDs.' }
      ]);
    }

    const allSeed = getAllSeedProducts();
    const resolvedProducts = [];

    for (const id of productIds) {
      const found = allSeed.find(p => p.id === id || p.slug === id);
      if (found) {
        resolvedProducts.push(found);
      } else {
        try {
          const dbProduct = await CatalogRepository.findPublicProductByIdOrSlug(id);
          if (dbProduct) {
            resolvedProducts.push({
              id: dbProduct.id,
              title: dbProduct.title,
              brand: dbProduct.brand || 'Bespoke',
              category: dbProduct.category,
              price: dbProduct.price,
              priceNumeric: dbProduct.priceNumeric,
              rating: dbProduct.rating,
              reviewsCount: dbProduct.reviewsCount,
              merchant: dbProduct.merchant,
              merchantCity: dbProduct.merchantCity,
              verified: dbProduct.verified,
              badge: dbProduct.verified ? 'VERIFIED' : null,
              badgeClass: 'badge-blue',
              image: dbProduct.image,
              specs: dbProduct.specs || {},
              attributes: dbProduct.attributes || {}
            });
          }
        } catch (e) {
          // Continue checking remaining IDs
        }
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
  static async getCompareCandidates({ category, currentProductId, search, limit = 8 } = {}) {
    const all = getAllSeedProducts();
    let candidates = [...all];

    if (currentProductId) {
      candidates = candidates.filter(p => p.id !== currentProductId);
    }

    if (category) {
      const catLower = category.toLowerCase();
      candidates = candidates.filter(p => 
        p.category?.toLowerCase() === catLower ||
        p.subCategory?.toLowerCase().includes(catLower) ||
        p.vertical?.toLowerCase() === catLower
      );
    }

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
