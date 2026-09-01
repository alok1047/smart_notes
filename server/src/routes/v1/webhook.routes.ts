import { Router } from 'express';
import { authenticate } from '@/middleware/auth';
import { validate } from '@/middleware/validate';
import { createWebhook, listWebhooks, deleteWebhook } from '@/controllers/webhook.controller';
import { z } from 'zod';

const createWebhookSchema = z.object({
  url: z.string().url(),
  events: z.array(z.enum(['LECTURE_CREATED', 'LECTURE_PROCESSED', 'NOTES_UPDATED'])).min(1),
});

const webhookIdParamsSchema = z.object({
  id: z.string().min(1),
});

const router = Router();

router.use(authenticate);

router.post('/', validate(createWebhookSchema), createWebhook);
router.get('/', listWebhooks);
router.delete('/:id', validate(webhookIdParamsSchema, 'params'), deleteWebhook);

export default router;