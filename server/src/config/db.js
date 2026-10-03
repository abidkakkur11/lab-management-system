const mongoose = require('mongoose');
const { ensureMongoDB } = require('./mongoRunner');

let mongodInstance = null;

const connectDB = async () => {
  // Ensure a running MongoDB service (external or embedded with persistent storage)
  mongodInstance = await ensureMongoDB();

  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/lab_management_system';

  try {
    const conn = await mongoose.connect(uri);
    console.log(`[MongoDB] Connected to database at: ${conn.connection.host}:${conn.connection.port}/${conn.connection.name}`);
    return conn;
  } catch (err) {
    console.error('[MongoDB] Connection error:', err.message);
    throw err;
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    if (mongodInstance) {
      await mongodInstance.stop();
      console.log('[MongoDB] Embedded MongoDB stopped.');
    }
  } catch (err) {
    console.error('[MongoDB] Error during disconnect:', err.message);
  }
};

module.exports = { connectDB, disconnectDB };
