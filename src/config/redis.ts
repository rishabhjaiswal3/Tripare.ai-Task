
import Redis from 'ioredis';
import { config } from './env';

export const redis = new Redis(config.redisUrl, {
  lazyConnect: true,
  maxRetriesPerRequest: 2,
  retryStrategy(attempt) {
    if (attempt > 5) return null;
    return Math.min(attempt * 250, 1500);
  },
});

redis.on('error', (error: Error) => {
  console.error(`[redis] connection error: ${error.message}`);
});

export async function connectRedis(): Promise<void> {
  if (redis.status === 'wait') await redis.connect();
}

