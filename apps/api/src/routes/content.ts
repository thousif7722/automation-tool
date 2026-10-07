import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../middleware/auth';
import { tenantMiddleware } from '../middleware/tenant';
import { requirePermission } from '../middleware/rbac';
import { Errors } from '../middleware/errorHandler';

export const contentRouter = Router();

contentRouter.use(authMiddleware);
contentRouter.use(tenantMiddleware);

contentRouter.get('/drafts', requirePermission('content:read'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const drafts = [
      { id: 'draft-1', title: 'Product Launch Reel', status: 'DRAFT', createdAt: new Date() },
      { id: 'draft-2', title: 'Customer Review Carousel', status: 'SCHEDULED', scheduledAt: new Date(Date.now() + 86400000) },
    ];
    return res.json({ success: true, data: drafts, count: drafts.length });
  } catch (err) {
    return next(err);
  }
});

contentRouter.post('/generate-caption', requirePermission('content:create'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { topic } = req.body;
    if (!topic) return next(Errors.BadRequest('Topic is required'));

    const caption = `🚀 Discover the future of automation with ${topic}! Drop a comment below with "INFO" to get instant details in your DMs. #InstagramAutomation #AIAgents`;
    return res.json({ success: true, caption, hashtags: ['#InstagramAutomation', '#AIAgents', '#LeadGeneration'] });
  } catch (err) {
    return next(err);
  }
});

contentRouter.post('/schedule', requirePermission('content:create'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { caption, scheduledAt } = req.body;
    if (!caption || !scheduledAt) return next(Errors.BadRequest('Caption and scheduledAt are required'));

    return res.status(201).json({ success: true, message: 'Content scheduled successfully', status: 'SCHEDULED', scheduledAt });
  } catch (err) {
    return next(err);
  }
});
