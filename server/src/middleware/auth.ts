import type { RequestHandler } from 'express';
import { verifyGoogleToken } from '@/config/oauth';
import { userRepository } from '@/repositories/user.repository';
import { UnauthorizedError } from '@/errors/UnauthorizedError';
import { verifySessionToken } from '@/utils/crypto';
import { createChildLogger } from '@/utils/logger';

const logger = createChildLogger('auth-middleware');

export const authenticate: RequestHandler = async (req, _res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError(
        'No token provided. Authorization header must be: Bearer <token>'
      );
    }

    const token = authHeader.split(' ')[1];

    // First try our own HMAC-signed session token (email/password users).
    const session = verifySessionToken(token);
    if (session) {
      const user = await userRepository.findById(session.sub);
      if (!user) {
        throw new UnauthorizedError('Invalid or expired token');
      }
      req.user = user;
      next();
      return;
    }

    // Fall back to Google token verification (accepts ID tokens and OAuth
    // access tokens obtained from the GIS popup flow).
    let googleUser;
    try {
      googleUser = await verifyGoogleToken(token);
    } catch (error) {
      logger.warn({ err: error }, 'Google token verification failed');
      throw new UnauthorizedError('Invalid or expired token');
    }

    const user = await userRepository.upsertByGoogleId({
      googleId: googleUser.sub,
      name: googleUser.name || 'User',
      email: googleUser.email || '',
      avatar: googleUser.picture || '',
    });

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};