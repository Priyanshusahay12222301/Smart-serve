// Simple test function — no dependencies, no DB
module.exports = (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({
    status: 'ok',
    message: 'Vercel function routing works!',
    url: req.url,
    method: req.method,
    time: new Date().toISOString()
  }));
};
