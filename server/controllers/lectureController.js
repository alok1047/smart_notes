const Lecture = require('../models/Lecture');
const Subject = require('../models/Subject');
const pdfParse = require('pdf-parse');
const { processNotes, streamNotes, extractTextFromImage } = require('../services/aiService');

const getSingleLecture = async (req, res) => {
  try {
    const lecture = await Lecture.findById(req.params.id);
    if (!lecture) {
      return res.status(404).json({ error: 'Lecture not found' });
    }

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
};

const getLectures = async (req, res) => {
  try {
    const subject = await Subject.findOne({
      _id: req.params.subjectId,
      userId: req.user._id,
    });

    if (!subject) {
      return res.status(404).json({ error: 'Subject not found' });
    }

    const lectures = await Lecture.find({ subjectId: req.params.subjectId })
      .sort({ lectureNumber: 1 });

    res.json({ subject, lectures });
  } catch (error) {
    console.error('Get lectures error:', error.message);
    res.status(500).json({ error: 'Failed to fetch lectures' });
  }
};

const addLecture = async (req, res) => {
  try {
    const subject = await Subject.findOne({
      _id: req.params.subjectId,
      userId: req.user._id,
    });

    if (!subject) {
      return res.status(404).json({ error: 'Subject not found' });
    }

    const count = await Lecture.countDocuments({ subjectId: req.params.subjectId });
    const lecture = await Lecture.create({
      subjectId: req.params.subjectId,
      lectureNumber: count + 1,
      title: `Lecture ${count + 1}`,
      rawNotes: '',
      processedNotes: '',
    });

    subject.lectureCount = count + 1;
    await subject.save();

    res.status(201).json(lecture);
  } catch (error) {
    console.error('Add lecture error:', error.message);
    res.status(500).json({ error: 'Failed to add lecture' });
  }
};

const deleteLecture = async (req, res) => {
  try {
    const lecture = await Lecture.findById(req.params.id);
    if (!lecture) {
      return res.status(404).json({ error: 'Lecture not found' });
    }

    const subject = await Subject.findOne({
      _id: lecture.subjectId,
      userId: req.user._id,
    });

    if (!subject) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await Lecture.findByIdAndDelete(req.params.id);

    const remainingCount = await Lecture.countDocuments({ subjectId: lecture.subjectId });
    subject.lectureCount = remainingCount;
    await subject.save();

    res.json({ message: 'Lecture deleted' });
  } catch (error) {
    console.error('Delete lecture error:', error.message);
    res.status(500).json({ error: 'Failed to delete lecture' });
  }
};

const updateLecture = async (req, res) => {
  try {
    const lecture = await Lecture.findById(req.params.id);
    if (!lecture) {
      return res.status(404).json({ error: 'Lecture not found' });
    }

    const subject = await Subject.findOne({
      _id: lecture.subjectId,
      userId: req.user._id,
    });

    if (!subject) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const { title, rawNotes, processedNotes } = req.body;
    if (title !== undefined) lecture.title = title;
    if (rawNotes !== undefined) lecture.rawNotes = rawNotes;
    if (processedNotes !== undefined) {
      lecture.processedNotes = processedNotes;
    }

    await lecture.save();
    res.json({ lecture });
  } catch (error) {
    console.error('Update lecture error:', error.message);
    res.status(500).json({ error: 'Failed to update lecture' });
  }
};

const processLecture = async (req, res) => {
  try {
    const lecture = await Lecture.findById(req.params.id);
    if (!lecture) {
      return res.status(404).json({ error: 'Lecture not found' });
    }

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

    const { aiProvider, apiKey, options } = req.body || {};
    const processedNotes = await processNotes(lecture.rawNotes, aiProvider, apiKey, options);

    res.json({
      message: 'Notes processed successfully. Waiting for user approval.',
      processedNotes,
      lecture,
    });
  } catch (error) {
    console.error('Process notes error:', error.message);
    res.status(500).json({ error: error.message || 'Failed to process notes' });
  }
};

const processLectureStream = async (req, res) => {
  try {
    const lecture = await Lecture.findById(req.params.id);
    if (!lecture) return res.status(404).json({ error: 'Lecture not found' });

    const subject = await Subject.findOne({ _id: lecture.subjectId, userId: req.user._id });
    if (!subject) return res.status(403).json({ error: 'Not authorized' });

    if (!lecture.rawNotes || lecture.rawNotes.trim().length === 0) {
      return res.status(400).json({ error: 'No raw notes to process' });
    }

    const { aiProvider, apiKey, options } = req.body || {};

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const fullText = await streamNotes(lecture.rawNotes, aiProvider, apiKey, options, (chunk) => {
      res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
    });

    lecture.processedNotes = fullText;
    await lecture.save();

    res.write(`data: ${JSON.stringify({ done: true, fullText })}\n\n`);
    res.end();
  } catch (error) {
    console.error('Process stream error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message || 'Streaming failed' });
    } else {
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
      res.end();
    }
  }
};

const importLectureFile = async (req, res) => {
  try {
    const lecture = await Lecture.findById(req.params.id);
    if (!lecture) return res.status(404).json({ error: 'Lecture not found' });

    const subject = await Subject.findOne({ _id: lecture.subjectId, userId: req.user._id });
    if (!subject) return res.status(403).json({ error: 'Not authorized' });

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { mimetype, buffer, originalname } = req.file;
    const { apiKey } = req.body || {};
    let extractedText = '';

    if (mimetype === 'application/pdf') {
      try {
        extractedText = await extractTextFromImage(buffer, 'application/pdf', apiKey);
      } catch (geminiErr) {
        console.warn('Gemini PDF vision extraction failed, falling back to pdf-parse:', geminiErr.message);
        const pdfData = await pdfParse(buffer);
        extractedText = pdfData.text || '';
      }
    } else if (mimetype.startsWith('image/')) {
      extractedText = await extractTextFromImage(buffer, mimetype, apiKey);
    } else {
      return res.status(400).json({ error: 'Unsupported file format. Please upload PDF or image.' });
    }

    res.json({
      message: 'File imported successfully',
      filename: originalname,
      extractedText: extractedText.trim(),
    });
  } catch (error) {
    console.error('Import file error:', error);
    res.status(500).json({ error: error.message || 'Failed to extract text from file' });
  }
};

const getRecentLectures = async (req, res) => {
  try {
    const userSubjects = await Subject.find({ userId: req.user._id }).select('_id name');
    const subjectIds = userSubjects.map(s => s._id);
    const subjectMap = {};
    userSubjects.forEach(s => { subjectMap[s._id.toString()] = s.name; });

    const lectures = await Lecture.find({ subjectId: { $in: subjectIds } })
      .sort({ updatedAt: -1 })
      .limit(6);

    const recentLectures = lectures.map(l => ({
      ...l.toObject(),
      subjectName: subjectMap[l.subjectId.toString()] || 'Subject',
    }));

    res.json(recentLectures);
  } catch (error) {
    console.error('Get recent lectures error:', error.message);
    res.status(500).json({ error: 'Failed to fetch recent lectures' });
  }
};

module.exports = {
  getSingleLecture,
  getLectures,
  getRecentLectures,
  addLecture,
  deleteLecture,
  updateLecture,
  processLecture,
  processLectureStream,
  importLectureFile,
};
