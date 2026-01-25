const mongoose = require('mongoose');

const ExamAttemptSchema = new mongoose.Schema({
  exam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam',
    required: [true, 'Exam is required'],
  },
  candidate: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Candidate is required'],
  },
  
  startedAt: {
    type: Date,
    default: Date.now,
  },
  submittedAt: Date,
  
  answers: [{
    questionId: mongoose.Schema.Types.ObjectId,
    answer: mongoose.Schema.Types.Mixed, // String or Array
    isCorrect: Boolean,
    pointsEarned: Number,
  }],
  
  score: {
    obtained: Number,
    total: Number,
    percentage: Number,
  },
  
  status: {
    type: String,
    enum: ['in_progress', 'submitted', 'evaluated', 'flagged'],
    default: 'in_progress',
  },
  
  proctoringData: {
    violations: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProctoringEvent',
    }],
    riskScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    flagged: {
      type: Boolean,
      default: false,
    },
  },
}, {
  timestamps: true,
});

ExamAttemptSchema.index({ exam: 1, candidate: 1 });
ExamAttemptSchema.index({ candidate: 1 });

module.exports = mongoose.model('ExamAttempt', ExamAttemptSchema);
