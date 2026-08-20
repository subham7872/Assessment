const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const projectRoutes = require('./projectRoutes');
const taskRoutes = require('./taskRoutes');
const fileRoutes = require('./fileRoutes');
const { apiLimiter } = require('../middleware/rateLimiter');

// General API rate limiter
router.use(apiLimiter);

// Mount Sub-routers
router.use('/auth', authRoutes);
router.use('/projects', projectRoutes);
router.use('/projects/:projectId/tasks', taskRoutes);
router.use('/projects/:projectId/tasks', fileRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is running',
  });
});

module.exports = router;
