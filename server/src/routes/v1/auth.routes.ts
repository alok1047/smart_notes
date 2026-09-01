import { Router } from 'express';
import { googleAuth, register, login, updateProfile } from '@/controllers/auth.controller';
import { validate } from '@/middleware/validate';
import { googleAuthSchema, registerSchema, loginSchema, updateProfileSchema } from '@/validators/auth.schema';
import { authLimiter } from '@/middleware/rateLimiter';
import { authenticate } from '@/middleware/auth';

const router = Router();

router.post('/google', authLimiter, validate(googleAuthSchema), googleAuth);
router.post('/register', authLimiter, validate(registerSchema), register);
router.post('/login', authLimiter, validate(loginSchema), login);
router.put('/me', authenticate, validate(updateProfileSchema), updateProfile);

export default router;