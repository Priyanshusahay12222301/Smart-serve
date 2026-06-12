// Cache the ESM app module across warm invocations (dynamic import is module-cached by Node.js)
let appModule = null;

module.exports = async (req, res) => {
  if (!appModule) {
    // Dynamic import works in CJS for ESM modules (Node 14+)
    const imported = await import('../../super-admin/backend/src/app.js');
    appModule = imported.default;
  }

  // Rewrite /api/developer/* → /api/* for the express router
  if (req.url.startsWith('/api/developer')) {
    req.url = req.url.replace('/api/developer', '/api') || '/api';
  }

  return appModule(req, res);
};
