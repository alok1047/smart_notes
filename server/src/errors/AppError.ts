export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly code?: string;

  constructor(message: string, statusCode = 500, options?: { isOperational?: boolean; code?: string }) {
    super(message);
    this.name = new.target.name;
    this.statusCode = statusCode;
    this.isOperational = options?.isOperational ?? true;
    this.code = options?.code;
    Error.captureStackTrace?.(this, new.target);
  }
}