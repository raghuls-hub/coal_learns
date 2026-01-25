const mongoose = require('mongoose');

const ModuleSchema = new mongoose.Schema({
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: [true, 'Course reference is required'],
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
  },
  description: {
    type: String,
  },
  order: {
    type: Number,
    required: [true, 'Order is required'],
    min: 0,
  },
  
  content: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Content',
  }],
  
  unlockRules: {
    requiredPreviousModules: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Module',
    }],
    minimumPreviousScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    requiredVideoCompletion: {
      type: Boolean,
      default: false,
    },
  },
  
  assessment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assessment',
  },
  
  duration: {
    type: Number, // Estimated duration in minutes
    min: 0,
  },
}, {
  timestamps: true,
});

// Indexes
ModuleSchema.index({ course: 1, order: 1 });

module.exports = mongoose.model('Module', ModuleSchema);
