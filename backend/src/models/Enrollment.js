const mongoose = require('mongoose');

const EnrollmentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  },
  amountPaid: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'USD'
  },
  paymentMethod: {
    type: String,
    default: 'mock_payment'
  },
  transactionId: {
    type: String
  },
  enrolledAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date
  },
  progress: {
    type: Number, // 0 to 100
    default: 0
  },
  lastAccessed: {
    type: Date,
    default: Date.now
  },
  // [NEW] Persistent Course Data (Snapshot — set on completion or before deletion)
  courseSnapshot: {
    title: String,
    description: String,
    thumbnail: String,
    category: String,
    level: String,
    instructorName: String,
    totalModules: Number,
    totalDuration: Number,
    deletedAt: Date,
    completedAt: Date,
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled'],
    default: 'active'
  },
}, {
  timestamps: true
});

// Prevent double enrollment
EnrollmentSchema.index({ user: 1, course: 1 }, { unique: true });

module.exports = mongoose.model('Enrollment', EnrollmentSchema);
