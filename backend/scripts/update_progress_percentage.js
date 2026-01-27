const mongoose = require('mongoose');
require('dotenv').config({ path: 'backend/.env' });

const User = require('../src/models/User');
const Enrollment = require('../src/models/Enrollment');
const Progress = require('../src/models/Progress');
const progressService = require('../src/services/progressService');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/lms';
const EMAIL = 'candidate@lms.com';

async function updateProgress() {
    try {
        await mongoose.connect(MONGO_URI);
        console.error('=== Updating Progress Percentage ===\n');

        const user = await User.findOne({ email: EMAIL });
        const enrollment = await Enrollment.findOne({ user: user._id }).sort({ createdAt: -1 });
        const progress = await Progress.findOne({ enrollment: enrollment._id });

        console.error(`Enrollment: ${enrollment._id}`);
        console.error(`Progress Before: ${enrollment.progress || 0}%\n`);

        // Trigger progress update
        await progressService.updateEnrollmentProgress(progress);

        // Fetch updated enrollment
        const updated = await Enrollment.findById(enrollment._id);
        console.error(`Progress After: ${updated.progress}%`);

        if (updated.progress > 0) {
            console.error('\n✅ SUCCESS! Progress percentage updated!');
        }

    } catch (err) {
        console.error('ERROR:', err.message);
    } finally {
        await mongoose.disconnect();
    }
}

updateProgress();
