/**
 * Centralized Idempotency Service
 * Prevents double-processing of financial transactions, webhooks, and orders
 */

const crypto = require('crypto');
const RedisConnection = require('./RedisConnection');
const { IdempotencyError } = require('../../shared/errors/AppError');
const logger = require('../../shared/logging/logger');

class IdempotencyService {
  constructor() {
    this.redis = RedisConnection.getInstance();
    this.memoryStore = new Map(); // key -> { state, response, expiresAt }
  }

  _computeHash(payload) {
    return crypto.createHash('sha256').update(JSON.stringify(payload || '')).digest('hex');
  }

  /**
   * Acquire or check an idempotency key
   * @param {string} key - Idempotency Key from request header
   * @param {any} payload - Request payload to verify semantic equality
   * @param {number} ttlSeconds - Duration to lock / cache the result (default 24h)
   */
  async checkOrLock(key, payload = null, ttlSeconds = 86400) {
    if (!key) return { state: 'NO_KEY' };

    const redisKey = `idempotency:${key}`;
    const payloadHash = this._computeHash(payload);

    try {
      if (this.redis && this.redis.status === 'ready') {
        const existingRaw = await this.redis.get(redisKey);
        if (existingRaw) {
          const record = JSON.parse(existingRaw);
          if (record.state === 'IN_PROGRESS') {
            throw new IdempotencyError('A transaction with this idempotency key is currently processing', key);
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
          JSON.stringify({ state: 'IN_PROGRESS', payloadHash, lockedAt: new Date().toISOString() }),
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

    // In-memory fallback
    const memRecord = this.memoryStore.get(redisKey);
    if (memRecord) {
      if (memRecord.expiresAt > Date.now()) {
        if (memRecord.state === 'IN_PROGRESS') {
          throw new IdempotencyError('A transaction with this idempotency key is currently processing', key);
        }
        return {
          state: 'COMPLETED',
          statusCode: memRecord.statusCode,
          responseBody: memRecord.responseBody
        };
      }
      this.memoryStore.delete(redisKey);
    }

    this.memoryStore.set(redisKey, {
      state: 'IN_PROGRESS',
      payloadHash,
      expiresAt: Date.now() + 120000
    });

    return { state: 'ACQUIRED', key };
  }

  /**
   * Save completed response for the idempotency key
   */
  async saveResponse(key, statusCode, responseBody, ttlSeconds = 86400) {
    if (!key) return;

    const redisKey = `idempotency:${key}`;
    const record = {
      state: 'COMPLETED',
      statusCode,
      responseBody,
      savedAt: new Date().toISOString()
    };

    try {
      if (this.redis && this.redis.status === 'ready') {
        await this.redis.set(redisKey, JSON.stringify(record), 'EX', ttlSeconds);
        return;
      }
    } catch (err) {
      logger.warn(`[IdempotencyService] Redis save response failed: ${err.message}`);
    }

    this.memoryStore.set(redisKey, {
      ...record,
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
        const check = await this.checkOrLock(idempotencyKey, req.body);
        if (check.state === 'COMPLETED') {
          res.setHeader('X-Cache-Lookup', 'IDEMPOTENT_HIT');
          return res.status(check.statusCode).json(check.responseBody);
        }

        req.idempotencyKey = idempotencyKey;

        // Intercept json response to cache the result
        const originalJson = res.json.bind(res);
        res.json = (body) => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            this.saveResponse(idempotencyKey, res.statusCode, body).catch(e => {
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
