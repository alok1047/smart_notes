import Redis from 'ioredis';
import { env } from './env';
import { logger } from '@/utils/logger';

let client: Redis | null = null;

export const getRedis = (): Redis => {
  if (!client) {
    client = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      retryStrategy: (times) => Math.min(times * 200, 3000),
    });

    client.on('error', (err) => {
      logger.warn({ err }, 'Redis connection error');
    });
  }
  return client;
};

export const redisKey = (...parts: string[]): string => {
  return ['smartnotes', ...parts].join(':');
};

export const closeRedis = async (): Promise<void> => {
  if (client) {
    await client.quit();
    client = null;
  }
};