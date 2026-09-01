import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import multer from 'multer';
import { AppError } from '@/errors/AppError';
import { ValidationError } from '@/errors/ValidationError';
import { logger } from '@/utils/logger';
import { isProduction } from '@/config/env';

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  const requestId = req.requestId || 'unknown';

  let statusCode = 500;
  let code = 'INTERNAL_SERVER_ERROR';
  let message = 'Internal server error';
  let details: unknown;

  if (err instanceof ZodError) {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = 'Invalid request data';
    details = err.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
    }));
  } else if (err instanceof ValidationError) {
    statusCode = err.statusCode;
    code = err.code || 'VALIDATION_ERROR';
    message = err.message;
    details = err.details;
  } else if (err instanceof AppError) {
    statusCode = err.statusCode;
    code = err.code || 'APP_ERROR';
    message = err.message;
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    statusCode = 400;
    if (err.code === 'P2002') {
      code = 'CONFLICT';
      message = 'A record with the same unique value already exists';
    } else if (err.code === 'P2025') {
      statusCode = 404;
      code = 'NOT_FOUND';
      message = 'Record not found';
    } else {
      message = 'Database error';
    }
  } else if (err instanceof SyntaxError && 'body' in err) {
    statusCode = 400;
    code = 'INVALID_JSON';
    message = 'Invalid JSON payload';
  } else if (err instanceof multer.MulterError) {
    statusCode = 400;
    if (err.code === 'LIMIT_FILE_SIZE') {
      code = 'FILE_TOO_LARGE';
      message = 'File is too large. Maximum allowed size is 15 MB.';
    } else {
      code = 'UPLOAD_ERROR';
      message = err.message;
    }
  } else if (err instanceof Error && err.message?.includes('Unsupported file type')) {
    statusCode = 400;
    code = 'UNSUPPORTED_FILE';
    message = err.message;
  }

  if (statusCode >= 500) {
    logger.error(
      { err: err.message, stack: isProduction ? undefined : err.stack, requestId, path: req.path, method: req.method },
      'Unhandled error'
    );
  } else {
    logger.warn({ requestId, path: req.path, method: req.method, code, statusCode }, 'Request failed');
  }

  const body = {
    success: false,
    error: {
      code,
      message,
      requestId,
      ...(details !== undefined ? { details } : {}),
      ...(isProduction ? {} : { stack: err.stack }),
    },
  };

  res.status(statusCode).json(body);
};