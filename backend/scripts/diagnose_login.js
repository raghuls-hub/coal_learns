const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: 'backend/.env' });
const User = require('../src/models/User');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/lms';
const EMAIL = 'candidate@lms.com';
const PASSWORD = 'password123';

async function diagnose() {
    try {
        await mongoose.connect(MONGO_URI);
        console.error('Connected to DB');

        const user = await User.findOne({ email: EMAIL });
        if (!user) {
            console.error('User NOT found');
            return;
        }
        console.error(`User found: ${user.email}, Role: ${user.role}`);
        // console.error(`Stored Hash: ${user.password}`);

        console.error(`Testing password: "${PASSWORD}"`);
        const isMatch = await bcrypt.compare(PASSWORD, user.password);
        console.error(`Match Result: ${isMatch}`);

        if (!isMatch) {
            console.error('Password mismatch! Resetting...');
            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash(PASSWORD, salt);
            user.password = hash;
            await user.save();
            console.error('Password reset to "password123".');
        }

    } catch (err) {
        console.error('CRASH:', err);
    } finally {
        await mongoose.disconnect();
    }
}
diagnose();
