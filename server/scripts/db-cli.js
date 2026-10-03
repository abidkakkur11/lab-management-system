require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');

const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/lab_management_system';

async function inspect() {
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 3000 });
    console.log('====================================================');
    console.log(` CONNECTED TO MONGODB DATABASE: ${mongoose.connection.name}`);
    console.log(` Host: ${mongoose.connection.host}:${mongoose.connection.port}`);
    console.log('====================================================\n');

    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('COLLECTIONS IN DATABASE:');
    for (const col of collections) {
      const count = await mongoose.connection.db.collection(col.name).countDocuments();
      console.log(` • ${col.name.padEnd(16)} : ${count} documents`);
    }

    console.log('\n----------------------------------------------------');
    console.log('SAMPLE DATA PREVIEW:');
    console.log('----------------------------------------------------');

    const users = await mongoose.connection.db.collection('users').find({}, { projection: { password: 0 } }).limit(4).toArray();
    console.log('\n[USERS] (First 4):');
    console.table(users.map(u => ({ userId: u.userId, name: u.userName, email: u.email, role: u.userType, dept: u.department })));

    const labs = await mongoose.connection.db.collection('labs').find({}).limit(3).toArray();
    console.log('\n[LABS]:');
    console.table(labs.map(l => ({ labId: l.labId, name: l.labName, capacity: l.capacity, dept: l.department })));

    const bookings = await mongoose.connection.db.collection('bookings').find({}).limit(5).toArray();
    console.log('\n[BOOKINGS] (First 5):');
    console.table(bookings.map(b => ({ bookingId: b.bookingId, seat: b.seatId, date: b.bookingDate, time: `${b.timeSlot?.startTime}-${b.timeSlot?.endTime}`, status: b.status })));

    console.log('\n====================================================');
    console.log('Connection URI for MongoDB Compass:');
    console.log(`>> ${uri}`);
    console.log('====================================================');

    process.exit(0);
  } catch (err) {
    console.error('Database connection failed:', err.message);
    console.log('Tip: Make sure the server is running with `npm run dev` so the database engine is active on port 27017.');
    process.exit(1);
  }
}

inspect();
