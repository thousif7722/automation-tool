import crypto from 'crypto';

export function generateMetaSignature(payload: string, secret: string): string {
  const hmac = crypto.createHmac('sha256', secret);
  const hash = hmac.update(payload).digest('hex');
  return `sha256=${hash}`;
}

export function verifyMetaSignature(payload: string, signature: string, secret: string): boolean {
  if (!signature || !secret || !payload) return false;
  const parts = signature.split('=');
  const expectedHash = parts.length === 2 ? parts[1] : signature;
  const hmac = crypto.createHmac('sha256', secret);
  const actualHash = hmac.update(payload).digest('hex');
  try {
    if (actualHash.length !== expectedHash.length) return false;
    return crypto.timingSafeEqual(Buffer.from(actualHash, 'hex'), Buffer.from(expectedHash, 'hex'));
  } catch {
    return false;
  }
}

export type MatchType = 'exact' | 'contains' | 'regex' | 'fuzzy';

export function matchCommentKeyword(commentText: string, targetKeyword: string, matchType: MatchType = 'contains'): boolean {
  if (!commentText || !targetKeyword) return false;
  const c = commentText.trim().toLowerCase();
  const k = targetKeyword.trim().toLowerCase();
  switch (matchType) {
    case 'exact': return c === k;
    case 'contains': return c.includes(k);
    case 'regex': {
      try { return new RegExp(targetKeyword, 'i').test(commentText); } catch { return false; }
    }
    case 'fuzzy': {
      return k.split(',').map((kw) => kw.trim()).filter(Boolean).some((kw) => c.includes(kw));
    }
    default: return c.includes(k);
  }
}

export interface EncryptedPayload {
  encrypted: string;
  iv: string;
  tag: string;
}

export function encrypt(plaintext: string, key: string): EncryptedPayload {
  const keyBuffer = Buffer.from(key, 'utf8').slice(0, 32);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', keyBuffer, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    encrypted: encrypted.toString('hex'),
    iv: iv.toString('hex'),
    tag: tag.toString('hex'),
  };
}

export function decrypt(payload: EncryptedPayload, key: string): string {
  const keyBuffer = Buffer.from(key, 'utf8').slice(0, 32);
  const iv = Buffer.from(payload.iv, 'hex');
  const tag = Buffer.from(payload.tag, 'hex');
  const encryptedBuffer = Buffer.from(payload.encrypted, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-gcm', keyBuffer, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encryptedBuffer), decipher.final()]).toString('utf8');
}

export function generateId(prefix = '', bytesLen = 12): string {
  const id = crypto.randomBytes(bytesLen).toString('base64url');
  return prefix ? `${prefix}_${id}` : id;
}

export function maskSecret(value: string): string {
  if (!value || value.length < 10) return '***';
  return `${value.slice(0, 4)}...${value.slice(-4)}`;
}

export interface OAuthStatePayload {
  workspaceId: string;
  userId: string;
  timestamp: number;
  nonce: string;
}

export function generateOAuthState(workspaceId: string, userId: string, secret: string): string {
  const payload: OAuthStatePayload = {
    workspaceId,
    userId,
    timestamp: Date.now(),
    nonce: generateId(),
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', secret).update(encodedPayload).digest('hex');
  return `${encodedPayload}.${signature}`;
}

const consumedNonces = new Set<string>();
const MAX_CONSUMED_NONCES = 10000;

export function clearConsumedOAuthNonces(): void {
  consumedNonces.clear();
}

export function isOAuthNonceConsumed(nonce: string): boolean {
  return consumedNonces.has(nonce);
}

export function markOAuthNonceConsumed(nonce: string): boolean {
  if (consumedNonces.has(nonce)) return false;
  if (consumedNonces.size >= MAX_CONSUMED_NONCES) {
    const first = consumedNonces.values().next().value;
    if (first) consumedNonces.delete(first);
  }
  consumedNonces.add(nonce);
  return true;
}

export function verifyOAuthState(state: string, secret: string, maxAgeMs = 600000): { workspaceId: string; userId: string; nonce: string } | null {
  if (!state || !secret) return null;
  const parts = state.split('.');
  if (parts.length !== 2) return null;

  const [encodedPayload, signature] = parts;
  const expectedSig = crypto.createHmac('sha256', secret).update(encodedPayload).digest('hex');

  try {
    if (signature.length !== expectedSig.length) return null;
    if (!crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expectedSig, 'hex'))) return null;

    const payload: OAuthStatePayload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));
    if (!payload || !payload.workspaceId || !payload.userId || !payload.timestamp || !payload.nonce) return null;

    if (Date.now() - payload.timestamp > maxAgeMs) {
      return null; // Expired state
    }

    return { workspaceId: payload.workspaceId, userId: payload.userId, nonce: payload.nonce };
  } catch {
    return null;
  }
}

export function verifyAndConsumeOAuthState(state: string, secret: string, maxAgeMs = 600000): { workspaceId: string; userId: string } | null {
  const verified = verifyOAuthState(state, secret, maxAgeMs);
  if (!verified) return null;

  if (isOAuthNonceConsumed(verified.nonce)) {
    return null; // State replay attempt detected & rejected!
  }

  markOAuthNonceConsumed(verified.nonce);
  return { workspaceId: verified.workspaceId, userId: verified.userId };
}

