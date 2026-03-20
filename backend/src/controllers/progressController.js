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

  console.log('[getProgress] Returning progress:', {
    enrollmentId,
  });

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

  /*
  if (!moduleId) {
    return res.status(400).json({
      success: false,
      error: 'Module ID is required'
    });
  }
  */
  console.log(`[Controller] Mark Complete: Enr=${enrollmentId}, Content=${contentId}`);

  // New service signature: markContentCompleted(enrollmentId, userId, contentId)
  // We no longer need moduleId or watchTime for the core simple logic
  const progress = await progressService.markContentCompleted(
    enrollmentId,
    candidateId,
    contentId
  );

  res.status(200).json({
    success: true,
    data: progress,
    message: 'Content marked as complete'
  });
});
