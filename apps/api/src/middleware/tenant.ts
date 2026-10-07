import { Request, Response, NextFunction } from 'express';
import { WorkspaceModel, SubscriptionModel } from '@insta-automation/database';
import type { WorkspaceRole, PlanSlug } from '@insta-automation/types';
import { Errors } from './errorHandler';

export async function tenantMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) return next(Errors.Unauthorized());

    const headerWorkspaceId = req.header('x-workspace-id');

    let workspace: any = null;
    let memberRole: WorkspaceRole = 'VIEWER';

    if (headerWorkspaceId) {
      workspace = await WorkspaceModel.findOne({
        _id: headerWorkspaceId,
        'members.userId': req.user.id,
      }).lean();

      if (workspace) {
        const m = workspace.members.find((mb: any) => mb.userId.toString() === req.user!.id);
        if (m) memberRole = m.role as WorkspaceRole;
      }
    }

    if (!workspace) {
      workspace = await WorkspaceModel.findOne({ 'members.userId': req.user.id }).lean();
      if (workspace) {
        const m = workspace.members.find((mb: any) => mb.userId.toString() === req.user!.id);
        if (m) memberRole = m.role as WorkspaceRole;
      }
    }

    if (!workspace) {
      workspace = await WorkspaceModel.create({
        name: `${req.user.name}'s Workspace`,
        slug: `ws-${req.user.id.slice(-6)}-${Date.now().toString(36)}`,
        ownerId: req.user.id,
        members: [{ userId: req.user.id, role: 'OWNER', joinedAt: new Date() }],
      });
      memberRole = 'OWNER';
    }

    const workspaceIdStr = workspace._id.toString();

    let subscription = await SubscriptionModel.findOne({ workspaceId: workspace._id }).lean();
    if (!subscription) {
      subscription = await SubscriptionModel.create({
        workspaceId: workspace._id,
        planSlug: 'free',
        status: 'ACTIVE',
      });
    }

    req.tenant = {
      workspaceId: workspaceIdStr,
      workspaceName: workspace.name,
      userRole: memberRole,
      planSlug: (subscription.planSlug || 'free') as PlanSlug,
    };

    return next();
  } catch (err: any) {
    return next(err);
  }
}
