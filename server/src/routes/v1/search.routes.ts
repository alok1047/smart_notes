import { Router } from 'express';
import { authenticate } from '@/middleware/auth';
import { validate } from '@/middleware/validate';
import { searchLimiter } from '@/middleware/rateLimiter';
import { searchQuerySchema } from '@/validators/search.schema';
import { search } from '@/controllers/search.controller';

const router = Router();

router.use(authenticate);

router.get('/', searchLimiter, validate(searchQuerySchema, 'query'), search);

export default router;