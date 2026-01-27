const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Load models first
const User = require('../src/models/User'); // Load User first due to refs
const Course = require('../src/models/Course');
const Module = require('../src/models/Module'); // Often nested 
const Content = require('../src/models/Content');
const Assessment = require('../src/models/Assessment');
const Enrollment = require('../src/models/Enrollment');
const Progress = require('../src/models/Progress');

async function diagnose() {
  try {
    if (!process.env.MONGO_URI) process.env.MONGO_URI = "mongodb://localhost:27017/lms";
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    // Get the most recent enrollment/progress
    // TARGET SPECIFIC ENROLLMENT FROM USER LOGS
    const targetEnrollmentId = "697796006b2be9031a8d5569"; 
    const progress = await Progress.findOne({ enrollment: targetEnrollmentId }).populate('completedContent'); 
    
    if (!progress) {
        console.log(`No progress found for enrollment ${targetEnrollmentId}! trying fallback...`);
        const pFallback = await Progress.findOne().sort({ updatedAt: -1 });
        console.log(`Fallback Progress: ${pFallback?._id}`);
        return;
    }

    console.log(`Diagnosing Progress ID: ${progress._id}`);
    console.log(`Enrollment: ${progress.enrollment}`);
    console.log(`Course: ${progress.course}`);
    console.log(`User: ${progress.user}`);

    // Fetch Course
    const course = await Course.findById(progress.course).populate('modules');
    
    // Check Content Completion
    // Handle populated content
    const completedSet = new Set(progress.completedContent.map(c => (c._id || c).toString()));
    console.log("Completed Content IDs:", Array.from(completedSet));

    console.log("\nStored Assessment Scores:", progress.assessmentScores.map(a => ({
        id: a.assessment.toString(),
        score: a.score,
        passed: a.passed
    })));

    // Look up the MYSTERY assessment attached to the user record
    const storedAssessmentIDs = progress.assessmentScores.map(a => a.assessment);
    const storedAssessments = await Assessment.find({ _id: { $in: storedAssessmentIDs } });
    storedAssessments.forEach(a => console.log(`Stored Assessment Details: ID=${a._id}, Title="${a.title}", Type=${a.type}`));

    console.log("------------------------------------------------");

    for (let i = 0; i < course.modules.length; i++) {
        const mod = course.modules[i];
        
        let modAssessmentInfo = "None";
        if (mod.assessment) {
            const a = await Assessment.findById(mod.assessment);
            modAssessmentInfo = `ID=${mod.assessment}, Title="${a?.title}", Type=${a?.type}`;
        }
        
        console.log(`\n--- Checking Module ${i + 1}: ${mod.title} ---`);
        console.log(`Module Expects Assessment: ${modAssessmentInfo}`);
        
        // 1. Check Content
        const contentStatus = mod.content.map(c => {
            const isDone = completedSet.has(c.toString());
            return `${c}: ${isDone ? 'DONE' : 'MISSING'}`;
        });
        console.log("Content Status:", contentStatus);
        
        const allContentDone = mod.content.every(c => completedSet.has(c.toString()));
        console.log(`All Content Done? ${allContentDone}`);

        // 2. Check Assessment
        let assessmentDone = true;
        if (mod.assessment) {
            console.log(`Module expects Assessment: ${mod.assessment}`);
            const scoreEntry = progress.assessmentScores.find(a => a.assessment.toString() === mod.assessment.toString());
            if (scoreEntry) {
                console.log(`Assessment Entry Found: Score=${scoreEntry.score}, Passed=${scoreEntry.passed}`);
                assessmentDone = scoreEntry.passed;
            } else {
                console.log("Assessment Entry NOT FOUND for this ID.");
                assessmentDone = false;
            }
        } else {
            console.log("No assessment for this module.");
        }
        console.log(`Assessment Done? ${assessmentDone}`);

        // 3. Module Status in Progress
        const mp = progress.moduleProgress.find(m => m.module.toString() === mod._id.toString());
        console.log(`Stored Module Status: isCompleted=${mp?.isCompleted}, isUnlocked=${mp?.isUnlocked}`);

        if (allContentDone && assessmentDone && !mp?.isCompleted) {
            console.error(">>> MISMATCH: Logic says DONE, but Stored is FALSE");
        }
    }

    // Check Final Exam Unlock Rule
    const allModulesStoredDone = progress.moduleProgress.every(m => m.isCompleted);
    console.log(`\nAll Modules Stored Done? ${allModulesStoredDone}`);
    console.log("Final Exam Unlock depends on this.");

  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

diagnose();
