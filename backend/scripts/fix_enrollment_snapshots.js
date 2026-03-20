const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Enrollment = require('../src/models/Enrollment');
const Course = require('../src/models/Course');
const User = require('../src/models/User');

const path = require('path');
// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const fixEnrollmentSnapshots = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const enrollments = await Enrollment.find({});
        console.log(`Found ${enrollments.length} enrollments to process.`);

        let updatedCount = 0;

        for (const enrollment of enrollments) {
            // Check if snapshot already exists
            if (enrollment.courseSnapshot && enrollment.courseSnapshot.title) {
               // console.log(`Skipping Enrollment ${enrollment._id} - Already has snapshot`);
               // continue; 
               // Force update to ensure latest data
            }

            // Try to find the live course
            const course = await Course.findById(enrollment.course).populate('courseHandler');

            if (course) {
                // Course exists! Copy data.
                enrollment.courseSnapshot = {
                    title: course.title,
                    description: course.description,
                    thumbnail: course.thumbnail,
                    category: course.category,
                    level: course.level,
                    instructorName: course.courseHandler?.profile?.firstName 
                        ? `${course.courseHandler.profile.firstName} ${course.courseHandler.profile.lastName}`
                        : 'Unknown Instructor',
                    totalModules: course.modules?.length || 0
                };
                console.log(`[OK] Backfilled snapshot from LIVE course: ${course.title} (${enrollment._id})`);
            } else {
                // Course is DELETED! Use placeholders.
                console.warn(`[WARN] Course ${enrollment.course} not found for Enrollment ${enrollment._id}. Using Legacy Placeholder.`);
                
                enrollment.courseSnapshot = {
                    title: 'Legacy Course (Deleted)',
                    description: 'This course content is no longer available.',
                    thumbnail: 'https://via.placeholder.com/300?text=Archived',
                    category: 'Archived',
                    level: 'N/A',
                    instructorName: 'Former Instructor',
                    totalModules: 0
                };
            }

            await enrollment.save();
            updatedCount++;
        }

        console.log(`✅ Successfully backfilled ${updatedCount} enrollments.`);
        process.exit(0);

    } catch (err) {
        console.error('Migration Failed:', err);
        process.exit(1);
    }
};

fixEnrollmentSnapshots();
