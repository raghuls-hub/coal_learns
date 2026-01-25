const mongoose = require('mongoose');

const ProctoringEventSchema = new mongoose.Schema({
  examAttempt: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ExamAttempt',
    required: [true, 'Exam attempt is required'],
  },
  type: {
    type: String,
    enum: [
      'face_not_detected',
      'multiple_faces',
      'eyes_away',
      'phone_detected',
      'tab_switch',
      'fullscreen_exit',
      'suspicious_behavior',
      'browser_navigation',
    ],
    required: [true, 'Violation type is required'],
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium',
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  
  data: {
    snapshot: String, // S3 URL of screenshot/webcam capture
    description: String,
    confidence: {
      type: Number, // AI confidence score
      min: 0,
      max: 1,
    },
  },
}, {
  timestamps: false, // Using custom timestamp field
});

// Index for fast violations lookup
ProctoringEventSchema.index({ examAttempt: 1, timestamp: 1 });

module.exports = mongoose.model('ProctoringEvent', ProctoringEventSchema);
