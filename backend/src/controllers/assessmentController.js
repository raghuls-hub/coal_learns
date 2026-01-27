const assessmentService = require('../services/assessmentService');
const progressService = require('../services/progressService'); // Import added
const catchAsync = require('../utils/catchAsync');

/**
 * @route   GET /api/assessments/:id/start
 * @desc    Start an assessment attempt (get questions without answers)
 * @access  Private
 */
exports.startAssessment = catchAsync(async (req, res) => {
  const { id } = req.params;
  const candidateId = req.user.userId;

  const assessment = await assessmentService.startAttempt(id, candidateId);

  res.status(200).json({
    success: true,
    data: assessment
  });
});

/**
 * @route   POST /api/assessments/:id/submit
 * @desc    Submit assessment answers and get results
 * @access  Private
 */
exports.submitAssessment = catchAsync(async (req, res) => {
  console.log('[submitAssessment] Route Hit!');
  const { id } = req.params;
  const { answers } = req.body;
  const candidateId = req.user.userId;

  console.log('[submitAssessment] Assessment ID:', id);
  console.log('[submitAssessment] Answers:', JSON.stringify(answers));
  console.log('[submitAssessment] User ID:', candidateId);

  if (!answers || !Array.isArray(answers)) {
    console.log('[submitAssessment] Invalid answers format');
    return res.status(400).json({
      success: false,
      error: 'Answers array is required'
    });
  }

  console.log('[submitAssessment] Calling assessmentService.submitAnswers...');
  const results = await assessmentService.submitAnswers(id, candidateId, answers);

  // Check if this was a final exam and passed
  console.log('Submission Results:', { passed: results.passed });
  
  // --- NEW: Save Progress ---
  const assessmentDoc = await assessmentService.getAssessmentById(id);
  const Enrollment = require('../models/Enrollment');
  
  // Use provided enrollmentId OR search
  let enrollment;
  if (req.body.enrollmentId) {
      enrollment = await Enrollment.findById(req.body.enrollmentId);
  } else {
      enrollment = await Enrollment.findOne({ 
        course: assessmentDoc.course, 
        user: candidateId 
      });
  }
  
  if (enrollment) {
      console.log(`[Controller] Saving Score for Enrollment: ${enrollment._id}`);
      await progressService.updateAssessmentResult(
          enrollment._id, 
          candidateId, 
          id, 
          results.score.percentage, 
          results.passed
      );
  } else {
      console.error(`Enrollment not found for user ${candidateId} course ${assessmentDoc.course}`);
  }
  // --------------------------

  // Return results (Certificate is claimed manually now)
  res.status(200).json({
    success: true,
    data: results
  });
});

/**
 * @route   GET /api/assessments/:id
 * @desc    Get assessment details
 * @access  Private
 */
exports.getAssessment = catchAsync(async (req, res) => {
  const { id } = req.params;

  const assessment = await assessmentService.getAssessmentById(id);

  res.status(200).json({
    success: true,
    data: assessment
  });
});
