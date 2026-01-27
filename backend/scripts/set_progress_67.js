const { MongoClient } = require('mongodb');

async function setProgress() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const db = client.db('lms');
        
        // Update all enrollments to 66% (2 out of 3 assessments - Module 1 & 2)
        const result = await db.collection('enrollments').updateMany(
            {},
            { $set: { progress: 67 } }  // 2/3 = 67%
        );
        
        console.log('Updated', result.modifiedCount, 'enrollments to 67% progress');
        console.log('\n✅ Progress bar should now show 67%!');
        console.log('After passing final exam, it will show 100%.');
        
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await client.close();
    }
}

setProgress();
