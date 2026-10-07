import { hashPassword, verifyPassword, signAccessToken, verifyAccessToken } from '@insta-automation/auth';

describe('Auth Package Unit Tests', () => {
  const testSecret = 'a_very_secure_test_jwt_secret_that_is_at_least_32_chars_long!';

  describe('Password Hashing (bcrypt)', () => {
    it('should hash a password and verify it correctly', async () => {
      const plain = 'SecureP@ssw0rd2026';
      const hash = await hashPassword(plain);

      expect(hash).not.toEqual(plain);
      expect(hash.startsWith('$2a$') || hash.startsWith('$2b$')).toBe(true);

      const isValid = await verifyPassword(plain, hash);
      expect(isValid).toBe(true);

      const isInvalid = await verifyPassword('WrongPassword123', hash);
      expect(isInvalid).toBe(false);
    });
  });

  describe('JWT Token Signing & Verification', () => {
    it('should sign and verify a valid JWT access token', () => {
      const payload = {
        sub: 'user_12345',
        email: 'test@example.com',
        name: 'Test User',
        globalRole: 'user' as const,
      };

      const { accessToken, expiresIn } = signAccessToken(payload, testSecret, '1h');

      expect(typeof accessToken).toBe('string');
      expect(expiresIn).toBe(604800);

      const decoded = verifyAccessToken(accessToken, testSecret);
      expect(decoded.sub).toBe(payload.sub);
      expect(decoded.email).toBe(payload.email);
      expect(decoded.globalRole).toBe('user');
    });

    it('should throw an error when verifying with an incorrect secret', () => {
      const payload = {
        sub: 'user_12345',
        email: 'test@example.com',
        name: 'Test User',
        globalRole: 'user' as const,
      };

      const { accessToken } = signAccessToken(payload, testSecret, '1h');

      expect(() => {
        verifyAccessToken(accessToken, 'wrong_secret_key_that_does_not_match_123456');
      }).toThrow();
    });
  });
});
