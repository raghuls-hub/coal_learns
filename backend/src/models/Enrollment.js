const mongoose = require('mongoose');

const EnrollmentSchema = new mongoose.Schema({
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
  
  enrolledAt: {
    type: Date,
    default: Date.now,
  },
  completedAt: Date,
  
  payment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment',
  },
  
  status: {
    type: String,
    enum: ['active', 'completed', 'suspended', 'cancelled'],
    default: 'active',
  },
}, {
  timestamps: true,
});

// Unique enrollment per candidate per course
EnrollmentSchema.index({ candidate: 1, course: 1 }, { unique: true });

module.exports = mongoose.model('Enrollment', EnrollmentSchema);
