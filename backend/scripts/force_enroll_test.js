const mongoose = require('mongoose');
require('dotenv').config({ path: 'backend/.env' });

const User = require('../src/models/User');
const Course = require('../src/models/Course');
const Enrollment = require('../src/models/Enrollment');
const Progress = require('../src/models/Progress');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/lms';
const EMAIL = 'candidate@lms.com';
const COURSE_TITLE = 'Complete Python Mastery (Test)';

async function enroll() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to DB');

        const user = await User.findOne({ email: EMAIL });
        if (!user) throw new Error('User not found');

        // 1. Find Correct Course
        const course = await Course.findOne({ title: COURSE_TITLE });
        if (!course) throw new Error(`Course '${COURSE_TITLE}' not found`);
        console.log(`Target Course: ${course.title} (${course._id})`);

        // 2. Delete ALL existing enrollments/progress for this user
        console.log('Deleting ALL existing enrollments for user...');
        await Enrollment.deleteMany({ user: user._id });
        await Progress.deleteMany({ user: user._id });
        
        // 3. Create NEW Enrollment
        console.log('Creating fresh enrollment...');
        const enrollment = await Enrollment.create({
            user: user._id,
            course: course._id,
            totalPrice: 0,
            amountPaid: 0,
            paymentMethod: 'manual_verification',
            paymentStatus: 'completed',
            status: 'active',
            progress: 0
        });
        
        console.log(`Enrolled! ID: ${enrollment._id}`);
        console.log('Please ask user to refresh "My Learning".');

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

enroll();
