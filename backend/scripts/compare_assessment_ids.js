const mongoose = require('mongoose');
require('dotenv').config({ path: 'backend/.env' });

const User = require('../src/models/User');
const Enrollment = require('../src/models/Enrollment');
const Progress = require('../src/models/Progress');
const Course = require('../src/models/Course');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/lms';
const EMAIL = 'candidate@lms.com';

async function diagnose() {
    try {
        await mongoose.connect(MONGO_URI);
        console.error('=== ASSESSMENT ID COMPARISON ===\n');

        const user = await User.findOne({ email: EMAIL });
        const enrollment = await Enrollment.findOne({ user: user._id }).sort({ createdAt: -1 });
        
        // Get course with populated modules
        const course = await Course.findById(enrollment.course).populate({
            path: 'modules',
            populate: { path: 'assessment' }
        });

        console.error('=== COURSE STRUCTURE ===');
        course.modules.forEach((mod, idx) => {
            console.error(`\nModule ${idx + 1}: ${mod.title}`);
            if (mod.assessment) {
                console.error(`  Assessment ID: ${mod.assessment._id}`);
                console.error(`  Assessment Title: ${mod.assessment.title}`);
            } else {
                console.error(`  No assessment`);
            }
        });

        // Get progress
        const progress = await Progress.findOne({ enrollment: enrollment._id });

        console.error('\n\n=== SAVED ASSESSMENT SCORES ===');
        if (progress.assessmentScores.length === 0) {
            console.error('❌ NO SCORES SAVED!');
        } else {
            progress.assessmentScores.forEach((score, idx) => {
                console.error(`\nScore ${idx + 1}:`);
                console.error(`  Assessment ID: ${score.assessment}`);
                console.error(`  Passed: ${score.passed}`);
                console.error(`  Score: ${score.score}%`);
            });
        }

        console.error('\n\n=== MATCHING CHECK ===');
        course.modules.forEach((mod, idx) => {
            if (mod.assessment) {
                const moduleAssessmentId = mod.assessment._id.toString();
                const scoreEntry = progress.assessmentScores.find(
                    s => s.assessment.toString() === moduleAssessmentId
                );
                
                console.error(`\nModule ${idx + 1}:`);
                console.error(`  Expected ID: ${moduleAssessmentId}`);
                console.error(`  Found in Progress: ${scoreEntry ? '✓ YES' : '❌ NO'}`);
                if (scoreEntry) {
                    console.error(`  Status: ${scoreEntry.passed ? 'PASSED' : 'FAILED'}`);
                }
            }
        });

        console.error('\n\n=== FRONTEND SIMULATION ===');
        const frontendState = {};
        progress.assessmentScores.forEach(score => {
            if (score.passed) {
                frontendState[score.assessment.toString()] = true;
            }
        });
        console.error('Progress state that frontend would create:');
        console.error(JSON.stringify(frontendState, null, 2));

        console.error('\n=== UI RENDER CHECK ===');
        course.modules.forEach((mod, idx) => {
            if (mod.assessment) {
                const moduleAssessmentId = mod.assessment._id.toString();
                const isPassed = frontendState[moduleAssessmentId];
                console.error(`Module ${idx + 1}: Would show "${isPassed ? 'Passed ✓' : 'Take Assessment'}"`);
            }
        });

    } catch (err) {
        console.error('ERROR:', err);
    } finally {
        await mongoose.disconnect();
    }
}

diagnose();
