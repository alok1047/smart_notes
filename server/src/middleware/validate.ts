import type { RequestHandler } from 'express';
import type { ZodSchema } from 'zod';
import { ValidationError } from '@/errors/ValidationError';

type Source = 'body' | 'query' | 'params';

export const validate = (schema: ZodSchema, source: Source = 'body'): RequestHandler => {
  return (req, _res, next) => {
    const data = req[source];
    const result = schema.safeParse(data);

    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      }));
      next(new ValidationError('Invalid request data', details));
      return;
    }

    (req as unknown as Record<string, unknown>)[source] = result.data;
    next();
  };
};