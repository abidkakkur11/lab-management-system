let ioInstance = null;

const initSocket = (io) => {
  ioInstance = io;

  io.on('connection', (socket) => {
    // User joins personal room for notifications
    socket.on('join_user_room', (userId) => {
      if (userId) {
        socket.join(`user:${userId}`);
      }
    });

    // Client views a specific lab room for live seat/booking status updates
    socket.on('join_lab_room', (labId) => {
      if (labId) {
        socket.join(`lab:${labId}`);
      }
    });

    socket.on('leave_lab_room', (labId) => {
      if (labId) {
        socket.leave(`lab:${labId}`);
      }
    });

    socket.on('disconnect', () => {
      // Clean disconnect
    });
  });
};

const getIO = () => ioInstance;

const emitToUser = (userId, event, data) => {
  if (ioInstance && userId) {
    ioInstance.to(`user:${userId}`).emit(event, data);
  }
};

const emitToLab = (labId, event, data) => {
  if (ioInstance && labId) {
    ioInstance.to(`lab:${labId}`).emit(event, data);
  }
};

const emitBroadcast = (event, data) => {
  if (ioInstance) {
    ioInstance.emit(event, data);
  }
};

module.exports = {
  initSocket,
  getIO,
  emitToUser,
  emitToLab,
  emitBroadcast,
};
