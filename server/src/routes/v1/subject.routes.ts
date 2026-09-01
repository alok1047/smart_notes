import { Router } from 'express';
import { authenticate } from '@/middleware/auth';
import { validate } from '@/middleware/validate';
import { generalLimiter } from '@/middleware/rateLimiter';
import { createSubjectSchema, subjectIdParamsSchema, updateSubjectSchema } from '@/validators/subject.schema';
import { createSubject, getSubjects, deleteSubject, updateSubject } from '@/controllers/subject.controller';

const router = Router();

router.use(authenticate);
router.use(generalLimiter);

router.post('/', validate(createSubjectSchema), createSubject);
router.get('/', getSubjects);
router.delete('/:id', validate(subjectIdParamsSchema, 'params'), deleteSubject);
router.patch('/:id', validate(subjectIdParamsSchema, 'params'), validate(updateSubjectSchema), updateSubject);

export default router;