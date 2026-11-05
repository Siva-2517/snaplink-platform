require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const { validateEnv } = require('./config/env');
const connectDB = require('./config/db');
const { apiLimiter } = require('./middleware/rateLimiter');
const authRoutes = require('./routes/authRoutes');
const urlRoutes = require('./routes/urlRoutes');
const redirectRoutes = require('./routes/redirectRoutes');
const publicRoutes = require('./routes/publicRoutes');
const analyticsBuffer = require('./utils/buffer');
const mongoose = require('mongoose');

// 1. Validate environment configuration on boot
const env = validateEnv();

const app = express();
const PORT = env.PORT;

// 2. Connect to MongoDB (skip during automated integration tests if managed externally)
if (process.env.NODE_ENV !== 'test') {
  connectDB();
}

// --------------------
// Security & Middlewares
// --------------------
app.use(
  helmet({
    contentSecurityPolicy: false, // Allows cross-origin assets for QR codes and avatars
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  })
);

// CORS configuration supporting single origin, list of origins, or dev fallback
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim().replace(/\/$/, ''));

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);

      const normalizedOrigin = origin.replace(/\/$/, '');
      if (
        allowedOrigins.includes(normalizedOrigin) ||
        process.env.NODE_ENV !== 'production'
      ) {
        return callback(null, true);
      }
      return callback(new Error(`CORS policy does not allow access from origin: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// Request Logger (omitted in test mode to keep test runs clean)
if (process.env.NODE_ENV !== 'test') {
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });
}

// --------------------
// Health Check
// --------------------
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
    message: 'SnapLink-URL Shortener Backend is healthy.'
  });
});

// --------------------
// API Routes (Rate limited)
// --------------------
app.use('/api/auth', apiLimiter, authRoutes);
app.use('/api/urls', apiLimiter, urlRoutes);
app.use('/api/public', apiLimiter, publicRoutes);

// Server-side redirection (top-level /:shortCode)
app.use('/', redirectRoutes);

// --------------------
// 404 Handler
// --------------------
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Resource not found.'
  });
});

// --------------------
// Centralized Global Error Handler
// --------------------
app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || 'An unexpected server error occurred.';

  if (process.env.NODE_ENV !== 'test') {
    console.error(`❌ [Error ${statusCode}] ${req.method} ${req.url}:`, err.stack || err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// --------------------
// Start Server (only when not imported as module in tests)
// --------------------
let server = null;
if (process.env.NODE_ENV !== 'test') {
  server = app.listen(PORT, () => {
    console.log(`🚀 Server running in ${env.NODE_ENV} mode on port ${PORT}`);
  });
}

// --------------------
// Graceful Shutdown
// --------------------
const handleShutdown = async (signal) => {
  console.log(`\n📡 Received ${signal}. Initiating graceful shutdown...`);

  try {
    await analyticsBuffer.shutdown();
    console.log('✅ Buffered analytics successfully flushed to database.');
  } catch (error) {
    console.error('❌ Error flushing buffer during shutdown:', error);
  }

  try {
    await mongoose.connection.close(false);
    console.log('🔌 MongoDB connection closed cleanly.');
  } catch (dbErr) {
    console.error('❌ Error closing MongoDB connection:', dbErr);
  }

  if (server) {
    server.close(() => {
      console.log('🛑 Server stopped. Goodbye!');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
};

process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGTERM', () => handleShutdown('SIGTERM'));

module.exports = app;
