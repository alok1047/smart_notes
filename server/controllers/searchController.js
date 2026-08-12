const Lecture = require('../models/Lecture');
const Subject = require('../models/Subject');

const escapeRegex = (str) => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

const search = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length === 0) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const searchRegex = new RegExp(escapeRegex(q.trim()), 'i');

    const subjects = await Subject.find({
      userId: req.user._id,
      name: searchRegex,
    }).lean();

    const allUserSubjects = await Subject.find({ userId: req.user._id }).select('_id name');
    const subjectIds = allUserSubjects.map(s => s._id);
    const subjectMap = {};
    allUserSubjects.forEach(s => { subjectMap[s._id.toString()] = s.name; });

    const lectures = await Lecture.find({
      subjectId: { $in: subjectIds },
      $or: [
        { rawNotes: searchRegex },
        { processedNotes: searchRegex },
      ],
    }).lean();

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
};

module.exports = { search };
