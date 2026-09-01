import crypto from 'node:crypto';
import type { RequestHandler } from 'express';

export const requestId: RequestHandler = (req, res, next) => {
  const incoming = req.headers['x-request-id'];
  const id = Array.isArray(incoming) ? incoming[0] : incoming;
  req.requestId = id || crypto.randomUUID();
  res.setHeader('X-Request-ID', req.requestId);
  next();
};