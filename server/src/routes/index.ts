import { Router } from 'express';
import authRoutes from './v1/auth.routes';
import subjectRoutes from './v1/subject.routes';
import lectureRoutes from './v1/lecture.routes';
import searchRoutes from './v1/search.routes';
import aiRoutes from './v1/ai.routes';
import youtubeRoutes from './v1/youtube.routes';
import notionRoutes from './v1/notion.routes';
import webhookRoutes from './v1/webhook.routes';
import tryFreeRoutes from './v1/tryFree.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/subjects', subjectRoutes);
router.use('/lectures', lectureRoutes);
router.use('/search', searchRoutes);
router.use('/ai', aiRoutes);
router.use('/youtube', youtubeRoutes);
router.use('/notion', notionRoutes);
router.use('/webhooks', webhookRoutes);
router.use('/try', tryFreeRoutes);

export default router;