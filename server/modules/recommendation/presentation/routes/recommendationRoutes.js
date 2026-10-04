/**
 * LOUMOO Discovery Engine — API routes (mounted at /api/v1/recommendations)
 * ===========================================================================
 *   POST /recommendations/events          batched interaction events
 *   GET  /recommendations/feed            personalized For-You page
 *   GET  /recommendations/similar/:itemId more-like-this + people-also-viewed
 *   GET  /recommendations/trending        non-personalized trending
 *   GET  /recommendations/profile         the caller's own learned taste (auth)
 *   POST /recommendations/feedback        not_interested | hide_store | reset
 *
 * Reads use optionalAuth so guests get personalization via their visitorId; the
 * events endpoint accepts `navigator.sendBeacon` payloads (no auth header), so
 * the visitor id travels in the body. Only /profile requires a session.
 */

const express = require('express');
const router = express.Router();
const { z } = require('zod');

const { requireAuth, optionalAuth } = require('../../../identity/presentation/guards/authGuard');
const RateLimitService = require('../../../../infrastructure/cache/RateLimitService');
const { ValidationError } = require('../../../../shared/errors/AppError');
const RecommendationService = require('../../application/RecommendationService');

const ctxOf = (req) => ({
  userId: (req.userProfile && req.userProfile.id) || req.userId || (req.principal && req.principal.id) || null,
  principal: req.principal || null
});
const ok = (res, data) => res.json({ success: true, status: 'success', data });

// Batched events can be chatty; give the endpoint its own generous budget,
// keyed by user or IP, on top of the global limiter.
const eventsLimiter = RateLimitService.middleware({
  maxRequests: 120,
  windowSeconds: 60,
  keyGenerator: (req) => 'reco:evt:' + ((req.userProfile && req.userProfile.id) || req.ip || 'anon')
});

const EventSchema = z.object({
  visitorId: z.string().max(80).optional(),
  events: z.array(z.object({
    type: z.string().max(24),
    itemId: z.string().max(80).optional().nullable(),
    category: z.string().max(64).optional().nullable(),
    subcategory: z.string().max(64).optional().nullable(),
    brand: z.string().max(80).optional().nullable(),
    storeName: z.string().max(160).optional().nullable(),
    priceXaf: z.union([z.number(), z.string()]).optional().nullable(),
    city: z.string().max(80).optional().nullable(),
    dwellMs: z.union([z.number(), z.string()]).optional().nullable(),
    query: z.string().max(120).optional().nullable(),
    position: z.union([z.number(), z.string()]).optional().nullable(),
    surface: z.string().max(32).optional().nullable()
  })).max(50)
}).passthrough();

// POST /api/v1/recommendations/events
router.post('/events', optionalAuth, eventsLimiter, async (req, res, next) => {
  try {
    const parsed = EventSchema.safeParse(req.body || {});
    if (!parsed.success) {
      throw new ValidationError('Invalid event payload', parsed.error.issues);
    }
    const result = await RecommendationService.recordEvents(ctxOf(req), parsed.data);
    ok(res, result);
  } catch (err) { next(err); }
});

// GET /api/v1/recommendations/feed
router.get('/feed', optionalAuth, async (req, res, next) => {
  try {
    const data = await RecommendationService.getFeed(ctxOf(req), {
      visitorId: req.query.visitorId,
      limit: req.query.limit,
      cursor: req.query.cursor,
      city: req.query.city,
      surface: req.query.surface
    });
    ok(res, data);
  } catch (err) { next(err); }
});

// GET /api/v1/recommendations/similar/:itemId
router.get('/similar/:itemId', optionalAuth, async (req, res, next) => {
  try {
    const data = await RecommendationService.getSimilar(ctxOf(req), {
      itemId: req.params.itemId,
      visitorId: req.query.visitorId,
      limit: req.query.limit
    });
    ok(res, data);
  } catch (err) { next(err); }
});

// GET /api/v1/recommendations/trending
router.get('/trending', optionalAuth, async (req, res, next) => {
  try {
    const data = await RecommendationService.getTrending({
      limit: req.query.limit,
      city: req.query.city
    });
    ok(res, data);
  } catch (err) { next(err); }
});

// GET /api/v1/recommendations/profile  (auth: your own learned taste)
router.get('/profile', requireAuth, async (req, res, next) => {
  try {
    const data = await RecommendationService.getProfileSummary(ctxOf(req));
    ok(res, data);
  } catch (err) { next(err); }
});

// POST /api/v1/recommendations/feedback  { action, itemId?, storeName?, visitorId? }
router.post('/feedback', optionalAuth, async (req, res, next) => {
  try {
    const body = req.body || {};
    const action = String(body.action || '');
    if (['not_interested', 'hide_store', 'reset'].indexOf(action) === -1) {
      throw new ValidationError('Unknown feedback action', [{ field: 'action', message: 'Expected not_interested | hide_store | reset.' }]);
    }
    const data = await RecommendationService.feedback(ctxOf(req), {
      action: action,
      itemId: body.itemId,
      storeName: body.storeName,
      category: body.category,
      surface: body.surface,
      visitorId: body.visitorId
    });
    ok(res, data);
  } catch (err) { next(err); }
});

module.exports = router;
