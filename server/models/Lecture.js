const mongoose = require('mongoose');

const lectureSchema = new mongoose.Schema({
  subjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true,
    index: true,
  },
  lectureNumber: {
    type: Number,
    required: true,
  },
  title: {
    type: String,
    default: '',
  },
  rawNotes: {
    type: String,
    default: '',
  },
  processedNotes: {
    type: String,
    default: '',
  },
  embedding: {
    type: [Number],
    default: [],
  }
}, {
  timestamps: true,
});

lectureSchema.index({ subjectId: 1, lectureNumber: 1 });

module.exports = mongoose.model('Lecture', lectureSchema);
