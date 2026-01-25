const mongoose = require('mongoose');

const AssessmentSchema = new mongoose.Schema({
  module: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Module',
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
  },
  type: {
    type: String,
    enum: {
      values: ['mini_test', 'module_assessment', 'final_exam'],
      message: '{VALUE} is not a valid assessment type',
    },
    required: [true, 'Assessment type is required'],
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
  },
  
  settings: {
    passingPercentage: {
      type: Number,
      default: 60,
      min: 0,
      max: 100,
    },
    timeLimit: {
      type: Number, // In minutes
      min: 0,
    },
    attemptsPerDay: {
      type: Number, // For mini-tests
      min: 1,
    },
    showAnswers: {
      type: Boolean,
      default: false,
    },
    shuffleQuestions: {
      type: Boolean,
      default: true,
    },
    shuffleOptions: {
      type: Boolean,
      default: true,
    },
  },
  
  questions: [{
    type: {
      type: String,
      enum: ['mcq', 'multiple_select', 'true_false', 'short_answer', 'fill_in_the_blank'],
      required: true,
    },
    question: {
      type: String,
      required: true,
    },
    options: [String], // For MCQ/Multiple Select/True-False
    correctAnswer: mongoose.Schema.Types.Mixed, // String or Array of strings
    points: {
      type: Number,
      default: 1,
      min: 0,
    },
    explanation: String,
  }],
}, {
  timestamps: true,
});

// Virtual for total points
AssessmentSchema.virtual('totalPoints').get(function () {
  return this.questions.reduce((sum, q) => sum + q.points, 0);
});

// Indexes
AssessmentSchema.index({ module: 1 });
AssessmentSchema.index({ course: 1 });

module.exports = mongoose.model('Assessment', AssessmentSchema);
