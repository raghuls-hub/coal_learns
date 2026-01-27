const mongoose = require('mongoose');
require('dotenv').config({ path: 'backend/.env' });

const Course = require('../src/models/Course');
const Progress = require('../src/models/Progress');

async function debug() {
    try {
        await mongoose.connect('mongodb://localhost:27017/lms');
        
        const progress = await Progress.findOne().sort({ createdAt: -1 });
        const course = await Course.findById(progress.course).populate('modules');
        
        console.log('Course ID:', course._id);
        console.log('Title:', course.title);
        console.log('\nModules Populated:', course.modules.length);
        
        course.modules.forEach((mod, idx) => {
            console.log(`\nModule ${idx + 1}:`);
            console.log(`  ID: ${mod._id}`);
            console.log(`  Title: ${mod.title}`);
            console.log(`  Assessment: ${mod.assessment}`);
            console.log(`  Type: ${typeof mod.assessment}`);
        });
        
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await mongoose.disconnect();
    }
}

debug();
