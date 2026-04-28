const { verifyToken } = require('../utils/jwt');
const User = require('../models/User.model');

const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = verifyToken(token);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = user;
    req.smartServeId = decoded.smartServeId;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

const authorizeSmartAdmin = (req, res, next) => {
  if (req.user.role !== 'SMART_ADMIN') {
    return res.status(403).json({ message: 'Access denied. Smart Admin only.' });
  }
  next();
};

module.exports = { authenticate, authorizeSmartAdmin };
