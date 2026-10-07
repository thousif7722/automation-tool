import { Router, Request, Response } from 'express';
import { InstagramWebhookService } from '@insta-automation/instagram';
import { CommentAutomationEngine } from '../services/commentEngine';
import { logger } from '../lib/logger';

export function createWebhookRouter(engine: CommentAutomationEngine): Router {
  const router = Router();
  const webhookService = new InstagramWebhookService();

  router.get('/instagram', (req: Request, res: Response) => {
    const mode = req.query['hub.mode'] as string | undefined;
    const token = req.query['hub.verify_token'] as string | undefined;
    const challenge = req.query['hub.challenge'] as string | undefined;

    const result = webhookService.verifyChallenge(mode, token, challenge);
    if (result) {
      logger.info('[Webhook] Meta verification challenge successful');
      return res.status(200).send(result);
    }

    logger.warn('[Webhook] Meta verification challenge failed');
    return res.status(403).json({ error: 'Verification failed' });
  });

  router.post('/instagram', async (req: Request, res: Response) => {
    const signature = req.headers['x-hub-signature-256'] as string | undefined;
    const rawPayload = (req as any).rawBody || JSON.stringify(req.body);

    const isValidSignature = webhookService.verifySignature(rawPayload, signature);
    if (!isValidSignature) {
      logger.warn('[Webhook] Rejected payload due to invalid HMAC signature');
      return res.status(401).json({ error: 'Invalid HMAC signature' });
    }

    try {
      const normalizedEvents = await webhookService.processWebhookPayload(req.body);

      for (const event of normalizedEvents) {
        if (event.eventType === 'COMMENT_CREATED') {
          await engine.processCommentEvent({
            eventId: event.eventId,
            workspaceId: event.workspaceId,
            commentId: event.payload.commentId,
            mediaId: event.payload.mediaId,
            commentText: event.payload.text,
            fromUserId: event.payload.fromUserId,
            fromUsername: event.payload.fromUsername,
            timestamp: event.timestamp.getTime(),
          });
        }
      }

      return res.status(200).send('EVENT_RECEIVED');
    } catch (err: any) {
      logger.error('[Webhook] Error processing payload', { error: err.message });
      return res.status(200).send('EVENT_RECEIVED');
    }
  });

  return router;
}
