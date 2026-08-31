/**
 * Identity Module — Route Composition
 */

const express = require('express');
const router = express.Router();

const { requireAuth } = require('../guards/authGuard');
const { handleClerkWebhook } = require('../webhooks/clerkWebhookHandler');
const AccountStateService = require('../../application/AccountStateService');

const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const accountStateRoutes = require('./accountStateRoutes');

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/me', accountStateRoutes);

/**
 * Clerk webhooks.
 *
 * `express.raw` is mounted here specifically: Svix signs the exact request
 * bytes, so the signature must be checked against those bytes rather than
 * against a re-serialised copy of the parsed JSON.
 */
router.post('/webhooks/clerk',
  express.raw({ type: '*/*', limit: '1mb' }),
  handleClerkWebhook);

/**
 * GET /api/v1/me — the profile in the shape the existing screens expect,
 * alongside the canonical account state.
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
