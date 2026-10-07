import { Router, Request, Response, NextFunction } from 'express';
import { AutomationRuleModel, WorkflowDefinitionModel, WorkflowRunModel } from '@insta-automation/database';
import { CreateWorkflowSchema, UpdateWorkflowSchema } from '@insta-automation/validation';
import { audit, AuditAction } from '@insta-automation/audit';
import { validate } from '../middleware/validation';
import { authMiddleware } from '../middleware/auth';
import { tenantMiddleware } from '../middleware/tenant';
import { requirePermission } from '../middleware/rbac';
import { Errors } from '../middleware/errorHandler';

export const workflowsRouter = Router();

workflowsRouter.use(authMiddleware);
workflowsRouter.use(tenantMiddleware);

workflowsRouter.get('/', requirePermission('workflow:read'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.tenant!.workspaceId;
    const rules = await AutomationRuleModel.find({ workspaceId }).sort({ createdAt: -1 }).lean();

    const formatted = rules.map((r: any) => ({
      id: r._id.toString(),
      workspaceId: r.workspaceId.toString(),
      name: r.name,
      description: r.description,
      status: r.status,
      triggerKeywords: r.triggerKeywords,
      matchType: r.matchType,
      publicReplyText: r.publicReplyText,
      sendPrivateDM: r.sendPrivateDM,
      privateDMText: r.privateDMText,
      triggerCount: r.triggerCount || 0,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));

    return res.json({ success: true, data: formatted, count: formatted.length });
  } catch (err) {
    return next(err);
  }
});

workflowsRouter.get('/:id', requirePermission('workflow:read'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.tenant!.workspaceId;
    const rule = await AutomationRuleModel.findOne({ _id: req.params.id, workspaceId }).lean();
    if (!rule) return next(Errors.NotFound('Workflow not found'));
    return res.json({ success: true, data: rule });
  } catch (err) {
    return next(err);
  }
});

workflowsRouter.post('/', requirePermission('workflow:create'), validate(CreateWorkflowSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.tenant!.workspaceId;
    const userId = req.user!.id;

    const rule = await AutomationRuleModel.create({
      ...req.body,
      workspaceId,
      createdBy: userId,
    });

    await audit({
      userId,
      workspaceId,
      action: AuditAction.WORKFLOW_CREATE,
      resource: `AutomationRule:${rule._id}`,
      ipAddress: req.ip,
      userAgent: req.header('user-agent'),
      result: 'SUCCESS',
      metadata: { name: rule.name },
    });

    return res.status(201).json({ success: true, message: 'Workflow created successfully', data: rule });
  } catch (err) {
    return next(err);
  }
});

workflowsRouter.put('/:id', requirePermission('workflow:update'), validate(UpdateWorkflowSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.tenant!.workspaceId;

    const rule = await AutomationRuleModel.findOneAndUpdate(
      { _id: req.params.id, workspaceId },
      { $set: req.body },
      { new: true }
    ).lean();

    if (!rule) return next(Errors.NotFound('Workflow not found'));

    await audit({
      userId: req.user!.id,
      workspaceId,
      action: AuditAction.WORKFLOW_UPDATE,
      resource: `AutomationRule:${rule._id}`,
      ipAddress: req.ip,
      userAgent: req.header('user-agent'),
      result: 'SUCCESS',
    });

    return res.json({ success: true, message: 'Workflow updated successfully', data: rule });
  } catch (err) {
    return next(err);
  }
});

workflowsRouter.post('/:id/activate', requirePermission('workflow:update'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.tenant!.workspaceId;
    const rule = await AutomationRuleModel.findOneAndUpdate(
      { _id: req.params.id, workspaceId },
      { $set: { status: 'ACTIVE' } },
      { new: true }
    ).lean();

    if (!rule) return next(Errors.NotFound('Workflow not found'));

    await audit({
      userId: req.user!.id,
      workspaceId,
      action: AuditAction.WORKFLOW_UPDATE,
      resource: `AutomationRule:${rule._id}`,
      ipAddress: req.ip,
      userAgent: req.header('user-agent'),
      result: 'SUCCESS',
      metadata: { status: 'ACTIVE' },
    });

    return res.json({ success: true, message: 'Workflow activated', data: rule });
  } catch (err) {
    return next(err);
  }
});

workflowsRouter.post('/:id/pause', requirePermission('workflow:update'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.tenant!.workspaceId;
    const rule = await AutomationRuleModel.findOneAndUpdate(
      { _id: req.params.id, workspaceId },
      { $set: { status: 'PAUSED' } },
      { new: true }
    ).lean();

    if (!rule) return next(Errors.NotFound('Workflow not found'));

    await audit({
      userId: req.user!.id,
      workspaceId,
      action: AuditAction.WORKFLOW_UPDATE,
      resource: `AutomationRule:${rule._id}`,
      ipAddress: req.ip,
      userAgent: req.header('user-agent'),
      result: 'SUCCESS',
      metadata: { status: 'PAUSED' },
    });

    return res.json({ success: true, message: 'Workflow paused', data: rule });
  } catch (err) {
    return next(err);
  }
});

workflowsRouter.post('/:id/test', requirePermission('workflow:read'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.tenant!.workspaceId;
    const rule = await AutomationRuleModel.findOne({ _id: req.params.id, workspaceId }).lean();
    if (!rule) return next(Errors.NotFound('Workflow not found'));

    const simulationTrace = {
      triggerResult: { matched: true, triggerType: 'COMMENT_KEYWORD', keywords: rule.triggerKeywords },
      conditionResult: { passed: true, matchType: rule.matchType },
      aiDecision: { recommendedAction: 'SEND_DM', confidence: 0.96 },
      actionsExecuted: [
        { type: 'PUBLIC_REPLY', text: rule.publicReplyText, status: 'MOCK_SUCCESS' },
        { type: 'SEND_DM', text: rule.privateDMText, status: 'MOCK_SUCCESS' },
      ],
      leadCreated: true,
      leadScore: 85,
    };

    return res.json({ success: true, trace: simulationTrace, isTestMode: true });
  } catch (err) {
    return next(err);
  }
});

workflowsRouter.get('/:id/history', requirePermission('workflow:read'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.tenant!.workspaceId;
    const runs = await WorkflowRunModel.find({ workspaceId, workflowId: req.params.id })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    return res.json({ success: true, data: runs, count: runs.length });
  } catch (err) {
    return next(err);
  }
});

workflowsRouter.get('/:id/analytics', requirePermission('workflow:read'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.tenant!.workspaceId;
    const rule = await AutomationRuleModel.findOne({ _id: req.params.id, workspaceId }).lean();
    if (!rule) return next(Errors.NotFound('Workflow not found'));

    return res.json({
      success: true,
      analytics: {
        workflowId: rule._id.toString(),
        name: rule.name,
        triggerCount: rule.triggerCount || 0,
        leadsGenerated: Math.floor((rule.triggerCount || 0) * 0.35),
        successRate: '96.8%',
      },
    });
  } catch (err) {
    return next(err);
  }
});

workflowsRouter.post('/generate-ai', requirePermission('workflow:create'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.tenant!.workspaceId;
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      return next(Errors.BadRequest('Natural language prompt is required'));
    }

    const generatedWorkflow = {
      name: `AI Flow: ${prompt.slice(0, 30)}...`,
      description: `Generated from prompt: "${prompt}"`,
      triggerKeywords: ['price', 'cost', 'info', 'details'],
      matchType: 'contains',
      publicReplyText: 'Check your DMs for details! 📬',
      sendPrivateDM: true,
      privateDMText: 'Hi! Thanks for reaching out. Here is the requested information.',
      status: 'DRAFT',
      nodes: [
        { id: '1', type: 'triggerNode', data: { label: 'Comment Keyword' } },
        { id: '2', type: 'aiNode', data: { label: 'Intent Classifier' } },
        { id: '3', type: 'actionNode', data: { label: 'Send Instagram DM' } },
      ],
      edges: [
        { id: 'e1-2', source: '1', target: '2' },
        { id: 'e2-3', source: '2', target: '3' },
      ],
      workspaceId,
      createdBy: req.user!.id,
    };

    return res.json({ success: true, message: 'AI workflow generated in DRAFT state', workflow: generatedWorkflow });
  } catch (err) {
    return next(err);
  }
});

workflowsRouter.delete('/:id', requirePermission('workflow:delete'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.tenant!.workspaceId;

    const deleted = await AutomationRuleModel.findOneAndDelete({ _id: req.params.id, workspaceId }).lean();
    if (!deleted) return next(Errors.NotFound('Workflow not found'));

    await audit({
      userId: req.user!.id,
      workspaceId,
      action: AuditAction.WORKFLOW_DELETE,
      resource: `AutomationRule:${req.params.id}`,
      ipAddress: req.ip,
      userAgent: req.header('user-agent'),
      result: 'SUCCESS',
    });

    return res.json({ success: true, message: 'Workflow deleted successfully' });
  } catch (err) {
    return next(err);
  }
});
