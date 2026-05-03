const { pool } = require('../config/database');
const QRCode = require('qrcode');
const PDFDocument = require('pdfkit');

const baseUrl = process.env.APP_URL;

const formatCert = (row) => ({
  _id: row.id,
  id: row.id,
  certificateId: row.certificate_id,
  user: row.user_id,
  course: row.course_id,
  enrollment: row.enrollment_id,
  instructorName: row.instructor_name,
  courseName: row.course_name,
  score: parseFloat(row.score),
  issueDate: row.issue_date,
  verificationUrl: row.verification_url,
  qrCodeData: row.qr_code_data,
  createdAt: row.created_at,
});

exports.claimCertificate = async (enrollmentId, userId) => {
  // 1. Verify progress
  const { rows: progRows } = await pool.query(
    'SELECT * FROM progress WHERE enrollment_id = $1 AND user_id = $2',
    [enrollmentId, userId]
  );
  if (!progRows.length) throw new Error('Progress not found');

  const progress = progRows[0];
  let isCompleted = progress.course_completed;

  if (!isCompleted) {
    const { rows: enrRows } = await pool.query(
      `SELECT * FROM enrollments WHERE id = $1`,
      [enrollmentId]
    );
    if (enrRows.length && (enrRows[0].status === 'completed' || parseFloat(enrRows[0].progress) >= 100)) {
      isCompleted = true;
    }
  }

  if (!isCompleted) {
    const { rows: msRows } = await pool.query(
      `SELECT COUNT(*) AS total, SUM(CASE WHEN is_completed THEN 1 ELSE 0 END) AS done
       FROM progress_module_status WHERE progress_id = $1`,
      [progress.id]
    );
    if (parseInt(msRows[0].total) > 0 && msRows[0].total === msRows[0].done) {
      isCompleted = true;
    }
  }

  if (isCompleted && !progress.course_completed) {
    await pool.query(
      'UPDATE progress SET course_completed = TRUE, updated_at = NOW() WHERE id = $1',
      [progress.id]
    );
  }

  if (!isCompleted) throw new Error('Course is not yet completed. Complete all modules to earn your certificate.');

  // 2. Idempotent check
  const { rows: existing } = await pool.query(
    'SELECT * FROM certificates WHERE enrollment_id = $1',
    [enrollmentId]
  );
  if (existing.length) {
    if (!progress.certificate_claimed) {
      await pool.query(
        'UPDATE progress SET certificate_claimed = TRUE, updated_at = NOW() WHERE id = $1',
        [progress.id]
      );
    }
    return formatCert(existing[0]);
  }

  // 3. Resolve course data
  const { rows: enrRows } = await pool.query(
    `SELECT e.*,
            c.title AS course_title,
            u.first_name AS handler_first, u.last_name AS handler_last,
            e.snap_title, e.snap_instructor_name
     FROM enrollments e
     LEFT JOIN courses c ON c.id = e.course_id
     LEFT JOIN users u ON u.id = c.course_handler_id
     WHERE e.id = $1`,
    [enrollmentId]
  );
  if (!enrRows.length) throw new Error('Enrollment fetch failed');

  const enr = enrRows[0];
  let courseTitle = enr.course_title || enr.snap_title;
  let instructorName = enr.handler_first
    ? `${enr.handler_first} ${enr.handler_last}`
    : enr.snap_instructor_name || 'Platform Instructor';

  if (!courseTitle) throw new Error('Course data is missing. Cannot generate certificate.');

  // 4. Generate cert
  const { rows: certRows } = await pool.query(
    `INSERT INTO certificates (user_id, course_id, enrollment_id, instructor_name, course_name, score, verification_url)
     VALUES ($1,$2,$3,$4,$5,100,'placeholder')
     RETURNING *`,
    [userId, enr.course_id, enrollmentId, instructorName, courseTitle]
  );

  const cert = certRows[0];
  const verificationUrl = `${baseUrl}/verify/${cert.certificate_id}`;
  const qrCodeData = await QRCode.toDataURL(verificationUrl);

  const { rows: updated } = await pool.query(
    `UPDATE certificates SET verification_url = $1, qr_code_data = $2, updated_at = NOW()
     WHERE id = $3 RETURNING *`,
    [verificationUrl, qrCodeData, cert.id]
  );

  await pool.query(
    'UPDATE progress SET certificate_claimed = TRUE, updated_at = NOW() WHERE id = $1',
    [progress.id]
  );

  return formatCert(updated[0]);
};

exports.getMyCertificates = async (userId) => {
  const { rows } = await pool.query(
    'SELECT * FROM certificates WHERE user_id = $1 ORDER BY created_at DESC',
    [userId]
  );
  return rows.map(formatCert);
};

exports.getCertificate = async (certificateId) => {
  const { rows } = await pool.query(
    `SELECT cert.*, u.first_name, u.last_name, u.email
     FROM certificates cert
     LEFT JOIN users u ON u.id = cert.user_id
     WHERE cert.certificate_id = $1`,
    [certificateId]
  );
  if (!rows.length) throw new Error('Certificate not found');

  const row = rows[0];
  return {
    ...formatCert(row),
    user: { _id: row.user_id, email: row.email, profile: { firstName: row.first_name, lastName: row.last_name } },
    courseName: row.course_name || 'Course Title Unavailable',
    instructorName: row.instructor_name || 'Platform Instructor',
  };
};

exports.generatePDF = async (certificateId, res) => {
  const { rows } = await pool.query(
    `SELECT cert.*, u.first_name, u.last_name
     FROM certificates cert
     LEFT JOIN users u ON u.id = cert.user_id
     WHERE cert.certificate_id = $1`,
    [certificateId]
  );
  if (!rows.length) throw new Error('Certificate not found');

  const cert = rows[0];
  const candidateName = cert.first_name
    ? `${cert.first_name} ${cert.last_name}`
    : 'Certificate Holder';

  const W = 841.89;
  const H = 595.28;

  const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 0 });
  doc.pipe(res);

  doc.rect(0, 0, W, H).fill('#0f172a');
  doc.rect(0, 0, W, 8).fill('#f59e0b');
  doc.rect(0, H - 8, W, 8).fill('#f59e0b');
  doc.rect(24, 24, W - 48, H - 48).lineWidth(2).strokeColor('#f59e0b').stroke();
  doc.rect(32, 32, W - 64, H - 64).lineWidth(0.5).strokeColor('#fcd34d').stroke();
  doc.rect(56, 56, 4, H - 112).fill('#f59e0b');
  doc.rect(W - 60, 56, 4, H - 112).fill('#f59e0b');

  const cxSeal = W / 2;
  const cySeal = 96;
  doc.circle(cxSeal, cySeal, 38).fill('#1e293b').stroke();
  doc.circle(cxSeal, cySeal, 38).lineWidth(2).strokeColor('#f59e0b').stroke();
  doc.font('Helvetica-Bold').fontSize(20).fillColor('#f59e0b').text('CL', cxSeal - 15, cySeal - 10, { width: 30, align: 'center' });

  doc.font('Helvetica-Bold').fontSize(13).fillColor('#94a3b8').text('COAL LEARNS', 0, 142, { align: 'center', characterSpacing: 4 });
  doc.font('Helvetica-Bold').fontSize(40).fillColor('#f59e0b').text('Certificate', 0, 162, { align: 'center' });
  doc.font('Helvetica').fontSize(14).fillColor('#94a3b8').text('OF COMPLETION', 0, 208, { align: 'center', characterSpacing: 6 });

  const divY = 232;
  doc.moveTo(W / 2 - 180, divY).lineTo(W / 2 + 180, divY).lineWidth(0.75).strokeColor('#334155').stroke();

  doc.font('Helvetica').fontSize(13).fillColor('#94a3b8').text('This is to certify that', 0, 248, { align: 'center' });
  doc.font('Helvetica-BoldOblique').fontSize(34).fillColor('#ffffff').text(candidateName, 0, 270, { align: 'center' });

  const nameWidth = Math.min(candidateName.length * 16, 400);
  doc.moveTo(W / 2 - nameWidth / 2, 310).lineTo(W / 2 + nameWidth / 2, 310).lineWidth(1.5).strokeColor('#f59e0b').stroke();

  doc.font('Helvetica').fontSize(13).fillColor('#94a3b8').text('has successfully completed the course', 0, 322, { align: 'center' });
  doc.font('Helvetica-Bold').fontSize(22).fillColor('#e2e8f0').text(cert.course_name || 'Course Title', 80, 345, { width: W - 160, align: 'center' });
  doc.font('Helvetica').fontSize(11).fillColor('#64748b').text(`Instructor: ${cert.instructor_name || 'Platform Instructor'}`, 0, 387, { align: 'center' });

  const bottomY = H - 100;
  doc.font('Helvetica-Bold').fontSize(10).fillColor('#64748b').text('ISSUE DATE', W / 2 - 80, bottomY + 15, { width: 160, align: 'center' });
  doc.font('Helvetica').fontSize(13).fillColor('#e2e8f0').text(
    new Date(cert.issue_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }),
    W / 2 - 80, bottomY + 30, { width: 160, align: 'center' }
  );

  if (cert.qr_code_data) {
    const qrBuffer = Buffer.from(cert.qr_code_data.split(',')[1], 'base64');
    doc.image(qrBuffer, W - 140, H - 140, { width: 75 });
    doc.font('Helvetica').fontSize(8).fillColor('#64748b').text('Scan to verify', W - 140, H - 60, { width: 75, align: 'center' });
  }

  doc.circle(56, 56, 6).fill('#f59e0b');
  doc.circle(W - 56, 56, 6).fill('#f59e0b');
  doc.circle(56, H - 56, 6).fill('#f59e0b');
  doc.circle(W - 56, H - 56, 6).fill('#f59e0b');

  doc.end();
};
