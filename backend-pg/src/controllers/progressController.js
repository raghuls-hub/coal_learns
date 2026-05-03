const progressService = require('../services/progressService');
const catchAsync = require('../utils/catchAsync');

exports.getProgress = catchAsync(async (req, res) => {
  const progress = await progressService.getProgress(req.params.enrollmentId, req.user.userId);
  res.status(200).json({ success: true, data: progress });
});

exports.markContentComplete = catchAsync(async (req, res) => {
  const { enrollmentId, contentId } = req.params;
  const progress = await progressService.markContentCompleted(enrollmentId, req.user.userId, contentId);
  res.status(200).json({ success: true, data: progress, message: 'Content marked as complete' });
});
