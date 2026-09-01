/**
 * Social Graph API Routes (Section 7)
 * ---------------------------------------------------------------------------
 * Handles: Follow, Unfollow, List Followers/Following, Endorsements, Recommendations,
 *          and User Blocking.
 */

'use strict';

const express = require('express');
const router = express.Router();
const SocialGraphService = require('../../application/SocialGraphService');
const { requireAuth, optionalAuth } = require('../guards/authGuard');

// POST /api/v1/social/follow (Follow user or seller)
router.post('/follow', requireAuth, async (req, res, next) => {
  try {
    const result = await SocialGraphService.follow(req.principal, req.body);
    res.status(200).json({ status: 'success', data: result });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/social/unfollow (Unfollow user or seller)
router.post('/unfollow', requireAuth, async (req, res, next) => {
  try {
    const result = await SocialGraphService.unfollow(req.principal, req.body);
    res.status(200).json({ status: 'success', data: result });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/social/status/:targetType/:targetId (Check if following)
router.get('/status/:targetType/:targetId', optionalAuth, async (req, res, next) => {
  try {
    if (!req.principal) {
      return res.json({ status: 'success', data: { isFollowing: false } });
    }
    const result = await SocialGraphService.getFollowStatus(req.principal.id, req.params.targetType, req.params.targetId);
    res.json({ status: 'success', data: result });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/social/followers/:targetType/:targetId (List followers)
router.get('/followers/:targetType/:targetId', async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 20;
    const offset = parseInt(req.query.offset, 10) || 0;
    const result = await SocialGraphService.listFollowers(req.params.targetType, req.params.targetId, { limit, offset });
    res.json({ status: 'success', data: result });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/social/following/:userId (List who a user follows)
router.get('/following/:userId', async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 20;
    const offset = parseInt(req.query.offset, 10) || 0;
    const result = await SocialGraphService.listFollowing(req.params.userId, { limit, offset });
    res.json({ status: 'success', data: result });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/social/recommendations (Post endorsement recommendation)
router.post('/recommendations', requireAuth, async (req, res, next) => {
  try {
    const result = await SocialGraphService.createRecommendation(req.principal, req.body);
    res.status(201).json({ status: 'success', data: { recommendation: result } });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/social/recommendations/:id (Delete recommendation)
router.delete('/recommendations/:id', requireAuth, async (req, res, next) => {
  try {
    const result = await SocialGraphService.deleteRecommendation(req.principal, req.params.id);
    res.json({ status: 'success', data: result });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/social/recommendations/:targetType/:targetId (List recommendations)
router.get('/recommendations/:targetType/:targetId', async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 20;
    const offset = parseInt(req.query.offset, 10) || 0;
    const result = await SocialGraphService.listRecommendations(req.params.targetType, req.params.targetId, { limit, offset });
    res.json({ status: 'success', data: result });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/social/block (Block a user)
router.post('/block', requireAuth, async (req, res, next) => {
  try {
    const targetUserId = req.body.userId || req.body.targetUserId || req.body.blockedId;
    const result = await SocialGraphService.blockUser(req.principal, targetUserId);
    res.json({ status: 'success', data: result });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/social/unblock (Unblock a user)
router.post('/unblock', requireAuth, async (req, res, next) => {
  try {
    const targetUserId = req.body.userId || req.body.targetUserId || req.body.blockedId;
    const result = await SocialGraphService.unblockUser(req.principal, targetUserId);
    res.json({ status: 'success', data: result });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/social/blocks (List blocked users)
router.get('/blocks', requireAuth, async (req, res, next) => {
  try {
    const blocks = await SocialGraphService.listBlockedUsers(req.principal);
    res.json({ status: 'success', data: { blocks } });
  } catch (err) {
    next(err);
  }
});

module.exports = router;