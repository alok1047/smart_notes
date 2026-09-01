import { AppError } from './AppError';
import { NotFoundError } from './NotFoundError';
import { UnauthorizedError } from './UnauthorizedError';
import { ValidationError } from './ValidationError';

export { AppError, NotFoundError, UnauthorizedError, ValidationError };

export class RateLimitError extends AppError {
  constructor(message = 'Too many requests, please try again later') {
    super(message, 429, { code: 'RATE_LIMITED' });
  }
}

export class AIProviderError extends AppError {
  public readonly provider: string;

  constructor(message: string, provider: string) {
    super(message, 502, { code: 'AI_PROVIDER_ERROR', isOperational: false });
    this.provider = provider;
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403, { code: 'FORBIDDEN' });
  }
}