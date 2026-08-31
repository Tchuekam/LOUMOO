/**
 * LOUMOO — Clerk Webhook Handler
 * ---------------------------------------------------------------------------
 * Keeps the LOUMOO profile in step with the Clerk identity.
 *
 * Four properties, each of which the previous revision lacked:
 *
 *   AUTHENTICATED  Every payload is Svix-signature verified. There is no
 *                  "development fallback" that accepts unsigned JSON — an
 *                  unsigned webhook could forge `user.deleted` for any account.
 *   IDEMPOTENT     `system.webhook_events.event_id` is UNIQUE. A redelivery of
 *                  an event already marked PROCESSED is acknowledged without
 *                  re-running the side effects, so retries never duplicate a
 *                  profile.
 *   RETRY-SAFE     A failure is recorded and answered with 500 so Svix retries.
 *                  A permanent rejection is answered 200 so it does not retry
 *                  forever.
 *   OBSERVABLE     Every event, attempt and outcome is written to the ledger.
 */

const { Webhook } = require('svix');
const { SupabaseDatabase } = require('../../../../infrastructure/database/SupabaseClient.js');
const config = require('../../../../config/env');
const ClerkIdentityProvider = require('../../infrastructure/ClerkIdentityProvider');
const ProfileRepository = require('../../infrastructure/ProfileRepository');
const OutboxService = require('../../../../infrastructure/events/OutboxService');
const { EVENT_TYPES, createDomainEvent } = require('../../../../infrastructure/events/EventContracts');
const AnalyticsService = require('../../../../infrastructure/analytics/AnalyticsService');
const EmailProvider = require('../../../../infrastructure/email/EmailProvider');
const logger = require('../../../../shared/logging/logger');
const { AuthenticationError, NotConfiguredError } = require('../../../../shared/errors/AppError');

const HANDLED_EVENTS = new Set(['user.created', 'user.updated', 'user.deleted']);

/**
 * Express handler. Mounted with a raw body parser so the exact bytes Clerk
 * signed are the bytes verified — re-serialising parsed JSON changes key order
 * and whitespace and breaks the signature.
 */
async function handleClerkWebhook(req, res, next) {
  try {
    if (!config.clerk.webhookSecret) {
      // Refusing is the only safe answer. Accepting unsigned identity events
      // would let anyone create, mutate or delete any LOUMOO account. This is
      // the DOCUMENTED behavior (.env.example): the deployment boots, the
      // endpoint answers 503 WEBHOOK_NOT_CONFIGURED, and no identity event is
      // processed. It is a warning in production config validation, not a
      // boot blocker — an absent secret cannot be exploited, only unused.
      logger.warn(
        '[ClerkWebhook] Rejected: CLERK_WEBHOOK_SECRET is not configured — ' +
        'answering 503 WEBHOOK_NOT_CONFIGURED. Identity events will not be processed.'
      );
      throw new NotConfiguredError(
        'Webhook processing is disabled: CLERK_WEBHOOK_SECRET is not configured',
        { requirement: 'CLERK_WEBHOOK_SECRET', endpoint: '/api/v1/webhooks/clerk' }
      );
    }

    const rawBody = Buffer.isBuffer(req.body)
      ? req.body.toString('utf8')
      : (typeof req.body === 'string' ? req.body : JSON.stringify(req.body));

    const headers = {
      'svix-id': req.headers['svix-id'],
      'svix-timestamp': req.headers['svix-timestamp'],
      'svix-signature': req.headers['svix-signature']
    };

    if (!headers['svix-id'] || !headers['svix-timestamp'] || !headers['svix-signature']) {
      throw new AuthenticationError('Missing Svix webhook verification headers');
    }

    let event;
    try {
      event = new Webhook(config.clerk.webhookSecret).verify(rawBody, headers);
    } catch (err) {
      logger.warn(`[ClerkWebhook] Signature verification failed: ${err.message}`);
      throw new AuthenticationError('Invalid Clerk webhook signature');
    }

    const eventId = headers['svix-id'];
    const eventType = event.type;

    const db = SupabaseDatabase.getAdmin().schema('system');

    // ── Idempotency: has this exact delivery already succeeded? ────────────
    const { data: existing } = await db
      .from('webhook_events')
      .select('id, status, attempts, result')
      .eq('event_id', eventId)
      .maybeSingle();

    if (existing && existing.status === 'PROCESSED') {
      logger.info(`[ClerkWebhook] Duplicate delivery ${eventId} (${eventType}) — already processed`);
      return res.status(200).json({ success: true, deduplicated: true, result: existing.result });
    }

    const attempts = (existing ? existing.attempts : 0) + 1;

    await db.from('webhook_events').upsert({
      ...(existing ? { id: existing.id } : {}),
      source: 'clerk',
      event_id: eventId,
      event_type: eventType,
      payload: event,
      status: 'RECEIVED',
      attempts
    }, { onConflict: 'event_id' });

    if (!HANDLED_EVENTS.has(eventType)) {
      await markProcessed(db, eventId, { ignored: true });
      return res.status(200).json({ success: true, acknowledged: true, type: eventType });
    }

    // ── Apply ──────────────────────────────────────────────────────────────
    let result;
    try {
      result = await applyUserEvent(eventType, event.data);
    } catch (err) {
      await db.from('webhook_events')
        .update({ status: 'FAILED', last_error: String(err.message).slice(0, 1000) })
        .eq('event_id', eventId);
      logger.error(`[ClerkWebhook] ${eventType} (${eventId}) failed on attempt ${attempts}: ${err.message}`);
      // 500 so Svix retries with backoff.
      return next(err);
    }

    await markProcessed(db, eventId, result);
    logger.info(`[ClerkWebhook] ${eventType} (${eventId}) processed`, result);

    return res.status(200).json({ success: true, processed: true, result });
  } catch (err) {
    return next(err);
  }
}

async function markProcessed(db, eventId, result) {
  await db.from('webhook_events')
    .update({ status: 'PROCESSED', processed_at: new Date().toISOString(), result, last_error: null })
    .eq('event_id', eventId);
}

/**
 * Applies one identity lifecycle event.
 * `getOrCreateForClerkUser` is idempotent and race-safe, so a webhook arriving
 * at the same moment as the user's first API call cannot produce two profiles.
 */
async function applyUserEvent(eventType, data) {
  const identity = ClerkIdentityProvider.normalizeUser(data);
  if (!identity || !identity.clerkUserId) {
    throw new Error('Clerk webhook payload carried no user id');
  }

  if (eventType === 'user.deleted') {
    const removed = await ProfileRepository.markDeleted(identity.clerkUserId);
    return { action: 'deleted', clerkUserId: identity.clerkUserId, profileId: removed ? removed.id : null };
  }

  const { profile, created } = await ProfileRepository.getOrCreateForClerkUser(identity);
  const synced = created ? profile : await ProfileRepository.syncFromClerk(profile, identity);

  await OutboxService.enqueue(createDomainEvent(
    created ? EVENT_TYPES.USER_CREATED : EVENT_TYPES.USER_UPDATED,
    'UserProfile',
    synced.id,
    { clerkUserId: identity.clerkUserId, emailVerified: identity.emailVerified }
  )).catch(err => logger.warn(`[ClerkWebhook] Outbox enqueue skipped: ${err.message}`));

  if (created) {
    AnalyticsService.identify(synced.id, {
      email: identity.email,
      name: `${identity.firstName} ${identity.lastName}`.trim()
    });
    AnalyticsService.track(synced.id, 'user_signed_up', {
      provider: 'clerk',
      hasPhone: Boolean(identity.phoneNumber),
      emailVerified: identity.emailVerified
    });

    if (identity.email) {
      EmailProvider.sendWelcomeEmail(identity.email, identity.firstName)
        .catch(err => logger.warn(`[ClerkWebhook] Welcome email skipped: ${err.message}`));
    }
  }

  return {
    action: created ? 'created' : 'updated',
    clerkUserId: identity.clerkUserId,
    profileId: synced.id,
    emailVerified: Boolean(synced.email_verified_at)
  };
}

module.exports = { handleClerkWebhook, applyUserEvent, HANDLED_EVENTS };
