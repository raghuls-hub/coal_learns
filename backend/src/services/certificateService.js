const Certificate = require('../models/Certificate');
const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const User = require('../models/User');
const QRCode = require('qrcode');
const PDFDocument = require('pdfkit');
const fs = require('fs');

/**
 * Generate a new certificate
 */
exports.generateCertificate = async (enrollmentId) => {
  // Fetch details
  const enrollment = await Enrollment.findById(enrollmentId)
    .populate('user')
    .populate('course')
    .populate({
      path: 'course',
      populate: { path: 'courseHandler', select: 'profile' }
    });

  if (!enrollment) throw new Error('Enrollment not found');

  // Check if already exists
  const existingCert = await Certificate.findOne({ enrollment: enrollmentId });
  if (existingCert) return existingCert;

  // Generate Verification URL
  // Ideally this points to the frontend verification route
  // e.g. https://lms-app.com/verify/:id
  // For dev: http://localhost:5173/verify/:id
  const baseUrl = process.env.APP_URL || 'http://localhost:5173';
  
  // Temporary ID for URL generation (will update after save if uuid used, but schema uses uuid by default)
  // We can rely on a generated UUID or let mongoose default do it.
  // Mongoose default in schema is uuidv4.
  
  // We need the ID for the QR code.
  // Let's create the object first.
  const cert = new Certificate({
    user: enrollment.user._id,
    course: enrollment.course._id,
    enrollment: enrollment._id,
    instructorName: `${enrollment.course.courseHandler.profile.firstName} ${enrollment.course.courseHandler.profile.lastName}`,
    courseName: enrollment.course.title,
    score: enrollment.progress || 100, // Fallback if progress not tracked exactly
    // verificationUrl and qrCodeData will be set below
  });

  const verificationUrl = `${baseUrl}/verify/${cert.certificateId}`;
  cert.verificationUrl = verificationUrl;

  // Generate QR Code
  const qrCodeData = await QRCode.toDataURL(verificationUrl);
  cert.qrCodeData = qrCodeData;

  await cert.save();
  return cert;
};

/**
 * Generate PDF Stream for a certificate
 */
exports.generatePDF = async (certificateId, res) => {
  const cert = await Certificate.findOne({ certificateId });
  if (!cert) throw new Error('Certificate not found');

  const doc = new PDFDocument({
    layout: 'landscape',
    size: 'A4',
    margin: 0
  });

  // Pipe to response
  doc.pipe(res);

  // -- Design --
  
  // Background / Border
  doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40)
     .stroke('#1a202c');
  
  doc.rect(40, 40, doc.page.width - 80, doc.page.height - 80)
     .stroke('#4a5568');

  // Header
  doc.font('Helvetica-Bold').fontSize(40).fillColor('#2d3748')
     .text('CERTIFICATE OF COMPLETION', 0, 100, { align: 'center' });

  doc.font('Helvetica').fontSize(20).fillColor('#718096')
     .text('This is to certify that', 0, 160, { align: 'center' });

  // Candidate Name
  // We need to fetch user name or store it in cert.
  // Currently cert model has user ID. Need to populate or better, store snapshot in model.
  // The plan said "Candidate Name". I'll populate for now.
  const populatedCert = await Certificate.findById(cert._id).populate('user');
  const candidateName = `${populatedCert.user.profile.firstName} ${populatedCert.user.profile.lastName}`;

  doc.font('Helvetica-Bold').fontSize(35).fillColor('#1a202c')
     .text(candidateName, 0, 200, { align: 'center' });

  doc.font('Helvetica').fontSize(20).fillColor('#718096')
     .text('has successfully completed the course', 0, 260, { align: 'center' });

  // Course Name
  doc.font('Helvetica-Bold').fontSize(30).fillColor('#667eea')
     .text(cert.courseName, 0, 300, { align: 'center' });

  // Success message / Grade
  doc.font('Helvetica').fontSize(16).fillColor('#4a5568')
     .text(`Passing Grade: ${cert.score}%`, 0, 360, { align: 'center' });
  
  doc.text(`Issued on: ${new Date(cert.issueDate).toLocaleDateString()}`, 0, 385, { align: 'center' });

  // Instructor
  doc.moveDown(4);
  const instructorY = 450;
  
  doc.text('Instructor', 100, instructorY);
  doc.font('Helvetica-Bold').text(cert.instructorName, 100, instructorY + 25);
  doc.moveTo(100, instructorY + 20).lineTo(300, instructorY + 20).stroke();

  // ID
  doc.font('Helvetica').fontSize(10).fillColor('#cbd5e0')
     .text(`Certificate ID: ${cert.certificateId}`, 20, doc.page.height - 30);

  // QR Code
  if (cert.qrCodeData) {
    const qrImage = cert.qrCodeData.split(';base64,').pop();
    const imgBuffer = Buffer.from(qrImage, 'base64');
    
    // Position QR code in bottom right
    const qrSize = 100;
    doc.image(imgBuffer, doc.page.width - 150, doc.page.height - 150, { width: qrSize });
    
    doc.fontSize(10).fillColor('#4a5568')
       .text('Scan to Verify', doc.page.width - 150, doc.page.height - 40, { width: qrSize, align: 'center' });
  }

  doc.end();
};
