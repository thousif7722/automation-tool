import { Request, Response, NextFunction } from 'express';
import { assertCan, PermissionDeniedError } from '@insta-automation/permissions';
import type { ResourceAction } from '@insta-automation/types';
import { Errors } from './errorHandler';

export function requirePermission(action: ResourceAction) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.tenant) return next(Errors.Unauthorized('Tenant context missing'));

    try {
      assertCan(req.tenant.userRole, action);
      return next();
    } catch (err) {
      if (err instanceof PermissionDeniedError) {
        return next(Errors.Forbidden(err.message));
      }
      return next(err);
    }
  };
}
