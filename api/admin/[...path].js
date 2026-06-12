const app = require('../../restaurant/admin/backend/src/app');
const connectDB = require('../../restaurant/admin/backend/src/config/db');

let isConnected = false;

module.exports = async (req, res) => {
  if (!isConnected) {
    try {
      await connectDB();
      isConnected = true;
    } catch (err) {
      // Log but don't crash — Mongoose buffers operations
      console.error('[admin-api] DB connection error:', err.message);
    }
  }

  // Rewrite /api/admin/* → /api/* for the express router
  if (req.url.startsWith('/api/admin')) {
    req.url = req.url.replace('/api/admin', '/api') || '/api';
  }

  return app(req, res);
};
