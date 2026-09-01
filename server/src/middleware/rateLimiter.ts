import rateLimit from 'express-rate-limit';
import type { RequestHandler } from 'express';

const keyGenerator = (req: Express.Request): string => {
  const ip = (req as Express.Request & { ip?: string }).ip;
  return req.user?.id ?? ip ?? 'anonymous';
};

const createLimiter = (windowMs: number, limit: number, message: string): RequestHandler => {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator,
    handler: (_req, res) => {
      res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMITED',
          message,
          requestId: _req.requestId,
        },
      });
    },
  });
};

export const generalLimiter = createLimiter(60_000, 100, 'Too many requests, please try again later');

export const aiLimiter = createLimiter(60_000, 20, 'AI request limit reached. Please wait a minute.');

export const searchLimiter = createLimiter(60_000, 60, 'Search rate limit reached. Please slow down.');

export const authLimiter = rateLimit({
  windowMs: 60_000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const ip = (req as Express.Request & { ip?: string }).ip;
    return ip ?? 'unknown';
  },
  handler: (_req, res) => {
    res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMITED',
        message: 'Too many auth attempts. Please try again later.',
        requestId: _req.requestId,
      },
    });
  },
});