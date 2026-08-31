/**
 * Centralized Rate Limiting Service
 * Sliding-window counter backed by Redis or In-Memory map
 */

const crypto = require('crypto');
const RedisConnection = require('./RedisConnection');
const { RateLimitError } = require('../../shared/errors/AppError');
const logger = require('../../shared/logging/logger');

class RateLimitService {
  constructor() {
    this.redis = RedisConnection.getInstance();
    this.memoryBuckets = new Map(); // key -> [timestamps]
  }

  /**
   * Boolean check if request is allowed without throwing
   */
  async isAllowed(key, maxRequests = 100, windowSeconds = 60) {
    try {
      const res = await this.consume(key, maxRequests, windowSeconds);
      return { allowed: true, ...res };
    } catch (err) {
      if (err instanceof RateLimitError) {
        return { allowed: false, retryAfter: err.retryAfter || windowSeconds };
      }
      throw err;
    }
  }

  /**
   * Check and consume tokens for a given key
   * @param {string} key - Identifier (e.g. IP address or userId)
   * @param {number} maxRequests - Max requests allowed in the window
   * @param {number} windowSeconds - Window size in seconds
   */
  async consume(key, maxRequests = 100, windowSeconds = 60) {
    const rateLimitKey = `ratelimit:${key}`;
    const now = Date.now();
    const windowMs = windowSeconds * 1000;
    const windowStart = now - windowMs;

    try {
      if (this.redis && this.redis.status === 'ready') {
        const multi = this.redis.multi();
        // Remove items older than window
        multi.zremrangebyscore(rateLimitKey, 0, windowStart);
        // Add current timestamp
        multi.zadd(rateLimitKey, now, `${now}-${Math.random()}`);
        // Count requests in window
        multi.zcard(rateLimitKey);
        // Set expiry on bucket
        multi.expire(rateLimitKey, windowSeconds);

        const results = await multi.exec();
        const requestCount = results[2][1];

        if (requestCount > maxRequests) {
          const retryAfter = Math.ceil(windowSeconds);
          throw new RateLimitError(`Rate limit exceeded (${requestCount}/${maxRequests}). Try again in ${retryAfter}s.`, retryAfter);
        }

        return {
          allowed: true,
          remaining: Math.max(0, maxRequests - requestCount),
          total: maxRequests,
          resetInSeconds: windowSeconds
        };
      }
    } catch (err) {
      if (err instanceof RateLimitError) throw err;
      logger.warn(`[RateLimitService] Redis rate limit check failed, using memory: ${err.message}`);
    }

    // In-memory fallback
    let timestamps = this.memoryBuckets.get(rateLimitKey) || [];
    timestamps = timestamps.filter(ts => ts > windowStart);
    timestamps.push(now);
    this.memoryBuckets.set(rateLimitKey, timestamps);

    if (timestamps.length > maxRequests) {
      throw new RateLimitError(`Rate limit exceeded (${timestamps.length}/${maxRequests}).`, windowSeconds);
    }

    return {
      allowed: true,
      remaining: maxRequests - timestamps.length,
      total: maxRequests,
      resetInSeconds: windowSeconds
    };
  }

  /**
   * Express Middleware Factory
   */
  /**
   * Chooses the bucket a request is counted against.
   *
   * An authenticated caller gets their OWN bucket, keyed by a hash of the
   * presented credential. That matters in both directions:
   *   - many people behind one address (an office, a university, a carrier's
   *     CGNAT) no longer share a single quota and lock each other out
   *   - one abusive account cannot dilute its usage across rotating addresses
   *
   * The credential is hashed — never stored or logged in the clear. Anonymous
   * traffic still buckets by client address.
   */
  resolveKey(req) {
    if (req.auth && req.auth.userId) return `user:${req.auth.userId}`;

    const header = req.headers && req.headers.authorization;
    if (header && /^Bearer\s+.+/i.test(header)) {
      const token = header.replace(/^Bearer\s+/i, '').trim();
      const digest = crypto.createHash('sha256').update(token).digest('hex').slice(0, 32);
      return `token:${digest}`;
    }

    const forwarded = req.headers && req.headers['x-forwarded-for'];
    const ip = (typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : null)
      || req.ip
      || (req.socket && req.socket.remoteAddress)
      || 'unknown';

    return `ip:${ip}`;
  }

  middleware({ maxRequests = 60, windowSeconds = 60, keyGenerator = null }) {
    return async (req, res, next) => {
      const key = keyGenerator ? keyGenerator(req) : this.resolveKey(req);

      try {
        const result = await this.consume(key, maxRequests, windowSeconds);
        res.setHeader('X-RateLimit-Limit', result.total);
        res.setHeader('X-RateLimit-Remaining', result.remaining);
        res.setHeader('X-RateLimit-Reset', result.resetInSeconds);
        next();
      } catch (err) {
        if (err instanceof RateLimitError) {
          res.setHeader('Retry-After', err.retryAfterSeconds);
        }
        next(err);
      }
    };
  }
}

module.exports = new RateLimitService();
