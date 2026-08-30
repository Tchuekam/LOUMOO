/**
 * Catalog Module — API Routes
 * Serves multi-vertical commerce products, hotels, flights, and store listings
 */

const express = require('express');
const router = express.Router();
const CacheService = require('../../../infrastructure/cache/CacheService');
const AnalyticsService = require('../../../infrastructure/analytics/AnalyticsService');
const { NotFoundError } = require('../../../shared/errors/AppError');

// Load foundational dataset via robust dataLoader
const { products, categories } = require('../dataLoader');

// Flatten all multi-vertical items into an indexable array
const allProducts = [
  ...(products.hotels || []).map(p => ({ ...p, vertical: 'hotels' })),
  ...(products.electronics || []).map(p => ({ ...p, vertical: 'electronics' })),
  ...(products.fashion || []).map(p => ({ ...p, vertical: 'fashion' })),
  ...(products.home || []).map(p => ({ ...p, vertical: 'home' })),
  ...(products.services || []).map(p => ({ ...p, vertical: 'services' })),
  ...(products.education || []).map(p => ({ ...p, vertical: 'education' }))
];

// GET /api/v1/products
router.get('/products', async (req, res, next) => {
  try {
    const { category, search, vertical, limit = 50, page = 1 } = req.query;
    const cacheKey = `list:${category || 'all'}:${vertical || 'all'}:${search || ''}:${page}:${limit}`;

    const data = await CacheService.remember(cacheKey, 120, async () => {
      let filtered = [...allProducts];

      if (vertical) {
        filtered = filtered.filter(p => p.vertical?.toLowerCase() === vertical.toLowerCase());
      }

      if (category) {
        filtered = filtered.filter(p => p.category?.toLowerCase() === category.toLowerCase());
      }

      if (search) {
        const q = search.toLowerCase();
        filtered = filtered.filter(p => 
          p.title?.toLowerCase().includes(q) || 
          p.merchant?.toLowerCase().includes(q) ||
          p.category?.toLowerCase().includes(q)
        );
      }

      const startIndex = (parseInt(page, 10) - 1) * parseInt(limit, 10);
      const paginated = filtered.slice(startIndex, startIndex + parseInt(limit, 10));

      return {
        items: paginated,
        total: filtered.length,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        hasMore: startIndex + paginated.length < filtered.length
      };
    }, 'catalog');

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/products/:id
router.get('/products/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const cacheKey = `detail:${id}`;

    const product = await CacheService.remember(cacheKey, 300, async () => {
      return allProducts.find(p => p.id === id) || null;
    }, 'catalog');

    if (!product) {
      throw new NotFoundError('Product', id);
    }

    // Track analytics event asynchronously
    AnalyticsService.track(req.userId || 'anonymous', 'product_viewed', {
      productId: id,
      title: product.title,
      category: product.category,
      price: product.priceNumeric
    });

    res.json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/categories
router.get('/categories', async (req, res, next) => {
  try {
    const data = await CacheService.remember('categories:all', 600, async () => {
      return categories || [];
    }, 'catalog');

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
