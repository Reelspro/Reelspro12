/**
 * app.js — Express application factory
 *
 * Middleware order (intentional):
 *   1. helmet          — security headers + CSP
 *   2. cors            — cross-origin policy
 *   3. apiLimiter      — global IP rate-limit (DB-driven, 100 req/15 min default)
 *   4. morgan          — request logging
 *   5. express.json    — body parsing
 *   6. sanitizeBody    — XSS / injection sanitisation
 *   7. Routes          — auth limiter applied specifically to /api/auth/*
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const { apiLimiter, authLimiter } = require('./middleware/securityMiddleware');
const { sanitizeBody } = require('./middleware/sanitizeMiddleware');

const app = express();

/* ──────────────────────────────────────────────────────────────
   1. HELMET — Security headers + Content-Security-Policy
   ────────────────────────────────────────────────────────────── */
app.use(
  helmet({
    // Allow cross-origin loading of media assets (thumbnails, reels, etc.)
    crossOriginResourcePolicy: { policy: 'cross-origin' },

    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        // Allow inline scripts/styles needed by some admin UIs
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
        imgSrc: ["'self'", 'data:', 'blob:', 'https:', 'http:'],
        mediaSrc: ["'self'", 'blob:', 'https:', 'http:'],
        connectSrc: [
          "'self'",
          'ws:', 'wss:',          // Socket.IO WebSocket connections
          'https:', 'http:',      // API calls to external providers
        ],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: null,  // Don't force HTTPS in development
      },
    },

    // Other useful helmet defaults kept enabled:
    hsts: false,                     // Disabled — set by reverse proxy in production
    noSniff: true,                   // X-Content-Type-Options: nosniff
    frameguard: { action: 'deny' },  // X-Frame-Options: DENY (clickjacking)
    xssFilter: true,                 // X-XSS-Protection: 1; mode=block
  })
);

/* ──────────────────────────────────────────────────────────────
   2. CORS
   ────────────────────────────────────────────────────────────── */
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

/* ──────────────────────────────────────────────────────────────
   3. GLOBAL RATE LIMIT (100 req / 15 min, DB-driven)
   ────────────────────────────────────────────────────────────── */
app.use(apiLimiter);

/* ──────────────────────────────────────────────────────────────
   4-6. LOGGING / BODY PARSING / SANITISATION
   ────────────────────────────────────────────────────────────── */
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(sanitizeBody);

/* ──────────────────────────────────────────────────────────────
   7. ROUTES
   ────────────────────────────────────────────────────────────── */
const authRoutes      = require('./routes/authRoutes');
const sourceRoutes    = require('./routes/sourceRoutes');
const apiKeysRoutes   = require('./routes/apiKeysRoutes');
const reelRoutes      = require('./routes/reelRoutes');
const redirectRoutes  = require('./routes/redirectRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const adminRoutes     = require('./routes/adminRoutes');

// Auth routes use a STRICTER limiter: 10 req / 15 min per IP
app.use('/api/auth',      authLimiter, authRoutes);
app.use('/api/sources',   sourceRoutes);
app.use('/api/keys',      apiKeysRoutes);
app.use('/api/reels',     reelRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/admin',     adminRoutes);
app.use('/api/update',    require('./routes/updateRoutes'));
app.use('/r',             redirectRoutes);
app.use('/api/upload',    require('./routes/upload'));

/* ──────────────────────────────────────────────────────────────
   STATIC ASSETS — must come after route limiters
   ────────────────────────────────────────────────────────────── */
const path = require('path');
app.use('/output',           express.static(path.resolve(__dirname, '../../output')));
app.use('/storage',          express.static(path.resolve(__dirname, '../../storage')));
app.use('/storage/uploads',  express.static(path.join(__dirname, '../storage/uploads')));
app.use('/assets',           express.static(path.resolve(__dirname, '../assets')));

/* ──────────────────────────────────────────────────────────────
   HEALTH CHECK
   ────────────────────────────────────────────────────────────── */
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'ReelsPro API is running' });
});

/* ──────────────────────────────────────────────────────────────
   GLOBAL ERROR HANDLER
   ────────────────────────────────────────────────────────────── */
app.use((err, req, res, next) => {
  console.error('[App] Unhandled error:', err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

module.exports = app;
