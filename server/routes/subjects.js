const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const { createSubject, getSubjects, deleteSubject } = require('../controllers/subjectController');

router.use(authenticate);

router.post('/', createSubject);
router.get('/', getSubjects);
router.delete('/:id', deleteSubject);

module.exports = router;
