require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
const connectDB = require('./db');

const authRoutes = require('./routes/auth');
const blogRoutes = require('./routes/blogs');
const commentRoutes = require('./routes/comments');
const likeRoutes = require('./routes/likes');
const notificationRoutes = require('./routes/notifications');
const savedRoutes = require('./routes/saved');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB on startup when running as standalone server
if (require.main === module) {
  connectDB();
}

const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map((url) => url.trim())
  : ['http://localhost:5173', 'http://localhost:5000'];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.includes('*') ||
        allowedOrigins.includes(origin) ||
        origin.endsWith('.vercel.app') ||
        process.env.NODE_ENV !== 'production'
      ) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[HTTP] ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
  });
  next();
});

// Middleware to ensure database connectivity for serverless invocations
app.use(async (req, res, next) => {
  if (req.path.startsWith('/api') && req.path !== '/api/health') {
    try {
      await connectDB();
    } catch (err) {
      console.error('[Database Middleware Error]', err);
      return res.status(500).json({
        success: false,
        message: 'Database connection failed. Please verify MONGODB_URI.'
      });
    }
  }
  next();
});

// Health Check Endpoint
app.get('/api/health', async (req, res) => {
  let dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  if (dbStatus !== 'connected') {
    try {
      await connectDB();
      dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    } catch (err) {
      dbStatus = 'error: ' + err.message;
    }
  }
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: dbStatus,
    environment: process.env.NODE_ENV || 'development'
  });
});

// Mount REST API Routes
app.use('/api/auth', authRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/likes', likeRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/saved', savedRoutes);

// Serve static client assets if built
const clientDistPath = path.join(__dirname, '../client/dist');
app.use(express.static(clientDistPath));

app.get('*', (req, res, next) => {
  if (req.originalUrl.startsWith('/api')) {
    return res.status(404).json({
      success: false,
      message: `API endpoint '${req.originalUrl}' not found.`
    });
  }
  const indexPath = path.join(clientDistPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      next();
    }
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Error Handler]', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
});

// Start Server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`[Server] Blog Application backend running on http://localhost:${PORT}`);
    console.log(`[Server] Health check: http://localhost:${PORT}/api/health`);
  });
}

module.exports = app;
