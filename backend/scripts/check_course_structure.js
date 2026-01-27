const { MongoClient } = require('mongodb');

async function check() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const db = client.db('lms');
        
        // Get course
        const course = await db.collection('courses').findOne({ title: 'Complete Python Mastery (Test)' });
        
        console.log('Course:', course.title);
        console.log('Modules:', course.modules.length);
        console.log('Final Assessment:', course.finalAssessment);
        
        // Get modules
        for (let i = 0; i < course.modules.length; i++) {
            const mod = await db.collection('modules').findOne({ _id: course.modules[i] });
            console.log(`\nModule ${i + 1}: ${mod.title}`);
            console.log(`  Assessment: ${mod.assessment}`);
        }
        
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await client.close();
    }
}

check();
