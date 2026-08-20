const joinProjectRoom = (socket, projectId) => {
  try {
    socket.join(`project:${projectId}`);
  } catch (err) {
    // Fail silently if socket is unattached
  }
};

const leaveProjectRoom = (socket, projectId) => {
  try {
    socket.leave(`project:${projectId}`);
  } catch (err) {
    // Fail silently if socket is unattached
  }
};

const emitToProject = (projectId, event, data) => {
  try {
    const { getIO } = require('./index');
    const io = getIO();
    if (io) {
      io.to(`project:${projectId}`).emit(event, data);
    }
  } catch (err) {
    // Fail silently if Socket.io is not initialized (e.g. in test runner)
  }
};

module.exports = {
  joinProjectRoom,
  leaveProjectRoom,
  emitToProject,
};
