import { Router } from 'express';
import { authenticate } from '@/middleware/auth';
import { validate } from '@/middleware/validate';
import { generalLimiter } from '@/middleware/rateLimiter';
import { notionImportSchema } from '@/validators/notion.schema';
import { importPage } from '@/controllers/notion.controller';

const router = Router();

router.use(authenticate);
router.use(generalLimiter);

router.post('/import', validate(notionImportSchema), importPage);

export default router;
