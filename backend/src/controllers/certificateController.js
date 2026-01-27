const certificateService = require('../services/certificateService');
const catchAsync = require('../utils/catchAsync');
const Enrollment = require('../models/Enrollment');

/**
 * @route   POST /api/certificates/claim
 * @desc    Claim a certificate for a completed course
 * @access  Private
 */
exports.claimCertificate = catchAsync(async (req, res) => {
  const { courseId } = req.body;
  const userId = req.user.userId;

  console.log(`[Controller] Claim Certificate Request. User: ${userId}, Course: ${courseId}`);

  // Find enrollment
  const enrollment = await Enrollment.findOne({ course: courseId, user: userId });
  
  if (!enrollment) {
    console.error(`[Controller] Enrollment not found for User ${userId} Course ${courseId}`);
    return res.status(404).json({ success: false, message: 'Enrollment not found' });
  }

  const certificate = await certificateService.claimCertificate(enrollment._id, userId);

  res.status(201).json({
    success: true,
    data: certificate
  });
});

/**
 * @route   GET /api/certificates/my
 * @desc    Get all certificates for the logged in user
 * @access  Private
 */
exports.getMyCertificates = catchAsync(async (req, res) => {
  const userId = req.user.userId;
  const Certificate = require('../models/Certificate');
  
  const certificates = await Certificate.find({ user: userId })
    .populate('course', 'title thumbnail')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: certificates
  });
});

/**
 * @route   GET /api/certificates/:id/download
 * @desc    Download certificate PDF
 * @access  Private (or Public if using signed token, but currently ID based)
 */
exports.downloadCertificate = catchAsync(async (req, res) => {
  const { id } = req.params;
  
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=certificate-${id}.pdf`);

  await certificateService.generatePDF(id, res);
});

/**
 * @route   GET /api/certificates/:id
 * @desc    Verify/View certificate details
 * @access  Public
 */
exports.getCertificate = catchAsync(async (req, res) => {
  const { id } = req.params;
  const Certificate = require('../models/Certificate');
  const cert = await Certificate.findOne({ certificateId: id })
    .populate('user', 'profile email') // Safe fields
    .populate('course', 'title description');

  if (!cert) {
      return res.status(404).json({ success: false, message: 'Certificate not found' });
  }

  res.status(200).json({
    success: true,
    data: cert
  });
});
