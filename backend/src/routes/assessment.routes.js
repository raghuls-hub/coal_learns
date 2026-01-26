const express = require('express');
const router = express.Router();
const assessmentService = require('../services/assessmentService');
const auth = require('../middleware/auth');

// All routes require authentication
router.use(auth);

/**
 * @route   GET /api/assessments/:assessmentId/start
 * @desc    Start assessment attempt (get questions without answers)
 * @access  Private (Candidate)
 */
router.get('/:assessmentId/start', async (req, res, next) => {
  try {
    const { assessmentId } = req.params;
    const candidateId = req.user.userId;
    
    const assessmentData = await assessmentService.startAttempt(assessmentId, candidateId);
    
    res.status(200).json({
      success: true,
      data: assessmentData
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/assessments/:assessmentId/submit
 * @desc    Submit assessment answers
 * @access  Private (Candidate)
 */
router.post('/:assessmentId/submit', async (req, res, next) => {
  try {
    const { assessmentId } = req.params;
    const { answers } = req.body;
    const candidateId = req.user.userId;
    
    const results = await assessmentService.submitAnswers(assessmentId, candidateId, answers);
    
    res.status(200).json({
      success: true,
      data: results
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/assessments/:assessmentId
 * @desc    Get assessment by ID
 * @access  Private
 */
router.get('/:assessmentId', async (req, res, next) => {
  try {
    const { assessmentId } = req.params;
    
    const assessment = await assessmentService.getAssessmentById(assessmentId);
    
    res.status(200).json({
      success: true,
      data: assessment
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
