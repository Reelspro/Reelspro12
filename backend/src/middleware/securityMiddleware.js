/**
 * middleware/securityMiddleware.js
 *
 * Centralised rate-limiting rules.
 *
 * Priority:
 *  1. authLimiter    — /api/auth/*  → 10 req / 15 min per IP (hardcoded, strict)
 *  2. apiLimiter     — global       → reads `rate_limit_requests` from system_settings,
 *                                     falls back to 100 req / 15 min if DB is unavailable
 *  3. generationLimiter — /api/reels/generate → 20 generations / 24 h
 *
 * Localhost IPs are always skipped so development is not throttled.
 */

const rateLimit = require('express-rate-limit');

/* ─── helpers ─────────────────────────────────────── */

/** Returns true when the request originates from localhost. */
const isLocalhost = (req) => {
  const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '';
  return (
    ip.includes('127.0.0.1') ||
    ip.includes('::1') ||
    ip.toLowerCase().includes('localhost') ||
    ip === '::ffff:127.0.0.1'
  );
};

/**
 * Read rate_limit_requests from system_settings.
 * Returns the value on success, or `fallback` on any error (table missing, row missing, etc.).
 */
const readDbRateLimit = (fallback = 100) => {
  try {
    const db = require('../config/db');
    const row = db.prepare('SELECT rate_limit_requests FROM system_settings WHERE id = 1').get();
    const value = parseInt(row?.rate_limit_requests, 10);
    return Number.isFinite(value) && value > 0 ? value : fallback;
  } catch {
    return fallback;
  }
};

/* ─── 1. Global API limiter (DB-driven) ───────────── */

/**
 * Uses a dynamic handler so the limit is read fresh from the DB on every
 * request cycle start. This lets admins change it at runtime without restart.
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  // `max` can be a function — express-rate-limit v6+ supports it
  max: () => readDbRateLimit(100),
  message: {
    error: 'Too many requests from this IP. Please try again after 15 minutes.'
  },
  standardHeaders: true,   // Return RateLimit-* headers (RFC 6585)
  legacyHeaders: false,    // Disable X-RateLimit-* legacy headers
  skip: isLocalhost,
});

/* ─── 2. Auth limiter (strict, hardcoded) ─────────── */

/**
 * Applied to /api/auth/* routes only.
 * 10 requests per 15 minutes per IP — prevents brute-force logins.
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: {
    error: 'Too many authentication attempts. Please try again in 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: isLocalhost,
});

/* ─── 3. Generation limiter ───────────────────────── */

/**
 * Applied specifically to /api/reels/generate.
 * Prevents abuse of the expensive AI + render pipeline.
 * 20 generations per 24 hours per IP.
 */
const generationLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 20,
  message: {
    error: 'Daily generation limit reached. Please come back tomorrow!'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: isLocalhost,
});

module.exports = {
  apiLimiter,
  authLimiter,
  generationLimiter,
};
