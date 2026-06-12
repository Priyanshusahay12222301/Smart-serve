// Vercel serverless handler for all /api/customer/* routes
// These are served by the restaurant admin backend (Express/CommonJS)
const app = require('../../restaurant/admin/backend/src/app');
const connectDB = require('../../restaurant/admin/backend/src/config/db');

let isConnected = false;

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Debug endpoint — returns what req.url Vercel passes to this function
  if (req.url && req.url.includes('__debug__')) {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      url: req.url,
      method: req.method,
      isConnected,
      mongoUri: process.env.MONGODB_URI ? 'SET' : 'NOT SET',
    }));
    return;
  }

  if (!isConnected) {
    try {
      await connectDB();
      isConnected = true;
    } catch (err) {
      // Log but don't crash — Mongoose buffers operations
      console.error('[customer-api] DB connection error:', err.message);
    }
  }

  // No URL rewriting needed — express app already has routes at /api/customer/*
  return app(req, res);
};
