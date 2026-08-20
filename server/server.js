require('dotenv').config();
const http = require('http');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

const connectDB = require('./src/config/db');
const routes = require('./src/routes');
const errorHandler = require('./src/middleware/errorHandler');
const { initSocket } = require('./src/socket');
const logger = require('./src/utils/logger');

const app = express();
app.set('trust proxy', 1);

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

  // Always reflect origin if matching Vercel domain pattern
  if (normalizedOrigin.endsWith('.vercel.app') || normalizedOrigin.endsWith('.onrender.com')) {
    return callback(null, true);
  }

  return callback(null, true);
};

// Security & Core Middlewares
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);
app.use(
  cors({
    origin: checkCorsOrigin,
    credentials: true,
  })
);
app.use(compression());
app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'combined'));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mount API Routes
app.use('/api/v1', routes);

// Centralized Error Handling Middleware
app.use(errorHandler);

// HTTP & Socket Server Setup
const server = http.createServer(app);
initSocket(server);

const PORT = process.env.PORT || 5000;

const emailUtils = require('./src/utils/emailUtils');

const startServer = async () => {
  try {
    await connectDB();
    await emailUtils.verifyEmailTransport();
    server.listen(PORT, () => {
      logger.info(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
      console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    });
  } catch (error) {
    logger.error(`Failed to start server: ${error.message}`);
    console.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

startServer();

// Graceful Shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    console.log('HTTP server closed');
    process.exit(0);
  });
});
