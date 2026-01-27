const { MongoClient } = require('mongodb');

async function checkAssessments() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const db = client.db('lms');
        
        const assessments = await db.collection('assessments').find({}).toArray();
        
        console.log('=== ASSESSMENT ANSWERS ===\n');
        
        for (const assessment of assessments) {
            console.log(`📝 ${assessment.title} (${assessment.type})`);
            console.log(`   Time Limit: ${assessment.timeLimit} minutes`);
            console.log(`   Passing: ${assessment.passingPercentage}%\n`);
            
            assessment.questions.forEach((q, idx) => {
                console.log(`   Question ${idx + 1}: ${q.question}`);
                q.options.forEach((opt, i) => {
                    const marker = i === q.correctAnswer ? '✓ CORRECT' : '  ';
                    console.log(`      ${i}. ${opt} ${marker}`);
                });
                console.log('');
            });
            
            console.log('---\n');
        }
        
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await client.close();
    }
}

checkAssessments();
