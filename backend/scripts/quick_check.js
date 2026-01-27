const mongoose = require('mongoose');
require('dotenv').config({ path: 'backend/.env' });

async function check() {
    try {
        await mongoose.connect('mongodb://localhost:27017/lms');
        
        const Progress = mongoose.model('Progress');
        const progress = await Progress.findOne().sort({ createdAt: -1 });
        
        console.log('Unlock Status:', progress.finalExamUnlocked);
        console.log('Scores:', progress.assessmentScores.length);
        
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await mongoose.disconnect();
    }
}

check();
