import { Router, Request, Response, NextFunction } from 'express';
import { CustomerModel } from '@insta-automation/database';
import { authMiddleware } from '../middleware/auth';
import { tenantMiddleware } from '../middleware/tenant';
import { requirePermission } from '../middleware/rbac';
import { Errors } from '../middleware/errorHandler';

export const customersRouter = Router();

customersRouter.use(authMiddleware);
customersRouter.use(tenantMiddleware);

customersRouter.get('/', requirePermission('customer:read'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.tenant!.workspaceId;
    const customers = await CustomerModel.find({ workspaceId }).sort({ lastInteraction: -1 }).lean();

    const formatted = customers.map((c: any) => ({
      id: c._id.toString(),
      workspaceId: c.workspaceId.toString(),
      instagramUsername: c.instagramUsername,
      name: c.name,
      location: c.location,
      language: c.language,
      tags: c.tags || [],
      intent: c.intent,
      lastInteraction: c.lastInteraction,
      leadScore: c.leadScore || 0,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }));

    return res.json({ success: true, data: formatted, count: formatted.length });
  } catch (err) {
    return next(err);
  }
});

customersRouter.get('/:id', requirePermission('customer:read'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.tenant!.workspaceId;
    const customer = await CustomerModel.findOne({ _id: req.params.id, workspaceId }).lean();
    if (!customer) return next(Errors.NotFound('Customer not found'));
    return res.json({ success: true, data: customer });
  } catch (err) {
    return next(err);
  }
});

customersRouter.put('/:id', requirePermission('customer:update'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.tenant!.workspaceId;
    const customer = await CustomerModel.findOneAndUpdate(
      { _id: req.params.id, workspaceId },
      { $set: req.body },
      { new: true }
    ).lean();

    if (!customer) return next(Errors.NotFound('Customer not found'));
    return res.json({ success: true, message: 'Customer updated successfully', data: customer });
  } catch (err) {
    return next(err);
  }
});
