/**
 * Infrastructure/API Security Regression Tests
 *
 * These tests stay at the HTTP boundary. They do not exercise authentication,
 * Commerce, Travel, payment, or frontend behavior.
 */

require('../setup');
const assert = require('assert');
const http = require('http');
const express = require('express');
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const RateLimitService = require('../../server/infrastructure/cache/RateLimitService');

function httpRequest(server, requestPath, headers = {}, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const address = server.address();
    const req = http.request({
      host: '127.0.0.1',
      port: address.port,
      path: requestPath,
      method,
      headers
    }, res => {
      res.resume();
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers }));
    });
    req.on('error', reject);
    req.end(body);
  });
}

async function run() {
  console.log('  Testing API & infrastructure security boundaries...');

  /* Equivalent address forms share one limiter identity. */
  assert.strictEqual(
    RateLimitService.normalizeAddress('::ffff:203.0.113.7'),
    '203.0.113.7'
  );
  assert.strictEqual(
    RateLimitService.normalizeAddress('203.0.113.7'),
    '203.0.113.7'
  );

  const spoofedHeader = RateLimitService.resolveKey({
    ip: '203.0.113.7',
    headers: { 'x-forwarded-for': '198.51.100.23' },
    socket: { remoteAddress: '127.0.0.1' }
  });
  assert.strictEqual(spoofedHeader, 'ip:203.0.113.7',
    'The limiter must use Express-resolved identity, never a raw forwarding header');

  const equivalentForms = RateLimitService.resolveKeys({
    ip: '::ffff:203.0.113.7',
    socket: { remoteAddress: '127.0.0.1' }
  });
  assert.ok(equivalentForms.includes('ip:203.0.113.7'),
    'IPv4-mapped IPv6 and dotted IPv4 must resolve to the same client bucket');
  assert.ok(equivalentForms.includes('peer:127.0.0.1'),
    'The immediate proxy peer must also be bounded');

  /* A caller varying X-Forwarded-For still exhausts the peer bucket. */
  const limiterApp = express();
  limiterApp.set('trust proxy', 1);
  const prefix = `infra-test-${Date.now()}-${Math.random()}`;
  limiterApp.use(RateLimitService.middleware({
    maxRequests: 2,
    peerMaxRequests: 2,
    windowSeconds: 60,
    keyPrefix: prefix
  }));
  limiterApp.get('/', (req, res) => res.json({ ok: true }));
  const limiterServer = http.createServer(limiterApp);
  await new Promise(resolve => limiterServer.listen(0, '127.0.0.1', resolve));
  try {
    const first = await httpRequest(limiterServer, '/', { 'X-Forwarded-For': '203.0.113.7' });
    const equivalent = await httpRequest(limiterServer, '/', { 'X-Forwarded-For': '::ffff:203.0.113.7' });
    const rotated = await httpRequest(limiterServer, '/', { 'X-Forwarded-For': '198.51.100.23' });
    assert.strictEqual(first.status, 200);
    assert.strictEqual(equivalent.status, 200);
    assert.strictEqual(rotated.status, 429,
      'Rotating spoofed forwarding headers must not bypass the immediate-peer quota');
  } finally {
    await new Promise(resolve => limiterServer.close(resolve));
  }

  /* The real app must expose only the generated public resource boundary. */
  const app = require('../../server/index');
  const appServer = http.createServer(app);
  await new Promise(resolve => appServer.listen(0, '127.0.0.1', resolve));
  try {
    for (const path of ['/package.json', '/server/index.js', '/tests/runner.js', '/.env.local', '/src/backend/config.py', '/_ds/modernist-dcebbf7e-2a15-4750-a4b9-db3ba3d0c312/readme.md', '/_ds/modernist-dcebbf7e-2a15-4750-a4b9-db3ba3d0c312/_ds_manifest.json']) {
      const response = await httpRequest(appServer, path);
      assert.strictEqual(response.status, 404,
        `${path} must not be downloadable through the HTTP server`);
    }
    const health = await httpRequest(appServer, '/api/v1/health');
    assert.strictEqual(health.status, 200);
    assert.strictEqual(health.headers['x-powered-by'], undefined,
      'Express implementation details must not be advertised');
    assert.strictEqual(health.headers['cache-control'], 'no-store');

    const crossSite = await httpRequest(appServer, '/api/v1/health', {
      Origin: 'https://attacker.example'
    });
    assert.strictEqual(crossSite.headers['access-control-allow-origin'], undefined,
      'Unlisted origins must not receive CORS permission');

    const unsupported = await httpRequest(appServer, '/api/v1/health', {}, 'TRACE');
    assert.strictEqual(unsupported.status, 405,
      'Unsupported API methods must be rejected before route handling');

    const oversized = Buffer.alloc(2 * 1024 * 1024 + 1, 0x20);
    const tooLarge = await httpRequest(appServer, '/api/v1/health', {
      'Content-Type': 'application/json',
      'Content-Length': oversized.length
    }, 'POST', oversized);
    assert.strictEqual(tooLarge.status, 413,
      'Oversized API payloads must be rejected with a bounded 413 response');

    const home = await httpRequest(appServer, '/');
    assert.strictEqual(home.status, 200, 'The intentional app shell must remain public');
  } finally {
    await new Promise(resolve => appServer.close(resolve));
  }

  /* Production unexpected errors expose neither message nor stack. */
  const projectRoot = require('path').resolve(__dirname, '..', '..');
  const output = execFileSync(process.execPath, ['-e', `
    const handler = require('./server/shared/middleware/errorHandler');
    const { InfrastructureError } = require('./server/shared/errors/AppError');
    const result = { status: null, body: null };
    const res = {
      status(code) { result.status = code; return this; },
      json(body) { result.body = body; console.log(JSON.stringify(result)); process.exit(0); }
    };
    handler(new InfrastructureError('Database', 'database password leaked', new Error('secret=should-not-leak')), { requestId: 'req_test' }, res, () => {});
  `], {
    cwd: projectRoot,
    env: { ...process.env, NODE_ENV: 'production' },
    encoding: 'utf8'
  });
  const errorLines = output.trim().split(/\r?\n/).filter(Boolean);
  const productionError = JSON.parse(errorLines[errorLines.length - 1]);
  assert.strictEqual(productionError.status, 500);
  assert.strictEqual(productionError.body.error.message, 'An unexpected internal server error occurred.');
  assert.strictEqual(productionError.body.error.details, null);

  /* The deployment workflow cannot run Railway before the test gate. */
  const deployWorkflow = fs.readFileSync(
    path.resolve(__dirname, '..', '..', '.github', 'workflows', 'deploy.yml'),
    'utf8'
  );
  assert.ok(/needs:\s*validate/.test(deployWorkflow),
    'Production deployment must depend on the validation job');
  assert.ok(/run:\s*npm test/.test(deployWorkflow),
    'The deployment validation job must execute the required test suite');

  console.log('    ✓ Proxy identity, abuse limits, static exposure and production error redaction verified.');
}

module.exports = { run };

if (require.main === module) {
  run().then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
  });
}
