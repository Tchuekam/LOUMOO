/**
 * Distributed Lock Service
 * Provides short-lived mutexes backed by Redis or In-Memory state
 */

const crypto = require('crypto');
const RedisConnection = require('./RedisConnection');
const { config } = require('../../config/env');
const { ServiceUnavailableError } = require('../../shared/errors/AppError');
const logger = require('../../shared/logging/logger');

class DistributedLockService {
  constructor() {
    this.redis = RedisConnection.getInstance();
    this.memoryLocks = new Map(); // resourceKey -> { lockId, expiresAt }
  }

  /**
   * Acquire a lock for a specified resource
   * @param {string} resourceKey - Name of resource to lock
   * @param {number} ttlMs - Lock expiration in milliseconds
   * @returns {Promise<string|null>} Lock token if acquired, null if already locked
   * @throws {ServiceUnavailableError} in production when Redis is configured but
   *   cannot be reached. This is deliberately NOT a null return: callers such as
   *   SeatInventoryService retry a null up to 25 times, and each retry would sit
   *   in waitForReady again (~60s in total) before reporting a misleading
   *   "busy" conflict instead of an infrastructure outage.
   */
  async acquireLock(resourceKey, ttlMs = 5000) {
    const lockKey = `lock:${resourceKey}`;
    const lockToken = crypto.randomUUID();

    try {
      const redisReady = this.redis && (this.redis.status === 'ready' ||
        (config.isProduction && await RedisConnection.waitForReady(this.redis)));
      if (redisReady) {
        const result = await this.redis.set(lockKey, lockToken, 'PX', ttlMs, 'NX');
        if (result === 'OK') {
          return lockToken;
        }
        return null;
      }
      if (this.redis && config.isProduction) {
        // Redis is the configured cross-instance source of truth. A per-process
        // map would let every instance grant this same lock, so refuse instead.
        logger.warn(`[DistributedLockService] Redis not ready (status=${this.redis.status}); lock '${resourceKey}' not acquired.`);
        throw new ServiceUnavailableError('Reservation locking is temporarily unavailable');
      }
    } catch (err) {
      if (err instanceof ServiceUnavailableError) throw err;
      logger.warn(`[DistributedLockService] Redis lock acquisition error: ${err.message}`);
      // A mutex must never silently degrade to a per-process map while Redis is
      // the configured source of truth in production: every instance would then
      // hand out the same lock. Refuse explicitly (503) rather than fail open.
      if (config.isProduction) {
        throw new ServiceUnavailableError('Reservation locking is temporarily unavailable');
      }
    }

    // In-memory fallback
    const now = Date.now();
    const existing = this.memoryLocks.get(lockKey);
    if (existing && existing.expiresAt > now) {
      return null;
    }

    this.memoryLocks.set(lockKey, {
      lockId: lockToken,
      expiresAt: now + ttlMs
    });
    return lockToken;
  }

  /**
   * Release an acquired lock safely using its token
   */
  async releaseLock(resourceKey, lockToken) {
    const lockKey = `lock:${resourceKey}`;

    try {
      if (this.redis && this.redis.status === 'ready') {
        // Lua script ensures atomic check and delete
        const luaScript = `
          if redis.call("get", KEYS[1]) == ARGV[1] then
            return redis.call("del", KEYS[1])
          else
            return 0
          end
        `;
        // A 0 reply means the key was gone or already owned by someone else
        // (TTL elapsed mid-work), so the caller must not be told it released it.
        const released = await this.redis.eval(luaScript, 1, lockKey, lockToken);
        return Number(released) === 1;
      }
    } catch (err) {
      logger.warn(`[DistributedLockService] Redis lock release error: ${err.message}`);
    }

    const existing = this.memoryLocks.get(lockKey);
    if (existing && existing.lockId === lockToken) {
      this.memoryLocks.delete(lockKey);
      return true;
    }
    return false;
  }

  /**
   * Execute callback within a distributed lock
   */
  async withLock(resourceKey, ttlMs, fn) {
    const lockToken = await this.acquireLock(resourceKey, ttlMs);
    if (!lockToken) {
      throw new Error(`Failed to acquire distributed lock for resource '${resourceKey}'`);
    }

    try {
      return await fn();
    } finally {
      await this.releaseLock(resourceKey, lockToken);
    }
  }
}

module.exports = new DistributedLockService();
