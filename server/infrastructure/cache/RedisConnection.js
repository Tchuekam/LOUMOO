/**
 * Centralized Redis Connection Manager (ioredis)
 * Manages singleton Redis connection pool with exponential reconnection logic and keep-alive resilience
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
          connectTimeout: 5000,
          keepAlive: 10000,
          enableAutoPipelining: true,
          reconnectOnError(err) {
            const targetErrors = ['READONLY', 'ECONNRESET', 'ETIMEDOUT', 'EAI_AGAIN'];
            if (targetErrors.some(sub => (err && err.message ? err.message : '').includes(sub))) {
              return true;
            }
            return false;
          },
          retryStrategy(times) {
            if (times > 1) {
              logger.warn('[Redis] Redis unavailable; using in-memory distributed lock fallback.');
              return null;
            }
            return 250;
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
