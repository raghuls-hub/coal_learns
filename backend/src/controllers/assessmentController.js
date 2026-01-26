const assessmentService = require('../services/assessmentService');
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
  const { id } = req.params;
  const { answers } = req.body;
  const candidateId = req.user.userId;

  if (!answers || !Array.isArray(answers)) {
    return res.status(400).json({
      success: false,
      error: 'Answers array is required'
    });
  }

  const results = await assessmentService.submitAnswers(id, candidateId, answers);

  // Check if this was a final exam and passed
  console.log('Submission Results:', { passed: results.passed });
  
  if (results.passed) {
    const assessment = await assessmentService.getAssessmentById(id);
    console.log('Assessment Type:', assessment.type);
    
    if (assessment.type === 'final_exam') {
      // Find the enrollment
      const Enrollment = require('../models/Enrollment');
      const enrollment = await Enrollment.findOne({ 
        course: assessment.course, 
        user: candidateId 
      });

      console.log('Enrollment found:', !!enrollment);

      if (enrollment) {
        // Generate Certificate
        try {
            const certificateService = require('../services/certificateService');
            const certificate = await certificateService.generateCertificate(enrollment._id);
            console.log('Certificate generated:', certificate.certificateId);
            
            // Add certificate ID to results
            results.certificateId = certificate.certificateId;
            results.isFinalExam = true;
        } catch (err) {
            console.error('Certificate Generation Failed:', err);
        }
      }
    }
  }

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
