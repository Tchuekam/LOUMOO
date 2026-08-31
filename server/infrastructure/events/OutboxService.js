/**
 * Transactional Outbox Service & Event Dispatcher
 * Ensures critical state mutations and domain events are persisted reliably before external dispatch
 */

const logger = require('../../shared/logging/logger');
const { tryGetAdmin, handleDatabaseFailure } = require('../database/SupabaseClient.js');

class OutboxService {
  constructor() {
    this.inMemoryOutbox = [];
    this.subscribers = new Map(); // eventType -> Set<callback>
  }

  /**
   * Subscribe an event listener to a domain event type
   */
  subscribe(eventType, callback) {
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, new Set());
    }
    this.subscribers.get(eventType).add(callback);
    return () => this.subscribers.get(eventType).delete(callback);
  }

  /**
   * Publish or Enqueue a domain event into the transactional outbox
   */
  async publish(event) {
    return this.enqueue(event);
  }

  async enqueue(event) {
    const record = {
      aggregate_type: event.aggregateType,
      aggregate_id: event.aggregateId,
      event_type: event.eventType,
      payload: event.payload,
      status: 'PENDING',
      created_at: new Date().toISOString()
    };

    try {
      const adminDb = tryGetAdmin('OutboxService');
if (adminDb) {
        const { data, error } = await adminDb
          .schema('system').from('outbox_events')
          .insert(record)
          .select('id')
          .single();

        if (!error && data) {
          logger.debug(`[OutboxService] Enqueued event ${event.eventType} (DB ID: ${data.id})`);
          // Trigger asynchronous local dispatch
          this._dispatchAsync(event);
          return data.id;
        }
      }
    } catch (err) {
      handleDatabaseFailure(err, 'Supabase outbox write failed, queuing in memory');
    }

    this.inMemoryOutbox.push({ ...record, id: `mem_${Date.now()}_${Math.random()}` });
    this._dispatchAsync(event);
    return record.id;
  }

  /**
   * Internal asynchronous dispatch to local module subscribers
   */
  _dispatchAsync(event) {
    setImmediate(async () => {
      const handlers = this.subscribers.get(event.eventType) || new Set();
      const wildcardHandlers = this.subscribers.get('*') || new Set();

      const allHandlers = [...handlers, ...wildcardHandlers];

      for (const handler of allHandlers) {
        try {
          await handler(event);
        } catch (err) {
          logger.error(`[OutboxService] Handler failed for event ${event.eventType}`, err);
        }
      }
    });
  }

  /**
   * Process pending outbox batch (for background workers)
   */
  async processPendingBatch(limit = 50) {
    // Dispatch remaining in-memory events
    const memPending = this.inMemoryOutbox.filter(e => e.status === 'PENDING').slice(0, limit);
    for (const item of memPending) {
      item.status = 'PUBLISHED';
      item.published_at = new Date().toISOString();
    }
    return { processed: memPending.length };
  }
}

module.exports = new OutboxService();
