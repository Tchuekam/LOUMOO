/**
 * Centralized Cache Service
 * Provides typed caching with TTL, tag invalidation, and memory fallback
 */

const RedisConnection = require('./RedisConnection');
const logger = require('../../shared/logging/logger');

class CacheService {
  constructor() {
    this.redis = RedisConnection.getInstance();
    this.memoryFallback = new Map(); // key -> { value, expiresAt }
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
    this.memoryFallback.set(fullKey, {
      value,
      expiresAt: Date.now() + (ttlSeconds * 1000)
    });
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

    // Pattern matching on memory fallback
    const regexPattern = new RegExp('^' + fullPattern.replace(/\*/g, '.*') + '$');
    for (const key of this.memoryFallback.keys()) {
      if (regexPattern.test(key)) {
        this.memoryFallback.delete(key);
      }
    }
    return true;
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
