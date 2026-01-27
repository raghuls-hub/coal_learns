const mongoose = require('mongoose');
require('dotenv').config({ path: 'backend/.env' });

const User = require('../src/models/User');
const Enrollment = require('../src/models/Enrollment');
const Progress = require('../src/models/Progress');
const Course = require('../src/models/Course');
const Assessment = require('../src/models/Assessment');
const progressService = require('../src/services/progressService');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/lms';
const EMAIL = 'candidate@lms.com';

async function test() {
    try {
        await mongoose.connect(MONGO_URI);
        console.error('===Testing Assessment Submission Flow===\n');

        const user = await User.findOne({ email: EMAIL });
        const enrollment = await Enrollment.findOne({ user: user._id }).sort({ createdAt: -1 });
        
        console.error(`User: ${user.email}`);
        console.error(`Enrollment ID: ${enrollment._id}\n`);

        // Get course and first assessment
        const course = await Course.findById(enrollment.course).populate({
            path: 'modules',
            populate: { path: 'assessment' }
        });

        const module1 = course.modules[0];
        const assessment = module1.assessment;

        console.error(`Module 1: ${module1.title}`);
        console.error(`Assessment: ${assessment.title} (${assessment._id})\n`);

        // Initialize or get progress
        let progress = await Progress.findOne({ enrollment: enrollment._id });
        if (!progress) {
            console.error('Initializing progress...');
            progress = await progressService.initializeProgress(enrollment._id, user._id, course._id);
        }

        console.error('=== BEFORE Submission ===');
        console.error(`Assessment Scores: ${progress.assessmentScores.length}`);

        // Simulate submission
        console.error('\nSimulating assessment submission...');
        await progressService.updateAssessmentResult(
            enrollment._id,
            user._id,
            assessment._id,
            100, // score
            true  // passed
        );

        // Fetch updated progress
        progress = await Progress.findOne({ enrollment: enrollment._id })
            .populate('assessmentScores.assessment');

        console.error('\n=== AFTER Submission ===');
        console.error(`Assessment Scores: ${progress.assessmentScores.length}`);
        
        if (progress.assessmentScores.length > 0) {
            const score = progress.assessmentScores[0];
            console.error(`\nFirst Score:`);
            console.error(`  Assessment: ${score.assessment?.title || score.assessment}`);
            console.error(`  Assessment ID: ${score.assessment?._id || score.assessment}`);
            console.error(`  Passed: ${score.passed}`);
            console.error(`  Score: ${score.score}%`);

            // Test frontend mapping
            console.error(`\n=== Frontend Mapping Test ===`);
            const id = score.assessment?._id || score.assessment;
            console.error(`Would map: progress["${id}"] = true`);
        }

        // Check module completion
        console.error(`\n=== Module Completion ===`);
        progress.moduleProgress.forEach((mp, idx) => {
            console.error(`Module ${idx + 1}: Completed = ${mp.isCompleted}`);
        });

    } catch (err) {
        console.error('ERROR:', err);
    } finally {
        await mongoose.disconnect();
    }
}

test();
