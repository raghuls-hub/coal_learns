const Certificate = require('../models/Certificate');
const Enrollment = require('../models/Enrollment');
const Progress = require('../models/Progress');
const Course = require('../models/Course');
const QRCode = require('qrcode');
const PDFDocument = require('pdfkit');

// Base URL for certificate verification links
const baseUrl = process.env.APP_URL || 'http://localhost:5173';

/**
 * Claim Certificate (Manual Trigger)
 */
exports.claimCertificate = async (enrollmentId, userId) => {
  console.log(`[Services] Claiming cert for Enr: ${enrollmentId}, User: ${userId}`);
  try {
      // 1. Verify Progress
      const progress = await Progress.findOne({ enrollment: enrollmentId, user: userId });
      if (!progress) {
          console.error('Progress not found');
          throw new Error('Progress not found');
      }

      // Check completion — use multiple signals as fallback for old
      // Progress documents saved before courseCompleted was in the schema
      let isCompleted = progress.courseCompleted;

      if (!isCompleted) {
        // Fallback 1: enrollment status / progress percentage
        const enrollmentCheck = await Enrollment.findById(enrollmentId).lean();
        if (enrollmentCheck && (enrollmentCheck.status === 'completed' || enrollmentCheck.progress >= 100)) {
          console.log('[Certificate] Auto-fixing courseCompleted from enrollment status/progress');
          isCompleted = true;
        }
      }

      if (!isCompleted) {
        // Fallback 2: all moduleProgress entries are isCompleted (all modules done)
        if (progress.moduleProgress && progress.moduleProgress.length > 0) {
          const allModulesDone = progress.moduleProgress.every(m => m.isCompleted === true);
          if (allModulesDone) {
            console.log('[Certificate] Auto-fixing courseCompleted from moduleProgress (all modules done)');
            isCompleted = true;
          }
        }
      }

      if (isCompleted && !progress.courseCompleted) {
        // Persist the fix so future claims are instant
        progress.courseCompleted = true;
        await progress.save();
      }

      if (!isCompleted) {
        console.error('Course not completed');
        throw new Error('Course is not yet completed. Complete all modules to earn your certificate.');
      }

      // 2. Check if already exists (idempotent)
      let cert = await Certificate.findOne({ enrollment: enrollmentId });
      if (cert) {
          console.log('Certificate already exists:', cert._id);
          if (!progress.certificateClaimed) {
              progress.certificateClaimed = true;
              await progress.save();
          }
          return cert;
      }

      // 3. Resolve course data — use live course first, then snapshot
      const enrollment = await Enrollment.findById(enrollmentId)
        .populate('user')
        .populate({
            path: 'course',
            populate: { path: 'courseHandler', select: 'profile' }
        });

      if (!enrollment) throw new Error('Enrollment fetch failed');

      let courseTitle = 'Untitled Course';
      let instructorName = 'Platform Instructor';
      const rawEnrollment = await Enrollment.findById(enrollmentId);
      const courseId = rawEnrollment.course;

      if (enrollment.course) {
          courseTitle = enrollment.course.title;
          const handler = enrollment.course.courseHandler;
          if (handler && handler.profile) {
              instructorName = `${handler.profile.firstName} ${handler.profile.lastName}`;
          }
      } else if (enrollment.courseSnapshot && enrollment.courseSnapshot.title) {
          console.warn(`[Certificate] Course deleted. Using snapshot for Enrollment ${enrollmentId}`);
          courseTitle = enrollment.courseSnapshot.title;
          instructorName = enrollment.courseSnapshot.instructorName || 'Former Instructor';
      } else {
          throw new Error('Course data is missing. Cannot generate certificate.');
      }

      console.log(`[Certificate] Generating for: "${courseTitle}" by "${instructorName}"`);

      // 4. Generate certificate
      cert = new Certificate({
        user: userId,
        course: courseId,
        enrollment: enrollmentId,
        instructorName,
        courseName: courseTitle,
        score: 100,
      });

      const verificationUrl = `${baseUrl}/verify/${cert.certificateId}`;
      cert.verificationUrl = verificationUrl;
      cert.qrCodeData = await QRCode.toDataURL(verificationUrl);

      await cert.save();
      console.log('[Certificate] Saved:', cert._id);

      // 5. Mark claimed in progress
      progress.certificateClaimed = true;
      await progress.save();

      return cert;
  } catch (err) {
      console.error('[Services] Claim Certificate Failed:', err.message);
      throw err;
  }
};

/**
 * Generate Certificate PDF — Fully drawn with PDFKit (no template image)
 */
exports.generatePDF = async (certificateId, res) => {
  const cert = await Certificate.findOne({ certificateId })
    .populate('user');
  if (!cert) throw new Error('Certificate not found');

  const candidateName = cert.user
    ? `${cert.user.profile.firstName} ${cert.user.profile.lastName}`
    : 'Certificate Holder';

  const W = 841.89; // A4 landscape width  (pts)
  const H = 595.28; // A4 landscape height (pts)

  const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 0 });
  doc.pipe(res);

  /* ─────────────────── BACKGROUND LAYERS ─────────────────── */
  // Deep navy base
  doc.rect(0, 0, W, H).fill('#0f172a');

  // Subtle background highlight (optional, but keeping it plain as requested)
  // No texture as per user request

  // Top gold accent bar
  doc.rect(0, 0, W, 8).fill('#f59e0b');
  // Bottom gold accent bar
  doc.rect(0, H - 8, W, 8).fill('#f59e0b');

  // Outer border frame
  doc.rect(24, 24, W - 48, H - 48)
    .lineWidth(2)
    .strokeColor('#f59e0b')
    .stroke();

  // Inner lighter border
  doc.rect(32, 32, W - 64, H - 64)
    .lineWidth(0.5)
    .strokeColor('#fcd34d')
    .stroke();

  /* ─────────────────── DECORATIVE COLUMNS ─────────────── */
  // Vertical gold left stripe
  doc.rect(56, 56, 4, H - 112).fill('#f59e0b');
  // Vertical gold right stripe
  doc.rect(W - 60, 56, 4, H - 112).fill('#f59e0b');

  /* ─────────────────── HEADER SEAL CIRCLE ─────────────────── */
  const cxSeal = W / 2;
  const cySeal = 96;
  doc.circle(cxSeal, cySeal, 38).fill('#1e293b').stroke();
  doc.circle(cxSeal, cySeal, 38).lineWidth(2).strokeColor('#f59e0b').stroke();
  // Star / monogram inside seal
  doc.font('Helvetica-Bold')
    .fontSize(20)
    .fillColor('#f59e0b')
    .text('CL', cxSeal - 15, cySeal - 10, { width: 30, align: 'center' });

  /* ─────────────────── PLATFORM NAME ─────────────────── */
  doc.font('Helvetica-Bold')
    .fontSize(13)
    .fillColor('#94a3b8')
    .text('COAL LEARNS', 0, 142, { align: 'center', characterSpacing: 4 });

  /* ─────────────────── TITLE ─────────────────── */
  doc.font('Helvetica-Bold')
    .fontSize(40)
    .fillColor('#f59e0b')
    .text('Certificate', 0, 162, { align: 'center' });

  doc.font('Helvetica')
    .fontSize(14)
    .fillColor('#94a3b8')
    .text('OF COMPLETION', 0, 208, { align: 'center', characterSpacing: 6 });

  /* ─────────────────── DIVIDER ─────────────────── */
  const divY = 232;
  doc.moveTo(W / 2 - 180, divY).lineTo(W / 2 + 180, divY)
    .lineWidth(0.75).strokeColor('#334155').stroke();

  /* ─────────────────── BODY TEXT ─────────────────── */
  doc.font('Helvetica')
    .fontSize(13)
    .fillColor('#94a3b8')
    .text('This is to certify that', 0, 248, { align: 'center' });

  /* ─────────────────── RECIPIENT NAME ─────────────────── */
  doc.font('Helvetica-BoldOblique')
    .fontSize(34)
    .fillColor('#ffffff')
    .text(candidateName, 0, 270, { align: 'center' });

  // Name underline
  const nameWidth = Math.min(candidateName.length * 16, 400);
  doc.moveTo(W / 2 - nameWidth / 2, 310)
    .lineTo(W / 2 + nameWidth / 2, 310)
    .lineWidth(1.5).strokeColor('#f59e0b').stroke();

  /* ─────────────────── COMPLETION TEXT ─────────────────── */
  doc.font('Helvetica')
    .fontSize(13)
    .fillColor('#94a3b8')
    .text('has successfully completed the course', 0, 322, { align: 'center' });

  /* ─────────────────── COURSE NAME ─────────────────── */
  doc.font('Helvetica-Bold')
    .fontSize(22)
    .fillColor('#e2e8f0')
    .text(cert.courseName || 'Course Title', 80, 345, { width: W - 160, align: 'center' });

  /* ─────────────────── INSTRUCTOR TAG ─────────────────── */
  doc.font('Helvetica')
    .fontSize(11)
    .fillColor('#64748b')
    .text(`Instructor: ${cert.instructorName || 'Platform Instructor'}`, 0, 387, { align: 'center' });

  /* ─────────────────── BOTTOM INFO ROW ─────────────────── */
  const bottomY = H - 100;

  // Issue Date block (center-ish)
  doc.font('Helvetica-Bold')
    .fontSize(10)
    .fillColor('#64748b')
    .text('ISSUE DATE', W/2 - 80, bottomY + 15, { width: 160, align: 'center' });
  doc.font('Helvetica')
    .fontSize(13)
    .fillColor('#e2e8f0')
    .text(new Date(cert.issueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }), W/2 - 80, bottomY + 30, { width: 160, align: 'center' });

  /* ─────────────────── QR CODE ─────────────────── */
  if (cert.qrCodeData) {
    const qrBuffer = Buffer.from(cert.qrCodeData.split(',')[1], 'base64');
    // QR in bottom-right corner, adjusted for better alignment
    doc.image(qrBuffer, W - 140, H - 140, { width: 75 });
    doc.font('Helvetica')
      .fontSize(8)
      .fillColor('#64748b')
      .text('Scan to verify', W - 140, H - 60, { width: 75, align: 'center' });
  }

  /* ─────────────────── CORNER ORNAMENTS ─────────────────── */
  // Top-left
  doc.circle(56, 56, 6).fill('#f59e0b');
  // Top-right
  doc.circle(W - 56, 56, 6).fill('#f59e0b');
  // Bottom-left
  doc.circle(56, H - 56, 6).fill('#f59e0b');
  // Bottom-right
  doc.circle(W - 56, H - 56, 6).fill('#f59e0b');

  doc.end();
};
