const mongoose = require('mongoose');
require('dotenv').config({ path: 'backend/.env' });

const API_URL = 'http://localhost:5000/api';
const EMAIL = 'candidate@lms.com';
const PASSWORD = 'password123';

async function run() {
    try {
        console.log('--- Submitting Module 1 Assessment via Script ---');
        
        // Helper
        const post = async (url, body, token) => {
            const headers = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;
            const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
            const json = await res.json();
            if (!res.ok) throw new Error(json.message || res.statusText);
            return json;
        };
        
        const get = async (url, token) => {
             try {
                 const headers = {};
                 if (token) headers['Authorization'] = `Bearer ${token}`;
                 console.log(`GET ${url}`);
                 const res = await fetch(url, { headers });
                 if (!res.ok) {
                    const text = await res.text();
                    throw new Error(`HTTP ${res.status}: ${text}`);
                 }
                 const json = await res.json();
                 return json;
             } catch (e) {
                 console.error(`GET FAILED: ${url}`, e);
                 throw e;
             }
        };

        // 1. Login
        console.error('Logging in...');
        const loginData = await post(`${API_URL}/auth/login`, { email: EMAIL, password: PASSWORD });
        console.error('Login Success.'); 
        const token = loginData.token || (loginData.data && loginData.data.token);
        
        // 2. Get Enrollments
        console.error('Fetching Enrollments...');
        const enrollData = await get(`${API_URL}/enrollments/my-courses`, token);
        console.error('Enroll Data Type:', typeof enrollData);
        const enrollments = enrollData.data || enrollData;
        console.log(`Found ${enrollments.length} enrollments.`);
        
        const enrollment = enrollments[0]; 
        console.log(`Using Enrollment: ${enrollment._id} (Course: ${enrollment.course.title})`);

        // 3. Get Course Details
        console.log('Fetching Course Details...');
        const courseRes = await get(`${API_URL}/courses/${enrollment.course._id}`, token);
        const course = courseRes.data;
        const mod1 = course.modules[0];
        console.log(`Module 1: ${mod1.title}, Assessment: ${mod1.assessment}`);

        if (!mod1.assessment) throw new Error('Module 1 has no assessment');

        // Fetch Assessment to get QID
        const assessRes = await get(`${API_URL}/assessments/${mod1.assessment}`, token);
        const assessment = assessRes.data;
        const q1 = assessment.questions[0];
        console.log(`Question: ${q1.question} (ID: ${q1._id})`);

        // 4. Submit Assessment
        console.log(`Submitting Assessment ${mod1.assessment}...`);
        const payload = {
            enrollmentId: enrollment._id,
            answers: [{
                questionId: q1._id,
                answer: '2'
            }]
        };

        const submitRes = await post(`${API_URL}/assessments/${mod1.assessment}/submit`, payload, token);
        console.log('Submission Result:', submitRes);
        
        // 5. Verify Progress
        console.log('Verifying Progress...');
        const progRes = await get(`${API_URL}/progress/${enrollment._id}`, token);
        const prog = progRes.data;
        
        const scoreEntry = prog.assessmentScores.find(a => a.assessment === mod1.assessment);
        console.log('Score Entry in DB:', scoreEntry);
        
        const mod1Prog = prog.moduleProgress.find(m => m.module === mod1._id);
        console.log('Module 1 Completed:', mod1Prog.isCompleted);

    } catch (err) {
        console.error('Error:', err);
    }
}

run();
