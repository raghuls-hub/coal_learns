require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');

const CANDIDATE_CREDENTIALS = {
  email: 'candidate@lms.com',
  password: 'candidate123',
  role: 'candidate',
  profile: {
    firstName: 'John',
    lastName: 'Doe',
    phone: '+1234567890'
  }
};

async function createCandidate() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Delete existing candidate if exists
    await User.deleteOne({ email: CANDIDATE_CREDENTIALS.email });
    console.log('Removed existing candidate if any');

    // Create new user (password will be hashed by pre-save hook)
    const candidate = new User({
      email: CANDIDATE_CREDENTIALS.email,
      password: CANDIDATE_CREDENTIALS.password,
      role: CANDIDATE_CREDENTIALS.role,
      profile: CANDIDATE_CREDENTIALS.profile,
      isActive: true,
      isVerified: true
    });

    await candidate.save();

    console.log('\n✅ Candidate created successfully!');
    console.log('\n📧 LOGIN CREDENTIALS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Email:    ', CANDIDATE_CREDENTIALS.email);
    console.log('Password: ', CANDIDATE_CREDENTIALS.password);
    console.log('Role:     ', CANDIDATE_CREDENTIALS.role);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━\n');

    process.exit(0);
  } catch (error) {
    console.error('Error creating candidate:', error);
    process.exit(1);
  }
}

createCandidate();
