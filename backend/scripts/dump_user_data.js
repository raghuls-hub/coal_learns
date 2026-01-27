const mongoose = require('mongoose');
require('dotenv').config();

// Load Models
const User = require('../src/models/User');
const Enrollment = require('../src/models/Enrollment');
const Progress = require('../src/models/Progress');
const Course = require('../src/models/Course');
const Assessment = require('../src/models/Assessment');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/lms';

async function diagnose() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to DB');

    const email = 'candidate@lms.com';
    let user = await User.findOne({ email });
    
    if (!user) {
        console.log(`User ${email} not found. Listing recent users:`);
        const users = await User.find().sort({createdAt: -1}).limit(5);
        users.forEach(u => console.log(` - ${u.email} (${u._id})`));
        
        if (users.length > 0) user = users[0]; // Pick most recent
    }

    if (!user) throw new Error('No users in DB');

    console.log(`\n=== USER: ${user.email} (${user._id}) ===`);

    // 1. Get Enrollments (LEAN)
    const enrollments = await Enrollment.find({ user: user._id }).sort({ createdAt: -1 }).lean();
    console.log(`\nFound ${enrollments.length} Enrollments:`);
    
    for (const enr of enrollments) {
        console.log(`\n--------------------------------------------------`);
        console.log(`Enrollment ID: ${enr._id}`);
        console.log(`Course ID:     ${enr.course}`);
        console.log(`Created At:    ${enr.createdAt}`);
        console.log(`Status:        ${enr.paymentStatus}`);
        
        // 2. Get Progress (LEAN)
        const prog = await Progress.findOne({ enrollment: enr._id }).lean();
        if (!prog) {
            console.log(`PROGRESS:      [NOT FOUND]`);
        } else {
            console.log(`PROGRESS ID:   ${prog._id}`);
            console.log(`Completed Content Count: ${prog.completedContent ? prog.completedContent.length : 0}`);
            
            console.log(`Module Progress:`);
            if (prog.moduleProgress) {
                prog.moduleProgress.forEach((mp, i) => {
                    console.log(`  Module: ${mp.module} | Completed: ${mp.isCompleted} | Unlocked: ${mp.isUnlocked}`);
                });
            }
            
            console.log(`Assessment Scores: ${prog.assessmentScores ? prog.assessmentScores.length : 0}`);
            if(prog.assessmentScores) {
                prog.assessmentScores.forEach(as => {
                    console.log(`  Assessment: ${as.assessment} | Passed: ${as.passed} | Score: ${as.score}`);
                });
            }
        }

        // 3. Logic Check (Skipped due to crash)
        // const course = await Course.findById(enr.course)...
    }

    // AUTO-FIX: Remove Duplicates
    if (enrollments.length > 1) {
        console.log(`\n!!! DUPLICATE ENROLLMENTS DETECTED !!!`);
        // Keep the first one (recents first due to sort)
        const keep = enrollments[0];
        const remove = enrollments.slice(1);
        
        console.log(`Keeping Valid Enrollment: ${keep._id}`);
        for (const bad of remove) {
            console.log(`DELETING Old Enrollment: ${bad._id}`);
            await Enrollment.deleteOne({ _id: bad._id });
            console.log(`DELETING Old Progress: (via Enrollment ID)`);
            await Progress.deleteOne({ enrollment: bad._id });
        }
        console.log(`\nFIX APPLIED: Duplicates removed. User should refresh.`);
    } else {
        console.log(`\nNo duplicates found. Data seems structure-wise clean.`);
    }

  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

diagnose();
