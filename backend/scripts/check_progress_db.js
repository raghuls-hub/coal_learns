const { MongoClient } = require('mongodb');

async function checkProgress() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const db = client.db('lms');
        
        const progress = await db.collection('progresses').findOne({}, { sort: { updatedAt: -1 } });
        
        if (!progress) {
            console.log('No progress found!');
            return;
        }
        
        console.log('=== Latest Progress ===\n');
        console.log('User:', progress.user);
        console.log('Course:', progress.course);
        console.log('Final Exam Unlocked:', progress.finalExamUnlocked);
        console.log('\nAssessment Scores:', progress.assessmentScores.length);
        
        progress.assessmentScores.forEach((score, idx) => {
            console.log(`\n${idx + 1}. Assessment: ${score.assessment}`);
            console.log(`   Score: ${score.score}%`);
            console.log(`   Passed: ${score.passed ? 'YES ✓' : 'NO ✗'}`);
            console.log(`   Attempts: ${score.attempts}`);
        });
        
        console.log('\n=== Enrollment Progress ===');
        const enrollment = await db.collection('enrollments').findOne({ _id: progress.enrollment });
        if (enrollment) {
            console.log('Progress Percentage:', enrollment.progress + '%');
            console.log('Status:', enrollment.status);
        }
        
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await client.close();
    }
}

checkProgress();
