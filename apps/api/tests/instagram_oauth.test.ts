import { InstagramOAuthService } from '@insta-automation/instagram';
import { resetEnv } from '@insta-automation/config';

describe('Instagram OAuth Service Tests', () => {
  let oauthService: InstagramOAuthService;

  beforeAll(() => {
    process.env.MONGODB_URI = 'mongodb://localhost:27017/test_db';
    process.env.JWT_SECRET = 'super_secret_jwt_key_32_characters_long!';
    process.env.META_APP_ID = '1234567890';
    process.env.META_APP_SECRET = 'my_meta_app_secret_32_chars_long!';
    resetEnv();
  });

  beforeEach(() => {
    oauthService = new InstagramOAuthService();
  });

  describe('Authorization URL Generation', () => {
    it('should generate a valid Meta OAuth URL with mandatory scopes and workspace state', () => {
      const redirectUri = 'https://app.example.com/oauth/callback';
      const state = 'ws_123456';

      const url = oauthService.getAuthorizationUrl(redirectUri, state);

      expect(url).toContain('https://www.facebook.com/v19.0/dialog/oauth');
      expect(url).toContain('redirect_uri=https%3A%2F%2Fapp.example.com%2Foauth%2Fcallback');
      expect(url).toContain('state=ws_123456');
      expect(url).toContain('instagram_basic');
      expect(url).toContain('instagram_manage_comments');
      expect(url).toContain('instagram_manage_messages');
    });
  });

  describe('OAuth Code Exchange (Mocked)', () => {
    it('should exchange code for short-lived access token', async () => {
      const globalFetch = global.fetch;
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          access_token: 'short_lived_meta_access_token_123',
          token_type: 'bearer',
          expires_in: 3600,
        }),
      } as any);

      const res = await oauthService.exchangeCodeForToken('auth_code_xyz', 'https://app.example.com/callback');

      expect(res.accessToken).toBe('short_lived_meta_access_token_123');
      expect(res.expiresIn).toBe(3600);

      global.fetch = globalFetch;
    });

    it('should exchange short-lived token for long-lived Page access token', async () => {
      const globalFetch = global.fetch;
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          access_token: 'long_lived_meta_page_token_987',
          token_type: 'bearer',
          expires_in: 5184000,
        }),
      } as any);

      const res = await oauthService.exchangeForLongLivedToken('short_lived_meta_access_token_123');

      expect(res.accessToken).toBe('long_lived_meta_page_token_987');
      expect(res.expiresIn).toBe(5184000);

      global.fetch = globalFetch;
    });
  });
});
