import { createClient, RedisClientType } from 'redis';
import { config } from '../config/app';
import { logger, logDatabase } from '../utils/logger';

// Create Redis client
let redisClient: RedisClientType;

// Connect to Redis
export const connectRedis = async (): Promise<void> => {
  try {
    redisClient = createClient({
      url: config.redis.url,
      socket: {
        host: config.redis.host,
        port: config.redis.port,
      },
      password: config.redis.password,
    });

    // Set up error handler
    redisClient.on('error', (error) => {
      logger.error('Redis connection error:', error);
    });

    // Set up connection handler
    redisClient.on('connect', () => {
      logger.info('Redis connected successfully');
    });

    // Set up ready handler
    redisClient.on('ready', () => {
      logger.info('Redis client ready');
    });

    // Set up end handler
    redisClient.on('end', () => {
      logger.info('Redis connection ended');
    });

    // Set up reconnecting handler
    redisClient.on('reconnecting', () => {
      logger.info('Redis reconnecting...');
    });

    // Connect to Redis
    await redisClient.connect();

    // Test connection
    await redisClient.ping();
    logger.info('Redis connection verified');
  } catch (error) {
    logger.error('Failed to connect to Redis:', error);
    throw error;
  }
};

// Disconnect from Redis
export const disconnectRedis = async (): Promise<void> => {
  try {
    if (redisClient) {
      await redisClient.quit();
      logger.info('Redis disconnected successfully');
    }
  } catch (error) {
    logger.error('Failed to disconnect from Redis:', error);
    throw error;
  }
};

// Get Redis client
export const getRedisClient = (): RedisClientType => {
  if (!redisClient) {
    throw new Error('Redis client not initialized. Call connectRedis() first.');
  }
  return redisClient;
};

// Test Redis connection
export const testRedisConnection = async (): Promise<boolean> => {
  try {
    if (!redisClient) {
      return false;
    }
    await redisClient.ping();
    return true;
  } catch (error) {
    logger.error('Redis connection test failed:', error);
    return false;
  }
};

// Set a key-value pair
export const setRedisValue = async (
  key: string,
  value: string,
  ttl?: number
): Promise<void> => {
  try {
    const client = getRedisClient();
    if (ttl) {
      await client.setEx(key, ttl, value);
    } else {
      await client.set(key, value);
    }
    logger.debug(`Redis SET: ${key}`);
  } catch (error) {
    logger.error(`Failed to set Redis value for key ${key}:`, error);
    throw error;
  }
};

// Get a value by key
export const getRedisValue = async (key: string): Promise<string | null> => {
  try {
    const client = getRedisClient();
    const value = await client.get(key);
    logger.debug(`Redis GET: ${key}`);
    return value;
  } catch (error) {
    logger.error(`Failed to get Redis value for key ${key}:`, error);
    throw error;
  }
};

// Delete a key
export const deleteRedisKey = async (key: string): Promise<void> => {
  try {
    const client = getRedisClient();
    await client.del(key);
    logger.debug(`Redis DEL: ${key}`);
  } catch (error) {
    logger.error(`Failed to delete Redis key ${key}:`, error);
    throw error;
  }
};

// Check if a key exists
export const redisKeyExists = async (key: string): Promise<boolean> => {
  try {
    const client = getRedisClient();
    const exists = await client.exists(key);
    return exists === 1;
  } catch (error) {
    logger.error(`Failed to check if Redis key ${key} exists:`, error);
    throw error;
  }
};

// Set a hash field
export const setRedisHashField = async (
  key: string,
  field: string,
  value: string
): Promise<void> => {
  try {
    const client = getRedisClient();
    await client.hSet(key, field, value);
    logger.debug(`Redis HSET: ${key}.${field}`);
  } catch (error) {
    logger.error(`Failed to set Redis hash field ${key}.${field}:`, error);
    throw error;
  }
};

// Get a hash field
export const getRedisHashField = async (
  key: string,
  field: string
): Promise<string | undefined> => {
  try {
    const client = getRedisClient();
    const value = await client.hGet(key, field);
    logger.debug(`Redis HGET: ${key}.${field}`);
    return value;
  } catch (error) {
    logger.error(`Failed to get Redis hash field ${key}.${field}:`, error);
    throw error;
  }
};

// Get all hash fields
export const getRedisHashAll = async (key: string): Promise<Record<string, string>> => {
  try {
    const client = getRedisClient();
    const hash = await client.hGetAll(key);
    logger.debug(`Redis HGETALL: ${key}`);
    return hash;
  } catch (error) {
    logger.error(`Failed to get all Redis hash fields for key ${key}:`, error);
    throw error;
  }
};

// Delete a hash field
export const deleteRedisHashField = async (
  key: string,
  field: string
): Promise<void> => {
  try {
    const client = getRedisClient();
    await client.hDel(key, field);
    logger.debug(`Redis HDEL: ${key}.${field}`);
  } catch (error) {
    logger.error(`Failed to delete Redis hash field ${key}.${field}:`, error);
    throw error;
  }
};

// Add to a list
export const addRedisListItem = async (
  key: string,
  value: string
): Promise<number> => {
  try {
    const client = getRedisClient();
    const length = await client.lPush(key, value);
    logger.debug(`Redis LPUSH: ${key}`);
    return length;
  } catch (error) {
    logger.error(`Failed to add item to Redis list ${key}:`, error);
    throw error;
  }
};

// Get list items
export const getRedisListItems = async (
  key: string,
  start: number = 0,
  end: number = -1
): Promise<string[]> => {
  try {
    const client = getRedisClient();
    const items = await client.lRange(key, start, end);
    logger.debug(`Redis LRANGE: ${key} (${start}, ${end})`);
    return items;
  } catch (error) {
    logger.error(`Failed to get Redis list items for key ${key}:`, error);
    throw error;
  }
};

// Remove from list
export const removeRedisListItem = async (
  key: string,
  value: string,
  count: number = 1
): Promise<number> => {
  try {
    const client = getRedisClient();
    const removed = await client.lRem(key, count, value);
    logger.debug(`Redis LREM: ${key}`);
    return removed;
  } catch (error) {
    logger.error(`Failed to remove item from Redis list ${key}:`, error);
    throw error;
  }
};

// Add to a set
export const addRedisSetItem = async (key: string, value: string): Promise<number> => {
  try {
    const client = getRedisClient();
    const added = await client.sAdd(key, value);
    logger.debug(`Redis SADD: ${key}`);
    return added;
  } catch (error) {
    logger.error(`Failed to add item to Redis set ${key}:`, error);
    throw error;
  }
};

// Get set items
export const getRedisSetItems = async (key: string): Promise<string[]> => {
  try {
    const client = getRedisClient();
    const items = await client.sMembers(key);
    logger.debug(`Redis SMEMBERS: ${key}`);
    return items;
  } catch (error) {
    logger.error(`Failed to get Redis set items for key ${key}:`, error);
    throw error;
  }
};

// Remove from set
export const removeRedisSetItem = async (key: string, value: string): Promise<number> => {
  try {
    const client = getRedisClient();
    const removed = await client.sRem(key, value);
    logger.debug(`Redis SREM: ${key}`);
    return removed;
  } catch (error) {
    logger.error(`Failed to remove item from Redis set ${key}:`, error);
    throw error;
  }
};

// Health check for Redis
export const redisHealthCheck = async () => {
  try {
    const startTime = Date.now();
    const client = getRedisClient();
    await client.ping();
    const responseTime = Date.now() - startTime;

    // Get Redis info
    const info = await client.info();
    const memoryMatch = info.match(/used_memory:(\d+)/);
    const memory = memoryMatch ? parseInt(memoryMatch[1]) : 0;

    return {
      status: 'healthy',
      responseTime: `${responseTime}ms`,
      memory: `${Math.round(memory / 1024 / 1024 * 100) / 100}MB`,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    };
  }
};

// Cache utilities
export const cacheUtils = {
  // Cache user session
  cacheUserSession: async (userId: string, sessionData: any, ttl: number = 3600) => {
    const key = `session:${userId}`;
    await setRedisValue(key, JSON.stringify(sessionData), ttl);
  },

  // Get user session
  getUserSession: async (userId: string) => {
    const key = `session:${userId}`;
    const sessionData = await getRedisValue(key);
    return sessionData ? JSON.parse(sessionData) : null;
  },

  // Delete user session
  deleteUserSession: async (userId: string) => {
    const key = `session:${userId}`;
    await deleteRedisKey(key);
  },

  // Cache API response
  cacheApiResponse: async (cacheKey: string, responseData: any, ttl: number = 300) => {
    await setRedisValue(cacheKey, JSON.stringify(responseData), ttl);
  },

  // Get cached API response
  getCachedApiResponse: async (cacheKey: string) => {
    const cachedData = await getRedisValue(cacheKey);
    return cachedData ? JSON.parse(cachedData) : null;
  },

  // Invalidate cache pattern
  invalidateCachePattern: async (pattern: string) => {
    const client = getRedisClient();
    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(keys);
      logger.debug(`Redis DEL pattern: ${pattern} (${keys.length} keys)`);
    }
    return keys.length;
  },
};

export { redisClient };
export default redisClient;