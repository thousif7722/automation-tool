import { Router, Request, Response, NextFunction } from 'express';
import { UserModel, WorkspaceModel, InstagramAccountModel, AutomationRuleModel, LeadModel, MessageModel } from '@insta-automation/database';
import { authMiddleware, adminOnly } from '../middleware/auth';

export const adminRouter = Router();

adminRouter.use(authMiddleware);
adminRouter.use(adminOnly);

adminRouter.get('/stats', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const totalUsers = await UserModel.countDocuments();
    const totalWorkspaces = await WorkspaceModel.countDocuments();
    const totalConnectedAccounts = await InstagramAccountModel.countDocuments({ status: 'CONNECTED' });
    const totalWorkflows = await AutomationRuleModel.countDocuments();
    const totalLeads = await LeadModel.countDocuments();
    const totalMessages = await MessageModel.countDocuments();

    return res.json({
      success: true,
      stats: {
        totalUsers,
        totalWorkspaces,
        totalConnectedAccounts,
        totalWorkflows,
        totalLeads,
        totalMessages,
        systemStatus: 'ALL_SYSTEMS_OPERATIONAL',
      },
    });
  } catch (err) {
    return next(err);
  }
});

adminRouter.get('/users', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await UserModel.find().select('-passwordHash').sort({ createdAt: -1 }).lean();
    return res.json({ success: true, users, count: users.length });
  } catch (err) {
    return next(err);
  }
});
