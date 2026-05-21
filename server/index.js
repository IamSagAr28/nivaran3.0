const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const authRoutes = require('./auth');
const webhookRoutes = require('./webhooks');
const adminRoutes = require('./admin');
const newsletterRoutes = require('./newsletter');
const membershipRoutes = require('./membership');
const workshopRoutes = require('./workshops');
const productRoutes = require('./products');
const orderRoutes = require('./orders');
const blogsRoutes = require('./blogs');
const heroSlidesRoutes = require('./hero-slides');
const paymentRoutes = require('./payments');
const sessionMiddleware = require('./session');

const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy for Render deployment
app.set('trust proxy', 1);

// CORS configuration for production
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3002',
  'https://nivaran31-h5u5ip9ru-vidyasagars-projects-414a8af3.vercel.app',
  'https://nivaran31-awqiwe0kv-vidyasagars-projects-414a8af3.vercel.app',
  'https://nivaran31.vercel.app',
  'https://www.nivaranupcyclers.in',
  'https://nivaranupcyclers.in',
  'https://shop.nivaranupcyclers.in',
  process.env.FRONTEND_URL,
  process.env.CLIENT_URL
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc)
    if (!origin) return callback(null, true);

    // Check if origin is allowed
    const isAllowed = allowedOrigins.some(allowed => origin.includes(allowed) || allowed.includes(origin));

    if (isAllowed || origin.includes('vercel.app') || origin.includes('localhost')) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(null, true); // Temporarily allow all for debugging if needed
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Security headers - Fix for CSP issues
app.use((req, res, next) => {
  // Remove restrictive CSP that's blocking resources
  res.removeHeader('Content-Security-Policy');

  // Set a very permissive CSP for production to ensure Google Auth and other scripts work
  res.setHeader(
    'Content-Security-Policy',
    "default-src * data: blob: 'unsafe-inline' 'unsafe-eval'; " +
    "script-src * data: blob: 'unsafe-inline' 'unsafe-eval'; " +
    "connect-src * data: blob: 'unsafe-inline'; " +
    "img-src * data: blob: 'unsafe-inline'; " +
    "frame-src * data: blob:; " +
    "style-src * data: blob: 'unsafe-inline';"
  );

  // Add permissive headers for production
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Allow fonts and scripts from any source for now to fix the specific errors
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  next();
});

// Webhooks need to be mounted before body parser if we want raw body
app.use('/api/webhooks', express.raw({ type: 'application/json' }));

// Use JSON parser for all other API routes with increased limit for base64 images/videos
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Body-parser error handler (e.g. payload too large)
app.use((err, req, res, next) => {
  if (err && (err.type === 'entity.too.large' || err.status === 413)) {
    return res.status(413).json({
      error: 'Uploaded media is too large. Please use smaller files or fewer uploads.',
    });
  }
  return next(err);
});

// Session Middleware
app.use(sessionMiddleware);

// Routes
app.use('/auth', authRoutes);
app.use('/api', authRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/membership', membershipRoutes);
app.use('/api/workshops', workshopRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/blogs', blogsRoutes);
app.use('/api/hero-slides', heroSlidesRoutes);
app.use('/api/payments', paymentRoutes);

// Health Check
app.get('/', (req, res) => {
  res.send('Nivaran Auth Server is running.');
});

// Diagnostic endpoint for debugging admin login issues
app.get('/api/admin/debug', async (req, res) => {
  try {
    const db = require('./database');
    const admins = await new Promise((resolve, reject) => {
      db.all('SELECT username FROM admin_users', [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
    res.json({
      status: 'ok',
      database: process.env.DATABASE_URL ? 'PostgreSQL' : 'SQLite',
      adminUsers: admins.map(a => a.username),
      adminCount: admins.length,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('Debug endpoint error:', err);
    res.status(500).json({
      status: 'error',
      error: err.message,
      database: process.env.DATABASE_URL ? 'PostgreSQL' : 'SQLite'
    });
  }
});

// Start Server only if run directly
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`👉 Client URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
  });
}

module.exports = app;
