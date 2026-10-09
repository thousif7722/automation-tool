import { Router, Request, Response, NextFunction } from 'express';
import { UserModel, WorkspaceModel, SubscriptionModel } from '@insta-automation/database';
import { hashPassword, verifyPassword, signAccessToken, verifyGoogleIdToken } from '@insta-automation/auth';
import { RegisterSchema, LoginSchema, GoogleAuthSchema } from '@insta-automation/validation';
import { getEnv } from '@insta-automation/config';
import { audit, AuditAction } from '@insta-automation/audit';
import { validate } from '../middleware/validation';
import { authMiddleware, adminOnly } from '../middleware/auth';
import { Errors } from '../middleware/errorHandler';

export const authRouter = Router();

authRouter.post('/register', validate(RegisterSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await UserModel.findOne({ email }).lean();
    if (existingUser) {
      return next(Errors.Conflict('An account with this email address already exists.'));
    }

    const passwordHash = await hashPassword(password);
    const user = await UserModel.create({
      name,
      email,
      passwordHash,
      globalRole: 'user',
      isEmailVerified: false,
    });

    const workspace = await WorkspaceModel.create({
      name: `${name}'s Workspace`,
      slug: `ws-${user._id.toString().slice(-6)}-${Date.now().toString(36)}`,
      ownerId: user._id,
      members: [{ userId: user._id, role: 'OWNER', joinedAt: new Date() }],
    });

    await SubscriptionModel.create({
      workspaceId: workspace._id,
      planSlug: 'free',
      status: 'ACTIVE',
    });

    const env = getEnv();
    const tokenPayload = { sub: user._id.toString(), email: user.email, name: user.name, globalRole: user.globalRole };
    const tokens = signAccessToken(tokenPayload, env.JWT_SECRET, env.JWT_EXPIRES_IN);

    await audit({
      userId: user._id.toString(),
      workspaceId: workspace._id.toString(),
      action: AuditAction.AUTH_REGISTER,
      ipAddress: req.ip,
      userAgent: req.header('user-agent'),
      result: 'SUCCESS',
    });

    return res.status(201).json({
      success: true,
      message: 'Account created successfully',
      tokens,
      user: { id: user._id.toString(), email: user.email, name: user.name, globalRole: user.globalRole },
      workspace: { id: workspace._id.toString(), name: workspace.name, role: 'OWNER' },
    });
  } catch (err) {
    return next(err);
  }
});

authRouter.post('/login', validate(LoginSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    const user = await UserModel.findOne({ email }).select('+passwordHash').exec();
    if (!user || !user.passwordHash) {
      return next(Errors.Unauthorized('Invalid email or password'));
    }

    const isMatch = await verifyPassword(password, user.passwordHash);
    if (!isMatch) {
      await audit({ action: AuditAction.AUTH_LOGIN, ipAddress: req.ip, userAgent: req.header('user-agent'), result: 'FAILURE', metadata: { email } });
      return next(Errors.Unauthorized('Invalid email or password'));
    }

    user.lastLoginAt = new Date();
    await user.save();

    const workspace = await WorkspaceModel.findOne({ 'members.userId': user._id }).lean();

    const env = getEnv();
    const tokenPayload = { sub: user._id.toString(), email: user.email, name: user.name, globalRole: user.globalRole };
    const tokens = signAccessToken(tokenPayload, env.JWT_SECRET, env.JWT_EXPIRES_IN);

    await audit({
      userId: user._id.toString(),
      workspaceId: workspace?._id?.toString(),
      action: AuditAction.AUTH_LOGIN,
      ipAddress: req.ip,
      userAgent: req.header('user-agent'),
      result: 'SUCCESS',
    });

    return res.json({
      success: true,
      tokens,
      user: { id: user._id.toString(), email: user.email, name: user.name, globalRole: user.globalRole },
      workspace: workspace ? { id: workspace._id.toString(), name: workspace.name } : null,
    });
  } catch (err) {
    return next(err);
  }
});

authRouter.post('/google', validate(GoogleAuthSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { idToken } = req.body;
    const env = getEnv();

    if (!env.GOOGLE_CLIENT_ID) {
      return next(Errors.BadRequest('Google OAuth is not configured on this server'));
    }

    const gUser = await verifyGoogleIdToken(idToken, env.GOOGLE_CLIENT_ID);
    let user = await UserModel.findOne({ $or: [{ googleId: gUser.googleId }, { email: gUser.email }] });

    if (!user) {
      user = await UserModel.create({
        name: gUser.name,
        email: gUser.email,
        googleId: gUser.googleId,
        avatarUrl: gUser.avatarUrl,
        globalRole: 'user',
        isEmailVerified: gUser.emailVerified,
      });

      const workspace = await WorkspaceModel.create({
        name: `${gUser.name}'s Workspace`,
        slug: `ws-${user._id.toString().slice(-6)}-${Date.now().toString(36)}`,
        ownerId: user._id,
        members: [{ userId: user._id, role: 'OWNER', joinedAt: new Date() }],
      });

      await SubscriptionModel.create({ workspaceId: workspace._id, planSlug: 'free', status: 'ACTIVE' });
    } else if (!user.googleId) {
      user.googleId = gUser.googleId;
      if (gUser.avatarUrl) user.avatarUrl = gUser.avatarUrl;
      await user.save();
    }

    const workspace = await WorkspaceModel.findOne({ 'members.userId': user._id }).lean();
    const tokenPayload = { sub: user._id.toString(), email: user.email, name: user.name, globalRole: user.globalRole };
    const tokens = signAccessToken(tokenPayload, env.JWT_SECRET, env.JWT_EXPIRES_IN);

    await audit({
      userId: user._id.toString(),
      workspaceId: workspace?._id?.toString(),
      action: AuditAction.AUTH_GOOGLE_LOGIN,
      ipAddress: req.ip,
      userAgent: req.header('user-agent'),
      result: 'SUCCESS',
    });

    return res.json({
      success: true,
      tokens,
      user: { id: user._id.toString(), email: user.email, name: user.name, globalRole: user.globalRole },
      workspace: workspace ? { id: workspace._id.toString(), name: workspace.name } : null,
    });
  } catch (err) {
    return next(err);
  }
});

authRouter.get('/me', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await UserModel.findById(req.user!.id).select('-passwordHash').lean();
    if (!user) return next(Errors.NotFound('User account not found'));

    const workspaces = await WorkspaceModel.find({ 'members.userId': user._id }).lean();

    return res.json({
      success: true,
      user: { id: user._id.toString(), email: user.email, name: user.name, globalRole: user.globalRole },
      workspaces: workspaces.map((w: any) => ({
        id: w._id.toString(),
        name: w.name,
        role: w.members.find((m: any) => m.userId.toString() === user._id.toString())?.role,
      })),
    });
  } catch (err) {
    return next(err);
  }
});

authRouter.post('/admin-login', validate(LoginSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    const user = await UserModel.findOne({ email }).select('+passwordHash').exec();
    if (!user || !user.passwordHash) {
      await audit({ action: AuditAction.AUTH_ADMIN_LOGIN, ipAddress: req.ip, userAgent: req.header('user-agent'), result: 'FAILURE', metadata: { email, reason: 'Invalid user' } });
      return next(Errors.Unauthorized('Invalid administrator credentials'));
    }

    const isMatch = await verifyPassword(password, user.passwordHash);
    if (!isMatch) {
      await audit({ action: AuditAction.AUTH_ADMIN_LOGIN, ipAddress: req.ip, userAgent: req.header('user-agent'), result: 'FAILURE', metadata: { email, reason: 'Invalid password' } });
      return next(Errors.Unauthorized('Invalid administrator credentials'));
    }

    if (user.globalRole !== 'admin' && user.globalRole !== 'superadmin') {
      await audit({
        userId: user._id.toString(),
        action: AuditAction.AUTH_ADMIN_LOGIN,
        ipAddress: req.ip,
        userAgent: req.header('user-agent'),
        result: 'DENIED',
        metadata: { email, role: user.globalRole, reason: 'Forbidden: Insufficient platform role' },
      });
      return next(Errors.Forbidden('Platform administrator privileges required for Super Admin Portal access'));
    }

    user.lastLoginAt = new Date();
    await user.save();

    const env = getEnv();
    const tokenPayload = { sub: user._id.toString(), email: user.email, name: user.name, globalRole: user.globalRole };
    const tokens = signAccessToken(tokenPayload, env.JWT_SECRET, env.JWT_EXPIRES_IN);

    await audit({
      userId: user._id.toString(),
      action: AuditAction.AUTH_ADMIN_LOGIN,
      ipAddress: req.ip,
      userAgent: req.header('user-agent'),
      result: 'SUCCESS',
      metadata: { role: user.globalRole },
    });

    return res.json({
      success: true,
      message: 'Super Admin authentication successful',
      tokens,
      user: { id: user._id.toString(), email: user.email, name: user.name, globalRole: user.globalRole },
    });
  } catch (err) {
    return next(err);
  }
});

authRouter.post('/logout', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await audit({
      userId: req.user?.id,
      action: AuditAction.AUTH_LOGOUT,
      ipAddress: req.ip,
      userAgent: req.header('user-agent'),
      result: 'SUCCESS',
    });
    return res.json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    return next(err);
  }
});

authRouter.get('/admin-me', authMiddleware, adminOnly, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await UserModel.findById(req.user!.id).select('-passwordHash').lean();
    if (!user) return next(Errors.NotFound('User account not found'));

    if (user.globalRole !== 'admin' && user.globalRole !== 'superadmin') {
      return next(Errors.Forbidden('Admin platform privileges required'));
    }

    return res.json({
      success: true,
      user: { id: user._id.toString(), email: user.email, name: user.name, globalRole: user.globalRole },
    });
  } catch (err) {
    return next(err);
  }
});
