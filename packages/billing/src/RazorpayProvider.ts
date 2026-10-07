import { createHmac, timingSafeEqual } from 'crypto';
import { IBillingProvider, CheckoutSessionRequest, CheckoutSessionResponse, WebhookEventVerificationResult } from './BillingProvider';

export class RazorpayProvider implements IBillingProvider {
  public readonly providerName = 'razorpay';

  constructor(
    private keyId: string = process.env.RAZORPAY_KEY_ID || 'rzp_test_mock_key',
    private keySecret: string = process.env.RAZORPAY_KEY_SECRET || 'mock_secret_key_32_bytes_long_!'
  ) {}

  public async createCheckoutSession(request: CheckoutSessionRequest): Promise<CheckoutSessionResponse> {
    // Plan prices in INR subunit (paise) or USD cents
    const basePrices: Record<string, number> = {
      free: 0,
      starter: 2900,
      growth: 7900,
      pro: 14900,
      business: 29900,
      enterprise: 99900,
    };

    const monthlyAmount = basePrices[request.planSlug] || 0;
    const totalAmount = request.billingCycle === 'annual' ? Math.round(monthlyAmount * 12 * 0.8) : monthlyAmount;
    const orderId = `order_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    return {
      sessionId: `rzp_sess_${Date.now()}`,
      orderId,
      amount: totalAmount,
      currency: 'INR',
      checkoutUrl: `https://api.razorpay.com/v1/checkout/mock/${orderId}`,
    };
  }

  public async verifyWebhookSignature(
    rawBody: string | Buffer,
    signature: string,
    secret: string = this.keySecret
  ): Promise<WebhookEventVerificationResult> {
    if (!signature || !rawBody) {
      return { isValid: false, error: 'Missing signature or body payload' };
    }

    try {
      const bodyStr = typeof rawBody === 'string' ? rawBody : rawBody.toString('utf-8');
      const expectedSignature = createHmac('sha256', secret).update(bodyStr).digest('hex');

      const sigBuffer = Buffer.from(signature, 'hex');
      const expectedBuffer = Buffer.from(expectedSignature, 'hex');

      if (sigBuffer.length !== expectedBuffer.length || !timingSafeEqual(sigBuffer, expectedBuffer)) {
        return { isValid: false, error: 'Invalid HMAC SHA-256 webhook signature' };
      }

      const payload = JSON.parse(bodyStr);
      const eventType = payload.event || 'subscription.charged';
      const entity = payload.payload?.subscription?.entity || payload.payload?.payment?.entity || {};

      return {
        isValid: true,
        eventType,
        workspaceId: entity.notes?.workspaceId,
        subscriptionId: entity.id,
        planSlug: entity.notes?.planSlug,
        payload,
      };
    } catch (err: any) {
      return { isValid: false, error: `Webhook verification failed: ${err.message}` };
    }
  }
}
