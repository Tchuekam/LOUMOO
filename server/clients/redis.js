/**
 * Redis Client Initialization (ioredis)
 * Manages cache, sliding sessions, rate limiting, and pub/sub channels
 */

const config = require('../config');

let redis = null;

try {
  const Redis = require('ioredis');

  if (config.redis.url) {
    redis = new Redis(config.redis.url, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      retryStrategy(times) {
        const delay = Math.min(times * 200, 2000);
        return delay;
      }
    });

    redis.on('connect', () => {
      console.log('[Redis] Connected to Redis instance successfully.');
    });

    redis.on('error', (err) => {
      console.error('[Redis] Connection error:', err.message);
    });
  }
} catch (err) {
  console.warn('[Redis] ioredis library not installed yet.');
}

module.exports = {
  redis
};
