const mongoose = require('mongoose');
require('dotenv').config({ path: 'backend/.env' });
const User = require('../src/models/User');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/lms';
const EMAIL = 'candidate@lms.com';
const PASSWORD = 'password123';

async function reset() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to DB');
        
        // Find by email
        const user = await User.findOne({ email: EMAIL });
        if (!user) {
            console.log('User not found');
            return;
        }

        // Set Plain Text - Middleware will hash it!
        user.password = PASSWORD;
        
        await user.save();
        
        console.log(`Password reset for ${user.email} to "${PASSWORD}" (Hashed by Middleware)`);
        
    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}
reset();
