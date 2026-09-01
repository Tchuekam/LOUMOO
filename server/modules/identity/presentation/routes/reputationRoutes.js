/**
 * Reviews & Reputation API Routes (Section 8 & 11)
 * ---------------------------------------------------------------------------
 * Handles: Verified Transaction Reviews, Rating Breakdowns, and Reputation Metrics.
 */

'use strict';

const express = require('express');
const router = express.Router();
const ReviewService = require('../../application/ReviewService');
const { ReputationEngine } = require('../../domain/ReputationEngine');
const { SupabaseClient } = require('../../../../infrastructure/database/SupabaseClient');
const { NotFoundError } = require('../../../../shared/errors/AppError');
const { requireAuth } = require('../guards/authGuard');

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// POST /api/v1/reviews (Submit review)
router.post('/reviews', requireAuth, async (req, res, next) => {
  try {
    const result = await ReviewService.createReview(req.principal, req.body);
    res.status(201).json({ status: 'success', data: { review: result } });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/reviews/:targetType/:targetId (List reviews)
router.get('/reviews/:targetType/:targetId', async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 20;
    const offset = parseInt(req.query.offset, 10) || 0;
    const verifiedOnly = req.query.verified === 'true';
    const minRating = req.query.minRating ? parseInt(req.query.minRating, 10) : null;

    const result = await ReviewService.listReviews(req.params.targetType, req.params.targetId, {
      limit,
      offset,
      verifiedOnly,
      minRating
    });
    res.json({ status: 'success', data: result });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/reviews/:targetType/:targetId/summary (Get rating summary & breakdown)
router.get('/reviews/:targetType/:targetId/summary', async (req, res, next) => {
  try {
    const summary = await ReviewService.getRatingSummary(req.params.targetType, req.params.targetId);
    res.json({ status: 'success', data: { summary } });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/reviews/:id (Delete review)
router.delete('/reviews/:id', requireAuth, async (req, res, next) => {
  try {
    const result = await ReviewService.deleteReview(req.principal, req.params.id);
    res.json({ status: 'success', data: result });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/reputation/:sellerId (Get full multi-signal reputation breakdown)
router.get('/reputation/:sellerId', async (req, res, next) => {
  try {
    const adminDb = SupabaseClient.getAdmin();
    let query = adminDb
      .from('stores')
      .select('id, name, slug, rating, rating_count, is_verified, recommendation_count, completed_orders_count, response_rate_percent, trust_tier, reputation_score');

    if (UUID_REGEX.test(req.params.sellerId) || req.params.sellerId.startsWith('store_')) {
      query = query.eq('id', req.params.sellerId);
    } else {
      query = query.eq('slug', req.params.sellerId.toLowerCase());
    }

    const { data: store, error } = await query.maybeSingle();
    if (error || !store) throw new NotFoundError('Seller Store', req.params.sellerId);

    const summary = await ReviewService.getRatingSummary('seller', store.id);
    const rep = ReputationEngine.calculateReputation({
      ratingAvg: summary.average,
      ratingCount: summary.total,
      verifiedReviewsCount: summary.verifiedCount,
      recommendationCount: store.recommendation_count || 0,
      completedOrdersCount: store.completed_orders_count || 0,
      isKycVerified: Boolean(store.is_verified),
      responseRatePercent: store.response_rate_percent || 100
    });

    res.json({
      status: 'success',
      data: {
        sellerId: store.id,
        sellerName: store.name,
        slug: store.slug,
        reputation: rep
      }
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;