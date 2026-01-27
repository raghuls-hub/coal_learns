const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../src/models/User');
const Course = require('../src/models/Course');
const Module = require('../src/models/Module');
const Content = require('../src/models/Content');
const Assessment = require('../src/models/Assessment');
const Enrollment = require('../src/models/Enrollment');
const Progress = require('../src/models/Progress');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/lms';

async function seed() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to DB');

        // 1. Cleanup Old 'Python' Course (and everything related)
        console.log('Cleaning up old Python courses...');
        const oldCourses = await Course.find({ title: { $regex: /python/i } });
        for (const c of oldCourses) {
            console.log(`Deleting Course: ${c.title} (${c._id})`);
            await Course.deleteOne({ _id: c._id });
            await Enrollment.deleteMany({ course: c._id });
            await Progress.deleteMany({ course: c._id });
            await Module.deleteMany({ course: c._id });
            await Content.deleteMany({ module: { $in: c.modules } }); // Approximate
        }

        // 2. Identify Instructor
        const mentor = await User.findOne({ role: 'mentor' });
        if (!mentor) throw new Error('No Mentor found to create course');
        const userId = mentor._id;

        // 3. Create New Course
        console.log('Creating New Test Course...');
        const course = await Course.create({
            title: 'Complete Python Mastery (Test)',
            description: 'A dedicated test course for verification.',
            category: 'Development',
            level: 'beginner',
            courseHandler: userId,
            settings: { isPublished: true, passingPercentage: 50 },
            pricing: { amount: 0, currency: 'USD' },
            thumbnail: 'https://via.placeholder.com/300'
        });

        // 4. Create Modules & Assessments
        
        // --- Module 1 ---
        const mod1 = await Module.create({ title: 'Module 1: Basics', course: course._id, order: 1 });
        
        // Add Content
        const vid1 = await Content.create({
            title: 'Intro Video',
            type: 'video',
            data: { url: 'https://www.youtube.com/watch?v=rfscVS0vtbw' },
            module: mod1._id,
            order: 1
        });
        mod1.content.push(vid1._id);
        
        // Add Mini Assessment 1 (Module Assessment)
        const assess1 = await Assessment.create({
            title: 'Module 1 Quiz',
            course: course._id,
            type: 'module_assessment',
            questions: [
                {
                    type: 'mcq',
                    question: 'What is 1 + 1?',
                    options: ['2', '11', '0', 'Window'],
                    correctAnswer: '2',
                    points: 10
                }
            ],
            passingPercentage: 0
        });
        mod1.assessment = assess1._id;
        await mod1.save();

        // --- Module 2 ---
        const mod2 = await Module.create({ title: 'Module 2: Advanced', course: course._id, order: 2 });
        
        const txt1 = await Content.create({
            title: 'Advanced Reading',
            type: 'text',
            data: { htmlContent: '<p>Read me</p>' },
            module: mod2._id,
            order: 1
        });
        mod2.content.push(txt1._id);

        // Add Mini Assessment 2
        const assess2 = await Assessment.create({
            title: 'Module 2 Quiz',
            course: course._id,
            type: 'module_assessment',
            questions: [
                {
                    type: 'mcq',
                    question: 'Is Python compiled?',
                    options: ['No', 'Yes', 'Maybe', 'Who knows'],
                    correctAnswer: 'No',
                    points: 10
                }
            ],
            passingPercentage: 0
        });
        mod2.assessment = assess2._id;
        await mod2.save();

        // Attach Modules to Course
        course.modules.push(mod1._id, mod2._id);
        await course.save();


        // 5. Final Exam
        const finalExam = await Assessment.create({
            title: 'Final Certification Exam',
            course: course._id,
            type: 'final_exam',
            questions: [
                {
                    type: 'mcq',
                    question: 'Final: Are we done?',
                    options: ['Yes', 'No'],
                    correctAnswer: 'Yes',
                    points: 100
                }
            ],
            passingPercentage: 50
        });
        
        console.log('Seed Complete!');
        console.log(`Course ID: ${course._id}`);
        console.log('\nANSWER KEY for Verification:');
        console.log(`Module 1 Quiz: "2"`);
        console.log(`Module 2 Quiz: "No"`);
        console.log(`Final Exam:    "Yes"`);

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

seed();
