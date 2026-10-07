import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import type { JwtPayload, GlobalRole, AuthTokens } from '@insta-automation/types';

export async function hashPassword(plaintext: string): Promise<string> {
  return bcrypt.hash(plaintext, 12);
}

export async function verifyPassword(plaintext: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plaintext, hash);
}

export function signAccessToken(
  payload: { sub: string; email: string; name: string; globalRole: GlobalRole },
  secret: string,
  expiresIn = '7d'
): AuthTokens {
  const token = jwt.sign(payload, secret, { expiresIn } as jwt.SignOptions);
  return { accessToken: token, expiresIn: 604800 };
}

export function verifyAccessToken(token: string, secret: string): JwtPayload {
  try {
    return jwt.verify(token, secret) as JwtPayload;
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      const e = new Error('Token has expired');
      (e as any).statusCode = 401;
      throw e;
    }
    const e = new Error('Invalid token');
    (e as any).statusCode = 401;
    throw e;
  }
}

export async function verifyGoogleIdToken(idToken: string, clientId: string) {
  const { OAuth2Client } = await import('google-auth-library');
  const client = new OAuth2Client(clientId);
  const ticket = await client.verifyIdToken({ idToken, audience: clientId });
  const payload = ticket.getPayload();
  if (!payload || !payload.sub || !payload.email) {
    throw new Error('Invalid Google token payload');
  }
  return {
    googleId: payload.sub,
    email: payload.email.toLowerCase(),
    name: payload.name ?? payload.email,
    avatarUrl: payload.picture,
    emailVerified: payload.email_verified ?? false,
  };
}

export function extractBearerToken(authHeader: string | undefined): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const t = authHeader.slice(7).trim();
  return t.length > 0 ? t : null;
}
