import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from '@/config/env';
import { initializeOAuth } from '@/config/oauth';
import { requestId } from '@/middleware/requestId';
import { errorHandler } from '@/middleware/errorHandler';
import apiRoutes from '@/routes';
import { logger, createChildLogger } from '@/utils/logger';

const appLogger = createChildLogger('http');

export const createApp = (): express.Express => {
  const app = express();

  app.disable('x-powered-by');
  app.use(requestId);
  app.use(helmet());

  app.use(
    cors({
      origin: env.CLIENT_URL,
      credentials: true,
    })
  );
  app.use(express.json({ limit: '10mb' }));

  app.use((req, _res, next) => {
    appLogger.info({ method: req.method, path: req.path, requestId: req.requestId }, 'request');
    next();
  });

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', message: 'Smart Lecture Notes API is running' });
  });

  app.use('/api/v1', apiRoutes);

  // Backwards-compatible aliases so the existing React client keeps working
  app.use('/api', apiRoutes);

  app.use((req, res) => {
    res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: `Route ${req.originalUrl} not found`,
        requestId: req.requestId,
      },
    });
  });

  app.use(errorHandler);

  return app;
};

export const boot = (): void => {
  initializeOAuth();
  const app = createApp();

  const server = app.listen(env.PORT, () => {
    logger.info(`🚀 Server running on http://localhost:${env.PORT}`);
  });

  const shutdown = (signal: string) => {
    logger.info({ signal }, 'Received shutdown signal, closing gracefully');
    server.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};