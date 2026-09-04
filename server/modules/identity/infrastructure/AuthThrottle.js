/**
 * LOUMOO — Authentication Failure Throttle
 * ---------------------------------------------------------------------------
 * A small, self-contained counter for "how many times has THIS source failed
 * THIS operation lately", used to slow down automated attacks on the
 * authentication endpoints (login guessing, credential stuffing, OTP
 * generation abuse) without punishing legitimate users.
 *
 * Design choices that matter:
 *   - Buckets are keyed on a server-derived identifier (the connection IP, as
 *     Express resolves it under `trust proxy`) COMBINED with the account
 *     identifier — never on a single client-controlled value. An attacker
 *     therefore cannot lock a victim out globally by spamming the victim's
 *     email, and cannot get unlimited guesses on one account by rotating the
 *     one field they control.
 *   - Identifiers are hashed before they touch the cache: raw IPs and emails
 *     are never stored.
 *   - The window is FIXED from the first failure. Continuing to hammer a
 *     blocked bucket cannot push its expiry further out, and once the window
 *     passes the bucket resets so a real user is never locked out for good.
 *   - Only FAILURES are recorded and a success CLEARS the bucket, so a user who
 *     mistypes a password and then gets it right is never thereafter throttled.
 *
 * State lives in the shared cache (Redis, memory fallback). The read-modify-
 * write increment is not perfectly atomic, but authentication attempts are
 * sequential HTTP requests and the threshold is small, so at most a couple of
 * extra attempts could ever slip a boundary — immaterial to the protection.
 */

'use strict';

const crypto = require('crypto');
const CacheService = require('../../../infrastructure/cache/CacheService');

const NAMESPACE = 'auth_throttle';

/** One-way, truncated fingerprint so raw identifiers never sit in the cache. */
function fingerprint(...parts) {
  return crypto
    .createHash('sha256')
    .update(parts.map(p => String(p == null ? '' : p)).join('|'))
    .digest('hex')
    .slice(0, 32);
}

/**
 * Is this bucket currently over its limit?
 * @returns {Promise<{blocked:boolean, count:number, retryAfter:number}>}
 */
async function check(key, { max, windowSeconds }) {
  const rec = await CacheService.get(key, NAMESPACE);
  const now = Date.now();
  if (!rec || (rec.expiresAt && now > rec.expiresAt)) {
    return { blocked: false, count: 0, retryAfter: 0 };
  }
  const count = rec.count || 0;
  const blocked = count >= max;
  const retryAfter = blocked ? Math.max(1, Math.ceil((rec.expiresAt - now) / 1000)) : 0;
  return { blocked, count, retryAfter };
}

/**
 * Record one failed attempt against the bucket, preserving the original fixed
 * window. Returns the new count.
 */
async function recordFailure(key, { windowSeconds }) {
  const now = Date.now();
  const rec = await CacheService.get(key, NAMESPACE);

  let count;
  let firstAt;
  let expiresAt;
  if (rec && rec.expiresAt && now <= rec.expiresAt) {
    count = (rec.count || 0) + 1;
    firstAt = rec.firstAt || now;
    expiresAt = rec.expiresAt; // never extended by a fresh failure
  } else {
    count = 1;
    firstAt = now;
    expiresAt = now + windowSeconds * 1000;
  }

  const ttlSeconds = Math.max(1, Math.ceil((expiresAt - now) / 1000));
  await CacheService.set(key, { count, firstAt, expiresAt }, ttlSeconds, NAMESPACE);
  return count;
}

/** Clear a bucket — called on a successful authentication. */
async function clear(key) {
  await CacheService.delete(key, NAMESPACE);
}

module.exports = {
  fingerprint,
  check,
  recordFailure,
  clear,
  NAMESPACE
};
