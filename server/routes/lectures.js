const express = require('express');
const router = express.Router();
const Lecture = require('../models/Lecture');
const Subject = require('../models/Subject');
const authenticate = require('../middleware/auth');
const { processNotes } = require('../services/aiService');

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/lectures/single/:id
 * Get a single lecture by its ID (used by the editor page)
 */
router.get('/single/:id', async (req, res) => {
  try {
    const lecture = await Lecture.findById(req.params.id);
    if (!lecture) {
      return res.status(404).json({ error: 'Lecture not found' });
    }

    // Verify ownership through subject
    const subject = await Subject.findOne({
      _id: lecture.subjectId,
      userId: req.user._id,
    });

    if (!subject) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    res.json({ lecture, subject });
  } catch (error) {
    console.error('Get single lecture error:', error.message);
    res.status(500).json({ error: 'Failed to fetch lecture' });
  }
});

/**
 * GET /api/lectures/:subjectId
 * Get all lectures for a subject
 */
router.get('/:subjectId', async (req, res) => {
  try {
    // Verify the subject belongs to the user
    const subject = await Subject.findOne({
      _id: req.params.subjectId,
      userId: req.user._id,
    });

    if (!subject) {
      return res.status(404).json({ error: 'Subject not found' });
    }

    const lectures = await Lecture.find({ subjectId: req.params.subjectId })
      .sort({ lectureNumber: 1 });

    res.json({
      subject,
      lectures,
    });
  } catch (error) {
    console.error('Get lectures error:', error.message);
    res.status(500).json({ error: 'Failed to fetch lectures' });
  }
});

/**
 * PUT /api/lectures/:id
 * Update raw notes for a lecture
 * Body: { rawNotes: string }
 */
router.put('/:id', async (req, res) => {
  try {
    const { rawNotes, processedNotes } = req.body;

    const lecture = await Lecture.findById(req.params.id);
    if (!lecture) {
      return res.status(404).json({ error: 'Lecture not found' });
    }

    // Verify ownership through subject
    const subject = await Subject.findOne({
      _id: lecture.subjectId,
      userId: req.user._id,
    });

    if (!subject) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Update whichever fields are provided
    if (rawNotes !== undefined) lecture.rawNotes = rawNotes;
    if (processedNotes !== undefined) lecture.processedNotes = processedNotes;
    await lecture.save();

    res.json({
      message: 'Notes saved successfully',
      lecture,
    });
  } catch (error) {
    console.error('Update lecture error:', error.message);
    res.status(500).json({ error: 'Failed to save notes' });
  }
});

/**
 * POST /api/lectures/:id/process
 * Process raw notes through AI
 */
router.post('/:id/process', async (req, res) => {
  try {
    const lecture = await Lecture.findById(req.params.id);
    if (!lecture) {
      return res.status(404).json({ error: 'Lecture not found' });
    }

    // Verify ownership
    const subject = await Subject.findOne({
      _id: lecture.subjectId,
      userId: req.user._id,
    });

    if (!subject) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    if (!lecture.rawNotes || lecture.rawNotes.trim().length === 0) {
      return res.status(400).json({ error: 'No raw notes to process. Write some notes first!' });
    }

    // Process through selected AI
    const { aiProvider, apiKey } = req.body || {};
    const processedNotes = await processNotes(lecture.rawNotes, aiProvider, apiKey);

    // Save processed notes
    lecture.processedNotes = processedNotes;
    await lecture.save();

    res.json({
      message: 'Notes processed successfully',
      lecture,
    });
  } catch (error) {
    console.error('Process notes error:', error.message);
    res.status(500).json({ error: error.message || 'Failed to process notes' });
  }
});

module.exports = router;
