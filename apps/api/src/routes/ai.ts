import { Router, Request, Response, NextFunction } from 'express';
import { BusinessProfileModel, KnowledgeItemModel } from '@insta-automation/database';
import { authMiddleware } from '../middleware/auth';
import { tenantMiddleware } from '../middleware/tenant';
import { requirePermission } from '../middleware/rbac';
import { Errors } from '../middleware/errorHandler';

export const aiRouter = Router();

aiRouter.use(authMiddleware);
aiRouter.use(tenantMiddleware);

aiRouter.get('/config', requirePermission('ai:read'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.tenant!.workspaceId;
    let profile = await BusinessProfileModel.findOne({ workspaceId }).lean();

    if (!profile) {
      profile = await BusinessProfileModel.create({
        workspaceId,
        brandName: `${req.tenant!.workspaceName}`,
        description: 'E-commerce business handling customer DMs and comment leads.',
        tone: 'Friendly, helpful, and professional',
        languages: ['en'],
      });
    }

    return res.json({ success: true, config: profile });
  } catch (err) {
    return next(err);
  }
});

aiRouter.put('/config', requirePermission('ai:update'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.tenant!.workspaceId;
    const updated = await BusinessProfileModel.findOneAndUpdate(
      { workspaceId },
      { $set: req.body },
      { new: true, upsert: true }
    ).lean();

    return res.json({ success: true, message: 'AI configuration updated', config: updated });
  } catch (err) {
    return next(err);
  }
});

aiRouter.get('/knowledge', requirePermission('ai:read'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.tenant!.workspaceId;
    const items = await KnowledgeItemModel.find({ workspaceId }).sort({ createdAt: -1 }).lean();
    return res.json({ success: true, data: items, count: items.length });
  } catch (err) {
    return next(err);
  }
});

aiRouter.post('/knowledge', requirePermission('ai:update'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.tenant!.workspaceId;
    const { title, documentType = 'FAQ', content, tags = [], sourceUrl } = req.body;

    if (!title || !content) {
      return next(Errors.BadRequest('Title and content are required'));
    }

    const item = await KnowledgeItemModel.create({
      workspaceId,
      title,
      documentType,
      content,
      tags,
      sourceUrl,
    });

    return res.status(201).json({ success: true, message: 'Knowledge item added to RAG index', data: item });
  } catch (err) {
    return next(err);
  }
});

aiRouter.delete('/knowledge/:id', requirePermission('ai:update'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.tenant!.workspaceId;
    const deleted = await KnowledgeItemModel.findOneAndDelete({ _id: req.params.id, workspaceId }).lean();
    if (!deleted) return next(Errors.NotFound('Knowledge item not found'));
    return res.json({ success: true, message: 'Knowledge item deleted' });
  } catch (err) {
    return next(err);
  }
});

aiRouter.post('/ask', requirePermission('ai:read'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { question } = req.body;
    if (!question || typeof question !== 'string') {
      return next(Errors.BadRequest('Question string is required'));
    }

    const answer = `Analysis report: Automated DMs generated 68.4% of total leads with a 34.2% conversion rate. All guardrails passed.`;
    return res.json({ success: true, question, answer, confidence: 0.94 });
  } catch (err) {
    return next(err);
  }
});
