import { Router, Request, Response, NextFunction } from 'express';
import { WorkspaceModel, SubscriptionModel, UserModel } from '@insta-automation/database';
import { CreateWorkspaceSchema, UpdateWorkspaceSchema } from '@insta-automation/validation';
import { audit, AuditAction } from '@insta-automation/audit';
import { validate } from '../middleware/validation';
import { authMiddleware } from '../middleware/auth';
import { tenantMiddleware } from '../middleware/tenant';
import { requirePermission } from '../middleware/rbac';
import { Errors } from '../middleware/errorHandler';

export const workspacesRouter = Router();

workspacesRouter.use(authMiddleware);

workspacesRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const workspaces = await WorkspaceModel.find({ 'members.userId': userId }).lean();

    const formatted = workspaces.map((w: any) => {
      const member = w.members.find((m: any) => m.userId.toString() === userId);
      return {
        id: w._id.toString(),
        name: w.name,
        slug: w.slug,
        role: member?.role || 'VIEWER',
        createdAt: w.createdAt,
      };
    });

    return res.json({ success: true, workspaces: formatted });
  } catch (err) {
    return next(err);
  }
});

workspacesRouter.post('/', validate(CreateWorkspaceSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { name, slug } = req.body;

    const workspaceSlug = slug || `ws-${userId.slice(-6)}-${Date.now().toString(36)}`;
    const workspace = await WorkspaceModel.create({
      name,
      slug: workspaceSlug,
      ownerId: userId,
      members: [{ userId, role: 'OWNER', joinedAt: new Date() }],
    });

    await SubscriptionModel.create({ workspaceId: workspace._id, planSlug: 'free', status: 'ACTIVE' });

    await audit({
      userId,
      workspaceId: workspace._id.toString(),
      action: AuditAction.WORKSPACE_CREATE,
      ipAddress: req.ip,
      userAgent: req.header('user-agent'),
      result: 'SUCCESS',
      metadata: { name, slug: workspaceSlug },
    });

    return res.status(201).json({
      success: true,
      message: 'Workspace created successfully',
      workspace: { id: workspace._id.toString(), name: workspace.name, slug: workspace.slug, role: 'OWNER' },
    });
  } catch (err) {
    return next(err);
  }
});

workspacesRouter.get('/current', tenantMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.tenant!.workspaceId;
    const workspace = await WorkspaceModel.findById(workspaceId).lean();
    if (!workspace) return next(Errors.NotFound('Workspace not found'));

    return res.json({
      success: true,
      workspace: {
        id: workspace._id.toString(),
        name: workspace.name,
        slug: workspace.slug,
        role: req.tenant!.userRole,
        planSlug: req.tenant!.planSlug,
        memberCount: workspace.members.length,
      },
    });
  } catch (err) {
    return next(err);
  }
});

workspacesRouter.put('/current', tenantMiddleware, requirePermission('workspace:update'), validate(UpdateWorkspaceSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.tenant!.workspaceId;
    const updated = await WorkspaceModel.findByIdAndUpdate(workspaceId, { $set: req.body }, { new: true }).lean();
    if (!updated) return next(Errors.NotFound('Workspace not found'));

    await audit({
      userId: req.user!.id,
      workspaceId,
      action: AuditAction.WORKSPACE_UPDATE,
      ipAddress: req.ip,
      userAgent: req.header('user-agent'),
      result: 'SUCCESS',
    });

    return res.json({
      success: true,
      message: 'Workspace updated successfully',
      workspace: { id: updated._id.toString(), name: updated.name, slug: updated.slug },
    });
  } catch (err) {
    return next(err);
  }
});

workspacesRouter.get('/current/members', tenantMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.tenant!.workspaceId;
    const workspace = await WorkspaceModel.findById(workspaceId).populate('members.userId', 'name email').lean();
    if (!workspace) return next(Errors.NotFound('Workspace not found'));

    const members = (workspace.members || []).map((m: any) => ({
      userId: m.userId?._id?.toString() || m.userId?.toString(),
      name: m.userId?.name || 'Workspace Member',
      email: m.userId?.email || 'member@workspace.com',
      role: m.role,
      joinedAt: m.joinedAt,
    }));

    return res.json({ success: true, members, count: members.length });
  } catch (err) {
    return next(err);
  }
});

workspacesRouter.post('/current/members/invite', tenantMiddleware, requirePermission('workspace:update'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.tenant!.workspaceId;
    const { email, role = 'MEMBER' } = req.body;

    if (!email) return next(Errors.BadRequest('Member email is required'));

    let user = await UserModel.findOne({ email });
    if (!user) {
      user = await UserModel.create({
        email,
        name: email.split('@')[0],
        globalRole: 'user',
        isEmailVerified: false,
      });
    }

    const workspace = await WorkspaceModel.findById(workspaceId);
    if (!workspace) return next(Errors.NotFound('Workspace not found'));

    const existingIndex = workspace.members.findIndex((m: any) => m.userId.toString() === user!._id.toString());
    if (existingIndex >= 0) {
      workspace.members[existingIndex].role = role;
    } else {
      workspace.members.push({ userId: user._id, role, joinedAt: new Date() });
    }

    await workspace.save();

    return res.json({ success: true, message: `Member ${email} added to workspace as ${role}` });
  } catch (err) {
    return next(err);
  }
});

workspacesRouter.delete('/current/members/:userId', tenantMiddleware, requirePermission('workspace:update'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.tenant!.workspaceId;
    const workspace = await WorkspaceModel.findById(workspaceId);
    if (!workspace) return next(Errors.NotFound('Workspace not found'));

    workspace.members = workspace.members.filter((m: any) => m.userId.toString() !== req.params.userId);
    await workspace.save();

    return res.json({ success: true, message: 'Workspace member removed' });
  } catch (err) {
    return next(err);
  }
});
