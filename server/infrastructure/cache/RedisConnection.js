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
          family: 4,
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
            // Returning a non-number makes ioredis abandon the connection for
            // the remaining life of the process: `status` never reaches 'ready'
            // again, so every Redis-backed service stays pinned to its degraded
            // fallback even after Redis comes back. Keep reconnecting with
            // capped backoff and warn once instead of giving up.
            if (times === 2) {
              logger.warn('[Redis] Redis unavailable; using in-memory fallbacks until the connection is restored.');
            }
            return Math.min(times * 250, 10000);
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

  /**
   * Resolve true once `client` can serve commands. A client that is still
   * connecting (cold start) or reconnecting gets a bounded wait instead of
   * being reported unavailable on the first request after boot. The listener
   * is removed on timeout so an outage cannot accumulate 'ready' handlers.
   */
  static waitForReady(client, timeoutMs = 2500) {
    if (!client) return Promise.resolve(false);
    if (client.status === 'ready') return Promise.resolve(true);
    if (!['connecting', 'connect', 'reconnecting'].includes(client.status)) {
      return Promise.resolve(false);
    }
    return new Promise(resolve => {
      const onReady = () => {
        clearTimeout(timer);
        resolve(true);
      };
      const timer = setTimeout(() => {
        client.removeListener('ready', onReady);
        resolve(client.status === 'ready');
      }, timeoutMs);
      client.once('ready', onReady);
    });
  }
}

module.exports = RedisConnection;
