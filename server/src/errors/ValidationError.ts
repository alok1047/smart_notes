import { AppError } from './AppError';

export class ValidationError extends AppError {
  public readonly details?: unknown;

  constructor(message: string, details?: unknown) {
    super(message, 400, { code: 'VALIDATION_ERROR' });
    this.details = details;
  }
}