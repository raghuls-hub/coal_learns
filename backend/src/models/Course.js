const mongoose = require('mongoose');

const CourseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
  },
  thumbnail: {
    type: String, // URL to thumbnail image
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
  },
  level: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner',
  },
  
  courseHandler: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Course handler is required'],
  },
  tutors: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  
  modules: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Module',
  }],
  
  pricing: {
    amount: {
      type: Number,
      required: [true, 'Price amount is required'],
      min: 0,
    },
    currency: {
      type: String,
      default: 'USD',
    },
    commissionRate: {
      type: Number,
      default: 20,
      min: 0,
      max: 100,
    },
  },
  
  settings: {
    enrollmentLimit: {
      type: Number,
      min: 0,
    },
    certificateTemplate: String,
    passingPercentage: {
      type: Number,
      default: 70,
      min: 0,
      max: 100,
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
  },
  
  stats: {
    enrollmentCount: {
      type: Number,
      default: 0,
    },
    completionCount: {
      type: Number,
      default: 0,
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
  },
}, {
  timestamps: true,
});

// Indexes
CourseSchema.index({ courseHandler: 1, 'settings.isPublished': 1 });
CourseSchema.index({ category: 1 });
CourseSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('Course', CourseSchema);
