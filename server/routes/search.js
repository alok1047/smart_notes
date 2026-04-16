const express = require('express');
const Lecture = require('../models/Lecture');
const Subject = require('../models/Subject');
const authenticate = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/search?q=searchTerm
 * Search across subjects, lectures (raw + processed notes)
 */
router.get('/', async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length === 0) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const searchRegex = new RegExp(q.trim(), 'i');

    // Search subjects by name
    const subjects = await Subject.find({
      userId: req.user._id,
      name: searchRegex,
    }).lean();

    // Get all user's subject IDs for lecture search
    const allUserSubjects = await Subject.find({ userId: req.user._id }).select('_id name');
    const subjectIds = allUserSubjects.map(s => s._id);
    const subjectMap = {};
    allUserSubjects.forEach(s => { subjectMap[s._id.toString()] = s.name; });

    // Search lectures by raw or processed notes
    const lectures = await Lecture.find({
      subjectId: { $in: subjectIds },
      $or: [
        { rawNotes: searchRegex },
        { processedNotes: searchRegex },
      ],
    }).lean();

    // Attach subject name to each lecture result
    const lectureResults = lectures.map(l => ({
      ...l,
      subjectName: subjectMap[l.subjectId.toString()] || 'Unknown',
    }));

    res.json({
      query: q,
      subjects,
      lectures: lectureResults,
      totalResults: subjects.length + lectures.length,
    });
  } catch (error) {
    console.error('Search error:', error.message);
    res.status(500).json({ error: 'Search failed' });
  }
});

module.exports = router;
