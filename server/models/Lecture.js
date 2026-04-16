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
  rawNotes: {
    type: String,
    default: '',
  },
  processedNotes: {
    type: String,
    default: '',
  },
}, {
  timestamps: true,
});

// Compound index for efficient queries
lectureSchema.index({ subjectId: 1, lectureNumber: 1 });

module.exports = mongoose.model('Lecture', lectureSchema);
