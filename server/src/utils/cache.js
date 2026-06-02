const { createClient } = require('redis');

class CacheManager {
  constructor() {
    this.redisClient = null;
    this.isRedisConnected = false;
    this.localCache = new Map();
    this.localCacheTTLs = new Map();

    this.initRedis();
  }

  async initRedis() {
    const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
    try {
      this.redisClient = createClient({ url: redisUrl });

      this.redisClient.on('error', (err) => {
        if (this.isRedisConnected) {
          console.warn('⚠️ Redis Connection Error. Falling back to In-Memory Cache.');
        }
        this.isRedisConnected = false;
      });

      this.redisClient.on('connect', () => {
        console.log('⚡ Attempting to connect to Redis cache server...');
      });

      this.redisClient.on('ready', () => {
        this.isRedisConnected = true;
        console.log('🚀 Redis Cache Connected & Active!');
      });

      await this.redisClient.connect();
    } catch (error) {
      console.warn('⚠️ Redis not available on startup. Using high-speed local In-Memory Cache.');
      this.isRedisConnected = false;
      this.redisClient = null;
    }
  }

  // Unified API
  async get(key) {
    if (this.isRedisConnected && this.redisClient) {
      try {
        const val = await this.redisClient.get(key);
        return val ? JSON.parse(val) : null;
      } catch (err) {
        console.error('Redis GET Error:', err);
      }
    }

    // In-memory fallback
    if (this.localCache.has(key)) {
      const expiry = this.localCacheTTLs.get(key);
      if (expiry && expiry < Date.now()) {
        this.localCache.delete(key);
        this.localCacheTTLs.delete(key);
        return null;
      }
      return this.localCache.get(key);
    }
    return null;
  }

  async set(key, value, ttlSeconds = 3600) {
    if (this.isRedisConnected && this.redisClient) {
      try {
        await this.redisClient.set(key, JSON.stringify(value), {
          EX: ttlSeconds
        });
        return true;
      } catch (err) {
        console.error('Redis SET Error:', err);
      }
    }

    // In-memory fallback
    this.localCache.set(key, value);
    if (ttlSeconds) {
      this.localCacheTTLs.set(key, Date.now() + ttlSeconds * 1000);
    }
    return true;
  }

  async del(key) {
    if (this.isRedisConnected && this.redisClient) {
      try {
        await this.redisClient.del(key);
        return true;
      } catch (err) {
        console.error('Redis DEL Error:', err);
      }
    }

    // In-memory fallback
    this.localCache.delete(key);
    this.localCacheTTLs.delete(key);
    return true;
  }

  async clear() {
    if (this.isRedisConnected && this.redisClient) {
      try {
        await this.redisClient.flushAll();
      } catch (err) {
        console.error('Redis Flush Error:', err);
      }
    }
    this.localCache.clear();
    this.localCacheTTLs.clear();
  }
}

// Export singleton instance
module.exports = new CacheManager();
