/**
 * LOUMOO API rate limits.
 * ---------------------------------------------------------------------------
 * RateLimitService counts a request against up to two buckets: the CLIENT's
 * (`req.ip`, the per-user budget: `maxRequests`) and, behind a trusted proxy, the
 * immediate PEER's (the ingress every request arrives through: `peerMaxRequests`).
 *
 * The peer bucket is an abuse backstop for spoofed forwarding headers, so it has to
 * be far above the client budget. Left at its default it EQUALS the client budget:
 * on Railway/Vercel every user reaches the API through the same ingress peer, so the
 * whole site, not one user, shared a single 120-requests-a-minute allowance. A dozen
 * people checking out (about ten API calls per screen, plus the rider hub polling
 * every 15 s and posting GPS every 6 s) were enough for everyone to start getting
 * 429s, which the screens show as "temporarily unavailable" or as an error card.
 */
'use strict';

const PEER_MAX_REQUESTS = 3000;

module.exports = Object.freeze({
  PEER_MAX_REQUESTS,
  api: Object.freeze({ maxRequests: 120, peerMaxRequests: PEER_MAX_REQUESTS, windowSeconds: 60 }),
  discovery: Object.freeze({ maxRequests: 180, peerMaxRequests: PEER_MAX_REQUESTS, windowSeconds: 60, keyPrefix: 'discovery' })
});
