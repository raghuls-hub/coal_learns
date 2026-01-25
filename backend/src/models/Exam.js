const mongoose = require('mongoose');

const ExamSchema = new mongoose.Schema({
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: [true, 'Course is required'],
  },
  assessment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assessment',
    required: [true, 'Assessment is required'],
  },
  
  proctoringSettings: {
    enabled: {
      type: Boolean,
      default: true,
    },
    faceDetection: {
      type: Boolean,
      default: true,
    },
    eyeTracking: {
      type: Boolean,
      default: true,
    },
    phoneDetection: {
      type: Boolean,
      default: true,
    },
    tabSwitchDetection: {
      type: Boolean,
      default: true,
    },
    allowedViolations: {
      type: Number,
      default: 3,
    },
  },
  
  browserSettings: {
    fullScreenRequired: {
      type: Boolean,
      default: true,
    },
    disableCopy: {
      type: Boolean,
      default: true,
    },
    disablePaste: {
      type: Boolean,
      default: true,
    },
    disableRightClick: {
      type: Boolean,
      default: true,
    },
    chromeOnly: {
      type: Boolean,
      default: true,
    },
    blockExtensions: {
      type: Boolean,
      default: true,
    },
    silentMode: {
      type: Boolean,
      default: true,
    },
  },
}, {
  timestamps: true,
});

ExamSchema.index({ course: 1 });

module.exports = mongoose.model('Exam', ExamSchema);
