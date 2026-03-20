const mongoose = require('mongoose');

const ProgressSchema = new mongoose.Schema({
  enrollment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Enrollment',
    required: true,
    unique: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },

  // Track completed content (Videos/PDFs) by ID. 
  // Using a Set concept (array of unique IDs).
  completedContent: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Content'
  }],

  // Track status of modules
  moduleProgress: [{
    module: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Module'
    },
    isUnlocked: { type: Boolean, default: false },
    isCompleted: { type: Boolean, default: false }
  }],


  
  // Overall course completion flag (set when all modules done)
  courseCompleted: {
    type: Boolean,
    default: false
  },

  certificateClaimed: {
    type: Boolean,
    default: false
  },

  lastAccessed: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index for quick lookups
ProgressSchema.index({ user: 1, course: 1 }, { unique: true });

module.exports = mongoose.model('Progress', ProgressSchema);
