/**
 * LOUMOO Commerce Core — Order Presentation Routes
 * ---------------------------------------------------------------------------
 * REST endpoints for order creation, history, details, and cancellation.
 * Adheres to 04_API_SPEC contract:
 *   - POST   /api/v1/orders
 *   - GET    /api/v1/orders
 *   - GET    /api/v1/orders/:id
 *   - POST   /api/v1/orders/:id/cancel
 *   - PATCH  /api/v1/orders/:id/status
 */

const express = require('express');
const { OrderCreationService } = require('../../application/OrderCreationService');
const { OrderQueryService } = require('../../application/OrderQueryService');
const { OrderLifecycleService } = require('../../application/OrderLifecycleService');
const { CancelOrderInputSchema } = require('../validators/orderSchemas');
const { requireAuth } = require('../../../identity/presentation/guards/authGuard');
const { ValidationError } = require('../../../../shared/errors/AppError');

const router = express.Router();

const creationService = new OrderCreationService();
const queryService = new OrderQueryService();
const lifecycleService = new OrderLifecycleService();

// Helper to reliably extract caller profile ID and role
function getCallerIdentity(req) {
  const userId = req.userProfile?.id || req.userId || req.principal?.id;
  const userRole = req.userProfile?.primaryRole || req.principal?.primaryRole || 'customer';
  return { userId, userRole };
}

// POST /api/v1/orders - Place a new order with server-authoritative pricing
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { userId } = getCallerIdentity(req);
    const idempotencyKey = req.headers['idempotency-key'] || req.headers['x-idempotency-key'] || req.body?.idempotencyKey;

    const order = await creationService.createOrder(userId, req.body, { idempotencyKey });
    res.status(201).json({
      success: true,
      status: 'success',
      data: { order: order.toJSON() }
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/orders - Caller purchase history
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { userId } = getCallerIdentity(req);
    const { status = 'all', limit = 20, offset = 0 } = req.query;

    const result = await queryService.getUserOrders(userId, {
      status,
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10)
    });

    res.json({
      success: true,
      status: 'success',
      data: result
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/orders/:id - Single order detail (404 Anti-Enumeration for non-owners)
router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const { userId, userRole } = getCallerIdentity(req);
    const order = await queryService.getOrderById(req.params.id, userId, { userRole });

    res.json({
      success: true,
      status: 'success',
      data: { order }
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/orders/:id/cancel - Buyer order cancellation
router.post('/:id/cancel', requireAuth, async (req, res, next) => {
  try {
    const { userId, userRole } = getCallerIdentity(req);
    const parsed = CancelOrderInputSchema.safeParse(req.body || {});
    if (!parsed.success) {
      throw new ValidationError(parsed.error.issues[0]?.message || 'Invalid cancel payload', parsed.error.issues);
    }

    const order = await lifecycleService.cancelOrder(
      req.params.id,
      userId,
      parsed.data.reason,
      { userRole }
    );

    res.json({
      success: true,
      status: 'success',
      message: 'Order cancelled successfully.',
      data: { order }
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/orders/:id/status - Authorized merchant or admin fulfillment transition
router.patch('/:id/status', requireAuth, async (req, res, next) => {
  try {
    const { userId, userRole } = getCallerIdentity(req);
    const { status, note } = req.body || {};

    if (!status) throw new ValidationError('Field "status" is required.');

    const order = await lifecycleService.updateFulfillmentStatus(
      req.params.id,
      status,
      userId,
      { userRole, note }
    );

    res.json({
      success: true,
      status: 'success',
      data: { order }
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
