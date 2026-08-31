/**
 * Integration Test: API Gateway Endpoints Pipeline
 */

require('../setup');
const assert = require('assert');
const app = require('../../server/index');

async function run() {
  console.log('  Testing API Endpoints Pipeline...');

  // Start temporary HTTP server on random port
  const server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;

  try {
    // 1. GET /api/v1/health (Liveness)
    const healthRes = await fetch(`${baseUrl}/api/v1/health`);
    assert.strictEqual(healthRes.status, 200);
    const healthData = await healthRes.json();
    assert.strictEqual(healthData.status, 'ok');

    // 2. GET /api/v1/status (System Status)
    const statusRes = await fetch(`${baseUrl}/api/v1/status`);
    assert.strictEqual(statusRes.status, 200);
    const statusData = await statusRes.json();
    assert.ok(statusData.integrations);
    assert.strictEqual(statusData.integrations.supabase, true);

    // 3. GET /api/v1/products (Catalog listing)
    const productsRes = await fetch(`${baseUrl}/api/v1/products?limit=5`);
    assert.strictEqual(productsRes.status, 200);
    const productsData = await productsRes.json();
    assert.strictEqual(productsData.success, true);
    assert.ok(Array.isArray(productsData.data.items));
    assert.ok(productsData.data.items.length > 0);

    // 4. GET /api/v1/products/:id (Product Detail)
    const sampleId = productsData.data.items[0].id;
    const detailRes = await fetch(`${baseUrl}/api/v1/products/${sampleId}`);
    assert.strictEqual(detailRes.status, 200);
    const detailData = await detailRes.json();
    assert.strictEqual(detailData.data.id, sampleId);

    // 5. GET /api/v1/categories
    const catRes = await fetch(`${baseUrl}/api/v1/categories`);
    assert.strictEqual(catRes.status, 200);
    const catData = await catRes.json();
    assert.strictEqual(catData.success, true);

    // 6. GET /api/v1/me (Unauthenticated -> 401 UNAUTHENTICATED)
    const unauthRes = await fetch(`${baseUrl}/api/v1/me`);
    assert.strictEqual(unauthRes.status, 401);
    const unauthData = await unauthRes.json();
    assert.strictEqual(unauthData.error.code, 'UNAUTHENTICATED');

    // 7. GET /api/v1/me with an ARBITRARY bearer token.
    //    The guard used to trust any token whose text began with "user_" and
    //    to fall back to a demo identity for anything else, so this request
    //    returned a profile. It must now be rejected: a token that does not
    //    verify yields no identity at all.
    const forgedRes = await fetch(`${baseUrl}/api/v1/me`, {
      headers: { 'Authorization': 'Bearer user_test_session_token' }
    });
    assert.strictEqual(forgedRes.status, 401,
      'An unverifiable bearer token must never resolve to a user');
    const forgedData = await forgedRes.json();
    assert.strictEqual(forgedData.error.code, 'UNAUTHENTICATED');
    assert.ok(!forgedData.data, 'A rejected request must carry no profile payload');

    // 8. Headers Verification (Request ID & RateLimit headers)
    assert.ok(healthRes.headers.get('x-request-id'), 'X-Request-Id header should be set');
    assert.ok(healthRes.headers.get('x-ratelimit-limit'), 'X-RateLimit-Limit header should be set');

    console.log('    ✓ All API Gateway endpoints passed integration tests.');
  } finally {
    server.close();
  }
}

module.exports = { run };
