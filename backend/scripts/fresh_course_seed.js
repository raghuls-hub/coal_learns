const mongoose = require('mongoose');
require('dotenv').config({ path: 'backend/.env' });

const User = require('../src/models/User');
const Course = require('../src/models/Course');
const Module = require('../src/models/Module');
const Content = require('../src/models/Content');
const Assessment = require('../src/models/Assessment');
const Enrollment = require('../src/models/Enrollment');
const Progress = require('../src/models/Progress');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/lms';

async function resetAndSeed() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('=== Clean Slate Course Creation ===\n');

        // 1. DELETE ALL EXISTING DATA
        console.log('Step 1: Deleting all existing data...');
        await Progress.deleteMany({});
        await Enrollment.deleteMany({});
        await Assessment.deleteMany({});
        await Content.deleteMany({});
        await Module.deleteMany({});
        await Course.deleteMany({});
        console.log('✓ All old data deleted\n');

        // 2. GET MENTOR USER
        console.log('Step 2: Finding mentor1@lms.com...');
        const mentor = await User.findOne({ email: 'mentor1@lms.com' });
        if (!mentor) {
            throw new Error('mentor1@lms.com not found! Create this user first.');
        }
        console.log(`✓ Found mentor: ${mentor.email}\n`);

        // 3. CREATE COURSE
        console.log('Step 3: Creating course...');
        const course = new Course({
            title: 'Web Development Fundamentals',
            description: 'Learn the basics of web development including HTML, CSS, and JavaScript',
            category: 'Programming',
            level: 'beginner',
            courseHandler: mentor._id,
            tutors: [mentor._id],
            pricing: {
                amount: 49.99,
                currency: 'USD',
                commissionRate: 20
            },
            settings: {
                passingPercentage: 70,
                isPublished: true
            }
        });
        await course.save();
        console.log(`✓ Course created: ${course.title}\n`);

        // 4. CREATE MODULE 1 (without content/assessment first)
        console.log('Step 4: Creating Module 1...');
        const module1 = new Module({
            title: 'HTML Fundamentals',
            description: 'Introduction to HTML',
            course: course._id,
            content: [],  // Will add later
            order: 1
        });
        await module1.save();

        // Now create content for Module 1
        const content1 = new Content({
            module: module1._id,  // Now we have the module ID
            title: 'Introduction to HTML',
            type: 'video',
            description: 'Learn the basics of HTML',
            order: 1,
            data: { url: 'https://www.youtube.com/watch?v=UB1O30fR-EE' }
        });
        await content1.save();

        // Create assessment for Module 1
        const assessment1 = new Assessment({
            title: 'HTML Basics Quiz',
            type: 'module_assessment',
            course: course._id,
            passingPercentage: 70,
            timeLimit: 15,
            questions: [
                {
                    type: 'mcq',
                    question: 'What does HTML stand for?',
                    options: [
                        'Hyper Text Markup Language',
                        'High Tech Modern Language',
                        'Home Tool Markup Language',
                        'Hyperlinks and Text Markup Language'
                    ],
                    correctAnswer: 0,
                    points: 10
                }
            ]
        });
        await assessment1.save();

        // Update Module 1 with content and assessment
        module1.content = [content1._id];
        module1.assessment = assessment1._id;
        await module1.save();
        console.log(`✓ Module 1 created\n`);

        // 5. CREATE MODULE 2
        console.log('Step 5: Creating Module 2...');
        const module2 = new Module({
            title: 'CSS Fundamentals',
            description: 'Introduction to CSS',
            course: course._id,
            content: [],
            order: 2
        });
        await module2.save();

        const content2 = new Content({
            module: module2._id,
            title: 'Introduction to CSS',
            type: 'video',
            description: 'Learn the basics of CSS',
            order: 1,
            data: { url: 'https://www.youtube.com/watch?v=yfoY53QXEnI' }
        });
        await content2.save();

        const assessment2 = new Assessment({
            title: 'CSS Basics Quiz',
            type: 'module_assessment',
            course: course._id,
            passingPercentage: 70,
            timeLimit: 15,
            questions: [
                {
                    type: 'mcq',
                    question: 'What does CSS stand for?',
                    options: [
                        'Creative Style Sheets',
                        'Cascading Style Sheets',
                        'Computer Style Sheets',
                        'Colorful Style Sheets'
                    ],
                    correctAnswer: 1,
                    points: 10
                }
            ]
        });
        await assessment2.save();

        module2.content = [content2._id];
        module2.assessment = assessment2._id;
        await module2.save();
        console.log(`✓ Module 2 created\n`);

        // 6. CREATE FINAL EXAM
        console.log('Step 6: Creating Final Exam...');
        const finalExam = new Assessment({
            title: 'Web Development Final Exam',
            type: 'final_exam',
            course: course._id,
            passingPercentage: 70,
            timeLimit: 30,
            questions: [
                {
                    type: 'mcq',
                    question: 'Which tag is used to create a hyperlink in HTML?',
                    options: ['<link>', '<a>', '<href>', '<hyperlink>'],
                    correctAnswer: 1,
                    points: 10
                },
                {
                    type: 'mcq',
                    question: 'Which CSS property is used to change text color?',
                    options: ['text-color', 'color', 'font-color', 'text-style'],
                    correctAnswer: 1,
                    points: 10
                }
            ]
        });
        await finalExam.save();
        console.log(`✓ Final Exam created\n`);

        // 7. LINK MODULES TO COURSE
        console.log('Step 7: Linking modules to course...');
        course.modules = [module1._id, module2._id];
        await course.save();
        console.log(`✓ Course updated\n`);

        // 8. SUMMARY
        console.log('=== ✅ SUCCESS ===\n');
        console.log('Course Details:');
        console.log(`  Title: ${course.title}`);
        console.log(`  ID: ${course._id}`);
        console.log(`  Created by: ${mentor.email}`);
        console.log(`  Published: Yes`);
        console.log(`\n Module 1: HTML Fundamentals`);
        console.log(`  ├─ Video: Introduction to HTML`);
        console.log(`  └─ Quiz: HTML Basics Quiz`);
        console.log(`\nModule 2: CSS Fundamentals`);
        console.log(`  ├─ Video: Introduction to CSS`);
        console.log(`  └─ Quiz: CSS Basics Quiz`);
        console.log(`\nFinal Exam: Web Development Final Exam`);
        console.log('\n📚 Course is LIVE! Next steps:');
        console.log('  1. Login to candidate portal (candidate@lms.com)');
        console.log('  2. Browse catalog');
        console.log('  3. Enroll in "Web Development Fundamentals"');
        console.log('  4. Complete modules → Final Exam → Certificate!');

    } catch (err) {
        console.error('\n❌ ERROR:', err.message);
        if (err.errors) {
            console.error('Validation errors:');
            Object.keys(err.errors).forEach(key => {
                console.error(`  - ${key}: ${err.errors[key].message}`);
            });
        }
    } finally {
        await mongoose.disconnect();
    }
}

resetAndSeed();
