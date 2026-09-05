/**
 * Store & Business Module — Master API Routes (Phase 5)
 * Handles: 05.01 Create, 05.02 Onboarding, 05.03 Management, 05.04 Profile,
 *          05.05 Verification, 05.06 Categories, 05.07 Discovery, 05.08 Follow,
 *          05.09 Analytics, 05.10 Settings, 05.11 Hours, 05.12 Location,
 *          and Public Commercial Seller Profile (/s/:slug).
 */

const express = require('express');
const router = express.Router();

const { requireAuth, optionalAuth, requireCapability } = require('../../../identity/presentation/guards/authGuard');
const { requireStoreAccess, resolveStore } = require('../../guards/storeAuthGuard');

const CreateStoreUseCase = require('../../application/CreateStoreUseCase');
const StoreOnboardingUseCase = require('../../application/StoreOnboardingUseCase');
const StoreManagementUseCase = require('../../application/StoreManagementUseCase');
const StoreProfileUseCase = require('../../application/StoreProfileUseCase');
const StoreVerificationUseCase = require('../../application/StoreVerificationUseCase');
const StoreCategoryUseCase = require('../../application/StoreCategoryUseCase');
const StoreDiscoveryUseCase = require('../../application/StoreDiscoveryUseCase');
const StoreFollowService = require('../../application/StoreFollowService');
const StoreAnalyticsUseCase = require('../../application/StoreAnalyticsUseCase');
const StoreSettingsUseCase = require('../../application/StoreSettingsUseCase');
const StoreHoursUseCase = require('../../application/StoreHoursUseCase');
const StoreLocationUseCase = require('../../application/StoreLocationUseCase');
const StoreRepository = require('../../infrastructure/StoreRepository');
const PublicProfileService = require('../../../identity/application/PublicProfileService');

// ── CURRENT USER'S STORE ──
// GET /api/v1/stores/me or /api/v1/stores/mine
const getMyStoreHandler = async (req, res, next) => {
  try {
    const owned = await StoreRepository.findOwnedBy(req.principal.id);
    const store = owned && owned.length > 0 ? owned[0] : null;
    res.json({ status: 'success', data: { store } });
  } catch (err) {
    next(err);
  }
};
router.get('/me', requireAuth, getMyStoreHandler);
router.get('/mine', requireAuth, getMyStoreHandler);

// GET /api/v1/stores/analytics — current seller's store analytics
router.get('/analytics', requireAuth, async (req, res, next) => {
  try {
    const owned = await StoreRepository.findOwnedBy(req.principal.id);
    if (!owned || owned.length === 0) {
      return res.json({
        status: 'success',
        data: {
          summary: {
            totalRevenueXaf: 0,
            totalRevenueFormatted: '0 XAF',
            totalOrders: 0,
            totalStoreViews: 0,
            uniqueVisitors: 0,
            conversionRate: '0.0'
          },
          period: req.query.period || '30d',
          topSellingProducts: []
        }
      });
    }
    const store = owned[0];
    const analytics = await StoreAnalyticsUseCase.getAnalytics(store, req.query.period);
    res.json({ status: 'success', data: analytics });
  } catch (err) {
    next(err);
  }
});

// ── 05.06 CATEGORIES (PUBLIC) ──
// GET /api/v1/stores/categories
router.get('/categories', async (req, res, next) => {
  try {
    const categories = await StoreCategoryUseCase.listCategories();
    res.json({ status: 'success', data: categories });
  } catch (err) {
    next(err);
  }
});

// ── 05.07 STORE DISCOVERY (PUBLIC) ──
// GET /api/v1/stores/discovery
router.get('/discovery', async (req, res, next) => {
  try {
    const result = await StoreDiscoveryUseCase.discoverStores(req.query);
    res.json({ status: 'success', data: result });
  } catch (err) {
    next(err);
  }
});

// ── PUBLIC COMMERCIAL SELLER PROFILE (/s/:slug) ──
// GET /api/v1/stores/s/:slug
router.get('/s/:slug', optionalAuth, async (req, res, next) => {
  try {
    const seller = await PublicProfileService.getSellerPublicProfile(req.params.slug, req.principal);
    res.json({ status: 'success', data: { seller } });
  } catch (err) {
    next(err);
  }
});

// ── 05.01 CREATE A STORE ──
// POST /api/v1/stores
router.post('/', requireAuth, requireCapability('canStartSelling'), async (req, res, next) => {
  try {
    const store = await CreateStoreUseCase.execute(req.principal, req.accountState, req.body);
    res.status(201).json({ status: 'success', data: store });
  } catch (err) {
    next(err);
  }
});

// ── 05.04 PUBLIC STORE PROFILE ──
// GET /api/v1/stores/:storeId/profile
router.get('/:storeId/profile', async (req, res, next) => {
  try {
    const profile = await StoreProfileUseCase.getPublicProfile(req.params.storeId);
    res.json({ status: 'success', data: profile });
  } catch (err) {
    next(err);
  }
});

// ── 05.08 FOLLOW STORES ──
// POST /api/v1/stores/:storeId/follow
router.post('/:storeId/follow', requireAuth, resolveStore(), async (req, res, next) => {
  try {
    const result = await StoreFollowService.followStore(req.principal, req.store);
    res.json({ status: 'success', data: result });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/stores/:storeId/follow
router.delete('/:storeId/follow', requireAuth, resolveStore(), async (req, res, next) => {
  try {
    const result = await StoreFollowService.unfollowStore(req.principal, req.store);
    res.json({ status: 'success', data: result });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/stores/:storeId/follow-status
router.get('/:storeId/follow-status', requireAuth, async (req, res, next) => {
  try {
    const status = await StoreFollowService.getFollowStatus(req.principal.id, req.params.storeId);
    res.json({ status: 'success', data: status });
  } catch (err) {
    next(err);
  }
});

// ── 05.03 STORE MANAGEMENT (DASHBOARD) ──
// GET /api/v1/stores/:storeId
router.get('/:storeId', requireAuth, requireStoreAccess('store.view'), async (req, res, next) => {
  try {
    const dashboard = await StoreManagementUseCase.getStoreDashboard(req.store);
    res.json({ status: 'success', data: dashboard });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/stores/:storeId
router.patch('/:storeId', requireAuth, requireStoreAccess('store.manage_settings'), async (req, res, next) => {
  try {
    const updated = await StoreManagementUseCase.updateStore(req.store, req.body);
    res.json({ status: 'success', data: updated });
  } catch (err) {
    next(err);
  }
});

// ── 05.04 STORE PROFILE (MERCHANT CUSTOMIZATION) ──
// PATCH /api/v1/stores/:storeId/profile
router.patch('/:storeId/profile', requireAuth, requireStoreAccess('store.manage_settings'), async (req, res, next) => {
  try {
    const updated = await StoreProfileUseCase.updateStoreProfile(req.store, req.body);
    res.json({ status: 'success', data: updated });
  } catch (err) {
    next(err);
  }
});

// ── 05.02 STORE ONBOARDING ──
// GET /api/v1/stores/:storeId/onboarding
router.get('/:storeId/onboarding', requireAuth, requireStoreAccess('store.view'), async (req, res, next) => {
  try {
    const status = await StoreOnboardingUseCase.getOnboardingStatus(req.store);
    res.json({ status: 'success', data: status });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/stores/:storeId/onboarding
router.patch('/:storeId/onboarding', requireAuth, requireStoreAccess('store.manage_settings'), async (req, res, next) => {
  try {
    const status = await StoreOnboardingUseCase.updateOnboardingStep(req.store, req.principal, req.body.step, req.body);
    res.json({ status: 'success', data: status });
  } catch (err) {
    next(err);
  }
});

// ── 05.05 STORE VERIFICATION ──
// GET /api/v1/stores/:storeId/verification
router.get('/:storeId/verification', requireAuth, requireStoreAccess('store.view'), async (req, res, next) => {
  try {
    const ver = await StoreVerificationUseCase.getVerification(req.store);
    res.json({ status: 'success', data: ver });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/stores/:storeId/verification
router.post('/:storeId/verification', requireAuth, requireStoreAccess('store.manage_settings'), async (req, res, next) => {
  try {
    const result = await StoreVerificationUseCase.submitVerification(req.store, req.principal, req.body);
    res.json({ status: 'success', data: result });
  } catch (err) {
    next(err);
  }
});

// ── 05.09 STORE ANALYTICS (PRIVATE) ──
// GET /api/v1/stores/:storeId/analytics
router.get('/:storeId/analytics', requireAuth, requireStoreAccess('store.view_analytics'), async (req, res, next) => {
  try {
    const analytics = await StoreAnalyticsUseCase.getAnalytics(req.store, req.query.period);
    res.json({ status: 'success', data: analytics });
  } catch (err) {
    next(err);
  }
});

// ── 05.10 STORE SETTINGS ──
// GET /api/v1/stores/:storeId/settings
router.get('/:storeId/settings', requireAuth, requireStoreAccess('store.manage_settings'), async (req, res, next) => {
  try {
    const settings = await StoreSettingsUseCase.getSettings(req.store);
    res.json({ status: 'success', data: settings });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/stores/:storeId/settings
router.patch('/:storeId/settings', requireAuth, requireStoreAccess('store.manage_settings'), async (req, res, next) => {
  try {
    const updated = await StoreSettingsUseCase.updateSettings(req.store, req.body);
    res.json({ status: 'success', data: updated });
  } catch (err) {
    next(err);
  }
});

// ── 05.11 BUSINESS OPENING INFORMATION ──
// GET /api/v1/stores/:storeId/hours
router.get('/:storeId/hours', resolveStore(), async (req, res, next) => {
  try {
    const hours = await StoreHoursUseCase.getHours(req.store);
    res.json({ status: 'success', data: hours });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/stores/:storeId/hours
router.patch('/:storeId/hours', requireAuth, requireStoreAccess('store.manage_settings'), async (req, res, next) => {
  try {
    const updated = await StoreHoursUseCase.updateHours(req.store, req.body);
    res.json({ status: 'success', data: updated });
  } catch (err) {
    next(err);
  }
});

// ── 05.12 BUSINESS LOCATION ──
// GET /api/v1/stores/:storeId/location
router.get('/:storeId/location', optionalAuth, resolveStore(), async (req, res, next) => {
  try {
    const isOwner = Boolean(req.principal && req.store && req.store.ownerId === req.principal.id);
    const location = await StoreLocationUseCase.getLocation(req.store, isOwner);
    res.json({ status: 'success', data: location });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/stores/:storeId/location
router.patch('/:storeId/location', requireAuth, requireStoreAccess('store.manage_settings'), async (req, res, next) => {
  try {
    const updated = await StoreLocationUseCase.updateLocation(req.store, req.body);
    res.json({ status: 'success', data: updated });
  } catch (err) {
    next(err);
  }
});

module.exports = router;