const API_URL = 'http://localhost:5000/api';
const timestamp = Date.now();
const EMAIL = `verifyUser_${timestamp}@lms.com`; 
const PASSWORD = 'password123'; 

async function run() {
    try {
        console.log(`0. Registering User ${EMAIL}...`);
        let res = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                name: 'Verify User',
                email: EMAIL, 
                password: PASSWORD,
                role: 'candidate',
                profile: { firstName: 'Verify', lastName: 'User' } 
            })
        });
        let data = await res.json();
        // If 400 (exists), login. If 201, good.
        if (!data.success && !data.error.includes('exists')) throw new Error("Register failed: " + JSON.stringify(data));
        
        console.log("1. Logging in...");
        res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: EMAIL, password: PASSWORD })
        });
        data = await res.json();
        if (!data.success) throw new Error("Login failed: " + JSON.stringify(data));
        console.log("   Login Response:", JSON.stringify(data));
        
        const token = data.token;
        const userId = data.user?.id || data.data?.user?.id; // Try alternatives
        console.log(`   Logged in as ${userId}. Token obtained.`);

        const headers = { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };

        console.log("2. Fetching/Creating Enrollment...");
        res = await fetch(`${API_URL}/enrollments/my-courses`, { headers });
        data = await res.json();
        let enrollments = data.data;
        
        if (!enrollments || enrollments.length === 0) {
            console.log("   No enrollments. Enrolling in first available course...");
            // Get courses
            res = await fetch(`${API_URL}/courses`, { headers }); 
            data = await res.json();
            
            if (!data.success) throw new Error("Fetch Courses Failed: " + JSON.stringify(data));
            console.log("   Courses Response Data:", JSON.stringify(data.data).substring(0, 200) + "...");

            // Handle pagination { courses, total } OR flat array
            const courses = Array.isArray(data.data) ? data.data : (data.data.courses || []);
            
            if(!courses || courses.length === 0) throw new Error("No courses available in DB to enroll!");
            
            const courseToEnroll = courses[0];
            console.log(`   Enrolling in ${courseToEnroll.title} (ID: ${courseToEnroll._id})...`);
            res = await fetch(`${API_URL}/enrollments/${courseToEnroll._id}/enroll`, {
                method: 'POST', 
                headers,
                body: JSON.stringify({ paymentMethod: 'mock', amount: 0 })
            });
            data = await res.json();
            if(!data.success) throw new Error("Enrollment failed: " + JSON.stringify(data));
            
            // Refresh enrollments
            res = await fetch(`${API_URL}/enrollments/my-courses`, { headers });
            data = await res.json();
            enrollments = data.data;
        }
        
        const enrollment = enrollments[0];
        console.log(`   Using Enrollment: ${enrollment._id} (Course: ${enrollment.course.title})`);

        console.log("3. Fetching Module Structure...");
        res = await fetch(`${API_URL}/courses/${enrollment.course._id}`, { headers });
        data = await res.json();
        const modules = data.data.modules;
        console.log(`   Found ${modules.length} modules.`);
        
        const module1 = modules[0];
        console.log(`   Module 1: ${module1.title} (ID: ${module1._id})`);
        
        console.log("4. Marking ALL Content Complete for Module 1...");
        if (module1.content) {
            for (const content of module1.content) {
                const contentId = content._id || content; 
                console.log(`   Marking content ${contentId} complete...`);
                await fetch(`${API_URL}/progress/${enrollment._id}/content/${contentId}`, { 
                    method: 'PUT',
                    headers,
                    body: JSON.stringify({ moduleId: module1._id })
                });
            }
        }

        console.log("5. Submitting Assessment for Module 1...");
        // Pass enrollmentId explicitly!
        const payload = {
            answers: [],
            enrollmentId: enrollment._id 
        };

        // Get questions first
        if (module1.assessment) {
            res = await fetch(`${API_URL}/assessments/${module1.assessment}/start`, { headers });
            data = await res.json();
            const questions = data.data.questions;
            payload.answers = questions.map(q => ({
                questionId: q._id,
                answer: q.options ? q.options[0] : "Test Answer" 
            }));

            res = await fetch(`${API_URL}/assessments/${module1.assessment}/submit`, { 
                method: 'POST',
                headers,
                body: JSON.stringify(payload)
            });
            data = await res.json();
            console.log(`   Assessment Submitted. Passed: ${data.data.passed}`);
        } else {
            console.log("   No Assessment for Module 1.");
        }

        console.log("6. Verifying Final Exam Unlock...");
        res = await fetch(`${API_URL}/progress/${enrollment._id}`, { headers });
        data = await res.json();
        const progress = data.data;
        
        const mp1 = progress.moduleProgress.find(m => m.module === module1._id);
        console.log(`   Module 1 Completed: ${mp1?.isCompleted}`);
        
        // Final Exam Unlock Rule
        // Check if there is a next module or if course is complete
        // Or check specific modules
        
        progress.moduleProgress.forEach((m, idx) => {
            console.log(`   Module ${idx+1} (${m.module}): Unlocked=${m.isUnlocked}, Completed=${m.isCompleted}`);
        });

    } catch (err) {
        console.error("ERROR:", err.message);
    }
}

run();
