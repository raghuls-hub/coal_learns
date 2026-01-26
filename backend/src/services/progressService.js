const Progress = require('../models/Progress');
const Enrollment = require('../models/Enrollment');

/**
 * Get progress for an enrollment
 */
exports.getProgress = async (enrollmentId, candidateId) => {
  const enrollment = await Enrollment.findOne({
    _id: enrollmentId,
    user: candidateId
  });

  if (!enrollment) {
    throw new Error('Enrollment not found');
  }

  const progress = await Progress.findOne({ enrollment: enrollmentId });

  if (!progress) {
    // Create initial progress if doesn't exist
    const newProgress = await Progress.create({
      enrollment: enrollmentId,
      user: candidateId,
      completedContent: [],
      moduleProgress: []
    });
    return newProgress;
  }

  return progress;
};

/**
 * Mark content as complete
 */
exports.markContentComplete = async (enrollmentId, candidateId, moduleId, contentId, watchTime) => {
  let progress = await Progress.findOne({ enrollment: enrollmentId });

  if (!progress) {
    progress = await Progress.create({
      enrollment: enrollmentId,
      user: candidateId,
      completedContent: [],
      moduleProgress: []
    });
  }

  // Add to completed content if not already there
  if (!progress.completedContent.some(c => c.toString() === contentId)) {
    progress.completedContent.push(contentId);
  }

  // Update module progress
  const moduleProgressIndex = progress.moduleProgress.findIndex(
    mp => mp.module.toString() === moduleId
  );

  if (moduleProgressIndex >= 0) {
    if (!progress.moduleProgress[moduleProgressIndex].completedContent.includes(contentId)) {
      progress.moduleProgress[moduleProgressIndex].completedContent.push(contentId);
    }
  } else {
    progress.moduleProgress.push({
      module: moduleId,
      completedContent: [contentId]
    });
  }

  await progress.save();
  return progress;
};
