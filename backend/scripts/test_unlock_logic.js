const mongoose = require('mongoose');
require('dotenv').config({ path: 'backend/.env' });

const User = require('../src/models/User');
const Enrollment = require('../src/models/Enrollment');
const Progress = require('../src/models/Progress');
const Course = require('../src/models/Course');
const progressService = require('../src/services/progressService');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/lms';
const EMAIL = 'candidate@lms.com';

async function testUnlockLogic() {
    try {
        await mongoose.connect(MONGO_URI);
        console.error('=== Testing New Unlock Logic ===\n');

        const user = await User.findOne({ email: EMAIL });
        const enrollment = await Enrollment.findOne({ user: user._id }).sort({ createdAt: -1 });
        
        console.error(`User: ${user.email}`);
        console.error(`Enrollment: ${enrollment._id}\n`);

        // Get course structure
        const course = await Course.findById(enrollment.course).populate({
            path: 'modules',
            populate: { path: 'content assessment' }
        });

        console.error(`Course: ${course.title}`);
        console.error(`Modules: ${course.modules.length}\n`);

        // Get current progress
        let progress = await Progress.findOne({ enrollment: enrollment._id });
        if (!progress) {
            console.error('Initializing progress...');
            progress = await progressService.initializeProgress(enrollment._id, user._id, course._id);
        }

        console.error('=== INITIAL STATE ===');
        console.error(`Final Exam Unlocked: ${progress.finalExamUnlocked}`);
        console.error(`Completed Content: ${progress.completedContent.length}`);
        console.error(`Assessment Scores: ${progress.assessmentScores.length}\n`);

        // Test 1: Check unlock with current state
        console.error('=== TEST 1: Check Current Unlock Status ===');
        const unlocked1 = await progressService.checkFinalExamUnlock(progress);
        console.error(`Result: ${unlocked1 ? 'UNLOCKED ✓' : 'LOCKED 🔒'}\n`);

        // Refresh progress
        progress = await Progress.findOne({ enrollment: enrollment._id });

        // Show what's needed
        console.error('=== REQUIREMENTS CHECK ===');
        const completedContentSet = new Set(progress.completedContent.map(c => c.toString()));
        
        for (let i = 0; i < course.modules.length; i++) {
            const mod = course.modules[i];
            console.error(`\nModule ${i + 1}: ${mod.title}`);
            
            // Content check
            const totalContent = mod.content.length;
            const completedCount = mod.content.filter(c => completedContentSet.has(c._id.toString())).length;
            console.error(`  Content: ${completedCount}/${totalContent} ${completedCount === totalContent ? '✓' : '✗'}`);
            
            if (completedCount < totalContent) {
                mod.content.forEach(c => {
                    if (!completedContentSet.has(c._id.toString())) {
                        console.error(`    Missing: ${c.title}`);
                    }
                });
            }
            
            // Assessment check
            if (mod.assessment) {
                const scoreEntry = progress.assessmentScores.find(
                    s => s.assessment.toString() === mod.assessment._id.toString()
                );
                const passed = scoreEntry && scoreEntry.passed;
                console.error(`  Assessment: ${passed ? 'PASSED ✓' : 'NOT PASSED ✗'}`);
            }
        }

        console.error(`\n=== FINAL RESULT ===`);
        console.error(`Final Exam Unlocked: ${progress.finalExamUnlocked ? 'YES ✓' : 'NO 🔒'}`);

        if (!progress.finalExamUnlocked) {
            console.error('\n🔒 To unlock Final Exam:');
            console.error('   • Mark all videos/text as complete');
            console.error('   • Pass all module quizzes');
        }

    } catch (err) {
        console.error('ERROR:', err);
    } finally {
        await mongoose.disconnect();
    }
}

testUnlockLogic();
