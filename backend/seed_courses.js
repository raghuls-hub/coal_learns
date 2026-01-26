require('dotenv').config();
const mongoose = require('mongoose');
const Course = require('./src/models/Course');

const seedCourses = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Get admin user
        const User = require('./src/models/User');
        const admin = await User.findOne({ role: 'admin' });

        if (!admin) {
            console.error('No admin user found. Run reset_admin_script.js first.');
            process.exit(1);
        }

        // Create/Get Tutor user
        let tutor = await User.findOne({ email: 'tutor@lms.com' });
        if (!tutor) {
            tutor = new User({
                email: 'tutor@lms.com',
                password: 'Tutor123!',
                role: 'tutor',
                profile: { firstName: 'Alex', lastName: 'Tutor' },
                isVerified: true
            });
            await tutor.save();
            console.log('Created Tutor user');
        }

        // Create 10 courses (mixed authors)
        const courses = Array.from({ length: 15 }).map((_, i) => ({
            title: `${i < 10 ? 'Admin' : 'Tutor'} Course ${i + 1}: ${i % 2 === 0 ? 'React' : 'Node.js'} Mastery`,
            description: `Comprehensive course content for ${i + 1}. Learn from the best.`,
            category: 'Programming',
            level: i % 3 === 0 ? 'beginner' : i % 3 === 1 ? 'intermediate' : 'advanced',
            pricing: {
                amount: (i + 1) * 15,
                currency: 'USD'
            },
            thumbnail: 'https://via.placeholder.com/300x200',
            courseHandler: i < 10 ? admin._id : tutor._id, // First 10 by Admin, last 5 by Tutor
            settings: {
                isPublished: true
            },
            stats: {
                averageRating: 4.0 + (Math.random()),
                enrollmentCount: Math.floor(Math.random() * 200)
            }
        }));

        // Clear existing courses to avoid duplicates if re-run multiple times (optional, but cleaner for testing)
        await Course.deleteMany({});
        console.log('Cleared existing courses');

        await Course.insertMany(courses);
        console.log('Successfully seeded 15 courses (10 Admin, 5 Tutor)');

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

seedCourses();
