import { Request, Response, NextFunction } from 'express';
import { extractBearerToken, verifyAccessToken } from '@insta-automation/auth';
import { getEnv } from '@insta-automation/config';
import { UserModel } from '@insta-automation/database';
import { Errors } from './errorHandler';

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    const token = extractBearerToken(authHeader);

    if (!token) {
      return next(Errors.Unauthorized('Authentication required. Missing Bearer token.'));
    }

    const env = getEnv();
    const payload = verifyAccessToken(token, env.JWT_SECRET);

    const user = await UserModel.findById(payload.sub).select('_id email name globalRole').lean();

    if (!user) {
      return next(Errors.Unauthorized('Authenticated user account no longer exists.'));
    }

    req.user = {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      globalRole: user.globalRole,
    };

    return next();
  } catch (err: any) {
    return next(err);
  }
}

export function adminOnly(req: Request, res: Response, next: NextFunction) {
  if (!req.user) return next(Errors.Unauthorized());
  if (req.user.globalRole !== 'admin' && req.user.globalRole !== 'superadmin') {
    return next(Errors.Forbidden('Admin platform privileges required'));
  }
  return next();
}
