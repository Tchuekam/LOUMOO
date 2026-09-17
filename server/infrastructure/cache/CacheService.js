/**
 * Centralized Cache Service
 * Provides typed caching with TTL, tag invalidation, and memory fallback
 */

const RedisConnection = require('./RedisConnection');
const logger = require('../../shared/logging/logger');

// The memory fallback has no server-side reaper the way Redis EXPIRE does, so
// expired entries are swept here. Sweeping is time-gated so a full scan never
// runs per operation.
const MEMORY_SWEEP_INTERVAL_MS = 30000;

class CacheService {
  constructor() {
    this.redis = RedisConnection.getInstance();
    this.memoryFallback = new Map(); // key -> { value, expiresAt }
    this.lastMemorySweepAt = 0;
  }

  /**
   * Drop entries whose TTL has elapsed. Without this, a key that is written
   * while Redis is down and never read again stays resident forever, so the
   * fallback map grows without bound for the life of the process.
   */
  _sweepMemoryFallback(now) {
    if (now - this.lastMemorySweepAt < MEMORY_SWEEP_INTERVAL_MS) return;
    this.lastMemorySweepAt = now;
    for (const [key, item] of this.memoryFallback) {
      if (!item || item.expiresAt <= now) {
        this.memoryFallback.delete(key);
      }
    }
  }

  _getKey(key, namespace = 'loumoo') {
    return `${namespace}:${key}`;
  }

  async get(key, namespace = 'loumoo') {
    const fullKey = this._getKey(key, namespace);
    try {
      if (this.redis && this.redis.status === 'ready') {
        const data = await this.redis.get(fullKey);
        return data ? JSON.parse(data) : null;
      }
    } catch (e) {
      logger.warn(`[CacheService] Redis get failed for ${fullKey}, checking memory fallback: ${e.message}`);
    }

    // Memory fallback
    const item = this.memoryFallback.get(fullKey);
    if (item) {
      if (item.expiresAt > Date.now()) {
        return item.value;
      }
      this.memoryFallback.delete(fullKey);
    }
    return null;
  }

  async set(key, value, ttlSeconds = 300, namespace = 'loumoo') {
    const fullKey = this._getKey(key, namespace);
    const serialized = JSON.stringify(value);

    try {
      if (this.redis && this.redis.status === 'ready') {
        if (ttlSeconds > 0) {
          await this.redis.set(fullKey, serialized, 'EX', ttlSeconds);
        } else {
          await this.redis.set(fullKey, serialized);
        }
        return true;
      }
    } catch (e) {
      logger.warn(`[CacheService] Redis set failed for ${fullKey}: ${e.message}`);
    }

    // Memory fallback
    const now = Date.now();
    this.memoryFallback.set(fullKey, {
      value,
      expiresAt: now + (ttlSeconds * 1000)
    });
    this._sweepMemoryFallback(now);
    return true;
  }

  async delete(key, namespace = 'loumoo') {
    const fullKey = this._getKey(key, namespace);
    try {
      if (this.redis && this.redis.status === 'ready') {
        await this.redis.del(fullKey);
      }
    } catch (e) {
      logger.warn(`[CacheService] Redis del failed for ${fullKey}: ${e.message}`);
    }
    this.memoryFallback.delete(fullKey);
    return true;
  }

  async del(key, namespace = 'loumoo') {
    return this.delete(key, namespace);
  }

  async deleteMany(keys, namespace = 'loumoo') {
    if (!Array.isArray(keys) || keys.length === 0) return true;
    const fullKeys = keys.filter(Boolean).map(k => this._getKey(k, namespace));
    if (fullKeys.length === 0) return true;

    try {
      if (this.redis && this.redis.status === 'ready') {
        await this.redis.del(...fullKeys);
      }
    } catch (e) {
      logger.warn(`[CacheService] Redis deleteMany failed: ${e.message}`);
    }

    for (const k of fullKeys) {
      this.memoryFallback.delete(k);
    }
    return true;
  }

  async delMany(keys, namespace = 'loumoo') {
    return this.deleteMany(keys, namespace);
  }

  async delPattern(pattern, namespace = 'loumoo') {
    const fullPattern = this._getKey(pattern, namespace);
    try {
      if (this.redis && this.redis.status === 'ready') {
        const keys = await this.redis.keys(fullPattern);
        if (keys && keys.length > 0) {
          await this.redis.del(...keys);
        }
      }
    } catch (e) {
      logger.warn(`[CacheService] Redis delPattern failed for ${fullPattern}: ${e.message}`);
    }

    // Pattern matching on memory fallback: escape regex metacharacters first, then replace wildcard * with .*
    const escaped = fullPattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
    const regexPattern = new RegExp('^' + escaped.replace(/\*/g, '.*') + '$');
    for (const key of this.memoryFallback.keys()) {
      if (regexPattern.test(key)) {
        this.memoryFallback.delete(key);
      }
    }
    return true;
  }

  async flush(namespace = null) {
    if (!namespace) {
      try {
        if (this.redis && this.redis.status === 'ready') {
          const keys = await this.redis.keys('*');
          if (keys && keys.length > 0) {
            await this.redis.del(...keys);
          }
        }
      } catch (e) {
        logger.warn(`[CacheService] Redis flush failed: ${e.message}`);
      }
      this.memoryFallback.clear();
      return true;
    }
    return this.delPattern('*', namespace);
  }

  async remember(key, ttlSeconds, fetchFn, namespace = 'loumoo') {
    const cached = await this.get(key, namespace);
    if (cached !== null && cached !== undefined) {
      return cached;
    }
    const freshValue = await fetchFn();
    if (freshValue !== null && freshValue !== undefined) {
      await this.set(key, freshValue, ttlSeconds, namespace);
    }
    return freshValue;
  }
}

module.exports = new CacheService();
