import Redis from 'ioredis';
import logger from './logger';

let redisInstance: Redis;

export function getRedis(): Redis {
  if (!redisInstance) {
    redisInstance = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        if (times > 3) return null;
        return Math.min(times * 200, 2000);
      },
    });
    redisInstance.on('error', (err) => logger.error('Redis error:', err));
  }
  return redisInstance;
}

export async function connectRedis(): Promise<void> {
  await getRedis().ping();
}

export default getRedis;
