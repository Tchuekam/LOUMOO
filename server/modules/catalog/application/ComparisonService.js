/**
 * Catalog Comparison Service
 * ---------------------------------------------------------------------------
 * Coordinates universal resolution, candidate suggestions, and multi-seller
 * marketplace options across catalog products, curated benchmark datasets,
 * stores/merchants, and database listings.
 */

const { products: rawProducts, catalogProducts = {} } = require('../dataLoader');
const { ComparisonEngine } = require('../domain/ComparisonEngine');
const { NotFoundError, ValidationError } = require('../../../shared/errors/AppError');
const CatalogRepository = require('../infrastructure/CatalogRepository');

// Curated verified stores list for direct store-to-store comparison
const CURATED_STORES = [
  {
    id: 'store_orca_electronics',
    slug: 'orca-electronics',
    title: 'Orca Electronics',
    brand: 'Verified Merchant',
    category: 'Stores',
    subCategory: 'Consumer Electronics & Computing',
    type: 'store',
    price: '1,420+ Products',
    priceNumeric: 1420,
    rating: 4.9,
    reviewsCount: 384,
    merchant: 'Akwa Boulevard, Douala',
    merchantCity: 'Douala',
    verified: true,
    badge: 'TOP SELLER',
    badgeClass: 'badge-hot',
    coverImage: './Assets/telephone&PC/phoneBrands.image/139611657203176408.jfif',
    inStock: true,
    stockUnits: 1000,
    specs: {
      performance: { processor: 'Tier 1 Official Importer', thermal: '100% Genuine Sealed Stock' },
      display: { size: 'Flagship Showroom (Akwa)', panelType: 'Open Mon-Sat 8h-19h' },
      battery: { batteryLife: 'Same-Day Express 2h Delivery', fastCharging: 'Doorstep Courier Fleet' },
      commerce: { warranty: '24 Months Official Guarantee', escrowTier: 'LOUMOO Tier 1 Full Escrow' }
    }
  },
  {
    id: 'store_digital_corner',
    slug: 'digital-corner',
    title: 'Digital Corner',
    brand: 'Verified Merchant',
    category: 'Stores',
    subCategory: 'Apple Specialist & Accessories',
    type: 'store',
    price: '850+ Products',
    priceNumeric: 850,
    rating: 4.8,
    reviewsCount: 256,
    merchant: 'Bonapriso, Douala',
    merchantCity: 'Douala',
    verified: true,
    badge: 'VERIFIED',
    badgeClass: 'badge-blue',
    coverImage: './Assets/telephone&PC/phoneBrands.image/139611657203176408.jfif',
    inStock: true,
    stockUnits: 1000,
    specs: {
      performance: { processor: 'Apple Certified Reseller', thermal: 'Direct Import US/EU Spec' },
      display: { size: 'Boutique Showroom (Bonapriso)', panelType: 'Open Mon-Sat 9h-20h' },
      battery: { batteryLife: 'Express Doorstep Delivery 3h', fastCharging: 'Doorstep Courier Fleet' },
      commerce: { warranty: '12 Months Replacement Warranty', escrowTier: 'LOUMOO Tier 1 Full Escrow' }
    }
  },
  {
    id: 'store_kamertech_direct',
    slug: 'kamertech-direct',
    title: 'KamerTech Direct',
    brand: 'Verified Merchant',
    category: 'Stores',
    subCategory: 'Computing, Servers & Components',
    type: 'store',
    price: '620+ Products',
    priceNumeric: 620,
    rating: 5.0,
    reviewsCount: 194,
    merchant: 'Bastos, Yaoundé',
    merchantCity: 'Yaoundé',
    verified: true,
    badge: 'PRO PARTNER',
    badgeClass: 'badge-new',
    coverImage: './Assets/telephone&PC/ordinateurPortable.image/dell/dell1.jfif',
    inStock: true,
    stockUnits: 1000,
    specs: {
      performance: { processor: 'Enterprise IT Solutions', thermal: 'Direct Manufacturer Sealed' },
      display: { size: 'Tech Center (Bastos)', panelType: 'Open Mon-Sat 8h30-18h30' },
      battery: { batteryLife: 'Same-Day Yaoundé & Douala', fastCharging: 'VIP Secured Transport' },
      commerce: { warranty: '36 Months Manufacturer ProSupport', escrowTier: 'LOUMOO Tier 1 Full Escrow' }
    }
  },
  {
    id: 'store_akwa_palm',
    slug: 'akwa-palm-hospitality',
    title: 'Akwa Palm Commercial & Living',
    brand: 'Verified Host',
    category: 'Stores',
    subCategory: 'Hospitality & Commercial Suites',
    type: 'store',
    price: '48 Suites & Spaces',
    priceNumeric: 48,
    rating: 4.7,
    reviewsCount: 142,
    merchant: 'Akwa Commercial Strip, Douala',
    merchantCity: 'Douala',
    verified: true,
    badge: 'VERIFIED HOST',
    badgeClass: 'badge-sale',
    coverImage: './Assets/telephone&PC/phoneBrands.image/139611657203176408.jfif',
    inStock: true,
    stockUnits: 1000,
    specs: {
      performance: { processor: 'Full Concierge & Security', thermal: 'Dual Generator 24/7 Backup' },
      display: { size: 'Executive Suites', panelType: 'City View Balconies' },
      battery: { batteryLife: 'Instant Check-in', fastCharging: 'Fiber Wi-Fi 6 Dedicated' },
      commerce: { warranty: 'Free Flexible Cancellation', escrowTier: 'LOUMOO Tier 1 Full Escrow' }
    }
  }
];

// Flatten all products across seed categories, curated catalog, and stores.
//
// rawProducts, catalogProducts (the ~1.8MB curated dataset) and CURATED_STORES
// are all static after boot, so the flattened list is built ONCE and cached at
// module scope — mirroring CatalogRepository.__curatedCache. Rebuilding ~1000
// objects on every /compare and /compare/candidates request was pure CPU/GC on
// the single event loop. Callers treat the returned array read-only (they spread
// or filter into new structures), so sharing the cached array is safe.
let _allEntitiesCache = null;
function getAllEntities() {
  if (_allEntitiesCache) return _allEntitiesCache;
  const seedList = [
    ...(rawProducts.electronics || []).map(p => ({ ...p, vertical: 'electronics', inStock: true, stockUnits: Math.max(1000, Number(p.stockUnits || 1000)) })),
    ...(rawProducts.hotels || []).map(p => ({ ...p, vertical: 'hotels', inStock: true, stockUnits: Math.max(1000, Number(p.stockUnits || 1000)) })),
    ...(rawProducts.services || []).map(p => ({ ...p, vertical: 'services', inStock: true, stockUnits: Math.max(1000, Number(p.stockUnits || 1000)) })),
    ...(rawProducts.universities || []).map(p => ({ ...p, vertical: 'education', inStock: true, stockUnits: Math.max(1000, Number(p.stockUnits || 1000)) }))
  ];

  // Map curated catalog products
  const curatedList = Object.keys(catalogProducts).map(id => {
    const cp = catalogProducts[id];
    const priceNum = CatalogRepository._priceToNumber(cp.price);
    const cover = cp.coverImage || (Array.isArray(cp.images) && cp.images[0]) || '';
    return {
      id: cp.id || id,
      slug: cp.id || id,
      title: cp.title,
      brand: cp.brand || 'LOUMOO Curated',
      category: cp.category || 'electronics',
      categoryLabel: cp.categoryLabel || cp.category,
      subCategory: cp.subcategory || cp.category,
      vertical: cp.category || 'electronics',
      price: cp.price,
      priceNumeric: priceNum,
      rating: Number(cp.rating) || 4.8,
      reviewsCount: cp.reviewCount || 24,
      merchant: cp.storeName || 'LOUMOO Direct',
      merchantCity: cp.storeCity || 'Douala',
      verified: Boolean(cp.storeVerified),
      badge: cp.badge || 'IN STOCK',
      badgeClass: 'badge-hot',
      image: CatalogRepository._enc(cover),
      coverImage: CatalogRepository._enc(cover),
      inStock: true,
      stockUnits: Math.max(1000, Number(cp.stock || cp.stockQuantity || cp.stockUnits || 1000)),
      stockQuantity: 1000,
      description: cp.description || '',
      specs: {
        performance: { processor: (cp.attributes && cp.attributes[0]?.val) || 'Standard Specification' },
        connectivity: { wifi: (cp.attributes && cp.attributes[1]?.val) || 'Standard Connectivity' },
        battery: { batteryLife: (cp.attributes && cp.attributes[2]?.val) || 'High Capacity Battery' },
        commerce: { warranty: (cp.attributes && cp.attributes[3]?.val) || '12 Months LOUMOO Escrow Protection' }
      }
    };
  });

  _allEntitiesCache = [...seedList, ...curatedList, ...CURATED_STORES];
  return _allEntitiesCache;
}

class ComparisonService {
  /**
   * Retrieves head-to-head comparison for a list of product or entity IDs
   */
  static async getComparison(productIds, userPriorities = {}) {
    if (!Array.isArray(productIds) || productIds.length === 0) {
      throw new ValidationError('Product IDs are required for comparison.', [
        { field: 'ids', message: 'Provide 2 to 4 product IDs.' }
      ]);
    }

    // The engine compares at most 4 entities (validateCompatibility), so enforce
    // the limit before resolving: every unresolved id costs one database round
    // trip, and an uncapped ?ids= turns a single request into an unbounded query
    // fan-out. Reject rather than silently truncate, so a caller never gets a
    // comparison of products it did not fully ask for.
    if (productIds.length > 4) {
      throw new ValidationError('Comparison is limited to a maximum of 4 products.', [
        { field: 'ids', message: 'Provide 2 to 4 product IDs.' }
      ]);
    }
    const requestedIds = productIds;

    const allEntities = getAllEntities();
    const resolvedProducts = [];

    for (const id of requestedIds) {
      const found = allEntities.find(p => p.id === id || p.slug === id);
      if (found) {
        resolvedProducts.push({
          ...found,
          inStock: true,
          stockUnits: Math.max(1000, Number(found.stockUnits || found.stockQuantity || 1000))
        });
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
              inStock: true,
              stockUnits: 1000,
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
      throw new NotFoundError('Products', requestedIds.join(', '));
    }

    return ComparisonEngine.run(resolvedProducts, userPriorities);
  }

  /**
   * Suggests candidate products/stores/hotels to add to comparison
   */
  static async getCompareCandidates({ category, currentProductId, search, type, limit = 16 } = {}) {
    const all = getAllEntities();
    let candidates = [...all];

    if (currentProductId) {
      candidates = candidates.filter(p => p.id !== currentProductId && p.slug !== currentProductId);
    }

    if (type && type !== 'all') {
      if (type === 'stores') {
        candidates = candidates.filter(p => p.type === 'store');
      } else if (type === 'hotels') {
        candidates = candidates.filter(p => p.category?.toLowerCase() === 'hotels' || p.vertical === 'hotels');
      } else if (type === 'products') {
        candidates = candidates.filter(p => p.type !== 'store' && p.category?.toLowerCase() !== 'hotels');
      }
    }

    if (category && category !== 'all') {
      const catLower = category.toLowerCase();
      candidates = candidates.filter(p => 
        p.category?.toLowerCase() === catLower ||
        p.categoryLabel?.toLowerCase()?.includes(catLower) ||
        p.subCategory?.toLowerCase().includes(catLower) ||
        p.vertical?.toLowerCase() === catLower
      );
    }

    if (search && String(search).trim()) {
      const q = String(search).trim().toLowerCase();
      candidates = candidates.filter(p =>
        p.title?.toLowerCase().includes(q) ||
        p.brand?.toLowerCase().includes(q) ||
        p.merchant?.toLowerCase().includes(q) ||
        p.subCategory?.toLowerCase().includes(q) ||
        p.categoryLabel?.toLowerCase()?.includes(q)
      );
    }

    const sliced = candidates.slice(0, Number(limit) || 16);

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
        image: p.image || p.coverImage,
        type: p.type || 'product',
        inStock: true,
        stockUnits: Math.max(1000, Number(p.stockUnits || 1000)),
        valueScore: ComparisonEngine.calculateValueScore(p)
      }))
    };
  }
}

module.exports = ComparisonService;

