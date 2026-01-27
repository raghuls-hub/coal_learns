const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Progress = require('../src/models/Progress');
const Certificate = require('../src/models/Certificate');
const Enrollment = require('../src/models/Enrollment');
const Course = require('../src/models/Course');
const Assessment = require('../src/models/Assessment');
const User = require('../src/models/User');

const progressService = require('../src/services/progressService');
const certificateService = require('../src/services/certificateService');

async function testFullFlow() {
  try {
    if (!process.env.MONGO_URI) process.env.MONGO_URI = "mongodb://localhost:27017/lms";
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    // 1. Setup Data
    const finalExam = await Assessment.findOne({ type: 'final_exam' });
    if (!finalExam) throw new Error("No final exam found");
    
    const course = await Course.findById(finalExam.course).populate('modules');
    const enrollment = await Enrollment.findOne({ course: course._id }).populate('user');
    if (!enrollment) throw new Error("No enrollment found");

    const userId = enrollment.user._id;
    const enrollmentId = enrollment._id;

    console.log(`User: ${enrollment.user.email}`);
    console.log(`Course: ${course.title}`);

    // 2. Initialize Progress (Simulate Login/Access)
    console.log("Initializing Progress...");
    let progress = await progressService.initializeProgress(enrollmentId, userId, course._id);
    
    // 3. Mark Content Complete (One by One & Check Monotonicity)
    console.log("Completing all content one by one...");
    let completedCount = 0;
    for (const mod of course.modules) {
        if (mod.content && mod.content.length > 0) {
            for (const cId of mod.content) {
                await progressService.markContentCompleted(enrollmentId, userId, cId);
                
                // Verify immediate persistence
                const pCheck = await Progress.findOne({ enrollment: enrollmentId });
                if (!pCheck.completedContent.includes(cId)) {
                    throw new Error(`Integrity Fail: Content ${cId} not saved.`);
                }
                completedCount++;
            }
        }
    }
    console.log(`Verified ${completedCount} content items marked strictly.`);

    // 4. Pass Final Exam
    console.log("Passing Final Exam...");
    progress = await progressService.updateAssessmentResult(
        enrollmentId,
        userId,
        finalExam._id,
        100, // Score
        true // Passed
    );

    // 5. Verify Course Completed
    if (progress.courseCompleted) {
        console.log("SUCCESS: Course Marked Completed in Progress.");
    } else {
        console.error("FAILURE: Course NOT Marked Completed.");
        return;
    }

    // 6. Claim Certificate
    console.log("Claiming Certificate...");
    const cert = await certificateService.claimCertificate(enrollmentId, userId);
    console.log(`Certificate Claimed: ${cert.certificateId}`);

    // 7. Verify Certificate Data
    if (cert.certificateClaimed) {
        console.log("SUCCESS: Certificate has 'certificateClaimed' flag.");
    }
    
    // 8. Verify Re-Claim (Should return same)
    const cert2 = await certificateService.claimCertificate(enrollmentId, userId);
    if (cert2.certificateId === cert.certificateId) {
        console.log("SUCCESS: Re-claim returned existing certificate.");
    }

  } catch (err) {
    console.error("Test Error:", err);
  } finally {
    await mongoose.disconnect();
  }
}

testFullFlow();
