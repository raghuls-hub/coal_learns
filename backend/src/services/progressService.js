const Progress = require('../models/Progress');
const Module = require('../models/Module');
const Content = require('../models/Content');

/**
 * Get progress for an enrollment
 */
exports.getProgress = async (enrollmentId, candidateId) => {
  const progress = await Progress.findOne({
    enrollment: enrollmentId,
    candidate: candidateId,
  })
    .populate({
      path: 'moduleProgress.module',
      select: 'title description order',
    })
    .populate({
      path: 'moduleProgress.contentProgress.content',
      select: 'title type order',
    });

  if (!progress) {
    throw new Error('Progress not found');
  }

  return progress;
};

/**
 * Mark content as completed
 */
exports.markContentComplete = async (enrollmentId, candidateId, moduleId, contentId, watchTime = null) => {
  const progress = await Progress.findOne({
    enrollment: enrollmentId,
    candidate: candidateId,
  });

  if (!progress) {
    throw new Error('Progress not found');
  }

  const moduleProgress = progress.moduleProgress.find(
    mp => mp.module.toString() === moduleId
  );

  if (!moduleProgress) {
    throw new Error('Module not found in progress');
  }

  if (!moduleProgress.isUnlocked) {
    throw new Error('Module is locked');
  }

  // Find or create content progress
  let contentProgress = moduleProgress.contentProgress.find(
    cp => cp.content.toString() === contentId
  );

  if (!contentProgress) {
    contentProgress = {
      content: contentId,
      isCompleted: false,
      watchTime: 0,
    };
    moduleProgress.contentProgress.push(contentProgress);
  }

  contentProgress.isCompleted = true;
  contentProgress.lastAccessedAt = new Date();

  if (watchTime !== null) {
    contentProgress.watchTime = watchTime;
  }

  // Calculate module completion
  const module = await Module.findById(moduleId).populate('content');
  const totalContent = module.content.length;
  const completedContent = moduleProgress.contentProgress.filter(cp => cp.isCompleted).length;

  moduleProgress.completionPercentage = Math.round((completedContent / totalContent) * 100);

  if (moduleProgress.completionPercentage === 100 && !moduleProgress.isCompleted) {
    moduleProgress.isCompleted = true;
    moduleProgress.completedAt = new Date();

    // Unlock next module
    await this.unlockNextModule(progress, moduleProgress.module);
  }

  // Update overall completion
  const totalModules = progress.moduleProgress.length;
  const completedModules = progress.moduleProgress.filter(mp => mp.isCompleted).length;
  progress.overallCompletion = Math.round((completedModules / totalModules) * 100);

  // Check if final exam should be unlocked (all modules complete)
  if (progress.overallCompletion === 100) {
    progress.finalExamUnlocked = true;
  }

  await progress.save();

  return progress;
};

/**
 * Unlock next module
 */
exports.unlockNextModule = async (progress, currentModuleId) => {
  const currentIndex = progress.moduleProgress.findIndex(
    mp => mp.module.toString() === currentModuleId.toString()
  );

  if (currentIndex < progress.moduleProgress.length - 1) {
    const nextModule = progress.moduleProgress[currentIndex + 1];

    // Check unlock rules
    const module = await Module.findById(nextModule.module);

    if (module.unlockRules && module.unlockRules.minimumPreviousScore > 0) {
      // Check if previous assessments meet minimum score
      const currentModuleProgress = progress.moduleProgress[currentIndex];
      const lastAttempt = currentModuleProgress.assessmentAttempts[
        currentModuleProgress.assessmentAttempts.length - 1
      ];

      if (!lastAttempt || lastAttempt.score < module.unlockRules.minimumPreviousScore) {
        throw new Error(`Minimum score of ${module.unlockRules.minimumPreviousScore}% required to unlock next module`);
      }
    }

    nextModule.isUnlocked = true;
    await progress.save();
  }
};

/**
 * Record assessment attempt
 */
exports.recordAssessmentAttempt = async (enrollmentId, candidateId, moduleId, assessmentId, score, passed) => {
  const progress = await Progress.findOne({
    enrollment: enrollmentId,
    candidate: candidateId,
  });

  if (!progress) {
    throw new Error('Progress not found');
  }

  const moduleProgress = progress.moduleProgress.find(
    mp => mp.module.toString() === moduleId
  );

  if (!moduleProgress) {
    throw new Error('Module not found in progress');
  }

  moduleProgress.assessmentAttempts.push({
    assessment: assessmentId,
    attemptDate: new Date(),
    score,
    passed,
  });

  await progress.save();

  return progress;
};

module.exports = exports;
