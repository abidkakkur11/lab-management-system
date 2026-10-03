const { MongoMemoryServer } = require('mongodb-memory-server');
const path = require('path');
const fs = require('fs');
const net = require('net');

// Check if a port is already open
const isPortOpen = (port) => {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(800);
    socket.on('connect', () => {
      socket.destroy();
      resolve(true); // Port has something listening (e.g. real MongoDB)
    });
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.on('error', () => {
      resolve(false);
    });
    socket.connect(port, '127.0.0.1');
  });
};

let mongodInstance = null;

const ensureMongoDB = async () => {
  const is27017Active = await isPortOpen(27017);
  if (is27017Active) {
    console.log('[MongoDB Service] Existing MongoDB service detected on port 27017.');
    return null;
  }

  console.log('[MongoDB Service] No external MongoDB active on port 27017. Initializing embedded local MongoDB engine with disk persistence...');
  const dbPath = path.join(__dirname, '../../data/db');
  if (!fs.existsSync(dbPath)) {
    fs.mkdirSync(dbPath, { recursive: true });
  }

  try {
    mongodInstance = await MongoMemoryServer.create({
      instance: {
        port: 27017,
        dbPath,
        storageEngine: 'wiredTiger',
      },
    });
    console.log(`[MongoDB Service] Embedded persistent MongoDB running on port 27017 (storage: ${dbPath})`);
    return mongodInstance;
  } catch (err) {
    console.warn(`[MongoDB Service] Could not bind port 27017 directly (${err.message}). Starting on dynamic port...`);
    mongodInstance = await MongoMemoryServer.create({
      instance: {
        dbPath,
        storageEngine: 'wiredTiger',
      },
    });
    const dynamicUri = mongodInstance.getUri();
    console.log(`[MongoDB Service] Embedded persistent MongoDB running at: ${dynamicUri}`);
    process.env.MONGODB_URI = `${dynamicUri}lab_management_system`;
    return mongodInstance;
  }
};

module.exports = { ensureMongoDB };
