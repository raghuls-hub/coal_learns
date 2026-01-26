require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');

/**
 * Migration script to update user roles from course_handler/tutor to mentor
 */
async function migrateRoles() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✓ Connected to MongoDB\n');

    // Find all users with old roles
    const courseHandlers = await User.find({ role: 'course_handler' });
    const tutors = await User.find({ role: 'tutor' });

    console.log(`Found ${courseHandlers.length} course_handler(s)`);
    console.log(`Found ${tutors.length} tutor(s)\n`);

    if (courseHandlers.length === 0 && tutors.length === 0) {
      console.log('✅ No users to migrate. All roles are already up to date!');
      process.exit(0);
    }

    // Update course_handlers to mentor
    if (courseHandlers.length > 0) {
      await User.updateMany(
        { role: 'course_handler' },
        { $set: { role: 'mentor' } }
      );
      console.log(`✓ Migrated ${courseHandlers.length} course_handler(s) → mentor`);
      courseHandlers.forEach(user => {
        console.log(`  - ${user.email}`);
      });
      console.log('');
    }

    // Update tutors to mentor
    if (tutors.length > 0) {
      await User.updateMany(
        { role: 'tutor' },
        { $set: { role: 'mentor' } }
      );
      console.log(`✓ Migrated ${tutors.length} tutor(s) → mentor`);
      tutors.forEach(user => {
        console.log(`  - ${user.email}`);
      });
      console.log('');
    }

    // Verify changes
    const mentors = await User.find({ role: 'mentor' });
    const remainingOld = await User.find({ role: { $in: ['course_handler', 'tutor'] } });

    console.log('═══════════════════════════════════════════════════');
    console.log('📊 MIGRATION SUMMARY');
    console.log('═══════════════════════════════════════════════════');
    console.log(`Total mentors now: ${mentors.length}`);
    console.log(`Remaining old roles: ${remainingOld.length}`);
    console.log('═══════════════════════════════════════════════════\n');

    if (remainingOld.length === 0) {
      console.log('✅ Migration completed successfully!\n');
    } else {
      console.log('⚠️  Warning: Some old roles remain!');
      remainingOld.forEach(user => {
        console.log(`  - ${user.email} (${user.role})`);
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrateRoles();
