const progressService = require("../services/progressService");
const catchAsync = require("../utils/catchAsync");

exports.getProgress = catchAsync(async (req, res) => {
  const progress = await progressService.getProgress(
    req.params.enrollmentId,
    req.user.userId,
  );
  res.status(200).json({ success: true, data: progress });
});

exports.markContentComplete = catchAsync(async (req, res) => {
  const { enrollmentId, contentId } = req.params;
  const progress = await progressService.markContentCompleted(
    enrollmentId,
    req.user.userId,
    contentId,
  );
  res.status(200).json({
    success: true,
    data: progress,
    message: "Content marked as complete",
  });
});

exports.getProgressHistory = catchAsync(async (req, res) => {
  const { courseId } = req.params;
  const tz = req.query.tz || req.headers["x-timezone"] || "UTC";
  const activityMap = await progressService.getProgressHistory(
    req.user.userId,
    courseId,
    tz,
  );
  res.status(200).json({ success: true, data: { activityMap } });
});

exports.getUserProgressActivity = catchAsync(async (req, res) => {
  const tz = req.query.tz || req.headers["x-timezone"] || "UTC";
  const result = await progressService.getUserProgressActivity(
    req.user.userId,
    tz,
  );
  res.status(200).json({ success: true, data: result });
});
