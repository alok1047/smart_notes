const express = require('express');
const router = express.Router();
const multer = require('multer');
const authenticate = require('../middleware/auth');
const {
  getSingleLecture,
  getLectures,
  getRecentLectures,
  addLecture,
  deleteLecture,
  updateLecture,
  processLecture,
  processLectureStream,
  importLectureFile,
} = require('../controllers/lectureController');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 15 * 1024 * 1024 } });

router.use(authenticate);

router.get('/single/:id', getSingleLecture);
router.get('/recent/all', getRecentLectures);
router.get('/:subjectId', getLectures);
router.post('/:subjectId', addLecture);
router.delete('/single/:id', deleteLecture);
router.put('/:id', updateLecture);
router.post('/:id/process', processLecture);
router.post('/:id/process-stream', processLectureStream);
router.post('/:id/import-file', upload.single('file'), importLectureFile);

module.exports = router;
