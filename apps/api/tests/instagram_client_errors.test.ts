import {
  InstagramApiClient,
  parseMetaError,
  MetaAuthenticationError,
  MetaPermissionError,
  MetaRateLimitError,
  MetaInvalidRequestError,
  MetaTemporaryError,
} from '@insta-automation/instagram';

describe('Instagram API Client & Structured Error Handling Tests', () => {
  let apiClient: InstagramApiClient;
  const origFetch = global.fetch;

  beforeEach(() => {
    apiClient = new InstagramApiClient();
  });

  afterEach(() => {
    global.fetch = origFetch;
  });

  describe('Meta Error Parsing', () => {
    it('should parse code 190 into MetaAuthenticationError', () => {
      const err = parseMetaError({
        error: { message: 'Invalid OAuth 2.0 Access Token', code: 190, error_subcode: 463 },
      });

      expect(err).toBeInstanceOf(MetaAuthenticationError);
      expect(err.code).toBe(190);
      expect(err.subcode).toBe(463);
      expect(err.message).toContain('Invalid OAuth');
    });

    it('should parse code 200 into MetaPermissionError', () => {
      const err = parseMetaError({
        error: { message: 'Permission instagram_manage_comments denied', code: 200 },
      });

      expect(err).toBeInstanceOf(MetaPermissionError);
      expect(err.code).toBe(200);
    });

    it('should parse code 4 into MetaRateLimitError', () => {
      const err = parseMetaError({
        error: { message: 'Application request limit reached', code: 4 },
      });

      expect(err).toBeInstanceOf(MetaRateLimitError);
      expect(err.code).toBe(4);
    });

    it('should parse code 100 into MetaInvalidRequestError', () => {
      const err = parseMetaError({
        error: { message: 'Param recipient_id is required', code: 100 },
      });

      expect(err).toBeInstanceOf(MetaInvalidRequestError);
      expect(err.code).toBe(100);
    });

    it('should parse code 1 into MetaTemporaryError', () => {
      const err = parseMetaError({
        error: { message: 'An unknown server error occurred', code: 1 },
      });

      expect(err).toBeInstanceOf(MetaTemporaryError);
      expect(err.code).toBe(1);
    });
  });

  describe('InstagramApiClient Mocked API Execution', () => {
    it('should successfully get account info for valid token', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          id: 'ig_123456789',
          username: 'brand_account',
          name: 'Awesome Brand',
          followers_count: 5000,
        }),
      } as any);

      const info = await apiClient.getAccountInfo('valid_token', 'ig_123456789');

      expect(info.id).toBe('ig_123456789');
      expect(info.username).toBe('brand_account');
      expect(info.followers_count).toBe(5000);
    });

    it('should throw MetaAuthenticationError when Meta returns code 190', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        json: async () => ({
          error: { message: 'Token expired', code: 190 },
        }),
      } as any);

      await expect(apiClient.getAccountInfo('expired_token', 'ig_123456789')).rejects.toThrow(
        MetaAuthenticationError
      );
    });
  });
});
