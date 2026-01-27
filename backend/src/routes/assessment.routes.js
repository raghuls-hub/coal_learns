const express = require('express');
const router = express.Router();
const assessmentController = require('../controllers/assessmentController');
const auth = require('../middleware/auth');

// Log all assessment route requests
router.use((req, res, next) => {
  console.log(`[ASSESSMENT ROUTE] ${req.method} ${req.path}`);
  console.log('[ASSESSMENT ROUTE] Full URL:', req.originalUrl);
  next();
});

// All routes require authentication
router.use(auth);

/**
 * @route   GET /api/assessments/:id/start
 * @desc    Start assessment attempt (get questions without answers)
 * @access  Private (Candidate)
 */
router.get('/:id/start', assessmentController.startAssessment);

/**
 * @route   POST /api/assessments/:id/submit
 * @desc    Submit assessment answers
 * @access  Private (Candidate)
 */
router.post('/:id/submit', assessmentController.submitAssessment);

/**
 * @route   GET /api/assessments/:id
 * @desc    Get assessment by ID
 * @access  Private
 */
router.get('/:id', assessmentController.getAssessment);

module.exports = router;
