import { Request, Response, NextFunction } from 'express';
import { logger } from '../lib/logger';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: any;

  constructor(message: string, statusCode = 500, code = 'INTERNAL_ERROR', details?: any) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export const Errors = {
  BadRequest: (msg = 'Bad request', details?: any) => new AppError(msg, 400, 'BAD_REQUEST', details),
  Unauthorized: (msg = 'Authentication required') => new AppError(msg, 401, 'UNAUTHORIZED'),
  Forbidden: (msg = 'Access denied') => new AppError(msg, 403, 'FORBIDDEN'),
  NotFound: (msg = 'Resource not found') => new AppError(msg, 404, 'NOT_FOUND'),
  Conflict: (msg = 'Resource conflict') => new AppError(msg, 409, 'CONFLICT'),
  TooManyRequests: (msg = 'Rate limit exceeded') => new AppError(msg, 429, 'TOO_MANY_REQUESTS'),
  Internal: (msg = 'An unexpected internal error occurred') => new AppError(msg, 500, 'INTERNAL_SERVER_ERROR'),
};

export function errorHandler(err: any, req: Request, res: Response, _next: NextFunction) {
  const statusCode = err.statusCode || (err.status && typeof err.status === 'number' ? err.status : 500);
  const code = err.code || (statusCode === 400 ? 'BAD_REQUEST' : statusCode === 401 ? 'UNAUTHORIZED' : statusCode === 403 ? 'FORBIDDEN' : statusCode === 404 ? 'NOT_FOUND' : 'INTERNAL_SERVER_ERROR');
  const message = statusCode >= 500 && process.env.NODE_ENV === 'production' ? 'An internal server error occurred' : err.message || 'An error occurred';

  logger.error(`[API Error] ${req.method} ${req.path} -> ${statusCode} ${code}`, {
    requestId: req.requestId,
    statusCode,
    code,
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });

  return res.status(statusCode).json({
    success: false,
    error: { code, message, details: err.details },
    requestId: req.requestId,
  });
}

export function notFoundHandler(req: Request, res: Response) {
  return res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: `Route '${req.method} ${req.path}' not found` },
    requestId: req.requestId,
  });
}
