/**
 * Identity Module — Master Route Composition
 * ---------------------------------------------------------------------------
 * Composes authentication, user profile, account state, organizations,
 * social graph, public user profiles (/u/:username), and public seller pages (/s/:slug).
 */

const express = require('express');
const router = express.Router();

const { requireAuth, optionalAuth } = require('../guards/authGuard');
const { handleClerkWebhook } = require('../webhooks/clerkWebhookHandler');
const AccountStateService = require('../../application/AccountStateService');
const PublicProfileService = require('../../application/PublicProfileService');

const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const accountStateRoutes = require('./accountStateRoutes');
const organizationRoutes = require('./organizationRoutes');
const socialRoutes = require('./socialRoutes');
const reputationRoutes = require('./reputationRoutes');

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/me', accountStateRoutes);
router.use('/organizations', organizationRoutes);
router.use('/social', socialRoutes);
router.use('/', reputationRoutes);

// GET /api/v1/u/:username (Public user profile)
router.get('/u/:username', optionalAuth, async (req, res, next) => {
  try {
    const profile = await PublicProfileService.getUserPublicProfile(req.params.username, req.principal);
    res.json({ status: 'success', data: { profile } });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/s/:slug (Public seller commercial page)
router.get('/s/:slug', optionalAuth, async (req, res, next) => {
  try {
    const profile = await PublicProfileService.getSellerPublicProfile(req.params.slug, req.principal);
    res.json({ status: 'success', data: { seller: profile } });
  } catch (err) {
    next(err);
  }
});

/**
 * Clerk webhooks.
 */
router.post('/webhooks/clerk',
  express.raw({ type: '*/*', limit: '1mb' }),
  handleClerkWebhook);

/**
 * GET /api/v1/me — canonical profile and client account state.
 */
router.get('/me', requireAuth, (req, res) => {
  res.json({
    status: 'success',
    data: {
      profile: req.userProfile ? req.userProfile.toPublicJSON() : null,
      accountState: AccountStateService.toClientState(req.principal, req.accountState),
      auth: {
        clerkUserId: req.auth.clerkUserId,
        sessionId: req.auth.sessionId
      }
    }
  });
});

module.exports = router;