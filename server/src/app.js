require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const { apiLimiter } = require('./middleware/rateLimiter');
const authRoutes = require('./routes/authRoutes');
const urlRoutes = require('./routes/urlRoutes');
const redirectRoutes = require('./routes/redirectRoutes');
const publicRoutes = require('./routes/publicRoutes');
const analyticsBuffer = require('./utils/buffer');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Global Middlewares
app.use(cors({
  origin: '*', // Allow connections from any origin for ease of local testing
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));


app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'SnapLink-URL Shortener Backend is healthy.' });
});

// API Routes (Rate limited)
app.use('/api/auth', apiLimiter, authRoutes);
app.use('/api/urls', apiLimiter, urlRoutes);
app.use('/api/public', apiLimiter, publicRoutes);

app.use('/', redirectRoutes);


app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Resource not found.' });
});

// Start Server
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// GRACEFUL SHUTDOWN: Ensure in-memory buffered writes flush to DB before exiting
const handleShutdown = async (signal) => {
  console.log(`\n📡 Received ${signal}. Initiating graceful shutdown...`);
  
  try {
    // Flush remaining visits to database
    await analyticsBuffer.shutdown();
    console.log('✅ Buffered analytics successfully flushed to database.');
  } catch (error) {
    console.error('❌ Error flushing buffer during shutdown:', error);
  }

  server.close(() => {
    console.log('🛑 Server stopped. Goodbye!');
    process.exit(0);
  });
};

process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGTERM', () => handleShutdown('SIGTERM'));
