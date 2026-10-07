import { Router, Request, Response, NextFunction } from 'express';
import { SimulateCommentSchema } from '@insta-automation/validation';
import { validate } from '../middleware/validation';
import { authMiddleware } from '../middleware/auth';
import { tenantMiddleware } from '../middleware/tenant';
import { requirePermission } from '../middleware/rbac';
import { CommentAutomationEngine } from '../services/commentEngine';

export function createAutomationRouter(engine: CommentAutomationEngine): Router {
  const router = Router();

  router.use(authMiddleware);
  router.use(tenantMiddleware);

  router.post(
    '/simulate',
    requirePermission('workflow:read'),
    validate(SimulateCommentSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const workspaceId = req.tenant!.workspaceId;
        const { commentText, fromUsername, fromUserId, mediaId } = req.body;

        const result = await engine.processCommentEvent({
          eventId: `sim_${Date.now()}`,
          workspaceId,
          commentId: `sim_cmt_${Date.now()}`,
          mediaId: mediaId || 'sim_media_101',
          commentText,
          fromUsername,
          fromUserId: fromUserId || `user_${Date.now()}`,
          timestamp: Date.now(),
        });

        return res.json({ success: true, workspaceId, result });
      } catch (err) {
        return next(err);
      }
    }
  );

  return router;
}
