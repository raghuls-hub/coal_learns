const Progress = require('../models/Progress');
const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const Module = require('../models/Module');
const Assessment = require('../models/Assessment');

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
      assessmentScores: [],
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
    .populate('assessmentScores.assessment');
  
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
  await this.checkModuleCompletion(progress, contentId);
  
  // Check if Final Exam should unlock
  await this.checkFinalExamUnlock(progress);
  
  return progress;
};

/**
 * Update Assessment Result
 */
exports.updateAssessmentResult = async (enrollmentId, userId, assessmentId, score, passed) => {
  const progress = await Progress.findOne({ enrollment: enrollmentId, user: userId });
  if (!progress) throw new Error('Progress not found');

  // Find existing score entry
  const existingIndex = progress.assessmentScores.findIndex(a => a.assessment.toString() === assessmentId.toString());

  if (existingIndex > -1) {
    const entry = progress.assessmentScores[existingIndex];
    // Monotonic: If already passed, keep passed. Update score only if higher.
    if (!entry.passed && passed) {
        entry.passed = true;
    }
    // Update score if higher
    if (score > entry.score) {
        entry.score = score;
    }
    entry.attempts += 1;
    entry.lastAttemptDate = Date.now();
  } else {
    progress.assessmentScores.push({
      assessment: assessmentId,
      score: score,
      passed: passed,
      attempts: 1,
      lastAttemptDate: Date.now()
    });
  }

  await progress.save();

  // Update enrollment progress percentage
  await this.updateEnrollmentProgress(progress);

  // Check Logic
  await this.checkCourseCompletion(progress, assessmentId);
  
  return progress;
};

/**
 * Internal: Check if Module is Completed
 */
exports.checkModuleCompletion = async (progress, contentId) => {
    // We need to find which module controls this content or assessment.
    // Ideally we look up the Module, but we can also iterate the course structure.
    // For efficiency, let's look up the module of the content.
    // Actually, usually the frontend passes ModuleID, but our API spec was contentId only.
    // Let's rely on Course structure.
    
    // Easier: Check ALL modules? Or just the current one?
    // Let's re-eval all modules to be safe/consistent.
    
    const course = await Course.findById(progress.course).populate('modules');
    let hasChanges = false;

    // Helper: list of content IDs in progress
    const completedSet = new Set(progress.completedContent.map(c => c.toString()));

    for (let i = 0; i < course.modules.length; i++) {
        const mod = course.modules[i];
        
        // Find progress entry
        const mp = progress.moduleProgress.find(m => m.module.toString() === mod._id.toString());
        if (!mp) continue; // Should exist

        // Debug Log
        // console.log(`Checking Module ${mod.title}: Current Status=${mp.isCompleted}`);

        // if (!mp.isCompleted) { // Force re-check even if true? No, we use monotonic helper now.
        // Actually, let's allow re-check to confirm it SHOULD be true.
            
            // Check content
            const contentDebug = mod.content.map(cId => ({id: cId, done: completedSet.has(cId.toString())}));
            const allContentDone = mod.content.every(cId => completedSet.has(cId.toString()));
            
            // Check assessment (if Module Assessment exists)
            let assessmentDone = true;
            if (mod.assessment) {
                const scoreEntry = progress.assessmentScores.find(a => a.assessment.toString() === mod.assessment.toString());
                assessmentDone = scoreEntry && scoreEntry.passed;
                // console.log(`Module Assessment ${mod.assessment}: Passed=${assessmentDone}`);
            }

            if (allContentDone && assessmentDone) {
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
            } else {
                // Log WHY it's not done if we think it might be
                // if (allContentDone) console.log(`[Service] Content done but Assessment not passed for Module ${mod._id}`);
                // if (!allContentDone) console.log(`[Service] Content incomplete for Module ${mod._id}`, contentDebug.filter(x => !x.done));
            }
        // }
    }

    if (hasChanges) await progress.save();
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
exports.checkCourseCompletion = async (progress, assessmentId) => {
    // Check if this assessment was the final exam
    const assessment = await Assessment.findById(assessmentId);
    if (assessment && assessment.type === 'final_exam') {
        const entry = progress.assessmentScores.find(a => a.assessment.toString() === assessmentId.toString());
        if (entry && entry.passed) {
            progress.courseCompleted = true;
            await progress.save();
            
            // Also update Enrollment status
            await Enrollment.findByIdAndUpdate(progress.enrollment, { 
                status: 'completed',
                progress: 100
             });
        }
    }

    // Also trigger module check in case this was a module assessment
    if (assessment && assessment.type === 'module_assessment') {
        // finding the module is hard without back-ref, but we can do a global check
        // checkModuleCompletion does global check
        await this.checkModuleCompletion(progress, null);
    }
    
    // Check Final Exam unlock status after any assessment
    await this.checkFinalExamUnlock(progress);
};

/**
 * Check if Final Exam should be unlocked
 * SIMPLIFIED REQUIREMENT:
 * - All mini-assessments (module_assessment) passed
 */
exports.checkFinalExamUnlock = async (progress) => {
    try {
        const course = await Course.findById(progress.course).populate('modules');
        if (!course) {
            console.error('[checkFinalExamUnlock] Course not found');
            return false;
        }

        console.log('[checkFinalExamUnlock] Checking unlock for enrollment:', progress.enrollment);
        
        // Check each module for its assessment
        for (const module of course.modules) {
            // Check if module has assessment
            if (module.assessment) {
                const scoreEntry = progress.assessmentScores.find(
                    s => s.assessment.toString() === module.assessment.toString()
                );
                
                if (!scoreEntry || !scoreEntry.passed) {
                    console.log(`[checkFinalExamUnlock] Module ${module.title} assessment NOT passed`);
                    progress.finalExamUnlocked = false;
                    await progress.save();
                    return false;
                }
                
                console.log(`[checkFinalExamUnlock] Module ${module.title} assessment PASSED ✓`);
            }
        }
        
        // All assessments passed - unlock Final Exam
        console.log('[checkFinalExamUnlock] All assessments passed - UNLOCKING Final Exam');
        progress.finalExamUnlocked = true;
        await progress.save();
        return true;
        
    } catch (err) {
        console.error('[checkFinalExamUnlock] Error:', err);
        return false;
    }
};

/**
 * Check if Certificate is eligible
 * SIMPLIFIED REQUIREMENTS:
 * 1. All mini-assessments passed
 * 2. Final exam passed
 */
exports.checkCertificateEligibility = async (progress) => {
    try {
        const course = await Course.findById(progress.course).populate('modules');
        if (!course) return false;
        
        // Check all module assessments are passed
        for (const module of course.modules) {
            if (module.assessment) {
                const scoreEntry = progress.assessmentScores.find(
                    s => s.assessment.toString() === module.assessment.toString()
                );
                
                if (!scoreEntry || !scoreEntry.passed) return false;
            }
        }
        
        // Check if final exam is passed
        for (const score of progress.assessmentScores) {
            const assessment = await Assessment.findById(score.assessment);
            if (assessment && assessment.type === 'final_exam' && score.passed) {
                return true;
            }
        }
        
        return false;
        
    } catch (err) {
        console.error('[checkCertificateEligibility] Error:', err);
        return false;
    }
};

/**
 * Update Enrollment Progress Percentage
 * Calculates based on passed assessments out of total assessments
 */
exports.updateEnrollmentProgress = async (progress) => {
    try {
        const course = await Course.findById(progress.course).populate('modules');
        if (!course) return;

        // Count total assessments (module assessments only - final exam counts for completion, not progress)
        let totalAssessments = 0;
        let passedAssessments = 0;

        // Count module assessments
        for (const module of course.modules) {
            if (module.assessment) {
                totalAssessments++;
                const scoreEntry = progress.assessmentScores.find(
                    s => s.assessment.toString() === module.assessment.toString() && s.passed
                );
                if (scoreEntry) passedAssessments++;
            }
        }

        // If no assessments at all, default to user progress metric
        if (totalAssessments === 0) {
            console.log('[updateEnrollmentProgress] No assessments found, skipping update');
            return;
        }

        // Calculate percentage
        const percentage = Math.round((passedAssessments / totalAssessments) * 100);

        console.log(`[updateEnrollmentProgress] ${passedAssessments}/${totalAssessments} assessments passed = ${percentage}%`);

        // Update enrollment
        await Enrollment.findByIdAndUpdate(progress.enrollment, {
            progress: percentage
        });

    } catch (err) {
        console.error('[updateEnrollmentProgress] Error:', err);
    }
};
