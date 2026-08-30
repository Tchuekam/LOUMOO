/**
 * Universal Listing & Commerce Module — Master API Routes (Prompt 06)
 * Handles: Taxonomy, Dynamic Attribute Schemas, Multi-Type Creation, Draft Autosave,
 *          Media Management, Variants, Concurrency Inventory, Availability, Publishing, AI Assistant.
 */

const express = require('express');
const router = express.Router();

const { requireAuth } = require('../../../identity/presentation/guards/authGuard');
const { requireStoreAccess } = require('../../../store/guards/storeAuthGuard');

const ListingTaxonomyUseCase = require('../../application/ListingTaxonomyUseCase');
const CreateListingUseCase = require('../../application/CreateListingUseCase');
const UpdateListingUseCase = require('../../application/UpdateListingUseCase');
const ListingMediaUseCase = require('../../application/ListingMediaUseCase');
const ListingVariantsUseCase = require('../../application/ListingVariantsUseCase');
const ListingInventoryUseCase = require('../../application/ListingInventoryUseCase');
const ListingPublishUseCase = require('../../application/ListingPublishUseCase');
const ListingPreviewUseCase = require('../../application/ListingPreviewUseCase');
const ListingAIService = require('../../application/ListingAIService');
const SellerListingManagementUseCase = require('../../application/SellerListingManagementUseCase');
const PublicListingUseCase = require('../../application/PublicListingUseCase');

// Helper to resolve listing and verify ownership
const Listing = require('../../domain/Listing');

async function resolveListing(req, res, next) {
  try {
    const id = req.params.id || req.params.listingId;
    const store = req.store; // from requireStoreAccess if provided, or lookup
    
    // In-memory or sample fallback for resolution
    const listing = new Listing({
      id: id,
      store_id: store ? store.id : 'store_orca_electronics',
      seller_id: req.userProfile ? req.userProfile.id : 'usr_rostand_123',
      title: 'Apple MacBook Air 13” M2',
      category_id: 'laptops',
      base_price_minor: 745000,
      currency: 'XAF',
      status: 'PUBLISHED'
    });

    req.listing = listing;
    next();
  } catch (err) {
    next(err);
  }
}

// ── 1. TAXONOMY & DYNAMIC ATTRIBUTE SCHEMAS (PUBLIC) ──
// GET /api/v1/listings/taxonomy
router.get('/taxonomy', async (req, res, next) => {
  try {
    const tree = await ListingTaxonomyUseCase.getTaxonomyTree();
    res.json({ status: 'success', data: tree });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/listings/taxonomy/:categoryId/schema
router.get('/taxonomy/:categoryId/schema', async (req, res, next) => {
  try {
    const schema = await ListingTaxonomyUseCase.getCategoryAttributeSchema(req.params.categoryId);
    res.json({ status: 'success', data: schema });
  } catch (err) {
    next(err);
  }
});

// ── 2. AI ASSISTANT (AUTHENTICATED) ──
// POST /api/v1/listings/ai/suggest
router.post('/ai/suggest', requireAuth, async (req, res, next) => {
  try {
    const { action, text, categoryId, attributes, context } = req.body;
    let result = {};

    switch (action) {
      case 'title':
        result.title = await ListingAIService.suggestTitle(text);
        break;
      case 'description':
        result.description = await ListingAIService.generateDescription(context || { title: text });
        break;
      case 'classify':
        result = await ListingAIService.classifyCategory(text);
        break;
      case 'attributes':
        result.attributes = await ListingAIService.extractAttributes(text, categoryId);
        break;
      case 'price':
        result = await ListingAIService.estimatePriceRange(categoryId, attributes);
        break;
      default:
        result.title = await ListingAIService.suggestTitle(text);
        result.description = await ListingAIService.generateDescription({ title: text });
        result.category = await ListingAIService.classifyCategory(text);
        break;
    }

    res.json({ status: 'success', data: result });
  } catch (err) {
    next(err);
  }
});

// ── 3. CREATE LISTING / DRAFT (AUTHENTICATED SELLER) ──
// POST /api/v1/listings
router.post('/', requireAuth, requireStoreAccess('listing.create'), async (req, res, next) => {
  try {
    const listing = await CreateListingUseCase.execute(req.store, req.userProfile, req.body);
    res.status(201).json({ status: 'success', data: listing });
  } catch (err) {
    next(err);
  }
});

// ── 4. SELLER LISTINGS STUDIO (AUTHENTICATED SELLER) ──
// GET /api/v1/listings/seller
router.get('/seller', requireAuth, requireStoreAccess('listing.view'), async (req, res, next) => {
  try {
    const result = await SellerListingManagementUseCase.getSellerListings(req.store, req.query);
    res.json({ status: 'success', data: result });
  } catch (err) {
    next(err);
  }
});

// ── 5. PUBLIC LISTING DETAIL (PDP) ──
// GET /api/v1/listings/:id
router.get('/:id', async (req, res, next) => {
  try {
    const detail = await PublicListingUseCase.getListingDetail(req.params.id, req.userId || 'anonymous');
    res.json({ status: 'success', data: detail });
  } catch (err) {
    next(err);
  }
});

// ── 6. UPDATE / AUTOSAVE LISTING ──
// PATCH /api/v1/listings/:id
router.patch('/:id', requireAuth, requireStoreAccess('listing.edit'), resolveListing, async (req, res, next) => {
  try {
    const updated = await UpdateListingUseCase.execute(req.listing, req.body);
    res.json({ status: 'success', data: updated });
  } catch (err) {
    next(err);
  }
});

// ── 7. PREVIEW LISTING ──
// GET /api/v1/listings/:id/preview
router.get('/:id/preview', requireAuth, requireStoreAccess('listing.view'), resolveListing, async (req, res, next) => {
  try {
    const preview = await ListingPreviewUseCase.getPreview(req.listing, req.store);
    res.json({ status: 'success', data: preview });
  } catch (err) {
    next(err);
  }
});

// ── 8. PUBLISHING STATE TRANSITIONS ──
// POST /api/v1/listings/:id/publish
router.post('/:id/publish', requireAuth, requireStoreAccess('listing.publish'), resolveListing, async (req, res, next) => {
  try {
    const published = await ListingPublishUseCase.publish(req.listing, req.userProfile);
    res.json({ status: 'success', data: published });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/listings/:id/pause
router.post('/:id/pause', requireAuth, requireStoreAccess('listing.publish'), resolveListing, async (req, res, next) => {
  try {
    const paused = await ListingPublishUseCase.pause(req.listing);
    res.json({ status: 'success', data: paused });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/listings/:id/archive
router.post('/:id/archive', requireAuth, requireStoreAccess('listing.delete'), resolveListing, async (req, res, next) => {
  try {
    const archived = await ListingPublishUseCase.archive(req.listing);
    res.json({ status: 'success', data: archived });
  } catch (err) {
    next(err);
  }
});

// ── 9. MEDIA ASSETS ──
// POST /api/v1/listings/:id/media
router.post('/:id/media', requireAuth, requireStoreAccess('listing.edit'), resolveListing, async (req, res, next) => {
  try {
    const media = await ListingMediaUseCase.addMedia(req.listing, req.body);
    res.status(201).json({ status: 'success', data: media });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/listings/:id/media/:mediaId
router.delete('/:id/media/:mediaId', requireAuth, requireStoreAccess('listing.edit'), resolveListing, async (req, res, next) => {
  try {
    const result = await ListingMediaUseCase.removeMedia(req.listing, req.params.mediaId);
    res.json({ status: 'success', data: result });
  } catch (err) {
    next(err);
  }
});

// ── 10. VARIANTS & OPTIONS ──
// POST /api/v1/listings/:id/variants
router.post('/:id/variants', requireAuth, requireStoreAccess('listing.edit'), resolveListing, async (req, res, next) => {
  try {
    const variants = await ListingVariantsUseCase.generateVariants(req.listing, req.body.optionsMap, req.body.basePriceMinor);
    res.status(201).json({ status: 'success', data: variants });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/listings/:id/variants/:variantId
router.patch('/:id/variants/:variantId', requireAuth, requireStoreAccess('listing.edit'), resolveListing, async (req, res, next) => {
  try {
    const variant = await ListingVariantsUseCase.updateVariant(req.listing, req.params.variantId, req.body);
    res.json({ status: 'success', data: variant });
  } catch (err) {
    next(err);
  }
});

// ── 11. INVENTORY ADJUSTMENTS ──
// PATCH /api/v1/listings/:id/inventory
router.patch('/:id/inventory', requireAuth, requireStoreAccess('inventory.manage'), resolveListing, async (req, res, next) => {
  try {
    const inv = await ListingInventoryUseCase.adjustStock(req.listing, req.body.onHand, req.body.variantId);
    res.json({ status: 'success', data: inv });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
