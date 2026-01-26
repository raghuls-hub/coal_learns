const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const CertificateSchema = new mongoose.Schema({
  certificateId: {
    type: String,
    default: uuidv4,
    unique: true,
    index: true
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
  enrollment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Enrollment',
    required: true
  },
  instructorName: {
    type: String,
    required: true
  },
  courseName: {
    type: String,
    required: true
  },
  score: {
    type: Number,
    required: true
  },
  issueDate: {
    type: Date,
    default: Date.now
  },
  verificationUrl: {
    type: String,
    required: true
  },
  qrCodeData: {
    type: String, // Base64 or URL of QR code
  },
  metadata: {
    type: Map,
    of: String
  }
}, {
  timestamps: true
});

CertificateSchema.index({ user: 1, course: 1 });

module.exports = mongoose.model('Certificate', CertificateSchema);
