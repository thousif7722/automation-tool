import { verifyMetaSignature } from '@insta-automation/utils';
import { getEnv } from '@insta-automation/config';
import { InstagramAccountModel } from '@insta-automation/database';
import { eventDeduplicator } from '@insta-automation/events';
import type { NormalizedEvent } from '@insta-automation/types';

import { InstagramEventNormalizer } from './normalizer';
import { InstagramAccountService } from './account';

export class InstagramWebhookService {
  private normalizer: InstagramEventNormalizer;
  private accountService: InstagramAccountService;

  constructor(normalizer?: InstagramEventNormalizer, accountService?: InstagramAccountService) {
    this.normalizer = normalizer || new InstagramEventNormalizer();
    this.accountService = accountService || new InstagramAccountService();
  }

  public verifyChallenge(mode?: string, token?: string, challenge?: string): string | null {
    const env = getEnv();
    const expectedToken = env.META_VERIFY_TOKEN || 'default_verify_token';

    if (mode === 'subscribe' && token === expectedToken && challenge) {
      return challenge;
    }
    return null;
  }

  public verifySignature(rawBody: string, signature?: string, secret?: string): boolean {
    const env = getEnv();
    const appSecret = secret || env.META_APP_SECRET;

    if (!appSecret) {
      // In development mode without secret, accept
      return env.NODE_ENV !== 'production';
    }

    if (!signature) return false;
    return verifyMetaSignature(rawBody, signature, appSecret);
  }

  public async processWebhookPayload(payload: any): Promise<NormalizedEvent[]> {
    if (!payload || payload.object !== 'instagram' || !Array.isArray(payload.entry)) {
      return [];
    }

    const normalizedEvents: NormalizedEvent[] = [];

    for (const entry of payload.entry) {
      const instagramUserId = entry.id;
      if (!instagramUserId) continue;

      const account = await InstagramAccountModel.findOne({
        instagramUserId,
        status: { $in: ['CONNECTED', 'ERROR', 'EXPIRED'] },
      }).lean();

      if (!account) {
        continue;
      }

      const workspaceId = account.workspaceId.toString();

      await this.accountService.recordWebhookEvent(workspaceId, instagramUserId);

      if (Array.isArray(entry.changes)) {
        for (const change of entry.changes) {
          const normalized = this.normalizer.normalizeChange(workspaceId, instagramUserId, change);
          if (!normalized) continue;

          // Event Deduplication Check
          const isDup = await eventDeduplicator.isDuplicate(workspaceId, normalized.eventId);
          if (isDup) {
            continue;
          }

          // Mark event as processed
          await eventDeduplicator.markProcessed(
            workspaceId,
            normalized.eventId,
            instagramUserId,
            normalized.eventType
          );

          normalizedEvents.push(normalized);
        }
      }
    }

    return normalizedEvents;
  }
}
