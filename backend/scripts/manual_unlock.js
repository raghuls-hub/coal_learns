const { MongoClient } = require('mongodb');

const uri = 'mongodb://localhost:27017';
const dbName = 'lms';

async function setUnlocked() {
    const client = new MongoClient(uri);
    
    try {
        await client.connect();
        console.log('Connected to MongoDB');
        
        const db = client.db(dbName);
        const progress = db.collection('progresses');
        
        // Find the latest progress
        const doc = await progress.findOne({}, { sort: { createdAt: -1 } });
        console.log('\nCurrent status:');
        console.log('  finalExamUnlocked:', doc.finalExamUnlocked);
        console.log('  assessmentScores:', doc.assessmentScores.length);
        
        // Update to unlock
        const result = await progress.updateOne(
            { _id: doc._id },
            { $set: { finalExamUnlocked: true } }
        );
        
        console.log('\nUpdate result:');
        console.log('  Modified:', result.modifiedCount);
        
        // Verify
        const updated = await progress.findOne({ _id: doc._id });
        console.log('\nAfter update:');
        console.log('  finalExamUnlocked:', updated.finalExamUnlocked);
        
        if (updated.finalExamUnlocked) {
            console.log('\n✅ SUCCESS! Final Exam is now UNLOCKED in database!');
            console.log('Refresh your browser to see the change.');
        }
        
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await client.close();
    }
}

setUnlocked();
