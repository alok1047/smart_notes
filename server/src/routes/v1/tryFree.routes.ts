import { Router } from 'express';
import { validate } from '@/middleware/validate';
import { generalLimiter, aiLimiter } from '@/middleware/rateLimiter';
import { tryStatusSchema, tryProcessSchema } from '@/validators/tryFree.schema';
import { getTryStatus, processTryFree } from '@/controllers/tryFree.controller';

const router = Router();

router.use(generalLimiter);

router.post('/status', validate(tryStatusSchema), getTryStatus);
router.post('/process', aiLimiter, validate(tryProcessSchema), processTryFree);

export default router;