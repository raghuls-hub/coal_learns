const progressService = require('../services/progressService');
const catchAsync = require('../utils/catchAsync');

/**
 * @route   GET /api/progress/:enrollmentId
 * @desc    Get progress for an enrollment
 * @access  Private
 */
exports.getProgress = catchAsync(async (req, res) => {
  const { enrollmentId } = req.params;
  const candidateId = req.user.userId;

  const progress = await progressService.getProgress(enrollmentId, candidateId);

  res.status(200).json({
    success: true,
    data: progress
  });
});

/**
 * @route   PUT /api/progress/:enrollmentId/content/:contentId
 * @desc    Mark content as complete
 * @access  Private
 */
exports.markContentComplete = catchAsync(async (req, res) => {
  const { enrollmentId, contentId } = req.params;
  const { moduleId, watchTime } = req.body;
  const candidateId = req.user.userId;

  if (!moduleId) {
    return res.status(400).json({
      success: false,
      error: 'Module ID is required'
    });
  }

  const progress = await progressService.markContentComplete(
    enrollmentId,
    candidateId,
    moduleId,
    contentId,
    watchTime
  );

  res.status(200).json({
    success: true,
    data: progress,
    message: 'Content marked as complete'
  });
});
