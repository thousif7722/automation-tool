import { Router, Request, Response, NextFunction } from 'express';
import { SYSTEM_PLANS, getPlanBySlug } from '@insta-automation/config';
import { SubscriptionModel, UsageModel } from '@insta-automation/database';
import { SubscribeSchema } from '@insta-automation/validation';
import { audit, AuditAction } from '@insta-automation/audit';
import { RazorpayProvider } from '@insta-automation/billing';
import { validate } from '../middleware/validation';
import { authMiddleware } from '../middleware/auth';
import { tenantMiddleware } from '../middleware/tenant';
import { requirePermission } from '../middleware/rbac';

export const billingRouter = Router();
const razorpay = new RazorpayProvider();

// Public webhook endpoint for Razorpay payment verification
billingRouter.post('/webhook/razorpay', async (req: Request, res: Response) => {
  const signature = req.headers['x-razorpay-signature'] as string;
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET || 'mock_webhook_secret_key';

  const verification = await razorpay.verifyWebhookSignature(req.body, signature, secret);

  if (!verification.isValid) {
    return res.status(400).json({ success: false, error: verification.error });
  }

  const { workspaceId, planSlug } = verification;

  if (workspaceId && planSlug) {
    await SubscriptionModel.findOneAndUpdate(
      { workspaceId },
      {
        $set: {
          planSlug,
          status: 'ACTIVE',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 86_400_000),
        },
      },
      { upsert: true }
    );
  }

  return res.json({ success: true, processed: true });
});

billingRouter.get('/plans', (_req: Request, res: Response) => {
  return res.json({ success: true, plans: SYSTEM_PLANS });
});

billingRouter.use(authMiddleware);
billingRouter.use(tenantMiddleware);

billingRouter.get('/subscription', requirePermission('billing:read'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.tenant!.workspaceId;

    let subscription = await SubscriptionModel.findOne({ workspaceId }).lean();
    if (!subscription) {
      subscription = await SubscriptionModel.create({ workspaceId, planSlug: 'free', status: 'ACTIVE', billingCycle: 'monthly' });
    }

    const plan = getPlanBySlug(subscription.planSlug);
    let usage = await UsageModel.findOne({ workspaceId }).lean();
    if (!usage) {
      usage = await UsageModel.create({ workspaceId, periodStart: new Date(), periodEnd: new Date(Date.now() + 30 * 86_400_000) });
    }

    return res.json({
      success: true,
      workspaceId,
      subscription: {
        id: subscription._id.toString(),
        planSlug: subscription.planSlug,
        status: subscription.status,
        billingCycle: subscription.billingCycle,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      },
      plan,
      usage: {
        dmCount: usage.dmCount || 0,
        leadCount: usage.leadCount || 0,
        workflowCount: usage.workflowCount || 0,
        connectedAccountCount: usage.connectedAccountCount || 0,
      },
    });
  } catch (err) {
    return next(err);
  }
});

billingRouter.post('/checkout-session', requirePermission('billing:update'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.tenant!.workspaceId;
    const { planSlug, billingCycle } = req.body;

    const session = await razorpay.createCheckoutSession({
      workspaceId,
      planSlug,
      billingCycle: billingCycle || 'monthly',
      customerEmail: req.user!.email,
    });

    return res.json({ success: true, session });
  } catch (err) {
    return next(err);
  }
});

billingRouter.post('/subscribe', requirePermission('billing:update'), validate(SubscribeSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.tenant!.workspaceId;
    const { planSlug, billingCycle } = req.body;
    const plan = getPlanBySlug(planSlug);

    const subscription = await SubscriptionModel.findOneAndUpdate(
      { workspaceId },
      {
        $set: {
          planSlug,
          billingCycle: billingCycle || 'monthly',
          status: 'ACTIVE',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + (billingCycle === 'annual' ? 365 : 30) * 86_400_000),
        },
      },
      { upsert: true, new: true }
    ).lean();

    await audit({
      userId: req.user!.id,
      workspaceId,
      action: AuditAction.BILLING_SUBSCRIBE,
      ipAddress: req.ip,
      userAgent: req.header('user-agent'),
      result: 'SUCCESS',
      metadata: { planSlug, billingCycle },
    });

    return res.json({
      success: true,
      message: `Workspace subscription updated to ${plan.name} (${billingCycle})`,
      subscription: { id: subscription._id.toString(), planSlug: subscription.planSlug, status: subscription.status },
      plan,
    });
  } catch (err) {
    return next(err);
  }
});
