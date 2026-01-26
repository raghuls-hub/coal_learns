const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./src/models/User');
const Course = require('./src/models/Course');
const Module = require('./src/models/Module');
const Content = require('./src/models/Content');
const Assessment = require('./src/models/Assessment');

const users = [
    {
        email: 'admin@lms.com',
        password: 'password123',
        role: 'admin',
        profile: { firstName: 'Super', lastName: 'Admin' },
        isActive: true
    },
    {
        email: 'tutor@lms.com',
        password: 'password123',
        role: 'tutor',
        profile: { firstName: 'Jane', lastName: 'Tutor' },
        isActive: true
    },
    {
        email: 'course@lms.com',
        password: 'password123',
        role: 'mentor',
        profile: { firstName: 'Mike', lastName: 'Handler' },
        isActive: true
    },
    {
        email: 'candidate@lms.com',
        password: 'password123',
        role: 'candidate',
        profile: { firstName: 'John', lastName: 'Learner' },
        isActive: true
    }
];

const seedDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/lms_db');
        console.log('📦 Connected to MongoDB');

        // Clear existing data
        await User.deleteMany({});
        await Course.deleteMany({});
        await Module.deleteMany({});
        await Content.deleteMany({});
        await Assessment.deleteMany({});
        console.log('🧹 Cleared existing data');

        // Create Users
        const createdUsers = [];
        for (const u of users) {
            const hashedPassword = await bcrypt.hash(u.password, 12);
            const user = await User.create({ ...u, password: hashedPassword });
            createdUsers.push(user);
            console.log(`👤 Created user: ${u.email} (${u.role})`);
        }

        const courseHandler = createdUsers.find(u => u.role === 'mentor');
        const tutor = createdUsers.find(u => u.role === 'tutor');

        // Create Course
        const course = await Course.create({
            title: 'Complete Web Development Bootcamp',
            description: 'Learn MERN stack from scratch with this comprehensive course.',
            category: 'Development',
            level: 'beginner',
            pricing: { amount: 99.99, currency: 'USD' },
            courseHandler: courseHandler._id,
            tutors: [tutor._id],
            settings: { isPublished: true, enrollmentOpen: true },
            stats: { enrollmentCount: 120, rating: 4.8 }
        });
        console.log(`📚 Created course: ${course.title}`);

        // Create Assessment
        const assessment = await Assessment.create({
            title: 'React Basics Quiz',
            type: 'module_assessment',
            questions: [
                {
                    type: 'mcq',
                    question: 'What is the Virtual DOM?',
                    options: ['A direct copy of the DOM', 'A lightweight copy', 'A database', 'A browser API'],
                    correctAnswer: 'A lightweight copy',
                    points: 10
                },
                {
                    type: 'fill_in_the_blank',
                    question: 'Use _____ to manage side effects in functional components.',
                    correctAnswer: 'useEffect',
                    points: 10
                }
            ],
            settings: { timeLimit: 15, passingScore: 50 }
        });

        // Create Module first (needs assessment ID)
        const module = await Module.create({
            course: course._id,
            title: 'React Fundamentals',
            order: 1,
            assessment: assessment._id
            // Content added later
        });

        // Create Content (Video)
        const videoContent = await Content.create({
            module: module._id,
            title: 'Intro to React',
            description: 'Understanding the component lifecycle.',
            type: 'video',
            data: { url: 'https://www.youtube.com/watch?v=w7ejDZ8SWv8', duration: 1200 }, // React crash course link
            order: 1
        });

        // Create Content (Text)
        const textContent = await Content.create({
            module: module._id,
            title: 'React Hooks Cheatsheet',
            description: 'Quick reference for useState and useEffect.',
            type: 'text',
            data: { htmlContent: '<h1>React Hooks</h1><p>Hooks are functions that let you use state...</p>' },
            order: 2
        });

        // Update Module with content
        module.content = [videoContent._id, textContent._id];
        await module.save();

        // Update references
        course.modules.push(module._id);
        await course.save();

        // Update content/assessment module refs if models require it (skipping for simplicity if not strictly enforced)

        console.log('✅ Seeding complete!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding failed:');
        console.log(JSON.stringify(error, null, 2));
        process.exit(1);
    }
};

seedDB();
