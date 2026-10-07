import { Request, Response, NextFunction } from 'express';
import { generateId } from '@insta-automation/utils';
import type { AuthenticatedUser, TenantContext } from '@insta-automation/types';

declare global {
  namespace Express {
    interface Request {
      requestId: string;
      user?: AuthenticatedUser;
      tenant?: TenantContext;
    }
  }
}

export function requestContextMiddleware(req: Request, res: Response, next: NextFunction) {
  const incomingId = req.header('x-request-id');
  req.requestId = incomingId && incomingId.trim() ? incomingId.trim() : generateId('req', 16);
  res.setHeader('x-request-id', req.requestId);
  next();
}
