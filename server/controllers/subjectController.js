const Subject = require('../models/Subject');
const Lecture = require('../models/Lecture');

const createSubject = async (req, res) => {
  try {
    const { name, lectureCount } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Subject name is required' });
    }

    const count = parseInt(lectureCount) || 1;

    if (count < 1 || count > 100) {
      return res.status(400).json({ error: 'Lecture count must be between 1 and 100' });
    }

    const subject = await Subject.create({
      name: name.trim(),
      userId: req.user._id,
      lectureCount: count,
    });

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
};

const getSubjects = async (req, res) => {
  try {
    const subjects = await Subject.find({ userId: req.user._id })
      .sort({ createdAt: -1 });

    res.json(subjects);
  } catch (error) {
    console.error('Get subjects error:', error.message);
    res.status(500).json({ error: 'Failed to fetch subjects' });
  }
};

const deleteSubject = async (req, res) => {
  try {
    const subject = await Subject.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!subject) {
      return res.status(404).json({ error: 'Subject not found' });
    }

    await Lecture.deleteMany({ subjectId: subject._id });
    await Subject.deleteOne({ _id: subject._id });

    res.json({ message: 'Subject and its lectures deleted successfully' });
  } catch (error) {
    console.error('Delete subject error:', error.message);
    res.status(500).json({ error: 'Failed to delete subject' });
  }
};

module.exports = { createSubject, getSubjects, deleteSubject };
