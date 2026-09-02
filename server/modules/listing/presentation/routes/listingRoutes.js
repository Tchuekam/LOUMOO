/**
 * LOUMOO — Universal Listing & Commerce API Routes
 * ---------------------------------------------------------------------------
 * Every mutating route follows the same four-step pipeline:
 *
 *     requireAuth            -> who is this, really? (verified session)
 *     requireCapability      -> is this account allowed to do this at all?
 *     requireListingOwnership-> does this account own THIS resource?
 *     handler                -> validate, then execute
 *
 * There is no route where "the frontend said it was allowed" is part of the
 * decision, and no route that resolves a resource from a request-body id.
 */

const express = require('express');
const router = express.Router();

const {
  requireAuth,
  optionalAuth,
  requireCapability
} = require('../../../identity/presentation/guards/authGuard');
const { requireStoreAccess, resolveOwnStore } = require('../../../store/guards/storeAuthGuard');
const { requireListingOwnership } = require('../guards/listingOwnershipGuard');

const ListingTaxonomyUseCase = require('../../application/ListingTaxonomyUseCase');
const ListingValidationService = require('../../application/ListingValidationService');
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
const ListingRepository = require('../../infrastructure/ListingRepository');

const { ValidationError } = require('../../../../shared/errors/AppError');

/* ════════════════════════════════════════════════════════════════════════ */
/* 1. TAXONOMY & VALIDATION SCHEMA (PUBLIC)                                 */
/*    Served publicly so the listing wizard renders exactly the fields the  */
/*    server will accept — one definition, two consumers.                   */
/* ════════════════════════════════════════════════════════════════════════ */

router.get('/taxonomy', async (req, res, next) => {
  try {
    res.json({ status: 'success', data: await ListingTaxonomyUseCase.getTaxonomyTree() });
  } catch (err) { next(err); }
});

router.get('/schema', (req, res) => {
  res.json({ status: 'success', data: ListingValidationService.describe() });
});

router.get('/taxonomy/:categoryId/schema', async (req, res, next) => {
  try {
    const schema = await ListingTaxonomyUseCase.getCategoryAttributeSchema(req.params.categoryId);
    res.json({ status: 'success', data: schema });
  } catch (err) { next(err); }
});

/* ════════════════════════════════════════════════════════════════════════ */
/* 2. SELLER STUDIO                                                          */
/* ════════════════════════════════════════════════════════════════════════ */

// GET /api/v1/listings/seller — the caller's own listings, resolved from their
// own store. There is no storeId parameter to tamper with.
router.get('/seller',
  requireAuth,
  requireCapability('canManageStore'),
  resolveOwnStore(),
  async (req, res, next) => {
    try {
      const result = await SellerListingManagementUseCase.getSellerListings(req.store, req.query);
      res.json({ status: 'success', data: result });
    } catch (err) { next(err); }
  });

/* ════════════════════════════════════════════════════════════════════════ */
/* 3. CREATE                                                                 */
/* ════════════════════════════════════════════════════════════════════════ */

// POST /api/v1/listings
router.post('/',
  requireAuth,
  requireCapability('canCreateListing'),
  resolveOwnStore(),
  async (req, res, next) => {
    try {
      const { listing, duplicate } = await CreateListingUseCase.execute({
        principal: req.principal,
        accountState: req.accountState,
        store: req.store,
        input: req.body,
        idempotencyKey: req.get('Idempotency-Key') || null
      });
      // 200 (not 201) when an identical in-flight submission was collapsed, so
      // a double-clicking client can tell nothing new was created.
      res.status(duplicate ? 200 : 201).json({ status: 'success', data: listing, duplicate });
    } catch (err) { next(err); }
  });

/* ════════════════════════════════════════════════════════════════════════ */
/* 4. MEDIA — attach / remove / reorder                                      */
/*    Bytes are uploaded via POST /api/v1/uploads/listing-media, which        */
/*    authorizes FIRST. These routes only link already-validated assets.      */
/* ════════════════════════════════════════════════════════════════════════ */

router.post('/:id/media',
  requireAuth,
  requireCapability('canUploadListingMedia'),
  requireListingOwnership({ permission: 'listing.edit' }),
  async (req, res, next) => {
    try {
      const uploadIds = req.body.uploadIds || (req.body.uploadId ? [req.body.uploadId] : []);
      const result = await ListingMediaUseCase.attach({
        listingRow: req.listingRow,
        principal: req.principal,
        uploadIds
      });
      res.status(201).json({ status: 'success', data: result });
    } catch (err) { next(err); }
  });

router.get('/:id/media',
  requireAuth,
  requireListingOwnership({ permission: 'listing.view' }),
  async (req, res, next) => {
    try {
      res.json({ status: 'success', data: { media: await ListingMediaUseCase.list(req.listingRow.id) } });
    } catch (err) { next(err); }
  });

router.delete('/:id/media/:mediaId',
  requireAuth,
  requireListingOwnership({ permission: 'listing.edit' }),
  async (req, res, next) => {
    try {
      const result = await ListingMediaUseCase.remove({
        listingRow: req.listingRow,
        mediaId: req.params.mediaId
      });
      res.json({ status: 'success', data: result });
    } catch (err) { next(err); }
  });

router.patch('/:id/media/order',
  requireAuth,
  requireListingOwnership({ permission: 'listing.edit' }),
  async (req, res, next) => {
    try {
      const result = await ListingMediaUseCase.reorder({
        listingRow: req.listingRow,
        orderedMediaIds: req.body.mediaIds
      });
      res.json({ status: 'success', data: result });
    } catch (err) { next(err); }
  });

router.post('/:id/media/:mediaId/cover',
  requireAuth,
  requireListingOwnership({ permission: 'listing.edit' }),
  async (req, res, next) => {
    try {
      const result = await ListingMediaUseCase.setCover({
        listingRow: req.listingRow,
        mediaId: req.params.mediaId
      });
      res.json({ status: 'success', data: result });
    } catch (err) { next(err); }
  });

/* ════════════════════════════════════════════════════════════════════════ */
/* 5. EDIT / AUTOSAVE                                                        */
/* ════════════════════════════════════════════════════════════════════════ */

router.patch('/:id',
  requireAuth,
  requireCapability('canCreateListing'),
  requireListingOwnership({ permission: 'listing.edit' }),
  async (req, res, next) => {
    try {
      const updated = await UpdateListingUseCase.execute({
        listingRow: req.listingRow,
        principal: req.principal,
        input: req.body
      });
      res.json({ status: 'success', data: updated });
    } catch (err) { next(err); }
  });

// GET /api/v1/listings/:id/preview
// The buyer-facing projection of an unpublished listing, assembled by the same
// code that assembles the published one. `resolveOwnStore` runs so the preview
// carries the real boutique identity rather than a placeholder.
router.get('/:id/preview',
  requireAuth,
  resolveOwnStore(),
  requireListingOwnership({ permission: 'listing.view' }),
  async (req, res, next) => {
    try {
      const hydrated = await CreateListingUseCase.hydrate(req.listingRow);
      const preview = await ListingPreviewUseCase.getPreview(hydrated, req.store);
      res.json({ status: 'success', data: preview });
    } catch (err) { next(err); }
  });

/* ════════════════════════════════════════════════════════════════════════ */
/* 6. PUBLICATION STATE TRANSITIONS                                          */
/* ════════════════════════════════════════════════════════════════════════ */

router.post('/:id/publish',
  requireAuth,
  requireCapability('canPublishListing'),
  requireListingOwnership({ permission: 'listing.publish' }),
  async (req, res, next) => {
    try {
      const published = await ListingPublishUseCase.publish({
        listingRow: req.listingRow,
        principal: req.principal,
        accountState: req.accountState,
        store: req.store
      });
      res.json({ status: 'success', data: published });
    } catch (err) { next(err); }
  });

router.post('/:id/pause',
  requireAuth,
  requireCapability('canCreateListing'),
  requireListingOwnership({ permission: 'listing.publish' }),
  async (req, res, next) => {
    try {
      const paused = await ListingPublishUseCase.pause({ listingRow: req.listingRow, principal: req.principal });
      res.json({ status: 'success', data: paused });
    } catch (err) { next(err); }
  });

router.post('/:id/archive',
  requireAuth,
  requireCapability('canCreateListing'),
  requireListingOwnership({ permission: 'listing.delete' }),
  async (req, res, next) => {
    try {
      const archived = await ListingPublishUseCase.archive({ listingRow: req.listingRow, principal: req.principal });
      res.json({ status: 'success', data: archived });
    } catch (err) { next(err); }
  });

router.delete('/:id',
  requireAuth,
  requireCapability('canCreateListing'),
  requireListingOwnership({ permission: 'listing.delete' }),
  async (req, res, next) => {
    try {
      const archived = await ListingPublishUseCase.archive({ listingRow: req.listingRow, principal: req.principal });
      res.json({ status: 'success', data: archived });
    } catch (err) { next(err); }
  });

/* ════════════════════════════════════════════════════════════════════════ */
/* 7. VARIANTS & INVENTORY                                                   */
/* ════════════════════════════════════════════════════════════════════════ */

// POST /api/v1/listings/:id/variants
// Regenerates the whole option matrix. The previous revision mutated a
// hydrated in-memory object and returned it, so the seller saw variants that
// were never written and had vanished by the next request.
router.post('/:id/variants',
  requireAuth,
  requireCapability('canCreateListing'),
  requireListingOwnership({ permission: 'listing.edit' }),
  async (req, res, next) => {
    try {
      const variants = await ListingVariantsUseCase.regenerate({
        listingRow: req.listingRow,
        optionsMap: req.body.optionsMap,
        basePriceMinor: req.body.basePriceMinor
      });
      res.status(201).json({ status: 'success', data: variants });
    } catch (err) { next(err); }
  });

router.get('/:id/variants',
  requireAuth,
  requireListingOwnership({ permission: 'listing.view' }),
  async (req, res, next) => {
    try {
      res.json({
        status: 'success',
        data: { variants: await ListingVariantsUseCase.list(req.listingRow.id) }
      });
    } catch (err) { next(err); }
  });

router.patch('/:id/variants/:variantId',
  requireAuth,
  requireCapability('canCreateListing'),
  requireListingOwnership({ permission: 'listing.edit' }),
  async (req, res, next) => {
    try {
      const variant = await ListingVariantsUseCase.updateVariant(
        req.listingRow.id, req.params.variantId, req.body
      );
      res.json({ status: 'success', data: variant });
    } catch (err) { next(err); }
  });

router.patch('/:id/inventory',
  requireAuth,
  requireCapability('canCreateListing'),
  requireListingOwnership({ permission: 'inventory.manage' }),
  async (req, res, next) => {
    try {
      const inv = await ListingInventoryUseCase.adjustStock({
        listingRow: req.listingRow,
        onHand: req.body.onHand,
        variantId: req.body.variantId,
        lowStockThreshold: req.body.lowStockThreshold,
        allowBackorder: req.body.allowBackorder,
        trackInventory: req.body.trackInventory
      });
      res.json({ status: 'success', data: inv });
    } catch (err) { next(err); }
  });

/* ════════════════════════════════════════════════════════════════════════ */
/* 8. AI ASSISTANT (authenticated sellers only — it costs money to run)      */
/* ════════════════════════════════════════════════════════════════════════ */

router.post('/ai/suggest',
  requireAuth,
  requireCapability('canCreateListing'),
  async (req, res, next) => {
    try {
      const { action, text, categoryId, attributes, context } = req.body;
      let result = {};

      switch (action) {
        case 'title': result.title = await ListingAIService.suggestTitle(text); break;
        case 'description': result.description = await ListingAIService.generateDescription(context || { title: text }); break;
        case 'classify': result = await ListingAIService.classifyCategory(text); break;
        case 'attributes': result.attributes = await ListingAIService.extractAttributes(text, categoryId); break;
        case 'price': result = await ListingAIService.estimatePriceRange(categoryId, attributes); break;
        default:
          throw new ValidationError(
            `Unknown AI action '${action}'.`,
            { fields: [{ field: 'action', message: 'Expected one of: title, description, classify, attributes, price' }] }
          );
      }

      res.json({ status: 'success', data: result });
    } catch (err) { next(err); }
  });

/* ════════════════════════════════════════════════════════════════════════ */
/* 9. PUBLIC DETAIL — LAST, so it never shadows the routes above             */
/* ════════════════════════════════════════════════════════════════════════ */

router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const listing = await ListingRepository.findById(req.params.id);
    if (!listing) {
      const { NotFoundError } = require('../../../../shared/errors/AppError');
      throw new NotFoundError('Listing', req.params.id);
    }

    // Unpublished listings are visible only to people who can manage them.
    if (listing.status !== 'PUBLISHED' || listing.visibility !== 'PUBLIC') {
      const isOwner = req.principal && req.principal.id === listing.seller_id;
      const isAdmin = req.principal && ['admin', 'super_admin'].includes(req.principal.primaryRole);
      if (!isOwner && !isAdmin) {
        const { NotFoundError } = require('../../../../shared/errors/AppError');
        throw new NotFoundError('Listing', req.params.id);
      }
    }

    // The owner gets the OWNER projection, because that is what the editor
    // reloads a listing from. Serving them the buyer-facing shape would drop
    // stock, fulfilment, service and trust on every edit — the listing would
    // quietly lose a section each time it was reopened.
    const isOwner = req.principal && req.principal.id === listing.seller_id;
    const isAdmin = req.principal && ['admin', 'super_admin'].includes(req.principal.primaryRole);

    if (isOwner || isAdmin) {
      const owned = await CreateListingUseCase.hydrate(listing);
      return res.json({ status: 'success', data: owned });
    }

    const detail = await PublicListingUseCase.getListingDetail(
      listing,
      req.principal ? req.principal.id : 'anonymous'
    );
    res.json({ status: 'success', data: detail });
  } catch (err) { next(err); }
});

module.exports = router;
