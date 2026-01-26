require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');

const USERS = [
  {
    email: 'admin@lms.com',
    password: 'admin123',
    role: 'admin',
    profile: {
      firstName: 'Admin',
      lastName: 'User',
      phone: '+1234567890'
    },
    isActive: true,
    isVerified: true
  },
  {
    email: 'mentor1@lms.com',
    password: 'mentor123',
    role: 'mentor',
    profile: {
      firstName: 'Sarah',
      lastName: 'Johnson',
      phone: '+1234567891'
    },
    isActive: true,
    isVerified: true
  },
  {
    email: 'mentor2@lms.com',
    password: 'mentor123',
    role: 'mentor',
    profile: {
      firstName: 'Michael',
      lastName: 'Chen',
      phone: '+1234567892'
    },
    isActive: true,
    isVerified: true
  },
  {
    email: 'candidate@lms.com',
    password: 'candidate123',
    role: 'candidate',
    profile: {
      firstName: 'John',
      lastName: 'Doe',
      phone: '+1234567893'
    },
    isActive: true,
    isVerified: true
  }
];

async function seedUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✓ Connected to MongoDB');

    // Clear existing users
    await User.deleteMany({});
    console.log('✓ Cleared existing users');

    // Create users (passwords will be hashed by pre-save hook)
    for (const userData of USERS) {
      const user = new User(userData);
      await user.save();
      console.log(`✓ Created ${userData.role}: ${userData.email}`);
    }

    console.log('\n✅ Database seeded successfully!\n');
    console.log('═══════════════════════════════════════════════════');
    console.log('📧 LOGIN CREDENTIALS');
    console.log('═══════════════════════════════════════════════════\n');
    
    console.log('👤 ADMIN:');
    console.log('   Email:    admin@lms.com');
    console.log('   Password: admin123');
    console.log('   Role:     admin\n');
    
    console.log('👨‍🏫 MENTOR 1:');
    console.log('   Email:    mentor1@lms.com');
    console.log('   Password: mentor123');
    console.log('   Role:     mentor');
    console.log('   Name:     Sarah Johnson\n');
    
    console.log('👨‍🏫 MENTOR 2:');
    console.log('   Email:    mentor2@lms.com');
    console.log('   Password: mentor123');
    console.log('   Role:     mentor');
    console.log('   Name:     Michael Chen\n');
    
    console.log('🎓 CANDIDATE:');
    console.log('   Email:    candidate@lms.com');
    console.log('   Password: candidate123');
    console.log('   Role:     candidate');
    console.log('   Name:     John Doe\n');
    
    console.log('═══════════════════════════════════════════════════');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seedUsers();
