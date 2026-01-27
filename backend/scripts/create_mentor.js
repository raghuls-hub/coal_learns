const mongoose = require('mongoose');
require('dotenv').config({ path: 'backend/.env' });

const User = require('../src/models/User');

async function createMentor() {
    try {
        await mongoose.connect('mongodb://localhost:27017/lms');
        
        // Check if mentor exists
        let mentor = await User.findOne({ email: 'mentor1@lms.com' });
        
        if (mentor) {
            console.log('Mentor already exists:', mentor.email);
            console.log('Role:', mentor.role);
        } else {
            console.log('Creating mentor1@lms.com...');
            mentor = new User({
                email: 'mentor1@lms.com',
                password: 'password123',  // Will be hashed by pre-save hook
                role: 'tutor',
                isActive: true
            });
            await mentor.save();
            console.log('✓ Mentor created!');
        }
        
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await mongoose.disconnect();
    }
}

createMentor();
