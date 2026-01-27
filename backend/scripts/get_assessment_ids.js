const mongoose = require('mongoose');
require('dotenv').config({ path: 'backend/.env' });
const Course = require('../src/models/Course');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/lms';

async function check() {
    try {
        await mongoose.connect(MONGO_URI);
        
        const course = await Course.findOne({ title: 'Complete Python Mastery (Test)' })
            .populate({ path: 'modules', populate: { path: 'assessment' } });
        
        console.error('=== MODULE ASSESSMENTS ===\n');
        course.modules.forEach((mod, idx) => {
            console.error(`Module ${idx + 1}: ${mod.title}`);
            if (mod.assessment) {
                console.error(`  Assessment: ${mod.assessment.title}`);
                console.error(`  ID: ${mod.assessment._id}`);
            }
            console.error('');
        });
        
    } catch (err) {
        console.error('ERROR:', err.message);
    } finally {
        await mongoose.disconnect();
    }
}
check();
