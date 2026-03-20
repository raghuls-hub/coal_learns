const certificateService = require('../services/certificateService');
const catchAsync = require('../utils/catchAsync');
const Enrollment = require('../models/Enrollment');
const Certificate = require('../models/Certificate');

/**
 * @route   POST /api/certificates/claim
 * @desc    Claim a certificate for a completed course
 * @access  Private
 */
exports.claimCertificate = catchAsync(async (req, res) => {
  const { courseId } = req.body;
  const userId = req.user.userId;

  console.log(`[Controller] Claim Certificate Request. User: ${userId}, Course: ${courseId}`);

  // Find enrollment — look up by courseId OR by courseSnapshot if course was deleted
  let enrollment = await Enrollment.findOne({ course: courseId, user: userId });

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

  // Use stored courseName and instructorName — do NOT rely on course populate
  // (course may have been deleted, but cert.courseName and cert.instructorName are always stored)
  const certificates = await Certificate.find({ user: userId })
    .sort({ createdAt: -1 })
    .lean();

  // Optionally try to populate course for thumbnail — but fall back gracefully
  const certIds = certificates.map(c => c._id);

  res.status(200).json({
    success: true,
    data: certificates
  });
});

/**
 * @route   GET /api/certificates/:id/download
 * @desc    Download certificate PDF
 * @access  Private (or Public via token)
 */
exports.downloadCertificate = catchAsync(async (req, res) => {
  const { id } = req.params;

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=certificate-${id}.pdf`);

  await certificateService.generatePDF(id, res);
});

/**
 * @route   GET /api/certificates/:id
 * @desc    Verify/View certificate details (public)
 * @access  Public
 */
exports.getCertificate = catchAsync(async (req, res) => {
  const { id } = req.params;

  // Find by certificateId (UUID), populate user safely
  const cert = await Certificate.findOne({ certificateId: id })
    .populate('user', 'profile email')
    .lean();

  if (!cert) {
    return res.status(404).json({ success: false, message: 'Certificate not found' });
  }

  // Return stored courseName & instructorName — not dependent on course doc existing
  res.status(200).json({
    success: true,
    data: {
      ...cert,
      // Ensure these are always present for the frontend
      courseName: cert.courseName || 'Course Title Unavailable',
      instructorName: cert.instructorName || 'Platform Instructor',
    }
  });
});
