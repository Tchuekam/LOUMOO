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
   * Process pending outbox batch from the REAL outbox table (system.outbox_events)
   * and dispatch each event to its subscribers. This is the worker that makes
   * the transactional outbox actually deliver: rows are claimed PENDING →
   * dispatched → PUBLISHED (or FAILED with a retry count).
   */
  async processPendingBatch(limit = 50) {
    let claimed = [];

    try {
      const adminDb = tryGetAdmin('OutboxService');
      if (adminDb) {
        const { data, error } = await adminDb
          .schema('system')
          .from('outbox_events')
          .select('id, aggregate_type, aggregate_id, event_type, payload, status, retry_count')
          .eq('status', 'PENDING')
          .order('created_at', { ascending: true })
          .limit(limit);

        if (error) {
          handleDatabaseFailure(error, 'OutboxService.drain');
          claimed = this.inMemoryOutbox.filter(e => e.status === 'PENDING').slice(0, limit);
        } else {
          claimed = data || [];
        }
      } else {
        claimed = this.inMemoryOutbox.filter(e => e.status === 'PENDING').slice(0, limit);
      }
    } catch (err) {
      handleDatabaseFailure(err, 'OutboxService.drain');
      claimed = this.inMemoryOutbox.filter(e => e.status === 'PENDING').slice(0, limit);
    }

    let processed = 0;
    for (const row of claimed) {
      const isMemory = Boolean(row.id && String(row.id).startsWith('mem_'));
      const event = isMemory
        ? { aggregateType: row.aggregate_type, aggregateId: row.aggregate_id, eventType: row.event_type, payload: row.payload }
        : { aggregateType: row.aggregate_type, aggregateId: row.aggregate_id, eventType: row.event_type, payload: row.payload };

      // Dispatch to local subscribers by event type + wildcard.
      const handlers = [
        ...(this.subscribers.get(event.eventType) || new Set()),
        ...(this.subscribers.get('*') || new Set())
      ];
      let ok = true;
      for (const handler of handlers) {
        try {
          await handler(event);
        } catch (err) {
          ok = false;
          logger.error(`[OutboxService] Handler failed for event ${event.eventType}: ${err.message}`);
        }
      }

      const retryCount = (Number(row.retry_count) || 0) + 1;
      const nextStatus = ok ? 'PUBLISHED' : retryCount >= 5 ? 'FAILED' : 'PENDING';

      try {
        const adminDb = tryGetAdmin('OutboxService');
        if (adminDb && !isMemory) {
          const { error: updErr } = await adminDb
            .schema('system')
            .from('outbox_events')
            .update({
              status: nextStatus,
              retry_count: retryCount,
              published_at: ok ? new Date().toISOString() : null,
              error_message: ok ? null : 'handler_failure_see_logs'
            })
            .eq('id', row.id);
          if (updErr) handleDatabaseFailure(updErr, 'OutboxService.mark');
        } else if (isMemory) {
          row.status = nextStatus;
          row.published_at = ok ? new Date().toISOString() : undefined;
          row.retry_count = retryCount;
        }
      } catch (err) {
        handleDatabaseFailure(err, 'OutboxService.mark');
      }
      processed += 1;
    }

    return { processed };
  }
}

module.exports = new OutboxService();
