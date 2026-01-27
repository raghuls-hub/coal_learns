require('dotenv').config();
const mongoose = require('mongoose');
const Certificate = require('../src/models/Certificate');
const Enrollment = require('../src/models/Enrollment');
const Course = require('../src/models/Course');
const User = require('../src/models/User'); // Ensure User model is loaded
const certificateService = require('../src/services/certificateService');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected');
    } catch (err) {
        console.error('DB Connection Failed', err);
        process.exit(1);
    }
};

const runDebug = async () => {
    await connectDB();

    try {
        // 1. Find Candidate
        const candidateEmail = 'candidate@lms.com';
        const candidate = await User.findOne({ email: candidateEmail });
        if (!candidate) {
            console.error('Candidate not found:', candidateEmail);
            return;
        }
        console.log('Found Candidate:', candidate._id, candidate.email);

        // 2. Find Enrollments for Candidate
        const enrollments = await Enrollment.find({ user: candidate._id }).populate('course');
        console.log(`Found ${enrollments.length} enrollments`);

        if (enrollments.length === 0) {
            console.log('No enrollments to test.');
            return;
        }

        // 3. Try generating certificate for the first enrollment
        // Or specific one if we knew the ID. Let's try ALL.
        for (const enroll of enrollments) {
            console.log(`\nTesting Enrollment: ${enroll._id} (Course: ${enroll.course ? enroll.course.title : 'Unknown'})`);
            
            try {
                // Check if progress allows? 
                // The User said "finishes the final exam". 
                // We'll skip the Exam check for a moment and just CHECK if certificateService works.
                // If this works, then the issue is in assessmentController (the trigger).
                // If this FAILS, the issue is in certificateService (the generator).

                console.log('Attempting generateCertificate()...');
                const cert = await certificateService.generateCertificate(enroll._id);
                console.log('SUCCESS! Certificate generated:', cert.certificateId);
            } catch (err) {
                console.error('FAILURE in generateCertificate:', err.message);
                console.error(err);
            }
        }

    } catch (err) {
        console.error('Global Debug Error:', err);
    } finally {
        await mongoose.disconnect();
        process.exit();
    }
};

runDebug();
