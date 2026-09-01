import { Router } from 'express';
import multer from 'multer';
import { authenticate } from '@/middleware/auth';
import { validate } from '@/middleware/validate';
import { generalLimiter, aiLimiter } from '@/middleware/rateLimiter';
import {
  subjectIdParamsSchema,
  lectureIdParamsSchema,
  updateLectureSchema,
  processLectureSchema,
} from '@/validators/lecture.schema';
import {
  getSingleLecture,
  getLectures,
  getRecentLectures,
  addLecture,
  deleteLecture,
  updateLecture,
  processLecture,
  processLectureStream,
  importLectureFile,
  getLectureVersions,
  deleteLectureVersion,
} from '@/controllers/lecture.controller';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (
      file.mimetype === 'application/pdf' ||
      file.mimetype.startsWith('image/') ||
      file.mimetype.startsWith('audio/')
    ) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type. Please upload a PDF, image, or audio file.'));
    }
  },
});

router.use(authenticate);
router.use(generalLimiter);

router.get('/single/:id', validate(lectureIdParamsSchema, 'params'), getSingleLecture);
router.get('/recent/all', getRecentLectures);
router.get('/:id/versions', validate(lectureIdParamsSchema, 'params'), getLectureVersions);
router.delete('/versions/:versionId', deleteLectureVersion);
router.get('/:subjectId', validate(subjectIdParamsSchema, 'params'), getLectures);
router.post('/:subjectId', validate(subjectIdParamsSchema, 'params'), addLecture);
router.delete('/single/:id', validate(lectureIdParamsSchema, 'params'), deleteLecture);
router.put('/:id', validate(lectureIdParamsSchema, 'params'), validate(updateLectureSchema), updateLecture);
router.post('/:id/process', validate(lectureIdParamsSchema, 'params'), aiLimiter, validate(processLectureSchema), processLecture);
router.post('/:id/process-stream', validate(lectureIdParamsSchema, 'params'), aiLimiter, validate(processLectureSchema), processLectureStream);
router.post('/:id/import-file', validate(lectureIdParamsSchema, 'params'), upload.single('file'), importLectureFile);

export default router;