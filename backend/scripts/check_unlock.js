const mongoose = require('mongoose');
require('dotenv').config({ path: 'backend/.env' });

const User = require('../src/models/User');
const Enrollment = require('../src/models/Enrollment');
const Progress = require('../src/models/Progress');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/lms';
const EMAIL = 'candidate@lms.com';

async function check() {
    try {
        await mongoose.connect(MONGO_URI);
        console.error('=== Unlock Status Check ===\n');

        const user = await User.findOne({ email: EMAIL });
        const enrollment = await Enrollment.findOne({ user: user._id }).sort({ createdAt: -1 });
        const progress = await Progress.findOne({ enrollment: enrollment._id });

        console.error(`Enrollment ID: ${enrollment._id}`);
        console.error(`\n=== CURRENT STATE ===`);
        console.error(`Final Exam Unlocked: ${progress.finalExamUnlocked ? 'YES ✓' : 'NO 🔒'}`);
        console.error(`Completed Content: ${progress.completedContent.length}`);
        console.error(`Assessment Scores: ${progress.assessmentScores.length}`);
        console.error(`  Passed Assessments: ${progress.assessmentScores.filter(s => s.passed).length}`);

        if (!progress.finalExamUnlocked) {
            console.error('\n⚠️  Final Exam is LOCKED');
            console.error('Requirements:');
            console.error('  • All content marked complete');
            console.error('  • All module assessments passed');
        } else {
            console.error('\n✓ Final Exam is UNLOCKED!');
        }

    } catch (err) {
        console.error('ERROR:', err.message);
    } finally {
        await mongoose.disconnect();
    }
}

check();
