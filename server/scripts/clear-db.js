require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../src/models/User');
const Lab = require('../src/models/Lab');
const Booking = require('../src/models/Booking');
const Project = require('../src/models/Project');
const Collaboration = require('../src/models/Collaboration');
const Notification = require('../src/models/Notification');

const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/lab_management_system';
const wipeAllUsers = process.argv.includes('--all') || process.argv.includes('--purge-all');

async function clearDatabase() {
  try {
    console.log('\n======================================================');
    console.log('       CLEARING DUMMY DATA FROM LAB SYSTEM DATABASE    ');
    console.log('======================================================');
    console.log(`Connecting to: ${uri}...`);

    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log('Connected to database successfully.\n');

    // 1. Wipe collections
    console.log('Deleting dummy records:');
    const [delBookings, delProjects, delCollabs, delNotifs, delLabs] = await Promise.all([
      Booking.deleteMany({}),
      Project.deleteMany({}),
      Collaboration.deleteMany({}),
      Notification.deleteMany({}),
      Lab.deleteMany({}),
    ]);

    console.log(`  ✓ Labs deleted:           ${delLabs.deletedCount}`);
    console.log(`  ✓ Bookings deleted:       ${delBookings.deletedCount}`);
    console.log(`  ✓ Projects deleted:       ${delProjects.deletedCount}`);
    console.log(`  ✓ Collaborations deleted: ${delCollabs.deletedCount}`);
    console.log(`  ✓ Notifications deleted:  ${delNotifs.deletedCount}`);

    // 2. Handle Users
    if (wipeAllUsers) {
      const delUsers = await User.deleteMany({});
      console.log(`  ✓ All Users deleted:      ${delUsers.deletedCount}`);
      console.log('\n[Notice] All users wiped. The next user who registers via /register will automatically become System Admin.');
    } else {
      await User.deleteMany({});
      // Create clean, fresh Administrator
      const admin = await User.create({
        userId: 'ADM-0001',
        userName: 'System Administrator',
        email: 'admin@example.com',
        password: 'Password123!',
        phoneNumber: '+1-555-0100',
        userType: 'admin',
        department: 'Computer Science',
        yearOfStudy: 'N/A',
        profession: 'Lab Administrator',
        skills: ['Lab Administration'],
        interests: ['System Management'],
        isActive: true,
        isEmailVerified: true,
      });

      console.log(`  ✓ Dummy users deleted. Created fresh Admin account:`);
      console.log(`    • Name:     ${admin.userName}`);
      console.log(`    • Email:    ${admin.email}`);
      console.log(`    • Password: Password123!`);
      console.log(`    • Role:     admin`);
    }

    console.log('\n======================================================');
    console.log(' DATABASE IS NOW CLEAN AND READY FOR MANUAL ENTRY!     ');
    console.log('======================================================');
    console.log('\nHow to start adding your own data:');
    console.log('1. Go to http://localhost:5173/login');
    console.log('2. Log in with admin@example.com / Password123!');
    console.log('3. Visit the "Lab Management" page (/admin/labs) to create your labs,');
    console.log('   set up the interactive seat layout, and assign equipment.');
    console.log('4. Create users at /admin/users or register students at /register.\n');

    process.exit(0);
  } catch (error) {
    console.error('Error clearing database:', error);
    process.exit(1);
  }
}

clearDatabase();
