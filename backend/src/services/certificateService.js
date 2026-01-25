const { ethers } = require('ethers');
const crypto = require('crypto');
const QRCode = require('qrcode');
const Certificate = require('../models/Certificate');
const ExamAttempt = require('../models/ExamAttempt');

// Certificate contract ABI (simplified - deploy actual contract separately)
const certificateContractABI = [
  "function storeCertificate(string memory certificateId, bytes32 certificateHash) public returns (uint256)",
  "function verifyCertificate(string memory certificateId) public view returns (bytes32, uint256, address, bool)"
];

/**
 * Generate and issue certificate after exam pass
 */
exports.generateCertificate = async (examAttemptId) => {
  const examAttempt = await ExamAttempt.findById(examAttemptId)
    .populate('candidate')
    .populate({
      path: 'exam',
      populate: { path: 'course assessment' },
    });

  if (!examAttempt) {
    throw new Error('Exam attempt not found');
  }

  const course = examAttempt.exam.course;

  // Check if exam was passed
  if (examAttempt.score.percentage < course.settings.passingPercentage) {
    throw new Error('Exam not passed. Certificate cannot be issued.');
  }

  // Check if certificate already exists
  const existingCert = await Certificate.findOne({ examAttempt: examAttemptId });
  if (existingCert) {
    return existingCert;
  }

  // Generate unique certificate ID
  const certificateId = `CERT-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

  // Create certificate metadata
  const metadata = {
    candidateName: `${examAttempt.candidate.profile.firstName} ${examAttempt.candidate.profile.lastName}`,
    courseTitle: course.title,
    score: examAttempt.score.percentage,
    completionDate: examAttempt.submittedAt,
    issuer: 'LMS Platform', // Configure this
  };

  // Generate hash for blockchain
  const certificateHash = crypto
    .createHash('sha256')
    .update(JSON.stringify({ certificateId, ...metadata }))
    .digest('hex');

  // Store on blockchain
  let blockchainData = null;
  if (process.env.BLOCKCHAIN_PRIVATE_KEY && process.env.POLYGON_RPC_URL) {
    try {
      blockchainData = await this.storeOnBlockchain(certificateId, certificateHash);
    } catch (error) {
      console.warn('Blockchain storage failed, continuing with database only:', error.message);
    }
  }

  // Generate QR code for verification
  const verificationUrl = `${process.env.APP_URL}/verify/${certificateId}`;
  const qrCode = await QRCode.toDataURL(verificationUrl);

  // Create certificate record
  const certificate = new Certificate({
    certificateId,
    candidate: examAttempt.candidate._id,
    course: course._id,
    examAttempt: examAttemptId,
    issuedAt: new Date(),
    blockchain: blockchainData ? {
      network: 'polygon',
      transactionHash: blockchainData.transactionHash,
      certificateHash: '0x' + certificateHash,
      blockNumber: blockchainData.blockNumber,
      verificationUrl,
    } : undefined,
    metadata,
    qrCode,
    status: 'active',
  });

  await certificate.save();

  return certificate;
};

/**
 * Store certificate hash on blockchain
 */
exports.storeOnBlockchain = async (certificateId, certificateHash) => {
  try {
    // Connect to Polygon network
    const provider = new ethers.JsonRpcProvider(process.env.POLYGON_RPC_URL);
    const wallet = new ethers.Wallet(process.env.BLOCKCHAIN_PRIVATE_KEY, provider);

    // Contract instance
    const contract = new ethers.Contract(
      process.env.CERTIFICATE_CONTRACT_ADDRESS,
      certificateContractABI,
      wallet
    );

    // Convert hash to bytes32
    const hashBytes32 = '0x' + certificateHash;

    // Submit transaction
    const tx = await contract.storeCertificate(certificateId, hashBytes32);

    // Wait for confirmation
    const receipt = await tx.wait();

    return {
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
    };
  } catch (error) {
    throw new Error(`Blockchain storage failed: ${error.message}`);
  }
};

/**
 * Verify certificate authenticity
 */
exports.verifyCertificate = async (certificateId) => {
  const certificate = await Certificate.findOne({ certificateId })
    .populate('candidate', 'profile.firstName profile.lastName')
    .populate('course', 'title');

  if (!certificate) {
    return {
      valid: false,
      reason: 'Certificate not found',
    };
  }

  if (certificate.status === 'revoked') {
    return {
      valid: false,
      reason: 'Certificate has been revoked',
      revokedAt: certificate.revokedAt,
      revokeReason: certificate.revokeReason,
    };
  }

  // Verify blockchain if available
  let blockchainVerified = false;
  if (certificate.blockchain && certificate.blockchain.transactionHash) {
    try {
      blockchainVerified = await this.verifyOnBlockchain(certificateId, certificate.blockchain.certificateHash);
    } catch (error) {
      console.warn('Blockchain verification failed:', error.message);
    }
  }

  return {
    valid: true,
    certificate: {
      id: certificate.certificateId,
      candidateName: certificate.metadata.candidateName,
      courseTitle: certificate.metadata.courseTitle,
      score: certificate.metadata.score,
      issuedAt: certificate.issuedAt,
      blockchain: certificate.blockchain,
    },
    blockchainVerified,
  };
};

/**
 * Verify certificate on blockchain
 */
exports.verifyOnBlockchain = async (certificateId, expectedHash) => {
  try {
    const provider = new ethers.JsonRpcProvider(process.env.POLYGON_RPC_URL);
    const contract = new ethers.Contract(
      process.env.CERTIFICATE_CONTRACT_ADDRESS,
      certificateContractABI,
      provider
    );

    const [storedHash, timestamp, issuer, revoked] = await contract.verifyCertificate(certificateId);

    return storedHash === expectedHash && !revoked;
  } catch (error) {
    throw new Error(`Blockchain verification failed: ${error.message}`);
  }
};

/**
 * Revoke certificate (admin only)
 */
exports.revokeCertificate = async (certificateId, adminId, reason) => {
  const certificate = await Certificate.findOne({ certificateId });

  if (!certificate) {
    throw new Error('Certificate not found');
  }

  if (certificate.status === 'revoked') {
    throw new Error('Certificate is already revoked');
  }

  certificate.status = 'revoked';
  certificate.revokedAt = new Date();
  certificate.revokedBy = adminId;
  certificate.revokeReason = reason;

  await certificate.save();

  return certificate;
};

module.exports = exports;
