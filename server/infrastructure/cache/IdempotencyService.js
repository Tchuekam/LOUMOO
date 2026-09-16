/**
 * Centralized Idempotency Service
 * Prevents double-processing of financial transactions, webhooks, and orders
 */

const crypto = require('crypto');
const RedisConnection = require('./RedisConnection');
const { IdempotencyError, ServiceUnavailableError } = require('../../shared/errors/AppError');
const { config } = require('../../config/env');
const logger = require('../../shared/logging/logger');

// The memory fallback has no server-side reaper the way Redis EXPIRE does, so
// expired records are swept here. Sweeping is time-gated so a full scan never
// runs per request.
const MEMORY_SWEEP_INTERVAL_MS = 60000;

class IdempotencyService {
  constructor() {
    this.redis = RedisConnection.getInstance();
    this.memoryStore = new Map(); // key -> { state, response, expiresAt }
    this.lastMemorySweepAt = 0;
  }

  /**
   * Drop records whose TTL has elapsed. Only the key being looked up is
   * expired lazily elsewhere, so without this a Redis outage leaves one
   * resident record per idempotency key for the life of the process.
   */
  _sweepMemoryStore(now) {
    if (now - this.lastMemorySweepAt < MEMORY_SWEEP_INTERVAL_MS) return;
    this.lastMemorySweepAt = now;
    for (const [key, record] of this.memoryStore) {
      if (!record || record.expiresAt <= now) {
        this.memoryStore.delete(key);
      }
    }
  }

  _computeHash(payload) {
    return crypto.createHash('sha256').update(JSON.stringify(payload || '')).digest('hex');
  }

  /**
   * Acquire or check an idempotency key
   * @param {string} key - Idempotency Key from request header
   * @param {any} payload - Request payload to verify semantic equality
   * @param {number} ttlSeconds - Duration to lock / cache the result (default 24h)
   * @param {string|null} authScope - Hashed caller identity or auth scope
   */
  async checkOrLock(key, payload = null, ttlSeconds = 86400, authScope = null) {
    if (!key) return { state: 'NO_KEY' };

    const redisKey = `idempotency:${key}`;
    const payloadHash = this._computeHash(payload);

    try {
      const redisReady = this.redis && (this.redis.status === 'ready' ||
        (config.isProduction && await RedisConnection.waitForReady(this.redis)));
      if (redisReady) {
        const existingRaw = await this.redis.get(redisKey);
        if (existingRaw) {
          const record = JSON.parse(existingRaw);
          if (record.state === 'IN_PROGRESS') {
            throw new IdempotencyError('A transaction with this idempotency key is currently processing', key);
          }
          if (record.payloadHash && record.payloadHash !== payloadHash) {
            throw new IdempotencyError('Idempotency key has already been used with different request parameters', key);
          }
          // A missing scope is a scope of its own: an unauthenticated replay must
          // never be served a response that was cached for an authenticated caller.
          if ((record.authScope || null) !== (authScope || null)) {
            throw new IdempotencyError('Idempotency key has already been used by another authenticated caller', key);
          }
          return {
            state: 'COMPLETED',
            statusCode: record.statusCode,
            responseBody: record.responseBody,
            cachedAt: record.savedAt
          };
        }

        // Atomically set state = IN_PROGRESS
        const lockAcquired = await this.redis.set(
          redisKey,
          JSON.stringify({ state: 'IN_PROGRESS', payloadHash, authScope, lockedAt: new Date().toISOString() }),
          'EX',
          120, // 2-minute lock during execution
          'NX'
        );

        if (!lockAcquired) {
          throw new IdempotencyError('Concurrent operation in progress for this idempotency key', key);
        }

        return { state: 'ACQUIRED', key };
      }
    } catch (err) {
      if (err instanceof IdempotencyError) throw err;
      logger.warn(`[IdempotencyService] Redis check failed: ${err.message}`);
    }

    if (this.redis && config.isProduction) {
      // A process-local record cannot see a request already running or
      // completed on another instance, so falling back here would let the same
      // key double-process. Refuse rather than silently fail open.
      throw new ServiceUnavailableError('Duplicate-request protection is temporarily unavailable');
    }

    // In-memory fallback
    const memRecord = this.memoryStore.get(redisKey);
    if (memRecord) {
      if (memRecord.expiresAt > Date.now()) {
        if (memRecord.state === 'IN_PROGRESS') {
          throw new IdempotencyError('A transaction with this idempotency key is currently processing', key);
        }
        if (memRecord.payloadHash && memRecord.payloadHash !== payloadHash) {
          throw new IdempotencyError('Idempotency key has already been used with different request parameters', key);
        }
        if ((memRecord.authScope || null) !== (authScope || null)) {
          throw new IdempotencyError('Idempotency key has already been used by another authenticated caller', key);
        }
        return {
          state: 'COMPLETED',
          statusCode: memRecord.statusCode,
          responseBody: memRecord.responseBody
        };
      }
      this.memoryStore.delete(redisKey);
    }

    const now = Date.now();
    this.memoryStore.set(redisKey, {
      state: 'IN_PROGRESS',
      payloadHash,
      authScope,
      expiresAt: now + 120000
    });
    this._sweepMemoryStore(now);

    return { state: 'ACQUIRED', key };
  }

  /**
   * Save completed response for the idempotency key
   */
  async saveResponse(key, statusCode, responseBody, ttlSeconds = 86400, payloadHash = null, authScope = null) {
    if (!key) return;

    const redisKey = `idempotency:${key}`;
    let finalPayloadHash = payloadHash;
    let finalAuthScope = authScope;

    try {
      if (this.redis && this.redis.status === 'ready') {
        if (!finalPayloadHash || !finalAuthScope) {
          const existingRaw = await this.redis.get(redisKey);
          if (existingRaw) {
            try {
              const existing = JSON.parse(existingRaw);
              finalPayloadHash = finalPayloadHash || existing.payloadHash;
              finalAuthScope = finalAuthScope || existing.authScope;
            } catch (e) {}
          }
        }
        const record = {
          state: 'COMPLETED',
          statusCode,
          responseBody,
          payloadHash: finalPayloadHash || null,
          authScope: finalAuthScope || null,
          savedAt: new Date().toISOString()
        };
        await this.redis.set(redisKey, JSON.stringify(record), 'EX', ttlSeconds);
        return;
      }
    } catch (err) {
      logger.warn(`[IdempotencyService] Redis save response failed: ${err.message}`);
    }

    const memRecord = this.memoryStore.get(redisKey);
    finalPayloadHash = finalPayloadHash || (memRecord && memRecord.payloadHash);
    finalAuthScope = finalAuthScope || (memRecord && memRecord.authScope);

    this.memoryStore.set(redisKey, {
      state: 'COMPLETED',
      statusCode,
      responseBody,
      payloadHash: finalPayloadHash || null,
      authScope: finalAuthScope || null,
      savedAt: new Date().toISOString(),
      expiresAt: Date.now() + (ttlSeconds * 1000)
    });
  }

  /**
   * Release or cancel an acquired lock on failure
   */
  async releaseLock(key) {
    if (!key) return;
    const redisKey = `idempotency:${key}`;
    try {
      if (this.redis && this.redis.status === 'ready') {
        await this.redis.del(redisKey);
      }
    } catch (e) {}
    this.memoryStore.delete(redisKey);
  }

  /**
   * Express Middleware for Idempotency Headers
   */
  middleware() {
    return async (req, res, next) => {
      const idempotencyKey = req.headers['idempotency-key'] || req.headers['x-idempotency-key'];
      if (!idempotencyKey || req.method === 'GET' || req.method === 'HEAD') {
        return next();
      }

      try {
        const authHeader = req.headers.authorization || '';
        const authScope = authHeader ? crypto.createHash('sha256').update(authHeader).digest('hex').slice(0, 16) : null;
        const payloadHash = this._computeHash(req.body);

        const check = await this.checkOrLock(idempotencyKey, req.body, 86400, authScope);
        if (check.state === 'COMPLETED') {
          res.setHeader('X-Cache-Lookup', 'IDEMPOTENT_HIT');
          return res.status(check.statusCode).json(check.responseBody);
        }

        req.idempotencyKey = idempotencyKey;

        // Intercept json response to cache the result
        const originalJson = res.json.bind(res);
        res.json = (body) => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            this.saveResponse(idempotencyKey, res.statusCode, body, 86400, payloadHash, authScope).catch(e => {
              logger.warn(`[Idempotency] Failed saving response: ${e.message}`);
            });
          } else {
            this.releaseLock(idempotencyKey).catch(() => {});
          }
          return originalJson(body);
        };

        next();
      } catch (err) {
        next(err);
      }
    };
  }
}

module.exports = new IdempotencyService();
