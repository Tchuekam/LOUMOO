/**
 * Unit Test: Event Contracts & Outbox Service
 */

const assert = require('assert');
const OutboxService = require('../../server/infrastructure/events/OutboxService');
const { EVENT_TYPES, createDomainEvent } = require('../../server/infrastructure/events/EventContracts');

async function run() {
  console.log('  Testing Event Contracts & Outbox Dispatching...');

  let receivedEvent = null;

  // 1. Subscribe to specific event type
  const unsubscribe = OutboxService.subscribe(EVENT_TYPES.USER_CREATED, (event) => {
    receivedEvent = event;
  });

  // 2. Create and Enqueue Domain Event
  const testEvent = createDomainEvent(
    EVENT_TYPES.USER_CREATED,
    'UserProfile',
    'usr_99999',
    { email: 'user@loumoo.cm', role: 'customer' }
  );

  assert.strictEqual(testEvent.eventType, EVENT_TYPES.USER_CREATED);
  assert.strictEqual(testEvent.aggregateId, 'usr_99999');
  assert.ok(testEvent.eventId);

  await OutboxService.enqueue(testEvent);

  // Wait for setImmediate dispatch
  await new Promise(r => setTimeout(r, 50));

  assert.ok(receivedEvent, 'Subscriber should receive dispatched event');
  assert.strictEqual(receivedEvent.aggregateId, 'usr_99999');

  unsubscribe();
  console.log('    ✓ Event Contracts & Outbox tests passed.');
}

module.exports = { run };
