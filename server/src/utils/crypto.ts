import crypto from 'node:crypto';
import { env } from '@/config/env';

export const hashSecret = (value: string): string => {
  return crypto.createHash('sha256').update(value).digest('hex');
};

export const generateSecret = (bytes = 32): string => {
  return crypto.randomBytes(bytes).toString('hex');
};

export const hashApiKey = (apiKey: string): string => {
  return crypto.createHash('sha512').update(apiKey).digest('hex');
};

export const apiKeyPrefix = (apiKey: string): string => {
  return apiKey.slice(0, 8);
};

export const signWebhookPayload = (secret: string, payload: string): string => {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
};

/* ---------------- password hashing (scrypt) ---------------- */

const SCRYPT_KEYLEN = 64;

export const hashPassword = (password: string): string => {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, SCRYPT_KEYLEN);
  return `scrypt$${salt}$${derived.toString('hex')}`;
};

export const verifyPassword = (password: string, stored: string): boolean => {
  const [scheme, salt, hash] = stored.split('$');
  if (scheme !== 'scrypt' || !salt || !hash) return false;
  const derived = crypto.scryptSync(password, salt, SCRYPT_KEYLEN);
  const a = Buffer.from(hash, 'hex');
  const b = derived;
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};

/* ---------------- session tokens (HMAC-signed, JWT-like) ---------------- */

const sign = (data: string): string => {
  return crypto.createHmac('sha256', env.JWT_SECRET).update(data).digest('base64url');
};

const b64url = (obj: unknown): string => {
  return Buffer.from(JSON.stringify(obj)).toString('base64url');
};

export const signSessionToken = (payload: { sub: string; email: string }): string => {
  const header = { alg: 'HS256', typ: 'JWT' };
  const body = {
    ...payload,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30,
  };
  const data = `${b64url(header)}.${b64url(body)}`;
  return `${data}.${sign(data)}`;
};

export const verifySessionToken = (
  token: string
): { sub: string; email: string } | null => {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [headerB64, bodyB64, sig] = parts;
  const data = `${headerB64}.${bodyB64}`;
  const expected = sign(data);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  try {
    const body = JSON.parse(Buffer.from(bodyB64, 'base64url').toString('utf8'));
    if (!body.sub || !body.exp || body.exp < Math.floor(Date.now() / 1000)) return null;
    return { sub: body.sub, email: body.email };
  } catch {
    return null;
  }
};