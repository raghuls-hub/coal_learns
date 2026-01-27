const mongoose = require('mongoose');
require('dotenv').config({ path: 'backend/.env' });

const User = require('../src/models/User');
const Enrollment = require('../src/models/Enrollment');
const progressService = require('../src/services/progressService');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/lms';
const EMAIL = 'candidate@lms.com';
const MODULE2_ASSESSMENT_ID = '69783e5c81200c4c9178ad6e';

async function submitModule2() {
    try {
        await mongoose.connect(MONGO_URI);
        console.error('=== Manually Submitting Module 2 Assessment ===\n');

        const user = await User.findOne({ email: EMAIL });
        const enrollment = await Enrollment.findOne({ user: user._id }).sort({ createdAt: -1 });
        
        console.error(`User: ${user.email}`);
        console.error(`Enrollment: ${enrollment._id}`);
        console.error(`Submitting Assessment: ${MODULE2_ASSESSMENT_ID}\n`);

        // Submit with 100% score
        await progressService.updateAssessmentResult(
            enrollment._id,
            user._id,
            MODULE2_ASSESSMENT_ID,
            100,
            true
        );

        console.error('✓ Module 2 Assessment submitted successfully!\n');

        // Verify it was saved
        const Progress = require('../src/models/Progress');
        const progress = await Progress.findOne({ enrollment: enrollment._id });

        console.error('=== Saved Scores ===');
        progress.assessmentScores.forEach((score, idx) => {
            console.error(`${idx + 1}. ${score.assessment} - Passed: ${score.passed}`);
        });

        console.error('\n=== Module Completion Status ===');
        progress.moduleProgress.forEach((mp, idx) => {
            console.error(`Module ${idx + 1}: Completed = ${mp.isCompleted}`);
        });

        const allComplete = progress.moduleProgress.every(m => m.isCompleted);
        console.error(`\nFinal Exam Unlocked: ${allComplete ? 'YES ✓' : 'NO'}`);

    } catch (err) {
        console.error('ERROR:', err.message);
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

submitModule2();
