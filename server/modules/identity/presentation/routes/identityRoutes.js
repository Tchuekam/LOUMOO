/**
 * Identity Module — API Routes
 */

const express = require('express');
const router = express.Router();
const { requireAuth } = require('../guards/authGuard');
const { handleClerkWebhook } = require('../webhooks/clerkWebhookHandler');
const { SyncClerkUserUseCase } = require('../../application/SyncClerkUserUseCase');

const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');

// Subrouters
router.use('/auth', authRoutes);
router.use('/users', userRoutes);

// Ingest Clerk Webhooks
router.post('/webhooks/clerk', handleClerkWebhook);

// Get Authenticated User Profile (Legacy & v1 alias)
router.get('/me', requireAuth, (req, res) => {
  res.json({
    success: true,
    data: {
      profile: req.userProfile ? req.userProfile.toPublicJSON() : null,
      auth: req.auth
    }
  });
});

// Client-Triggered Identity Sync (upon frontend Clerk sign-in / registration)
router.post('/me/sync', requireAuth, async (req, res, next) => {
  try {
    const clerkUserData = {
      id: req.auth.userId,
      first_name: req.body.firstName || req.userProfile?.firstName || '',
      last_name: req.body.lastName || req.userProfile?.lastName || '',
      email_addresses: req.body.email ? [{ email_address: req.body.email }] : [],
      phone_numbers: req.body.phoneNumber ? [{ phone_number: req.body.phoneNumber }] : [],
      public_metadata: req.body.metadata || {}
    };

    const result = await SyncClerkUserUseCase.execute(clerkUserData, 'user.updated');
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
