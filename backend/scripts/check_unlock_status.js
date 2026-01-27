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
        console.error('Connected to DB\n');

        const user = await User.findOne({ email: EMAIL });
        if (!user) throw new Error('User not found');

        const enrollment = await Enrollment.findOne({ user: user._id }).populate('course');
        if (!enrollment) throw new Error('No enrollment found');

        console.error(`=== ENROLLMENT ===`);
        console.error(`Course: ${enrollment.course.title}`);
        console.error(`Enrollment ID: ${enrollment._id}\n`);

        const progress = await Progress.findOne({ enrollment: enrollment._id })
            .populate('completedContent')
            .populate('moduleProgress.module')
            .populate('assessmentScores.assessment');

        if (!progress) throw new Error('No progress found');

        const course = await Course.findById(enrollment.course._id)
            .populate('modules')
            .populate({
                path: 'modules',
                populate: { path: 'content assessment' }
            });

        console.error(`=== COURSE STRUCTURE ===`);
        course.modules.forEach((mod, idx) => {
            console.error(`\nModule ${idx + 1}: ${mod.title}`);
            console.error(`  Content Items: ${mod.content.length}`);
            mod.content.forEach(c => console.error(`    - ${c.title} (${c._id})`));
            if (mod.assessment) {
                console.error(`  Assessment: ${mod.assessment.title} (${mod.assessment._id})`);
            }
        });

        console.error(`\n=== YOUR PROGRESS ===`);
        console.error(`Completed Content (${progress.completedContent.length}):`);
        progress.completedContent.forEach(c => {
            const title = c.title || c._id;
            console.error(`  ✓ ${title}`);
        });

        console.error(`\nAssessment Scores (${progress.assessmentScores.length}):`);
        progress.assessmentScores.forEach(s => {
            const title = s.assessment?.title || s.assessment;
            console.error(`  ${s.passed ? '✓' : '✗'} ${title} - Score: ${s.score}%`);
        });

        console.error(`\n=== MODULE COMPLETION STATUS ===`);
        course.modules.forEach((mod, idx) => {
            const mp = progress.moduleProgress[idx];
            console.error(`\nModule ${idx + 1}: ${mod.title}`);
            console.error(`  Unlocked: ${mp.isUnlocked}`);
            console.error(`  Completed: ${mp.isCompleted}`);
            
            // Check what's missing
            const contentIds = mod.content.map(c => c._id.toString());
            const completedIds = progress.completedContent.map(c => c._id.toString());
            const missingContent = contentIds.filter(id => !completedIds.includes(id));
            
            if (missingContent.length > 0) {
                console.error(`  ⚠️  Missing Content:`);
                missingContent.forEach(id => {
                    const content = mod.content.find(c => c._id.toString() === id);
                    console.error(`      - ${content.title}`);
                });
            }
            
            if (mod.assessment) {
                const scoreEntry = progress.assessmentScores.find(
                    s => s.assessment._id.toString() === mod.assessment._id.toString()
                );
                if (!scoreEntry || !scoreEntry.passed) {
                    console.error(`  ⚠️  Assessment NOT Passed`);
                } else {
                    console.error(`  ✓ Assessment Passed (${scoreEntry.score}%)`);
                }
            }
        });

        console.error(`\n=== FINAL EXAM UNLOCK ===`);
        const allModulesComplete = progress.moduleProgress.every(m => m.isCompleted);
        console.error(`All Modules Complete: ${allModulesComplete}`);
        console.error(`Final Exam Status: ${allModulesComplete ? 'UNLOCKED ✓' : 'LOCKED 🔒'}`);

        if (!allModulesComplete) {
            console.error(`\n⚠️  TO UNLOCK FINAL EXAM:`);
            progress.moduleProgress.forEach((mp, idx) => {
                if (!mp.isCompleted) {
                    console.error(`  - Complete Module ${idx + 1}: ${course.modules[idx].title}`);
                }
            });
        }

    } catch (err) {
        console.error('ERROR:', err.message);
    } finally {
        await mongoose.disconnect();
    }
}

diagnose();
