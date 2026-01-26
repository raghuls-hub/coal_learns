const Progress = require('../models/Progress');
const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const Module = require('../models/Module');
const mongoose = require('mongoose');

/**
 * Get or Create Progress for an Enrollment
 */
exports.getProgress = async (enrollmentId, candidateId) => {
  // 1. Try to find existing progress
  let progress = await Progress.findOne({ enrollment: enrollmentId })
    .populate({
      path: 'moduleProgress.module',
      select: 'title order'
    });

  if (progress) {
    return progress;
  }

  // 2. If not found, create new progress
  // Fetch Enrollment to get Course and User
  const enrollment = await Enrollment.findById(enrollmentId);
  if (!enrollment) {
    throw new Error('Enrollment not found');
  }

  if (enrollment.user.toString() !== candidateId) {
    throw new Error('Unauthorized access to enrollment');
  }

  // Fetch Course Structure (Modules -> Content)
  // We need to initialize the progress structure to match the course
  const course = await Course.findById(enrollment.course)
    .populate({
      path: 'modules',
      select: 'content assessment order',
      populate: {
        path: 'content',
        select: '_id type' // We just need ID to init
      }
    });

  if (!course) {
    throw new Error('Course not found');
  }

  // Initialize Module Progress
  const moduleProgress = course.modules.map((mod, index) => {
    // Unlock first module by default
    const isUnlocked = index === 0;

    return {
      module: mod._id,
      isUnlocked: isUnlocked,
      isCompleted: false,
      completionPercentage: 0,
      contentProgress: mod.content ? mod.content.map(c => ({
        content: c._id,
        isCompleted: false,
        watchTime: 0
      })) : []
    };
  });

  console.log('Creating Progress with:', {
    enrollment: enrollmentId,
    candidate: candidateId,
    course: enrollment.course
  });

  progress = new Progress({
    enrollment: enrollmentId,
    candidate: candidateId, // ensure this is just the ID
    course: enrollment.course,
    moduleProgress: moduleProgress,
    overallCompletion: 0,
    finalExamUnlocked: false
  });

  try {
      await progress.save();
  } catch (err) {
      console.error('Progress Save Error:', err);
      throw err;
  }
  
  // Return populated structure
  return await Progress.findById(progress._id).populate({
    path: 'moduleProgress.module',
    select: 'title order'
  });
};

/**
 * Mark Content as Complete
 */
exports.markContentComplete = async (enrollmentId, candidateId, moduleId, contentId, watchTime = 0) => {
  // 1. Fetch Progress
  const progress = await Progress.findOne({ enrollment: enrollmentId, candidate: candidateId });
  if (!progress) {
    // Should exist if getProgress was called, but safety check
    // If not, we could call getProgress here, but cleaner to fail.
    throw new Error('Progress record not found. Please load course first.');
  }

  // 2. Find the module entry
  const modIdx = progress.moduleProgress.findIndex(mp => mp.module.toString() === moduleId);
  if (modIdx === -1) {
    throw new Error('Module not found in progress tracking');
  }

  // 3. Find/Create content entry
  const modProgress = progress.moduleProgress[modIdx];
  
  // Check if content exists in tracking (it might be new content added to course)
  let contentIdx = modProgress.contentProgress.findIndex(cp => cp.content && cp.content.toString() === contentId);
  
  if (contentIdx === -1) {
    // Add it dynamically if missing (robustness)
    modProgress.contentProgress.push({
      content: contentId,
      isCompleted: true,
      watchTime,
      lastAccessedAt: new Date()
    });
  } else {
    modProgress.contentProgress[contentIdx].isCompleted = true;
    modProgress.contentProgress[contentIdx].watchTime = Math.max(modProgress.contentProgress[contentIdx].watchTime, watchTime);
    modProgress.contentProgress[contentIdx].lastAccessedAt = new Date();
  }

  // 4. Recalculate Module Completion
  // We need to know TOTAL content count. 
  // Ideally, we fetch the module from DB to get current true content list.
  const moduleDoc = await Module.findById(moduleId).populate('content');
  if (moduleDoc && moduleDoc.content.length > 0) {
    const totalItems = moduleDoc.content.length;
    // Count completed items that are actually in the current module
    const completedCount = moduleDoc.content.reduce((acc, item) => {
      const isDone = modProgress.contentProgress.some(cp => 
        cp.content.toString() === item._id.toString() && cp.isCompleted
      );
      return acc + (isDone ? 1 : 0);
    }, 0);

    modProgress.completionPercentage = Math.round((completedCount / totalItems) * 100);
    modProgress.isCompleted = modProgress.completionPercentage === 100;
  } else {
    // If no content, mark complete
    modProgress.completionPercentage = 100;
    modProgress.isCompleted = true;
  }

  // 5. Unlock Logic (Next Module)
  if (modProgress.isCompleted) {
    // Find next module index in the ARRAY (assuming array order matches course order, which we inited)
    // Better: Fetch Course and check order.
    // For now, simple array logic:
    if (modIdx + 1 < progress.moduleProgress.length) {
      progress.moduleProgress[modIdx + 1].isUnlocked = true;
    }
  }

  // 6. Recalculate Overall Completion & Final Exam Unlock
  // Fetch Course to get ALL modules
  const course = await Course.findById(progress.course).populate('modules');
  if (course) {
    const totalModules = course.modules.length;
    let completedModules = 0;
    
    // Check completion of each module
    for (const mod of course.modules) {
      const p = progress.moduleProgress.find(mp => mp.module.toString() === mod._id.toString());
      if (p && p.isCompleted) completedModules++;
    }

    const overall = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;
    progress.overallCompletion = overall;

    // Unlock Final Exam
    if (overall === 100) {
      progress.finalExamUnlocked = true;
    }

    // Update Enrollment progress too
    await Enrollment.findByIdAndUpdate(enrollmentId, { progress: overall });
  }

  await progress.save();
  return progress;
};
