import pino from 'pino';
import { env, isDevelopment } from '@/config/env';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  redact: {
    paths: ['req.headers.authorization', '*.apiKey', '*.key', 'password', 'secret'],
    censor: '[REDACTED]',
  },
  transport: isDevelopment
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
  base: isDevelopment ? undefined : { env: env.NODE_ENV },
});

export const createChildLogger = (name: string) => logger.child({ service: name });