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

// Security & Core Middlewares
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
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
