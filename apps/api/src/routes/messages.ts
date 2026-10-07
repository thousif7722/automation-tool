import { Router, Request, Response, NextFunction } from 'express';
import { MessageModel, AIConversationModel, LeadModel, CustomerModel } from '@insta-automation/database';
import { audit, AuditAction } from '@insta-automation/audit';
import { authMiddleware } from '../middleware/auth';
import { tenantMiddleware } from '../middleware/tenant';
import { requirePermission } from '../middleware/rbac';
import { Errors } from '../middleware/errorHandler';

export const messagesRouter = Router();

messagesRouter.use(authMiddleware);
messagesRouter.use(tenantMiddleware);

messagesRouter.get('/', requirePermission('message:read'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.tenant!.workspaceId;
    const messages = await MessageModel.find({ workspaceId }).sort({ timestamp: -1 }).limit(100).lean();
    return res.json({ success: true, data: messages, count: messages.length });
  } catch (err) {
    return next(err);
  }
});

messagesRouter.get('/conversations', requirePermission('message:read'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.tenant!.workspaceId;
    const conversations = await AIConversationModel.find({ workspaceId }).sort({ lastMessageTimestamp: -1 }).lean();
    return res.json({ success: true, data: conversations, count: conversations.length });
  } catch (err) {
    return next(err);
  }
});

messagesRouter.get('/conversations/:id', requirePermission('message:read'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.tenant!.workspaceId;
    const conversation = await AIConversationModel.findOne({ conversationId: req.params.id, workspaceId }).lean();
    if (!conversation) return next(Errors.NotFound('Conversation not found'));
    return res.json({ success: true, data: conversation });
  } catch (err) {
    return next(err);
  }
});

messagesRouter.post('/conversations/:id/reply', requirePermission('message:write'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.tenant!.workspaceId;
    const { content, sender = 'HUMAN_AGENT' } = req.body;

    if (!content || typeof content !== 'string') {
      return next(Errors.BadRequest('Reply content is required'));
    }

    const conversation = await AIConversationModel.findOne({ conversationId: req.params.id, workspaceId });
    if (!conversation) return next(Errors.NotFound('Conversation not found'));

    const newMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      sender: sender as 'HUMAN_AGENT' | 'AI' | 'CUSTOMER',
      content,
      timestamp: new Date(),
    };

    conversation.messages.push(newMessage as any);
    conversation.lastMessage = content;
    conversation.lastMessageTimestamp = newMessage.timestamp;
    if (sender === 'HUMAN_AGENT') {
      conversation.aiStatus = 'HUMAN_TAKEOVER';
    }
    await conversation.save();

    await MessageModel.create({
      workspaceId,
      instagramUsername: conversation.customer.username,
      channel: 'INSTAGRAM_DM',
      direction: 'OUTBOUND',
      content,
      status: 'Sent',
      timestamp: newMessage.timestamp,
    });

    await audit({
      userId: req.user!.id,
      workspaceId,
      action: AuditAction.MESSAGE_SEND,
      resource: `AIConversation:${conversation.conversationId}`,
      ipAddress: req.ip,
      userAgent: req.header('user-agent'),
      result: 'SUCCESS',
    });

    return res.json({ success: true, message: newMessage });
  } catch (err) {
    return next(err);
  }
});

messagesRouter.post('/conversations/:id/takeover', requirePermission('message:write'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.tenant!.workspaceId;
    const conversation = await AIConversationModel.findOneAndUpdate(
      { conversationId: req.params.id, workspaceId },
      { $set: { aiStatus: 'HUMAN_TAKEOVER' } },
      { new: true }
    );

    if (!conversation) return next(Errors.NotFound('Conversation not found'));

    return res.json({ success: true, message: 'Human takeover activated', aiStatus: conversation.aiStatus });
  } catch (err) {
    return next(err);
  }
});

messagesRouter.post('/conversations/:id/return-to-ai', requirePermission('message:write'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.tenant!.workspaceId;
    const conversation = await AIConversationModel.findOneAndUpdate(
      { conversationId: req.params.id, workspaceId },
      { $set: { aiStatus: 'AI_HANDLING' } },
      { new: true }
    );

    if (!conversation) return next(Errors.NotFound('Conversation not found'));

    return res.json({ success: true, message: 'AI handling restored', aiStatus: conversation.aiStatus });
  } catch (err) {
    return next(err);
  }
});

messagesRouter.post('/conversations/:id/tag', requirePermission('message:write'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.tenant!.workspaceId;
    const { tag } = req.body;

    if (!tag) return next(Errors.BadRequest('Tag is required'));

    const conversation = await AIConversationModel.findOne({ conversationId: req.params.id, workspaceId });
    if (!conversation) return next(Errors.NotFound('Conversation not found'));

    if (!conversation.customer.tags.includes(tag)) {
      conversation.customer.tags.push(tag);
      await conversation.save();
    }

    return res.json({ success: true, tags: conversation.customer.tags });
  } catch (err) {
    return next(err);
  }
});

messagesRouter.post('/conversations/:id/create-lead', requirePermission('lead:create'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.tenant!.workspaceId;
    const conversation = await AIConversationModel.findOne({ conversationId: req.params.id, workspaceId });
    if (!conversation) return next(Errors.NotFound('Conversation not found'));

    const lead = await LeadModel.create({
      workspaceId,
      instagramUsername: conversation.customer.username,
      source: 'UNIFIED_INBOX',
      status: 'NEW',
      score: conversation.customer.leadScore || 50,
      capturedAt: new Date(),
    });

    return res.status(201).json({ success: true, message: 'Lead created from conversation', lead });
  } catch (err) {
    return next(err);
  }
});
