const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Progress = require('../src/models/Progress');
const Certificate = require('../src/models/Certificate');
const Enrollment = require('../src/models/Enrollment');
const Course = require('../src/models/Course');
const User = require('../src/models/User');

const USER_EMAIL = 'candidate@lms.com';
const COURSE_KEYWORD = 'python'; // Case insensitive partial match

async function resetProgress() {
  try {
    if (!process.env.MONGO_URI) process.env.MONGO_URI = "mongodb://localhost:27017/lms";
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    // 1. Find User
    const user = await User.findOne({ email: USER_EMAIL });
    if (!user) throw new Error(`User ${USER_EMAIL} not found`);
    console.log(`Found User: ${user._id}`);

    // 2. Find Course
    const course = await Course.findOne({ title: { $regex: COURSE_KEYWORD, $options: 'i' } });
    if (!course) {
        console.log(`Course matching '${COURSE_KEYWORD}' not found. Listing all courses:`);
        const all = await Course.find({}, 'title');
        all.forEach(c => console.log(` - ${c.title}`));
        throw new Error("Course not found");
    }
    console.log(`Found Course: ${course.title} (${course._id})`);

    // 3. Find Enrollment
    const enrollment = await Enrollment.findOne({ user: user._id, course: course._id });
    if (!enrollment) {
        console.log("No enrollment found. Nothing to reset.");
        return;
    }
    console.log(`Found Enrollment: ${enrollment._id} (Status: ${enrollment.status})`);

    // 4. Delete Certificate
    const certDel = await Certificate.deleteMany({ enrollment: enrollment._id });
    console.log(`Deleted ${certDel.deletedCount} Certificates`);

    // 5. Delete Progress
    const progDel = await Progress.deleteMany({ enrollment: enrollment._id });
    console.log(`Deleted ${progDel.deletedCount} Progress records`);

    // 6. Reset Enrollment
    enrollment.status = 'active'; // or 'enrolled' depending on enum
    enrollment.progress = 0;
    // enrollment.completedAt = null; // if tracking completion date
    await enrollment.save();
    console.log("Enrollment reset to active/0%");

    console.log("SUCCESS: Progress Reset Complete.");

  } catch (err) {
    console.error("Reset Error:", err);
  } finally {
    await mongoose.disconnect();
  }
}

resetProgress();
