import { boot } from './app';
import { logger } from './utils/logger';

const start = (): void => {
  try {
    boot();
  } catch (error) {
    logger.fatal({ err: error }, 'Failed to start server');
    process.exit(1);
  }
};

start();