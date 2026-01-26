const certificateService = require('../services/certificateService');
const Certificate = require('../models/Certificate');

/**
 * Get my certificates
 */
exports.getMyCertificates = async (req, res, next) => {
  try {
    const certificates = await Certificate.find({ user: req.user.userId })
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      data: certificates
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get certificate by ID (Public/Private details)
 */
exports.getCertificate = async (req, res, next) => {
  try {
    const { id } = req.params;
    const cert = await Certificate.findOne({ certificateId: id });
    
    if (!cert) {
      return res.status(404).json({ success: false, error: 'Certificate not found' });
    }

    res.status(200).json({
      success: true,
      data: cert
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verify certificate (Public endpoint)
 */
exports.verifyCertificate = async (req, res, next) => {
  try {
    const { id } = req.params;
    const cert = await Certificate.findOne({ certificateId: id })
      .populate('user', 'profile.firstName profile.lastName')
      .populate('course', 'title category thumbnail');
    
    if (!cert) {
      return res.status(404).json({ success: false, valid: false, message: 'Certificate invalid or not found' });
    }

    res.status(200).json({
      success: true,
      valid: true,
      data: {
        certificateId: cert.certificateId,
        student: cert.user.profile,
        course: cert.course,
        issueDate: cert.issueDate,
        instructor: cert.instructorName
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Download Certificate PDF
 */
exports.downloadCertificate = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=certificate-${id}.pdf`);
    
    await certificateService.generatePDF(id, res);
  } catch (error) {
    next(error);
  }
};
