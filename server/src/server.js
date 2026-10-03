require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const { connectDB } = require('./config/db');
const { initSocket } = require('./sockets/socketHandler');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // 1. Connect to Database (local or embedded fallback)
    await connectDB();

    // 2. Create HTTP server
    const server = http.createServer(app);

    // 3. Initialize Socket.IO
    const io = new Server(server, {
      cors: {
        origin: [
          process.env.CLIENT_URL || 'http://localhost:5173',
          'http://localhost:3000',
          'http://127.0.0.1:5173',
        ],
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        credentials: true,
      },
    });

    initSocket(io);

    // 4. Start listening
    server.listen(PORT, () => {
      console.log('==================================================');
      console.log(` LAB MANAGEMENT SYSTEM - BACKEND SERVER RUNNING`);
      console.log(` Mode: ${process.env.NODE_ENV || 'development'}`);
      console.log(` Port: ${PORT}`);
      console.log(` API Base: http://localhost:${PORT}/api`);
      console.log(` Socket.IO: Initialized`);
      console.log('==================================================');
    });
  } catch (error) {
    console.error('[Server Startup Error]', error.message);
    process.exit(1);
  }
};

startServer();
