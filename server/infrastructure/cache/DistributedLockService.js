/**
 * Distributed Lock Service
 * Provides short-lived mutexes backed by Redis or In-Memory state
 */

const crypto = require('crypto');
const RedisConnection = require('./RedisConnection');
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
   */
  async acquireLock(resourceKey, ttlMs = 5000) {
    const lockKey = `lock:${resourceKey}`;
    const lockToken = crypto.randomUUID();

    try {
      if (this.redis && this.redis.status === 'ready') {
        const result = await this.redis.set(lockKey, lockToken, 'PX', ttlMs, 'NX');
        if (result === 'OK') {
          return lockToken;
        }
        return null;
      }
    } catch (err) {
      logger.warn(`[DistributedLockService] Redis lock acquisition error: ${err.message}`);
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
        await this.redis.eval(luaScript, 1, lockKey, lockToken);
        return true;
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
