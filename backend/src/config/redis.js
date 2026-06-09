const Redis = require('ioredis');

const REDIS_HOST = process.env.REDIS_HOST || '127.0.0.1';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379');

let redisClient = null;

try {
  redisClient = new Redis({
    host: REDIS_HOST,
    port: REDIS_PORT,
  });

  redisClient.on('error', (err) => {
    console.error('Redis connection error:', err.message);
  });

  redisClient.on('connect', () => {
    console.log('[Redis] Connected successfully via ioredis');
  });
} catch (err) {
  console.error('[Redis] Failed to initialize:', err.message);
}

// Expose get/set/del operations used for distributed locking
const redisLock = {
  set: async (key, value, ...args) => {
    if (!redisClient) return null;
    try {
      return await redisClient.set(key, value, ...args);
    } catch (error) {
      console.error('[Redis] set error:', error.message);
      return null;
    }
  },
  del: async (key) => {
    if (!redisClient) return;
    try {
      await redisClient.del(key);
    } catch (error) {
      console.error('[Redis] del error:', error.message);
    }
  },
  redis: redisClient
};

module.exports = redisLock;
