import { Router, Request, Response, NextFunction } from 'express';
import { LeadModel, LeadEventModel } from '@insta-automation/database';
import { UpdateLeadSchema } from '@insta-automation/validation';
import { validate } from '../middleware/validation';
import { authMiddleware } from '../middleware/auth';
import { tenantMiddleware } from '../middleware/tenant';
import { requirePermission } from '../middleware/rbac';
import { Errors } from '../middleware/errorHandler';

export const leadsRouter = Router();

leadsRouter.use(authMiddleware);
leadsRouter.use(tenantMiddleware);

leadsRouter.get('/', requirePermission('lead:read'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.tenant!.workspaceId;
    const statusFilter = req.query.status as string | undefined;

    const query: any = { workspaceId };
    if (statusFilter) query.status = statusFilter;

    const leads = await LeadModel.find(query).sort({ capturedAt: -1 }).lean();

    const formatted = leads.map((l: any) => ({
      id: l._id.toString(),
      workspaceId: l.workspaceId.toString(),
      instagramUsername: l.instagramUsername,
      instagramUserId: l.instagramUserId,
      source: l.source,
      product: l.product,
      status: l.status,
      score: l.score,
      owner: l.owner,
      value: l.value,
      capturedAt: l.capturedAt,
      createdAt: l.createdAt,
      updatedAt: l.updatedAt,
    }));

    return res.json({ success: true, data: formatted, count: formatted.length });
  } catch (err) {
    return next(err);
  }
});

leadsRouter.post('/', requirePermission('lead:create'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.tenant!.workspaceId;
    const { instagramUsername, source = 'MANUAL', product, status = 'NEW', score = 50, value = 0 } = req.body;

    if (!instagramUsername) {
      return next(Errors.BadRequest('instagramUsername is required'));
    }

    const lead = await LeadModel.create({
      workspaceId,
      instagramUsername,
      source,
      product,
      status,
      score,
      value,
      capturedAt: new Date(),
    });

    return res.status(201).json({ success: true, message: 'Lead created successfully', data: lead });
  } catch (err) {
    return next(err);
  }
});

leadsRouter.get('/:id', requirePermission('lead:read'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.tenant!.workspaceId;
    const lead = await LeadModel.findOne({ _id: req.params.id, workspaceId }).lean();
    if (!lead) return next(Errors.NotFound('Lead not found'));
    return res.json({ success: true, data: lead });
  } catch (err) {
    return next(err);
  }
});

leadsRouter.put('/:id', requirePermission('lead:update'), validate(UpdateLeadSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.tenant!.workspaceId;
    const lead = await LeadModel.findOneAndUpdate(
      { _id: req.params.id, workspaceId },
      { $set: req.body },
      { new: true }
    ).lean();
    if (!lead) return next(Errors.NotFound('Lead not found'));
    return res.json({ success: true, message: 'Lead updated successfully', data: lead });
  } catch (err) {
    return next(err);
  }
});

leadsRouter.put('/:id/stage', requirePermission('lead:update'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.tenant!.workspaceId;
    const { status } = req.body;

    const validStages = ['NEW', 'CONTACTED', 'QUALIFIED', 'HOT', 'CONVERTED', 'LOST'];
    if (!status || !validStages.includes(status)) {
      return next(Errors.BadRequest(`Status must be one of: ${validStages.join(', ')}`));
    }

    const lead = await LeadModel.findOneAndUpdate(
      { _id: req.params.id, workspaceId },
      { $set: { status } },
      { new: true }
    ).lean();

    if (!lead) return next(Errors.NotFound('Lead not found'));

    return res.json({ success: true, message: `Lead status updated to ${status}`, data: lead });
  } catch (err) {
    return next(err);
  }
});

leadsRouter.delete('/:id', requirePermission('lead:delete'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.tenant!.workspaceId;
    const deleted = await LeadModel.findOneAndDelete({ _id: req.params.id, workspaceId }).lean();
    if (!deleted) return next(Errors.NotFound('Lead not found'));
    return res.json({ success: true, message: 'Lead deleted successfully' });
  } catch (err) {
    return next(err);
  }
});
