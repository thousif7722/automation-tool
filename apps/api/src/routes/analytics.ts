import { Router, Request, Response, NextFunction } from 'express';
import { LeadModel, MessageModel, AutomationRuleModel, InstagramAccountModel } from '@insta-automation/database';
import { authMiddleware } from '../middleware/auth';
import { tenantMiddleware } from '../middleware/tenant';
import { requirePermission } from '../middleware/rbac';

export const analyticsRouter = Router();

analyticsRouter.use(authMiddleware);
analyticsRouter.use(tenantMiddleware);

analyticsRouter.get('/', requirePermission('analytics:read'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.tenant!.workspaceId;
    const leadsCaptured = await LeadModel.countDocuments({ workspaceId });
    const dmsSent = await MessageModel.countDocuments({ workspaceId, direction: 'OUTBOUND', status: { $in: ['Sent', 'Delivered'] } });
    const dmFailures = await MessageModel.countDocuments({ workspaceId, status: 'Failed' });
    const activeWorkflows = await AutomationRuleModel.countDocuments({ workspaceId, status: 'ACTIVE' });
    const connectedAccounts = await InstagramAccountModel.countDocuments({ workspaceId, status: 'CONNECTED' });

    const totalInteractions = dmsSent + leadsCaptured;
    const conversionRate = totalInteractions > 0 ? Number(((leadsCaptured / totalInteractions) * 100).toFixed(1)) : 0;

    return res.json({
      success: true,
      analytics: {
        workspaceId,
        workspaceName: req.tenant!.workspaceName,
        commentsProcessed: totalInteractions,
        dmsSent,
        dmFailures,
        leadsCaptured,
        activeWorkflows,
        connectedAccounts,
        conversionRate,
      },
    });
  } catch (err) {
    return next(err);
  }
});
