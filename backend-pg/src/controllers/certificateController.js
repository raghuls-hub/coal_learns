const certificateService = require('../services/certificateService');
const { pool } = require('../config/database');
const catchAsync = require('../utils/catchAsync');

exports.claimCertificate = catchAsync(async (req, res) => {
  const { courseId } = req.body;
  const userId = req.user.userId;

  const { rows } = await pool.query(
    'SELECT id FROM enrollments WHERE course_id=$1 AND user_id=$2',
    [courseId, userId]
  );
  if (!rows.length) return res.status(404).json({ success: false, message: 'Enrollment not found' });

  const certificate = await certificateService.claimCertificate(rows[0].id, userId);
  res.status(201).json({ success: true, data: certificate });
});

exports.getMyCertificates = catchAsync(async (req, res) => {
  const certificates = await certificateService.getMyCertificates(req.user.userId);
  res.status(200).json({ success: true, data: certificates });
});

exports.downloadCertificate = catchAsync(async (req, res) => {
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=certificate-${req.params.id}.pdf`);
  await certificateService.generatePDF(req.params.id, res);
});

exports.getCertificate = catchAsync(async (req, res) => {
  const cert = await certificateService.getCertificate(req.params.id);
  res.status(200).json({ success: true, data: cert });
});
