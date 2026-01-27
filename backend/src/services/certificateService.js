const Certificate = require('../models/Certificate');
const Enrollment = require('../models/Enrollment');
const Progress = require('../models/Progress');
const Course = require('../models/Course');
const QRCode = require('qrcode');


/**
 * Claim Certificate (Manual Trigger)
 */
exports.claimCertificate = async (enrollmentId, userId) => {
  console.log(`[Services] Claiming cert for Enr: ${enrollmentId}, User: ${userId}`);
  try {
      // 1. Verify Progress
      const progress = await Progress.findOne({ enrollment: enrollmentId, user: userId });
      if (!progress) {
          console.error("Progress not found");
          throw new Error('Progress not found');
      }

      if (!progress.courseCompleted) {
        console.error("Course not completed");
        throw new Error('Course is not completed. You must pass the final exam.');
      }

      // 2. Check if already exists
      let cert = await Certificate.findOne({ enrollment: enrollmentId });
      if (cert) {
          console.log("Certificate already exists:", cert._id);
          if (!progress.certificateClaimed) {
              progress.certificateClaimed = true;
              await progress.save();
          }
          return cert;
      }

      // 3. Generate New
      console.log("Generating new certificate...");
      const enrollment = await Enrollment.findById(enrollmentId)
        .populate('user')
        .populate({
            path: 'course',
            populate: { path: 'courseHandler', select: 'profile' } // Instructor info
        });
      
      if (!enrollment) throw new Error("Enrollment fetch failed");
      if (!enrollment.course) {
          console.error("Enrollment has no course attached. Data integrity issue.");
          throw new Error("Course data missing from enrollment");
      }
      console.log("Enrollment loaded. Course:", enrollment.course.title);

      const baseUrl = process.env.APP_URL || 'http://localhost:5173';
      
      // Safe extraction of instructor name
      let instructorName = 'Antigravity LMS Instructor';
      if (enrollment.course && enrollment.course.courseHandler && enrollment.course.courseHandler.profile) {
          instructorName = `${enrollment.course.courseHandler.profile.firstName || ''} ${enrollment.course.courseHandler.profile.lastName || ''}`.trim();
      }
      if (!instructorName || instructorName === ' ') instructorName = 'Platform Instructor';
      console.log("Instructor:", instructorName);

      cert = new Certificate({
        user: userId,
        course: enrollment.course._id,
        enrollment: enrollmentId,
        instructorName: instructorName,
        courseName: enrollment.course.title || 'Untitled Course',
        score: 100, // Or fetch final exam score if needed
        certificateClaimed: true
      });

      console.log("Certificate Object Created. Generating QR...");
      const verificationUrl = `${baseUrl}/verify/${cert.certificateId}`;
      cert.verificationUrl = verificationUrl;
      cert.qrCodeData = await QRCode.toDataURL(verificationUrl);
      console.log("QR Generated.");

      await cert.save();
      console.log("Certificate Saved:", cert._id);

      // Update Progress Latch
      progress.certificateClaimed = true;
      await progress.save();

      return cert;
  } catch (err) {
      console.error("[Services] Claim Certificate Failed:", err);
      throw err;
  }
};

/**
 * Generate PDF (Existing logic preserved)
 */
const PDFDocument = require('pdfkit');
const path = require('path');

exports.generatePDF = async (certificateId, res) => {
  const cert = await Certificate.findOne({ certificateId });
  if (!cert) throw new Error('Certificate not found');

  const populatedCert = await Certificate
    .findById(cert._id)
    .populate('user');

  const doc = new PDFDocument({
    size: 'A4',
    layout: 'landscape',
    margin: 0
  });

  doc.pipe(res);

  /* ================= BACKGROUND ================= */
  const templatePath = path.join(
    __dirname,
    '../assets/certificate_template.jpg'
  );

  doc.image(templatePath, 0, 0, {
    width: doc.page.width,
    height: doc.page.height
  });

  /* ================= HEADER ================= */
  doc.font('Helvetica-Bold')
    .fontSize(44)
    .fillColor('#000')
    .text('COAL LEARNS', 0, 70, { align: 'center' });

  doc.fontSize(30)
    .text('CERTIFICATE', 0, 135, { align: 'center' });

  doc.font('Helvetica')
    .fontSize(14)
    .text('OF COMPLETION', 0, 175, { align: 'center' });

  /* ================= BODY ================= */
  doc.fontSize(14)
    .text('This certificate is to certify that', 0, 220, {
      align: 'center'
    });

  doc.text('Has successfully completed the', 0, 285, {
    align: 'center'
  });

  /* ================= NAME ================= */
  const candidateName =
    `${populatedCert.user.profile.firstName} ${populatedCert.user.profile.lastName}`;

  doc.font('Helvetica-Oblique')
    .fontSize(20)
    .text(candidateName, 0, 315, {
      align: 'center'
    });

  /* ================= PASS BADGE TEXT ================= */
  doc.font('Helvetica-Bold')
    .fontSize(10)
    .text('Pass', 115, 300, {
      width: 60,
      align: 'center'
    });

  doc.fontSize(13)
    .text('100%', 115, 315, {
      width: 60,
      align: 'center'
    });

  /* ================= SIGNATURE ================= */
  doc.moveTo(doc.page.width / 2 - 110, 360)
    .lineTo(doc.page.width / 2 + 110, 360)
    .stroke();

  doc.font('Helvetica')
    .fontSize(12)
    .text('Instructor', doc.page.width / 2 - 100, 372, {
      width: 200,
      align: 'center'
    });

  /* ================= QR ================= */
  if (cert.qrCodeData) {
    const qrBuffer = Buffer.from(
      cert.qrCodeData.split(',')[1],
      'base64'
    );

    doc.image(qrBuffer, doc.page.width - 160, 285, {
      width: 85
    });
  }

  /* ================= FOOTER ================= */
  doc.font('Helvetica')
    .fontSize(7)
    .fillColor('#888')
    .text(
      `Certificate ID: ${cert.certificateId} | Issued: ${new Date(cert.issueDate).toLocaleDateString()}`,
      0,
      doc.page.height - 20,
      { align: 'center' }
    );

  doc.end();
};


