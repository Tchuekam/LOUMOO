/**
 * The API rate limit must be a per-client allowance, not a site-wide one.
 * ---------------------------------------------------------------------------
 * Behind a trusted proxy (Railway, Vercel) every user reaches the API through the same
 * ingress peer, and RateLimitService counts each request against the peer's bucket as
 * well as the client's. The peer bucket's limit defaulted to the client budget (120 per
 * minute), so the whole site shared one 120-request allowance: a dozen people checking
 * out exhausted it and everyone got 429s. server/config/rateLimits.js now sets the peer
 * backstop far above any one client; this drives the real middleware with the real
 * configuration the server uses.
 */
'use strict';

require('../setup');
const assert = require('assert');
const RateLimitService = require('../../server/infrastructure/cache/RateLimitService');
const LIMITS = require('../../server/config/rateLimits');

// The n-th distinct client address (198.51.x.y), so every call can come from a different user.
const clientIp = (n) => `198.51.${Math.floor(n / 250)}.${n % 250}`;

function request(clientIp, peerIp) {
  return { ip: clientIp, originalUrl: '/api/v1/orders', path: '/orders', socket: { remoteAddress: peerIp } };
}

function response() {
  const headers = {};
  return { headers, setHeader: (k, v) => { headers[k] = v; } };
}

async function hit(mw, req) {
  return new Promise((resolve) => {
    mw(req, response(), (err) => resolve(err ? (err.statusCode || err.code || 'error') : 'ok'));
  });
}

async function run() {
  assert.ok(LIMITS.api.peerMaxRequests >= 10 * LIMITS.api.maxRequests, 'the shared-ingress backstop is far above one client\'s budget');

  // A fresh limiter per scenario so buckets do not carry over.
  const mw = RateLimitService.middleware({ ...LIMITS.api, keyPrefix: `t1-${process.pid}` });

  // 1. 400 DIFFERENT users arriving through ONE ingress peer, each making a normal handful of calls.
  let limited = 0;
  for (let user = 0; user < 400; user++) {
    for (let call = 0; call < 2; call++) {
      if ((await hit(mw, request(clientIp(user), '10.0.0.1'))) !== 'ok') limited++;
    }
  }
  assert.strictEqual(limited, 0, '800 requests from 400 different clients through one proxy are all served');

  // 2. ONE client that really does hammer the API is still limited to its own budget.
  const mw2 = RateLimitService.middleware({ ...LIMITS.api, keyPrefix: `t2-${process.pid}` });
  let served = 0;
  let refused = 0;
  for (let i = 0; i < LIMITS.api.maxRequests + 30; i++) {
    const r = await hit(mw2, request('198.51.100.7', '10.0.0.1'));
    if (r === 'ok') served++; else refused++;
  }
  assert.strictEqual(served, LIMITS.api.maxRequests, 'one client is served exactly its own allowance');
  assert.strictEqual(refused, 30, 'and refused beyond it');

  // 3. The backstop still exists: a flood through one peer with forged, ever-changing client
  //    addresses is cut off once it passes the (much larger) peer allowance.
  const mw3 = RateLimitService.middleware({ ...LIMITS.api, keyPrefix: `t3-${process.pid}` });
  let floodRefused = 0;
  for (let i = 0; i < LIMITS.api.peerMaxRequests + 50; i++) {
    const r = await hit(mw3, request(clientIp(i), '10.0.0.9'));
    if (r !== 'ok') floodRefused++;
  }
  assert.ok(floodRefused >= 50, 'a spoofed-address flood through one peer is still stopped by the peer backstop');

  console.log('    ✓ rate_limit_shared_ingress: the limit is per client; the shared ingress is not one 120/min bucket');
}

module.exports = { run };
