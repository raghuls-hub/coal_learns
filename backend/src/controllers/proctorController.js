const Progress = require('../models/Progress');
const Course = require('../models/Course');
const User = require('../models/User');
const catchAsync = require('../utils/catchAsync');
const nodemailer = require('nodemailer');

// Helper to send email
const sendTutorEmail = async (tutorEmail, studentName, courseName, reason) => {
  try {
    // Basic transporter - configure with real creds in .env
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: tutorEmail,
      subject: `🚨 Proctoring Alert: Exam Locked for ${studentName}`,
      text: `
        Student: ${studentName}
        Course: ${courseName}
        
        The final assessment has been locked due to malpractice/proctoring violations.
        Reason: ${reason}
        
        Please review the case and unlock manually if appropriate.
      `
    };

    // Only send if creds exist, else log
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      await transporter.sendMail(mailOptions);
      console.log(`[Proctor] Email sent to tutor: ${tutorEmail}`);
    } else {
      console.log(`[Proctor] Email simulation: To ${tutorEmail} - ${reason}`);
    }
  } catch (error) {
    console.error('[Proctor] Email failed:', error);
  }
};

/**
 * @desc Get current proctoring status
 * @route GET /api/assessments/:id/proctor/status
 */
exports.getProctorStatus = catchAsync(async (req, res) => {
  const { id: assessmentId } = req.params; // Assessment ID (though usually we track by enrollment)
  const userId = req.user.userId;

  // We need to find the enrollment/progress for this user & assessment
  // But progress is linked to enrollment. 
  // Let's find progress containing this assessment score
  const progress = await Progress.findOne({ 
    user: userId, 
    'assessmentScores.assessment': assessmentId 
  });

  if (!progress) {
    return res.status(200).json({ warningsCount: 0, isLocked: false });
  }

  const scoreEntry = progress.assessmentScores.find(s => 
    s.assessment.toString() === assessmentId
  );

  res.status(200).json({
    warningsCount: scoreEntry?.warningsCount || 0,
    isLocked: scoreEntry?.isLocked || false,
    lockReason: scoreEntry?.lockReason || ''
  });
});

/**
 * @desc Log a warning (Client triggered)
 * @route POST /api/assessments/:id/proctor/warning
 */
exports.logWarning = catchAsync(async (req, res) => {
  const { id: assessmentId } = req.params;
  const { reason } = req.body;
  const userId = req.user.userId;

  console.log(`[Proctor] Warning for User ${userId} on Assessment ${assessmentId}: ${reason}`);

  let progress = await Progress.findOne({ 
    user: userId, 
    'assessmentScores.assessment': assessmentId 
  }).populate('course');

  if (!progress) {
    return res.status(404).json({ error: 'Progress not found' });
  }

  const scoreIndex = progress.assessmentScores.findIndex(s => 
    s.assessment.toString() === assessmentId
  );

  if (scoreIndex === -1) {
    return res.status(404).json({ error: 'Assessment not started' });
  }

  // Increment warning
  progress.assessmentScores[scoreIndex].warningsCount = (progress.assessmentScores[scoreIndex].warningsCount || 0) + 1;
  const warnings = progress.assessmentScores[scoreIndex].warningsCount;

  // Check Limit (3)
  if (warnings >= 3) {
    progress.assessmentScores[scoreIndex].isLocked = true;
    progress.assessmentScores[scoreIndex].lockReason = `Exceeded warning limit (${warnings} warnings). Last: ${reason}`;
    
    // Send Email Logic here
    const user = await User.findById(userId);
    // Assuming simple tutor assignment or fixed email for now
    const tutorEmail = 'tutor@lms.com'; // In real app, fetch from Course -> Instructor
    
    await sendTutorEmail(tutorEmail, user.profile.firstName, progress.course.title, `Exceeded warning limit. Last violation: ${reason}`);
  }

  await progress.save();

  res.status(200).json({
    success: true,
    warningsCount: warnings,
    isLocked: progress.assessmentScores[scoreIndex].isLocked,
    remainingWarnings: Math.max(0, 3 - warnings)
  });
});

/**
 * @desc Lock Assessment manually (Client triggered on major violation)
 * @route POST /api/assessments/:id/proctor/lock
 */
exports.lockAssessment = catchAsync(async (req, res) => {
  const { id: assessmentId } = req.params;
  const { reason } = req.body;
  const userId = req.user.userId;

  console.log(`[Proctor] LOCKING User ${userId} Assessment ${assessmentId}: ${reason}`);

  let progress = await Progress.findOne({ 
    user: userId, 
    'assessmentScores.assessment': assessmentId 
  }).populate('course');

  if (!progress) return res.status(404).json({ error: 'Progress not found' });

  const scoreIndex = progress.assessmentScores.findIndex(s => 
    s.assessment.toString() === assessmentId
  );

  if (scoreIndex === -1) return res.status(404).json({ error: 'Assessment not started' });

  progress.assessmentScores[scoreIndex].isLocked = true;
  progress.assessmentScores[scoreIndex].lockReason = reason;

  // Send Email
  const user = await User.findById(userId);
  await sendTutorEmail('tutor@lms.com', user.profile.firstName, progress.course.title, reason);

  await progress.save();

  res.status(200).json({ success: true, isLocked: true });
});

/**
 * @desc Unlock Assessment (Tutor only)
 * @route POST /api/assessments/:id/proctor/unlock
 */
exports.unlockAssessment = catchAsync(async (req, res) => {
  const { id: assessmentId } = req.params;
  const { userId } = req.body; // Target student

  // Verify tutor role (middleware should handle, but extra check)
  if (req.user.role !== 'tutor' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  let progress = await Progress.findOne({ 
    user: userId, 
    'assessmentScores.assessment': assessmentId 
  });

  if (!progress) return res.status(404).json({ error: 'Progress not found' });

  const scoreIndex = progress.assessmentScores.findIndex(s => 
    s.assessment.toString() === assessmentId
  );

  if (scoreIndex !== -1) {
    progress.assessmentScores[scoreIndex].isLocked = false;
    progress.assessmentScores[scoreIndex].warningsCount = 0; // Reset warnings
    progress.assessmentScores[scoreIndex].lockReason = null;
    await progress.save();
  }

  res.status(200).json({ success: true, message: 'Assessment unlocked' });
});
