const mongoose = require('mongoose');
require('dotenv').config({ path: 'backend/.env' });

const User = require('../src/models/User');
const Enrollment = require('../src/models/Enrollment');
const Progress = require('../src/models/Progress');
const progressService = require('../src/services/progressService');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/lms';
const EMAIL = 'candidate@lms.com';

async function forceUnlockCheck() {
    try {
        await mongoose.connect(MONGO_URI);
        console.error('=== Force Unlock Check ===\n');

        const user = await User.findOne({ email: EMAIL });
        const enrollment = await Enrollment.findOne({ user: user._id }).sort({ createdAt: -1 });
        let progress = await Progress.findOne({ enrollment: enrollment._id });

        console.error(`Enrollment: ${enrollment._id}`);
        console.error(`\nBEFORE:`);
        console.error(`  finalExamUnlocked: ${progress.finalExamUnlocked}`);
        console.error(`  Assessment Scores: ${progress.assessmentScores.length}`);
        progress.assessmentScores.forEach((s, i) => {
            console.error(`    ${i + 1}. ${s.assessment} - Passed: ${s.passed}`);
        });

        console.error('\n--- Calling checkFinalExamUnlock() ---');
        const result = await progressService.checkFinalExamUnlock(progress);
        console.error(`Result: ${result}\n');

        // Reload from database
        progress = await Progress.findOne({ enrollment: enrollment._id });
        
        console.error(`AFTER:`);
        console.error(`  finalExamUnlocked: ${progress.finalExamUnlocked}`);
        
        if (progress.finalExamUnlocked) {
            console.error('\n✅ SUCCESS! Final Exam is now UNLOCKED!');
        } else {
            console.error('\n❌ FAILED! Final Exam is still LOCKED.');
            console.error('Check backend logs for [checkFinalExamUnlock] errors');
        }

    } catch (err) {
        console.error('\nERROR:', err);
        console.error(err.stack);
    } finally {
        await mongoose.disconnect();
    }
}

forceUnlockCheck();
