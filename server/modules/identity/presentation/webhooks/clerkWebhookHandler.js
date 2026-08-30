/**
 * Clerk Webhook Handler
 * Verifies Svix webhook signatures, records webhook audit ledger, and triggers idempotent user synchronization
 */

const { Webhook } = require('svix');
const { config } = require('../../../../config/env');
const { SyncClerkUserUseCase } = require('../../application/SyncClerkUserUseCase');
const { adminClient } = require('../../../../infrastructure/database/SupabaseClient');
const { AuthenticationError, ValidationError } = require('../../../../shared/errors/AppError');
const logger = require('../../../../shared/logging/logger');

async function handleClerkWebhook(req, res, next) {
  const svixId = req.headers['svix-id'];
  const svixTimestamp = req.headers['svix-timestamp'];
  const svixSignature = req.headers['svix-signature'];

  const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);

  let event = null;

  // Signature verification (if webhook secret configured)
  if (config.clerk.webhookSecret) {
    if (!svixId || !svixTimestamp || !svixSignature) {
      throw new AuthenticationError('Missing required Svix webhook verification headers');
    }

    try {
      const wh = new Webhook(config.clerk.webhookSecret);
      event = wh.verify(rawBody, {
        'svix-id': svixId,
        'svix-timestamp': svixTimestamp,
        'svix-signature': svixSignature
      });
    } catch (err) {
      logger.error('[ClerkWebhook] Signature verification failed', err);
      throw new AuthenticationError('Invalid Clerk webhook signature');
    }
  } else {
    // Development fallback
    try {
      event = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    } catch (e) {
      throw new ValidationError('Invalid JSON payload');
    }
  }

  const eventType = event.type;
  const eventData = event.data;
  const eventId = svixId || event.id || `evt_${Date.now()}`;

  logger.info(`[ClerkWebhook] Received event ${eventType} (ID: ${eventId})`);

  // Record into webhook_events audit table
  try {
    if (adminClient) {
      await adminClient.from('webhook_events').upsert({
        source: 'clerk',
        event_id: eventId,
        event_type: eventType,
        payload: event,
        status: 'RECEIVED'
      }, { onConflict: 'event_id' });
    }
  } catch (err) {
    logger.warn(`[ClerkWebhook] Webhook ledger write skipped: ${err.message}`);
  }

  // Handle specific user events
  if (eventType === 'user.created' || eventType === 'user.updated' || eventType === 'user.deleted') {
    const result = await SyncClerkUserUseCase.execute(eventData, eventType);
    return res.status(200).json({ success: true, processed: true, result });
  }

  return res.status(200).json({ success: true, acknowledged: true, type: eventType });
}

module.exports = {
  handleClerkWebhook
};
