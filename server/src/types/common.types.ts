import type { NextFunction } from 'express';

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface ApiResponse<T> {
  success: true;
  data: T;
}

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    requestId?: string;
    details?: unknown;
  };
}

export type AsyncHandler = (
  req: Express.Request,
  res: Express.Response,
  next: NextFunction
) => Promise<void>;