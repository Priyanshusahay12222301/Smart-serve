const jwt = require('jsonwebtoken');

const generateToken = (userId, role, smartServeId) => {
  return jwt.sign(
    { 
      userId, 
      role,
      smartServeId 
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid token');
  }
};

module.exports = { generateToken, verifyToken };
