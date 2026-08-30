/**
 * Centralized Redis Connection Manager (ioredis)
 * Manages singleton Redis connection pool with exponential reconnection logic
 */

const Redis = require('ioredis');
const { config } = require('../../config/env');
const logger = require('../../shared/logging/logger');

let instance = null;

class RedisConnection {
  static getInstance() {
    if (!instance) {
      if (!config.redis.url) {
        logger.warn('[Redis] No REDIS_URL configured; running with in-memory cache fallback.');
        return null;
      }

      try {
        instance = new Redis(config.redis.url, {
          maxRetriesPerRequest: 3,
          enableReadyCheck: true,
          lazyConnect: false,
          connectTimeout: 8000,
          retryStrategy(times) {
            if (times > 3) {
              logger.warn('[Redis] Max connection retry attempts reached (3/3), using in-memory fallback.');
              return null;
            }
            const delay = Math.min(times * 200, 2000);
            logger.warn(`[Redis] Connection retry attempt #${times} in ${delay}ms`);
            return delay;
          }
        });

        instance.on('connect', () => {
          logger.info('[Redis] Connection established successfully.');
        });

        instance.on('ready', () => {
          logger.info('[Redis] Client is ready for commands.');
        });

        instance.on('error', (err) => {
          logger.error('[Redis] Client connection error', err);
        });

        instance.on('close', () => {
          logger.warn('[Redis] Connection closed.');
        });
      } catch (err) {
        logger.error('[Redis] Failed to initialize Redis instance', err);
        instance = null;
      }
    }
    return instance;
  }
}

module.exports = RedisConnection;
