const mongoose = require('mongoose');
require('dotenv').config({ path: 'backend/.env' });

const User = require('../src/models/User');
const Enrollment = require('../src/models/Enrollment');
const Progress = require('../src/models/Progress');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/lms';
const EMAIL = 'candidate@lms.com';

async function diagnose() {
    try {
        await mongoose.connect(MONGO_URI);
        console.error('=== RAW PROGRESS DATA ===\n');

        const user = await User.findOne({ email: EMAIL });
        const enrollment = await Enrollment.findOne({ user: user._id }).sort({ createdAt: -1 });
        
        console.error(`Enrollment ID: ${enrollment._id}`);
        console.error(`Course ID: ${enrollment.course}\n`);

        // Get progress WITHOUT populate to see raw IDs
        const progressRaw = await Progress.findOne({ enrollment: enrollment._id });
        
        console.error('=== ASSESSMENT SCORES (Raw) ===');
        console.error(JSON.stringify(progressRaw.assessmentScores, null, 2));
        
        console.error('\n=== COMPLETED CONTENT (Raw) ===');
        console.error(JSON.stringify(progressRaw.completedContent, null, 2));
        
        console.error('\n=== MODULE PROGRESS ===');
        progressRaw.moduleProgress.forEach((mp, idx) => {
            console.error(`Module ${idx + 1}:`);
            console.error(`  Module ID: ${mp.module}`);
            console.error(`  Unlocked: ${mp.isUnlocked}`);
            console.error(`  Completed: ${mp.isCompleted}`);
        });

        // Now get WITH populate to see what API returns
        const progressPopulated = await Progress.findOne({ enrollment: enrollment._id })
            .populate('assessmentScores.assessment')
            .populate('completedContent');
        
        console.error('\n=== ASSESSMENT SCORES (Populated) ===');
        progressPopulated.assessmentScores.forEach((score, idx) => {
            console.error(`\nScore ${idx + 1}:`);
            console.error(`  Assessment ID: ${score.assessment?._id || score.assessment}`);
            console.error(`  Assessment Title: ${score.assessment?.title || 'N/A'}`);
            console.error(`  Passed: ${score.passed}`);
            console.error(`  Score: ${score.score}`);
        });

        console.error('\n=== FRONTEND MAPPING TEST ===');
        const newProgress = {};
        
        // Simulate what frontend does
        if (progressPopulated.assessmentScores) {
            progressPopulated.assessmentScores.forEach(score => {
                if (score.passed) {
                    const id = score.assessment?._id || score.assessment;
                    console.error(`  Mapping: ${id} = true`);
                    newProgress[id] = true;
                }
            });
        }
        
        console.error(`\nFrontend Progress State:`, newProgress);

    } catch (err) {
        console.error('ERROR:', err);
    } finally {
        await mongoose.disconnect();
    }
}

diagnose();
