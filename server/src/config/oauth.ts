import { OAuth2Client, type TokenInfo } from 'google-auth-library';
import { env } from './env';
import { logger } from '@/utils/logger';

let oauthClient: OAuth2Client | null = null;

export const initializeOAuth = (): OAuth2Client => {
  if (oauthClient) return oauthClient;

  if (!env.GOOGLE_CLIENT_ID) {
    logger.warn('GOOGLE_CLIENT_ID is not set. Auth endpoints will reject tokens until configured.');
  }

  oauthClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);
  logger.info('Google OAuth2 client initialized');
  return oauthClient;
};

export const getOAuthClient = (): OAuth2Client => {
  if (!oauthClient) {
    return initializeOAuth();
  }
  return oauthClient;
};

export interface GoogleUserPayload {
  sub: string;
  email?: string;
  name?: string;
  picture?: string;
}

// tokeninfo returns these profile fields at runtime even though the upstream
// TokenInfo type only declares the token-metadata fields.
type TokenInfoProfile = TokenInfo & {
  name?: string;
  picture?: string;
  email?: string;
};

export const verifyGoogleIdToken = async (idToken: string): Promise<GoogleUserPayload> => {
  const client = getOAuthClient();

  if (!env.GOOGLE_CLIENT_ID) {
    throw new Error('GOOGLE_CLIENT_ID is not configured');
  }

  const ticket = await client.verifyIdToken({
    idToken,
    audience: env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();
  if (!payload) {
    throw new Error('Invalid Google ID token');
  }

  return {
    sub: payload.sub,
    email: payload.email,
    name: payload.name,
    picture: payload.picture,
  };
};

/**
 * Verify a Google credential that may be either an *ID token* (One Tap /
 * ID flow) or an *OAuth access token* returned by the GIS token-client popup
 * (which does not always include an `id_token` in the response).
 *
 * 1. Try the ID-token path — strict audience-bound JWT verification.
 * 2. Fall back to the access-token path via Google's `tokeninfo` endpoint
 *    (google-auth-library `getTokenInfo`), which returns the same profile
 *    fields (`sub`, `email`, `name`, `picture`) for an unexpired token.
 */
export const verifyGoogleToken = async (token: string): Promise<GoogleUserPayload> => {
  const client = getOAuthClient();

  if (!env.GOOGLE_CLIENT_ID) {
    throw new Error('GOOGLE_CLIENT_ID is not configured');
  }

  // 1) ID token path — audience-bound JWT verification.
  try {
    return await verifyGoogleIdToken(token);
  } catch {
    // Not a valid ID token (or expired) — it may still be an access token.
  }

  // 2) Access token path — verify with Google's tokeninfo endpoint.
  const info = (await client.getTokenInfo(token)) as TokenInfoProfile;

  const audiences = info.aud ? (Array.isArray(info.aud) ? info.aud : [info.aud]) : [];
  if (!audiences.includes(env.GOOGLE_CLIENT_ID) && !audiences.includes(info.azp || '')) {
    throw new Error('Token audience does not match this application');
  }

  const subject = info.sub ?? info.user_id;
  if (!subject) {
    throw new Error('Token does not identify a Google user');
  }

  // tokeninfo does not include name/picture — fetch them from the userinfo
  // endpoint so we always persist the user's Google profile photo.
  let profile: GoogleUserPayload = {
    sub: subject,
    email: info.email,
    name: info.name,
    picture: info.picture,
  };

  try {
    const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const ui = (await res.json()) as GoogleUserPayload;
      profile = {
        sub: ui.sub ?? subject,
        email: ui.email ?? info.email,
        name: ui.name ?? info.name,
        picture: ui.picture ?? info.picture,
      };
    }
  } catch {
    // userinfo unavailable — fall back to whatever tokeninfo provided
  }

  return profile;
};