const express = require('express');
const router = express.Router();
const Subject = require('../models/Subject');
const Lecture = require('../models/Lecture');
const authenticate = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

/**
 * POST /api/subjects
 * Create a new subject and bulk-create its lectures
 * Body: { name: string, lectureCount: number }
 */
router.post('/', async (req, res) => {
  try {
    const { name, lectureCount } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Subject name is required' });
    }

    const count = parseInt(lectureCount) || 1;

    if (count < 1 || count > 100) {
      return res.status(400).json({ error: 'Lecture count must be between 1 and 100' });
    }

    // Create the subject
    const subject = await Subject.create({
      name: name.trim(),
      userId: req.user._id,
      lectureCount: count,
    });

    // Bulk create lectures
    const lectures = [];
    for (let i = 1; i <= count; i++) {
      lectures.push({
        subjectId: subject._id,
        lectureNumber: i,
        rawNotes: '',
        processedNotes: '',
      });
    }

    await Lecture.insertMany(lectures);

    res.status(201).json({
      message: 'Subject created successfully',
      subject,
    });
  } catch (error) {
    console.error('Create subject error:', error.message);
    res.status(500).json({ error: 'Failed to create subject' });
  }
});

/**
 * GET /api/subjects
 * Get all subjects for the authenticated user
 */
router.get('/', async (req, res) => {
  try {
    const subjects = await Subject.find({ userId: req.user._id })
      .sort({ createdAt: -1 });

    res.json(subjects);
  } catch (error) {
    console.error('Get subjects error:', error.message);
    res.status(500).json({ error: 'Failed to fetch subjects' });
  }
});

/**
 * DELETE /api/subjects/:id
 * Delete a subject and all its lectures
 */
router.delete('/:id', async (req, res) => {
  try {
    const subject = await Subject.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!subject) {
      return res.status(404).json({ error: 'Subject not found' });
    }

    // Delete all lectures belonging to this subject
    await Lecture.deleteMany({ subjectId: subject._id });

    // Delete the subject
    await Subject.deleteOne({ _id: subject._id });

    res.json({ message: 'Subject and its lectures deleted successfully' });
  } catch (error) {
    console.error('Delete subject error:', error.message);
    res.status(500).json({ error: 'Failed to delete subject' });
  }
});

module.exports = router;
