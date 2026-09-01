import { Router } from 'express';
import { authenticate } from '@/middleware/auth';
import { validate } from '@/middleware/validate';
import { generalLimiter } from '@/middleware/rateLimiter';
import { youtubeTranscriptSchema } from '@/validators/ai.schema';
import { getTranscript } from '@/controllers/youtube.controller';

const router = Router();

router.use(authenticate);
router.use(generalLimiter);

router.post('/transcript', validate(youtubeTranscriptSchema), getTranscript);

export default router;
