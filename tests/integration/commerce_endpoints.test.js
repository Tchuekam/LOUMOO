/**
 * LOUMOO Integration Tests — Commerce Core REST API Endpoints Suite
 * ---------------------------------------------------------------------------
 * Drives the real Express app with real HTTP requests over the network:
 *   1. POST /api/v1/orders — Order placement with server pricing & validation
 *   2. POST /api/v1/orders — Idempotency-Key header replay & payload mismatch
 *   3. Price tampering over HTTP — 400 ValidationError
 *   4. Privileged field injection over HTTP — 400 ValidationError
 *   5. GET /api/v1/orders — Caller order history
 *   6. GET /api/v1/orders/:id — 404 Anti-Enumeration IDOR defense
 *   7. POST /api/v1/orders/:id/cancel — Buyer cancellation & IDOR defense
 */

require('../setup');
const assert = require('assert');
const harness = require('../helpers/harness');

async function run() {
  await harness.start();

  console.log('═══════════════════════════════════════════════════════════');
  console.log('  COMMERCE CORE REST API ENDPOINTS INTEGRATION TEST');
  console.log('═══════════════════════════════════════════════════════════\n');

  try {
    // 1. Provision real principals: Alice (buyer), Bob (attacker), and Seller with Store & Listing
    const seller = await harness.createUser({ stage: 'seller_ready' });
    const store = await harness.createStore(seller, { status: 'ACTIVE' });
    const listing = await harness.createListing(seller, store, {
      title: 'Sony WH-1000XM5 Wireless Headphones (Black)',
      base_price_minor: 250000,
      currency: 'XAF',
      status: 'PUBLISHED'
    });

    const alice = await harness.createUser({ stage: 'buyer' });
    const bob = await harness.createUser({ stage: 'buyer' });

    // ========================================================================
    // 1. HTTP ORDER CREATION & PRICE TAMPERING DEFENSE
    // ========================================================================
    console.log('  [1/4] Testing HTTP Order Creation & Price Tampering...');

    // 1.1 Attacker attempts to dictate price (1 XAF instead of 250,000 XAF)
    const attackRes = await harness.request('POST', '/api/v1/orders', {
      token: bob.token,
      body: {
        items: [{ listingId: listing.id, quantity: 1 }],
        totalAmountXaf: 1
      }
    });
    assert.strictEqual(attackRes.status, 400, 'Tampered price over HTTP must return 400 Bad Request');
    assert.ok(/Pricing mismatch/i.test(attackRes.body?.error?.message || ''), 'Must cite pricing mismatch');

    // 1.2 Attacker attempts to inject privileged sellerId
    const sellerHackRes = await harness.request('POST', '/api/v1/orders', {
      token: bob.token,
      body: {
        items: [{ listingId: listing.id, quantity: 1 }],
        sellerId: 'attacker_fake_seller'
      }
    });
    assert.strictEqual(sellerHackRes.status, 400, 'Privileged sellerId injection must return 400');

    // 1.3 Alice places legitimate order with server-authoritative calculation
    const createRes = await harness.request('POST', '/api/v1/orders', {
      token: alice.token,
      body: {
        items: [{ listingId: listing.id, quantity: 1 }],
        deliveryMethod: 'HOME_DELIVERY',
        shippingAddress: {
          fullName: 'Alice Mengue',
          phone: '+237690123456',
          street: 'Boulevard de la Liberte',
          city: 'Douala'
        }
      }
    });

    assert.strictEqual(createRes.status, 201, `Order creation failed: ${JSON.stringify(createRes.body)}`);
    const createdOrder = createRes.body.data.order;
    assert.ok(createdOrder.id, 'Order ID must be generated');
    assert.ok(createdOrder.orderNumber.startsWith('KM-'), 'Order number must start with KM-');
    assert.strictEqual(createdOrder.subtotalXaf, 250000, 'Server must calculate subtotal of 250,000 XAF');
    assert.strictEqual(createdOrder.shippingFeeXaf, 3000, 'Standard shipping fee of 3,000 XAF must apply');
    assert.strictEqual(createdOrder.totalAmountXaf, 253000, 'Total must equal 253,000 XAF');
    assert.strictEqual(createdOrder.buyerId, alice.id, 'Order buyerId must match Alice');
    assert.strictEqual(createdOrder.sellerId, seller.id, 'Order sellerId must match Seller');
    assert.strictEqual(createdOrder.paymentStatus, 'pending', 'Payment status must be pending');
    assert.strictEqual(createdOrder.fulfillmentStatus, 'processing');

    console.log('    ✓ HTTP Order creation and price tampering defenses passed.');

    // ========================================================================
    // 2. IDEMPOTENCY OVER HTTP
    // ========================================================================
    console.log('  [2/4] Testing Idempotency-Key Header Handling...');

    const idempotencyKey = `http_idemp_${Date.now()}`;
    const orderPayload = {
      items: [{ listingId: listing.id, quantity: 2 }],
      deliveryMethod: 'STORE_PICKUP'
    };

    // 2.1 First request with idempotency key
    const firstRes = await harness.request('POST', '/api/v1/orders', {
      token: alice.token,
      headers: { 'Idempotency-Key': idempotencyKey },
      body: orderPayload
    });
    assert.strictEqual(firstRes.status, 201);
    const firstOrder = firstRes.body.data.order;

    // 2.2 Replay request with same key and same payload
    const replayRes = await harness.request('POST', '/api/v1/orders', {
      token: alice.token,
      headers: { 'Idempotency-Key': idempotencyKey },
      body: orderPayload
    });
    assert.ok([200, 201].includes(replayRes.status), 'Replay must succeed');
    const replayedOrder = replayRes.body.data?.order || replayRes.body.order;
    assert.strictEqual(replayedOrder.id, firstOrder.id, 'Idempotent replay must return original order ID');
    assert.strictEqual(replayedOrder.orderNumber, firstOrder.orderNumber);

    // 2.3 Replay request with same key but DIFFERENT payload
    const conflictRes = await harness.request('POST', '/api/v1/orders', {
      token: alice.token,
      headers: { 'Idempotency-Key': idempotencyKey },
      body: {
        items: [{ listingId: listing.id, quantity: 10 }],
        deliveryMethod: 'HOME_DELIVERY'
      }
    });
    assert.strictEqual(conflictRes.status, 409, 'Mutated payload with same idempotency key must return 409 Conflict');

    console.log('    ✓ Idempotency-Key header replays and conflict detection verified.');

    // ========================================================================
    // 3. READ-SIDE & ANTI-IDOR (404 ANTI-ENUMERATION)
    // ========================================================================
    console.log('  [3/4] Testing Read Endpoints & Anti-IDOR (404 Anti-Enumeration)...');

    // 3.1 Alice lists her orders
    const listRes = await harness.request('GET', '/api/v1/orders', {
      token: alice.token
    });
    assert.strictEqual(listRes.status, 200);
    assert.ok(Array.isArray(listRes.body.data.orders), 'Orders must be returned as array');
    assert.ok(listRes.body.data.orders.some(o => o.id === createdOrder.id), 'Alice order must be present in her history');

    // 3.2 Alice views single order details
    const detailRes = await harness.request('GET', `/api/v1/orders/${createdOrder.id}`, {
      token: alice.token
    });
    assert.strictEqual(detailRes.status, 200);
    assert.strictEqual(detailRes.body.data.order.id, createdOrder.id);

    // 3.3 Bob attempts to inspect Alice's order -> 404 Anti-Enumeration
    const idorRes = await harness.request('GET', `/api/v1/orders/${createdOrder.id}`, {
      token: bob.token
    });
    assert.strictEqual(idorRes.status, 404, 'Bob accessing Alice order must receive 404 Not Found');

    console.log('    ✓ Read-side order discovery and 404 anti-enumeration IDOR defense verified.');

    // ========================================================================
    // 4. CANCELLATION & STATE MACHINE OVER HTTP
    // ========================================================================
    console.log('  [4/4] Testing Cancellation & State Machine Transitions...');

    // 4.1 Bob attempts to cancel Alice's order -> 404 Anti-Enumeration
    const idorCancelRes = await harness.request('POST', `/api/v1/orders/${createdOrder.id}/cancel`, {
      token: bob.token,
      body: { reason: 'Malicious cancel attempt' }
    });
    assert.strictEqual(idorCancelRes.status, 404, 'Bob cancelling Alice order must receive 404 Not Found');

    // 4.2 Alice legitimately cancels her order
    const cancelRes = await harness.request('POST', `/api/v1/orders/${createdOrder.id}/cancel`, {
      token: alice.token,
      body: { reason: 'Decided on a different model' }
    });
    assert.strictEqual(cancelRes.status, 200);
    assert.strictEqual(cancelRes.body.data.order.fulfillmentStatus, 'cancelled');

    // 4.3 Repeated cancellation fails (Terminal state)
    const repeatCancelRes = await harness.request('POST', `/api/v1/orders/${createdOrder.id}/cancel`, {
      token: alice.token,
      body: { reason: 'Cancel again' }
    });
    assert.strictEqual(repeatCancelRes.status, 409, 'Repeated cancellation must return 409 Conflict');

    // 4.4 Backward compatibility path: /api/v1/users/me/purchases/:id reflects cancelled status
    const purchaseDetailRes = await harness.request('GET', `/api/v1/users/me/purchases/${createdOrder.id}`, {
      token: alice.token
    });
    assert.strictEqual(purchaseDetailRes.status, 200);
    assert.strictEqual(purchaseDetailRes.body.data.order.fulfillmentStatus, 'cancelled');

    console.log('    ✓ Cancellation, terminal state protection, and backward compatibility verified.\n');
    console.log('ALL COMMERCE REST API ENDPOINTS TESTS PASSED.');
  } finally {
    await harness.cleanup();
  }
}

if (require.main === module) {
  run().catch(err => {
    console.error('Test Failed:', err);
    process.exit(1);
  });
}

module.exports = { run };
