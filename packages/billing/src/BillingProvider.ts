import { SubscriptionPlanSlug } from '@insta-automation/types';

export interface CheckoutSessionRequest {
  workspaceId: string;
  planSlug: SubscriptionPlanSlug;
  billingCycle: 'monthly' | 'annual';
  customerEmail?: string;
  successUrl?: string;
  cancelUrl?: string;
}

export interface CheckoutSessionResponse {
  sessionId: string;
  orderId: string;
  amount: number;
  currency: string;
  checkoutUrl?: string;
}

export interface WebhookEventVerificationResult {
  isValid: boolean;
  eventType?: string;
  workspaceId?: string;
  subscriptionId?: string;
  planSlug?: SubscriptionPlanSlug;
  payload?: any;
  error?: string;
}

export interface IBillingProvider {
  readonly providerName: string;
  createCheckoutSession(request: CheckoutSessionRequest): Promise<CheckoutSessionResponse>;
  verifyWebhookSignature(
    rawBody: string | Buffer,
    signature: string,
    secret: string
  ): Promise<WebhookEventVerificationResult>;
}
