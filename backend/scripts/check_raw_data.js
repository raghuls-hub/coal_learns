const mongoose = require('mongoose');
require('dotenv').config({ path: 'backend/.env' });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/lms';

async function check() {
    try {
        await mongoose.connect(MONGO_URI);
        const db = mongoose.connection.db;
        
        // Get the test course
        const course = await db.collection('courses').findOne({ title: 'Complete Python Mastery (Test)' });
        
        console.error('=== COURSE MODULES ===\n');
        console.error(`Course: ${course.title}`);
        console.error(`Modules: ${course.modules.length}\n`);
        
        for (let i = 0; i < course.modules.length; i++) {
            const modId = course.modules[i];
            const mod = await db.collection('modules').findOne({ _id: modId });
            
            console.error(`Module ${i + 1}:`);
            console.error(`  Title: ${mod.title}`);
            console.error(`  Module ID: ${mod._id}`);
            if (mod.assessment) {
                const assessment = await db.collection('assessments').findOne({ _id: mod.assessment });
                console.error(`  Assessment: ${assessment.title}`);
                console.error(`  Assessment ID: ${mod.assessment}`);
            } else {
                console.error(`  No assessment`);
            }
            console.error('');
        }
        
        // Check what's in progress
        const progress = await db.collection('progresses').findOne({ 
            enrollment: new mongoose.Types.ObjectId('697843b3576e7b4dc5aeb483')
        });
        
        console.error('\n=== PROGRESS DATA ===');
        console.error(`Assessment Scores Saved: ${progress.assessmentScores.length}`);
        progress.assessmentScores.forEach((score, idx) => {
            console.error(`  ${idx + 1}. Assessment ${score.assessment} - Passed: ${score.passed}`);
        });
        
    } catch (err) {
        console.error('ERROR:', err.message);
    } finally {
        await mongoose.disconnect();
    }
}
check();
