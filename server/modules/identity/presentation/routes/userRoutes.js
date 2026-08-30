/**
 * User & Profile Management API Routes (02.08 - 02.14)
 */

const express = require('express');
const router = express.Router();
const UpdateUserProfileUseCase = require('../../application/UpdateUserProfileUseCase');
const AccountSecurityService = require('../../application/AccountSecurityService');
const DeleteAccountUseCase = require('../../application/DeleteAccountUseCase');
const PrivacyPreferencesUseCase = require('../../application/PrivacyPreferencesUseCase');
const { requireAuth } = require('../guards/authGuard');
const { requireResourceOwner } = require('../guards/resourceOwnershipGuard');
const UserProfile = require('../../entities/UserProfile');
const CacheService = require('../../../../infrastructure/cache/CacheService');
const { NotFoundError } = require('../../../../shared/errors/AppError');
const logger = require('../../../../shared/logging/logger');

// GET /api/v1/users/me (02.09)
router.get('/me', requireAuth, async (req, res) => {
  res.json({
    status: 'success',
    data: {
      user: req.userProfile.toPublicJSON()
    }
  });
});

// PATCH /api/v1/users/me (02.09)
router.patch('/me', requireAuth, async (req, res, next) => {
  try {
    const result = await UpdateUserProfileUseCase.execute(req.userProfile, req.body);
    res.json({
      status: 'success',
      data: result
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/users/me/sessions (02.08)
router.get('/me/sessions', requireAuth, async (req, res, next) => {
  try {
    const sessions = await AccountSecurityService.getActiveSessions(req.userProfile.clerkUserId);
    res.json({
      status: 'success',
      data: { sessions }
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/users/me/sessions/:sessionId (02.08)
router.delete('/me/sessions/:sessionId', requireAuth, async (req, res, next) => {
  try {
    const result = await AccountSecurityService.revokeSession(req.userProfile.clerkUserId, req.params.sessionId);
    res.json({
      status: 'success',
      data: result
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/users/me/privacy (02.14)
router.get('/me/privacy', requireAuth, async (req, res, next) => {
  try {
    const prefs = await PrivacyPreferencesUseCase.getPreferences(req.userProfile.id);
    res.json({
      status: 'success',
      data: { preferences: prefs }
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/users/me/privacy (02.14)
router.patch('/me/privacy', requireAuth, async (req, res, next) => {
  try {
    const result = await PrivacyPreferencesUseCase.updatePreferences(req.userProfile.id, req.body);
    res.json({
      status: 'success',
      data: result
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/users/me (02.13)
router.delete('/me', requireAuth, async (req, res, next) => {
  try {
    const result = await DeleteAccountUseCase.execute(req.userProfile, req.body, {
      ip: req.ip,
      userAgent: req.get('user-agent')
    });
    res.json({
      status: 'success',
      data: result
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/users/:userId/public (02.09 & 02.10)
router.get('/:userId/public', async (req, res, next) => {
  try {
    const { userId } = req.params;
    let cached = await CacheService.get(`identity:profile:${userId}`);
    if (cached) {
      const p = new UserProfile(cached);
      return res.json({
        status: 'success',
        data: { user: p.toSafeMerchantPublicCard() }
      });
    }

    // Default mock merchant card for local development
    const p = new UserProfile({
      id: userId,
      clerkUserId: `user_${userId}`,
      firstName: 'LOUMOO',
      lastName: 'Merchant',
      businessName: 'Orca Electronics',
      city: 'Douala (Akwa)',
      sellerType: 'pro',
      kycDocStatus: 'verified'
    });

    res.json({
      status: 'success',
      data: { user: p.toSafeMerchantPublicCard() }
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
