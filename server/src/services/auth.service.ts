import { verifyGoogleToken } from '@/config/oauth';
import { userRepository } from '@/repositories/user.repository';
import { UnauthorizedError } from '@/errors/UnauthorizedError';
import { ValidationError } from '@/errors/ValidationError';
import { hashPassword, verifyPassword, signSessionToken } from '@/utils/crypto';

export interface AuthResult {
  message: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatar: string;
    provider: 'google' | 'email';
  };
  token?: string;
}

const publicUser = (
  user: { id: string; name: string; email: string; avatar: string },
  provider: 'google' | 'email',
  token?: string
): AuthResult => {
  return {
    message: 'Authentication successful',
    user: { id: user.id, name: user.name, email: user.email, avatar: user.avatar, provider },
    token,
  };
};

export const authService = {
  async googleAuth(token: string) {
    if (!token) {
      throw new UnauthorizedError('Google ID token is required');
    }

    let googleUser;
    try {
      googleUser = await verifyGoogleToken(token);
    } catch (error) {
      throw new UnauthorizedError('Authentication failed: invalid token');
    }

    const user = await userRepository.upsertByGoogleId({
      googleId: googleUser.sub,
      name: googleUser.name || '',
      email: googleUser.email || '',
      avatar: googleUser.picture || '',
    });

    return publicUser(user, 'google');
  },

  async register(data: { name: string; email: string; password: string }) {
    const email = data.email.trim().toLowerCase();

    const existing = await userRepository.findByEmail(email);
    if (existing) {
      throw new ValidationError('An account with this email already exists. Try signing in.');
    }

    const user = await userRepository.create({
      email,
      name: data.name.trim(),
      passwordHash: hashPassword(data.password),
    });

    const token = signSessionToken({ sub: user.id, email: user.email });
    return publicUser(user, 'email', token);
  },

  async login(data: { email: string; password: string }) {
    const email = data.email.trim().toLowerCase();

    const user = await userRepository.findByEmail(email);
    if (!user || !user.passwordHash || !verifyPassword(data.password, user.passwordHash)) {
      throw new UnauthorizedError('Invalid email or password.');
    }

    const token = signSessionToken({ sub: user.id, email: user.email });
    return publicUser(user, 'email', token);
  },

  async findByCredentialsFromToken(sub: string) {
    const user = await userRepository.findById(sub);
    if (!user) {
      throw new UnauthorizedError('Invalid or expired token');
    }
    return user;
  },

  async updateProfile(userId: string, data: { name?: string; avatar?: string }) {
    const user = await userRepository.update(userId, {
      ...(typeof data.name === 'string' ? { name: data.name.trim() } : {}),
      ...(typeof data.avatar === 'string' ? { avatar: data.avatar } : {}),
    });
    return publicUser(user, user.googleId ? 'google' : 'email');
  },
};