import { InstagramWebhookService, InstagramEventNormalizer } from '@insta-automation/instagram';
import { EventDeduplicator } from '@insta-automation/events';
import { generateMetaSignature } from '@insta-automation/utils';
import { resetEnv } from '@insta-automation/config';

describe('Instagram Webhook & Event Normalization Tests', () => {
  let webhookService: InstagramWebhookService;
  let normalizer: InstagramEventNormalizer;
  let deduplicator: EventDeduplicator;

  beforeAll(() => {
    process.env.MONGODB_URI = 'mongodb://localhost:27017/test_db';
    process.env.JWT_SECRET = 'super_secret_jwt_key_32_characters_long!';
    process.env.META_VERIFY_TOKEN = 'default_verify_token';
    process.env.META_APP_SECRET = 'my_meta_app_secret_32_chars_long!';
    resetEnv();
  });

  beforeEach(() => {
    webhookService = new InstagramWebhookService();
    normalizer = new InstagramEventNormalizer();
    deduplicator = new EventDeduplicator();
    deduplicator.clearMemory();
  });

  describe('Webhook GET Verification', () => {
    it('should successfully verify Meta webhook challenge with matching verify token', () => {
      const challenge = webhookService.verifyChallenge('subscribe', 'default_verify_token', 'challenge_code_123');
      expect(challenge).toBe('challenge_code_123');
    });

    it('should reject challenge when verify token does not match', () => {
      const challenge = webhookService.verifyChallenge('subscribe', 'wrong_token', 'challenge_code_123');
      expect(challenge).toBeNull();
    });
  });

  describe('Webhook HMAC Signature Verification', () => {
    it('should accept valid Meta HMAC-SHA256 signature', () => {
      const secret = 'my_meta_app_secret_32_chars_long!';
      const payload = JSON.stringify({ object: 'instagram', entry: [] });
      const signature = generateMetaSignature(payload, secret);

      const isValid = webhookService.verifySignature(payload, signature, secret);
      expect(isValid).toBe(true);
    });

    it('should reject tampered payload or invalid signature', () => {
      const secret = 'my_meta_app_secret_32_chars_long!';
      const payload = JSON.stringify({ object: 'instagram', entry: [] });
      const invalidSignature = 'sha256=invalid_signature_hash_value';

      const isValid = webhookService.verifySignature(payload, invalidSignature, secret);
      expect(isValid).toBe(false);
    });
  });

  describe('Event Normalization', () => {
    it('should normalize Instagram comment change into COMMENT_CREATED event', () => {
      const change = {
        field: 'comments',
        value: {
          comment_id: 'cmt_999',
          text: 'What is the price?',
          from: { id: 'usr_777', username: 'john_doe' },
          media: { id: 'med_555' },
        },
      };

      const event = normalizer.normalizeChange('ws_123', 'ig_acc_456', change);

      expect(event).not.toBeNull();
      expect(event?.eventType).toBe('COMMENT_CREATED');
      expect(event?.eventId).toBe('cmt_cmt_999');
      expect(event?.workspaceId).toBe('ws_123');
      expect(event?.accountId).toBe('ig_acc_456');
      expect(event?.payload.text).toBe('What is the price?');
      expect(event?.payload.fromUsername).toBe('john_doe');
    });

    it('should normalize direct message into MESSAGE_RECEIVED event', () => {
      const change = {
        field: 'messages',
        value: {
          mid: 'msg_888',
          sender: { id: 'usr_777' },
          recipient: { id: 'ig_acc_456' },
          message: { text: 'Hello! I need support' },
        },
      };

      const event = normalizer.normalizeChange('ws_123', 'ig_acc_456', change);

      expect(event).not.toBeNull();
      expect(event?.eventType).toBe('MESSAGE_RECEIVED');
      expect(event?.eventId).toBe('msg_msg_888');
      expect(event?.payload.text).toBe('Hello! I need support');
    });

    it('should return null for malformed or unknown event changes', () => {
      const event = normalizer.normalizeChange('ws_123', 'ig_acc_456', { field: 'unknown_field', value: {} });
      expect(event).toBeNull();
    });
  });

  describe('Duplicate Webhook Delivery & Idempotency', () => {
    it('should detect duplicate webhook events and prevent redundant execution', async () => {
      const workspaceId = 'ws_test_dedup';
      const eventId = 'evt_unique_1001';

      const isDupInitial = await deduplicator.isDuplicate(workspaceId, eventId);
      expect(isDupInitial).toBe(false);

      await deduplicator.markProcessed(workspaceId, eventId, 'ig_123', 'COMMENT_CREATED');

      const isDupSecond = await deduplicator.isDuplicate(workspaceId, eventId);
      expect(isDupSecond).toBe(true);
    });
  });
});
