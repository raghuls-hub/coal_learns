const mongoose = require('mongoose');

const ProgressSchema = new mongoose.Schema({
  enrollment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Enrollment',
    required: [true, 'Enrollment reference is required'],
  },
  candidate: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Candidate is required'],
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: [true, 'Course is required'],
  },
  
  moduleProgress: [{
    module: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Module',
    },
    isUnlocked: {
      type: Boolean,
      default: false,
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
    completionPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    
    contentProgress: [{
      content: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Content',
      },
      isCompleted: {
        type: Boolean,
        default: false,
      },
      watchTime: {
        type: Number, // For videos (in seconds)
        default: 0,
      },
      lastAccessedAt: Date,
    }],
    
    assessmentAttempts: [{
      assessment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Assessment',
      },
      attemptDate: Date,
      score: Number,
      passed: Boolean,
    }],
    
    completedAt: Date,
  }],
  
  overallCompletion: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  finalExamUnlocked: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

// Index for fast progress lookups
ProgressSchema.index({ enrollment: 1 });
ProgressSchema.index({ candidate: 1, course: 1 });

module.exports = mongoose.model('Progress', ProgressSchema);
