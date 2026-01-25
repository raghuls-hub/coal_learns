const mongoose = require('mongoose');

const CertificateSchema = new mongoose.Schema({
  certificateId: {
    type: String,
    required: [true, 'Certificate ID is required'],
    unique: true,
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
  examAttempt: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ExamAttempt',
    required: [true, 'Exam attempt is required'],
  },
  
  issuedAt: {
    type: Date,
    default: Date.now,
  },
  
  blockchain: {
    network: {
      type: String,
      enum: ['polygon', 'ethereum'],
      default: 'polygon',
    },
    transactionHash: String,
    certificateHash: String, // SHA-256 hash of certificate data
    blockNumber: Number,
    verificationUrl: String,
  },
  
  metadata: {
    candidateName: String,
    courseTitle: String,
    score: Number,
    completionDate: Date,
    issuer: String,
  },
  
  qrCode: String, // Base64 or S3 URL
  pdfUrl: String, // S3 URL
  
  status: {
    type: String,
    enum: ['active', 'revoked'],
    default: 'active',
  },
  
  revokedAt: Date,
  revokedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  revokeReason: String,
}, {
  timestamps: true,
});

// Indexes
CertificateSchema.index({ certificateId: 1 }, { unique: true });
CertificateSchema.index({ candidate: 1 });
CertificateSchema.index({ course: 1 });

module.exports = mongoose.model('Certificate', CertificateSchema);
