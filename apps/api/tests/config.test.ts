import { encrypt, decrypt, matchCommentKeyword, verifyMetaSignature } from '@insta-automation/utils';

describe('Utils & Encryption Unit Tests', () => {
  const encryptionKey = '12345678901234567890123456789012';

  describe('AES-256-GCM Encryption', () => {
    it('should encrypt and decrypt sensitive token plaintext correctly', () => {
      const plaintext = 'EAAI123456789_meta_long_lived_user_access_token_secret';

      const encrypted = encrypt(plaintext, encryptionKey);

      expect(encrypted).toHaveProperty('encrypted');
      expect(encrypted).toHaveProperty('iv');
      expect(encrypted).toHaveProperty('tag');
      expect(encrypted.encrypted).not.toEqual(plaintext);

      const decrypted = decrypt(encrypted, encryptionKey);
      expect(decrypted).toEqual(plaintext);
    });

    it('should fail decryption if ciphertext or auth tag is tampered with', () => {
      const plaintext = 'secret_data';
      const encrypted = encrypt(plaintext, encryptionKey);

      const tampered = { ...encrypted, encrypted: '00' + encrypted.encrypted.slice(2) };

      expect(() => {
        decrypt(tampered, encryptionKey);
      }).toThrow();
    });
  });

  describe('Keyword Matcher', () => {
    it('should match keywords using exact strategy', () => {
      expect(matchCommentKeyword('PRICE', 'price', 'exact')).toBe(true);
      expect(matchCommentKeyword('what is the price?', 'price', 'exact')).toBe(false);
    });

    it('should match keywords using contains strategy', () => {
      expect(matchCommentKeyword('What is the price of this item?', 'price', 'contains')).toBe(true);
      expect(matchCommentKeyword('Unrelated comment', 'price', 'contains')).toBe(false);
    });
  });
});
