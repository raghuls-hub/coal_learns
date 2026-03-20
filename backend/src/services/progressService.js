const Progress = require('../models/Progress');
const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const Module = require('../models/Module');


/**
 * Initialize Progress for a new Enrollment
 */
exports.initializeProgress = async (enrollmentId, userId, courseId) => {
  // Check if exists
  let progress = await Progress.findOne({ enrollment: enrollmentId });
  if (progress) return progress;

  const course = await Course.findById(courseId).populate('modules');
  if (!course) throw new Error('Course not found');

  // Init module progress
  const moduleProgress = course.modules.map((mod, index) => ({
    module: mod._id,
    isUnlocked: index === 0, // Unlock first module
    isCompleted: false
  }));

  // Race condition safety: Try standard save, but handle duplicate key error if created in parallel
  try {
    progress = new Progress({
      enrollment: enrollmentId,
      user: userId,
      course: courseId,
      completedContent: [],
      moduleProgress,

      courseCompleted: false,
      certificateClaimed: false
    });
    await progress.save();
  } catch (err) {
      if (err.code === 11000) {
          // Duplicate key error - means it was created by another request in parallel. Return that one.
          return await Progress.findOne({ enrollment: enrollmentId });
      }
      throw err;
  }
  console.log("Initialized progress:", progress._id);
  return progress;
};

/**
 * Get Progress
 */
exports.getProgress = async (enrollmentId, userId) => {
  let progress = await Progress.findOne({ enrollment: enrollmentId })
    .populate('completedContent')
    .populate('moduleProgress.module')

  
  if (!progress) {
    // Auto-fix if missing
    const enrollment = await Enrollment.findById(enrollmentId);
    if (enrollment && enrollment.user.toString() === userId) {
      return await exports.initializeProgress(enrollmentId, userId, enrollment.course);
    }
  }
  return progress;
};

/**
 * Mark Content as Completed (Video/PDF)
 */
exports.markContentCompleted = async (enrollmentId, userId, contentId) => {
  console.log(`Marking content: Enr=${enrollmentId}, User=${userId}`);
  const progress = await Progress.findOne({ enrollment: enrollmentId, user: userId });
  if (!progress) {
      console.error("Progress NOT found for query.");
      throw new Error('Progress not found');
  }

  // Idempotent add
  if (!progress.completedContent.includes(contentId)) {
    progress.completedContent.push(contentId);
    progress.lastAccessed = Date.now();
    await progress.save(); // Save first
  }

  // Check if this completes the module
  await exports.checkModuleCompletion(progress, contentId);
  

  
  return progress;
};



/**
 * Internal: Check if Module is Completed
 */
exports.checkModuleCompletion = async (progress, contentId) => {
    const course = await Course.findById(progress.course).populate('modules');
    let hasChanges = false;

    // Helper: list of content IDs in progress
    const completedSet = new Set(progress.completedContent.map(c => c.toString()));

    for (let i = 0; i < course.modules.length; i++) {
        const mod = course.modules[i];
        
        // Find progress entry
        const mp = progress.moduleProgress.find(m => m.module.toString() === mod._id.toString());
        if (!mp) continue; 

        // Check content
        const allContentDone = mod.content.every(cId => completedSet.has(cId.toString()));
        
        if (allContentDone) {
             if (!mp.isCompleted) {
                 console.log(`[Service] Module ${mod._id} Completed! unlocking next.`);
                 mp.isCompleted = true;
                 hasChanges = true;
                 
                 // Unlock NEXT module
                 const nextModIndex = i + 1;
                 if (nextModIndex < progress.moduleProgress.length) {
                     progress.moduleProgress[nextModIndex].isUnlocked = true;
                 }
             }
        }
    }

    if (hasChanges) {
        await progress.save();
        // Check course completion whenever a module is completed
        await exports.checkCourseCompletion(progress);
    }
};

/**
 * Helper to ensure monotonicity (Only set true, never revert to false)
 */
function monotonicSetCompleted(moduleProgress, isCompleted) {
    if (moduleProgress.isCompleted) return; // Already done, stay done
    if (isCompleted) moduleProgress.isCompleted = true;
}

/**
 * Internal: Check Course Completion (Final Exam)
 */
/**
 * Internal: Check Course Completion
 * Triggered when all modules are completed
 */
exports.checkCourseCompletion = async (progress) => {
    const course = await Course.findById(progress.course).populate('modules');
    if (!course) return;

    // Check if ALL modules are completed
    // We can check the boolean flags in progress.moduleProgress
    // But since we just updated them in checkModuleCompletion, we might depend on that.
    // Let's verify against the course module count.
    
    // Check if every module in the course has a corresponding completed entry in progress
    const allModulesCompleted = course.modules.every(mod => {
        const mp = progress.moduleProgress.find(m => m.module.toString() === mod._id.toString());
        return mp && mp.isCompleted;
    });

    if (allModulesCompleted && !progress.courseCompleted) {
        progress.courseCompleted = true;
        await progress.save();
        
        // Refetch course for fresh snapshot
        // (Populate courseHandler as before)
        const courseWithHandler = await Course.findById(progress.course).populate('courseHandler');
        let instructorName = 'Unknown Instructor';
        if (courseWithHandler.courseHandler) {
             const User = require('../models/User');
             if (courseWithHandler.courseHandler.profile) {
                 instructorName = `${courseWithHandler.courseHandler.profile.firstName} ${courseWithHandler.courseHandler.profile.lastName}`;
             } else {
                 const handler = await User.findById(courseWithHandler.courseHandler);
                 if (handler) instructorName = `${handler.profile.firstName} ${handler.profile.lastName}`;
             }
        }

        // Also update Enrollment status AND Snapshot
        await Enrollment.findByIdAndUpdate(progress.enrollment, { 
            status: 'completed',
            progress: 100,
            // [NEW] Persist final snapshot on completion
            courseSnapshot: {
                title: courseWithHandler.title,
                description: courseWithHandler.description,
                thumbnail: courseWithHandler.thumbnail,
                category: courseWithHandler.category,
                level: courseWithHandler.level,
                instructorName: instructorName,
                totalModules: courseWithHandler.modules?.length || 0,
                completedAt: new Date()
            }
         });
         
         console.log('[checkCourseCompletion] Course Completed and Snapshot saved.');
    } else {
         // Update enrollment progress even if not complete
         await exports.updateEnrollmentProgress(progress);
    }
};

/**
 * Check if Final Exam should be unlocked
 * SIMPLIFIED REQUIREMENT:
 * - All mini-assessments (module_assessment) passed
 */


/**
 * Check if Certificate is eligible
 * SIMPLIFIED REQUIREMENTS:
 * 1. All mini-assessments passed
 * 2. Final exam passed
 */


/**
 * Update Enrollment Progress Percentage
 * Calculates based on passed assessments out of total assessments
 */
exports.updateEnrollmentProgress = async (progress) => {
    try {
        const course = await Course.findById(progress.course).populate('modules');
        if (!course) return;

        // Calculate based on CONTENT completion
        let totalContent = 0;
        let completedContentCount = 0;

        // Flatten content
        const allContentIds = [];
        course.modules.forEach(mod => {
            if (mod.content) {
                allContentIds.push(...mod.content);
            }
        });
        
        totalContent = allContentIds.length;
        if (totalContent === 0) return;

        // Count how many are in completedContent
        completedContentCount = allContentIds.filter(cId => 
            progress.completedContent.includes(cId)
        ).length;

        // Calculate percentage
        const percentage = Math.round((completedContentCount / totalContent) * 100);

        console.log(`[updateEnrollmentProgress] ${completedContentCount}/${totalContent} content items completed = ${percentage}%`);

        // Update enrollment
        await Enrollment.findByIdAndUpdate(progress.enrollment, {
            progress: percentage
        });

    } catch (err) {
        console.error('[updateEnrollmentProgress] Error:', err);
    }
};
