const { MongoClient } = require('mongodb');

async function showAnswers() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const db = client.db('lms');
        
        const assessments = await db.collection('assessments').find({}).toArray();
        
        console.log('=== QUIZ ANSWERS CHEAT SHEET ===\n');
        
        assessments.forEach((assessment) => {
            console.log(`${assessment.title}`);
            console.log(`Type: ${assessment.type}`);
            console.log('');
            
            assessment.questions.forEach((q, idx) => {
                const correctOption = q.options[q.correctAnswer];
                console.log(`Q${idx + 1}: ${q.question}`);
                console.log(`Answer: ${correctOption} (Option ${q.correctAnswer})`);
                console.log('');
            });
            
            console.log('---\n');
        });
        
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await client.close();
    }
}

showAnswers();
