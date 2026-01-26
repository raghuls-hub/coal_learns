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
