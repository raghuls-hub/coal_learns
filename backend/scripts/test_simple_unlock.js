const mongoose = require('mongoose');
require('dotenv').config({ path: 'backend/.env' });

const User = require('../src/models/User');
const Enrollment = require('../src/models/Enrollment');
const progressService = require('../src/services/progressService');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/lms';
const EMAIL = 'candidate@lms.com';
const MODULE1_ASSESSMENT_ID = '69783e5c81200c4c9178ad66';
const MODULE2_ASSESSMENT_ID = '69783e5c81200c4c9178ad6e';

async function testNewLogic() {
    try {
        await mongoose.connect(MONGO_URI);
        console.error('=== Testing SIMPLIFIED Unlock Logic ===\n');

        const user = await User.findOne({ email: EMAIL });
        const enrollment = await Enrollment.findOne({ user: user._id }).sort({ createdAt: -1 });
        
        console.error(`Testing for: ${user.email}`);
        console.error(`Enrollment: ${enrollment._id}\n`);

        // Submit Module 1 Assessment
        console.error('--- Submitting Module 1 Quiz (100%, Passed) ---');
        await progressService.updateAssessmentResult(
            enrollment._id,
            user._id,
            MODULE1_ASSESSMENT_ID,
            100,
            true
        );

        // Check status
        const Progress = require('../src/models/Progress');
        let progress = await Progress.findOne({ enrollment: enrollment._id });
        
        console.error(`After Module 1:`);
        console.error(`  Assessment Scores: ${progress.assessmentScores.length}`);
        console.error(`  Final Exam Unlocked: ${progress.finalExamUnlocked ? 'YES ✓' : 'NO 🔒'}`);
        console.error(`  Expected: NO (need all modules)\n`);

        // Submit Module 2 Assessment
        console.error('--- Submitting Module 2 Quiz (100%, Passed) ---');
        await progressService.updateAssessmentResult(
            enrollment._id,
            user._id,
            MODULE2_ASSESSMENT_ID,
            100,
            true
        );

        // Check status again
        progress = await Progress.findOne({ enrollment: enrollment._id });
        
        console.error(`After Module 2:`);
        console.error(`  Assessment Scores: ${progress.assessmentScores.length}`);
        console.error(`  Final Exam Unlocked: ${progress.finalExamUnlocked ? 'YES ✓' : 'NO 🔒'}`);
        console.error(`  Expected: YES (all assessments passed)\n`);

        if (progress.finalExamUnlocked) {
            console.error('✅ SUCCESS! Final Exam unlocked after passing all quizzes!');
        } else {
            console.error('❌ FAILED! Final Exam still locked.');
        }

    } catch (err) {
        console.error('ERROR:', err);
    } finally {
        await mongoose.disconnect();
    }
}

testNewLogic();
