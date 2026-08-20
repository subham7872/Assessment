const { Server } = require('socket.io');
const mongoose = require('mongoose');
const { verifyAccessToken } = require('../utils/tokenUtils');
const logger = require('../utils/logger');
const projectRepository = require('../repositories/projectRepository');
const taskRepository = require('../repositories/taskRepository');
const { joinProjectRoom, leaveProjectRoom } = require('./roomManager');

let io = null;
const activeUserSockets = new Map();

const handleSocketError = (socket, error) => {
  logger.error(`Socket Error [User: ${socket.user?.userId}]: ${error.message}\n${error.stack || ''}`);
  const message = error.isOperational ? error.message : 'An error occurred';
  socket.emit('project:error', { message });
};

const getAllowedOrigins = () => {
  const envOrigins = (process.env.CLIENT_URL || '')
    .split(',')
    .map((url) => url.trim().replace(/\/$/, ''))
    .filter(Boolean);

  const defaultOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'https://assessment-sooty-omega.vercel.app',
  ];
  return Array.from(new Set([...envOrigins, ...defaultOrigins]));
};

const checkCorsOrigin = (origin, callback) => {
  if (!origin) return callback(null, true);
  const allowed = getAllowedOrigins();
  const normalizedOrigin = origin.replace(/\/$/, '');

  if (allowed.includes(normalizedOrigin) || allowed.includes('*') || process.env.NODE_ENV !== 'production') {
    return callback(null, true);
  }

  if (normalizedOrigin.endsWith('.vercel.app') || normalizedOrigin.endsWith('.onrender.com')) {
    return callback(null, true);
  }

  return callback(null, true);
};

const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: checkCorsOrigin,
      credentials: true,
    },
  });

  io.use((socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        return next(new Error('Authentication error: Token missing'));
      }

      const decoded = verifyAccessToken(token);
      socket.user = {
        userId: decoded.userId || decoded.id,
        email: decoded.email,
        name: decoded.name || '',
      };
      next();
    } catch (err) {
      next(new Error(`Authentication error: ${err.message}`));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user?.userId;
    logger.info(`Socket connected: ${socket.id} (User: ${userId})`);

    // Track user session sockets
    if (userId) {
      if (!activeUserSockets.has(userId)) {
        activeUserSockets.set(userId, new Set());
      }
      activeUserSockets.get(userId).add(socket.id);
    }

    // Secure Project Join
    socket.on('project:join', async (projectId) => {
      try {
        if (!projectId || !mongoose.Types.ObjectId.isValid(projectId)) {
          return socket.emit('project:error', { message: 'Invalid project ID' });
        }

        const project = await projectRepository.findById(projectId);
        if (!project || !project.isMember(userId)) {
          return socket.emit('project:error', { message: 'Access denied' });
        }

        joinProjectRoom(socket, projectId);
        socket.emit('project:joined', {
          projectId,
          userId,
        });
      } catch (err) {
        handleSocketError(socket, err);
      }
    });

    // Project Leave
    socket.on('project:leave', async (projectId) => {
      try {
        if (projectId) {
          leaveProjectRoom(socket, projectId);
          socket.emit('project:left', { projectId });
        }
      } catch (err) {
        handleSocketError(socket, err);
      }
    });

    // Task Viewing Presence
    socket.on('task:viewing', async ({ projectId, taskId }) => {
      try {
        if (!projectId || !taskId || !mongoose.Types.ObjectId.isValid(projectId)) return;
        const project = await projectRepository.findById(projectId);
        if (!project || !project.isMember(userId)) return;

        const task = await taskRepository.findByIdAndProject(taskId, projectId);
        if (!task) return;

        socket.to(`project:${projectId}`).emit('user:viewing', {
          userId,
          userName: socket.user.name,
          taskId,
          projectId,
        });
      } catch (err) {
        handleSocketError(socket, err);
      }
    });

    // Task Editing Presence
    socket.on('task:editing', async ({ projectId, taskId }) => {
      try {
        if (!projectId || !taskId || !mongoose.Types.ObjectId.isValid(projectId)) return;
        const project = await projectRepository.findById(projectId);
        if (!project || !project.isMember(userId)) return;

        const task = await taskRepository.findByIdAndProject(taskId, projectId);
        if (!task) return;

        socket.to(`project:${projectId}`).emit('user:editing', {
          userId,
          userName: socket.user.name,
          taskId,
          projectId,
        });
      } catch (err) {
        handleSocketError(socket, err);
      }
    });

    // Stop Editing Presence
    socket.on('task:stopped_editing', async ({ projectId, taskId }) => {
      try {
        if (!projectId || !taskId) return;
        socket.to(`project:${projectId}`).emit('user:stopped_editing', {
          userId,
          userName: socket.user.name,
          taskId,
          projectId,
        });
      } catch (err) {
        handleSocketError(socket, err);
      }
    });

    // Disconnect & Presence Cleanup
    socket.on('disconnect', (reason) => {
      logger.info(`Socket disconnected: ${socket.id} (Reason: ${reason})`);
      if (userId && activeUserSockets.has(userId)) {
        const userSocketSet = activeUserSockets.get(userId);
        userSocketSet.delete(socket.id);

        if (userSocketSet.size === 0) {
          activeUserSockets.delete(userId);
          io.emit('user:offline', { userId });
        }
      }
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io has not been initialized!');
  }
  return io;
};

module.exports = {
  initSocket,
  getIO,
};
