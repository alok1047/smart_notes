import { Router } from 'express';
import { authenticate } from '@/middleware/auth';
import { validate } from '@/middleware/validate';
import { aiLimiter } from '@/middleware/rateLimiter';
import { chatSchema, generateImageSchema, suggestSchema } from '@/validators/ai.schema';
import { chat, generateImage, suggest, embeddings } from '@/controllers/ai.controller';

const router = Router();

router.use(authenticate);

router.post('/chat', aiLimiter, validate(chatSchema), chat);
router.post('/generate-image', aiLimiter, validate(generateImageSchema), generateImage);
router.post('/suggest', aiLimiter, validate(suggestSchema), suggest);
router.post('/embeddings', aiLimiter, embeddings);

export default router;