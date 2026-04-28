import jwt from 'jsonwebtoken';
import User from '../models/User.model.js';

// Protect routes - verify JWT token
export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token (exclude password)
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user || !req.user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'User not found or inactive',
        });
      }

      next();
    } catch (error) {
      console.error(error);
      return res.status(401).json({
        success: false,
        message: 'Not authorized, token failed',
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no token provided',
    });
  }
};

// Restrict to specific roles
export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to perform this action',
      });
    }
    next();
  };
};

// Check tenant access (for Smart Admin routes)
export const checkTenantAccess = (req, res, next) => {
  const { smartServeId } = req.params;

  // Super admin can access all tenants
  if (req.user.role === 'SUPER_ADMIN') {
    return next();
  }

  // Smart admin can only access their own tenant
  if (req.user.role === 'SMART_ADMIN') {
    if (req.user.smartServeId.toString() !== smartServeId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this restaurant',
      });
    }
    return next();
  }

  return res.status(403).json({
    success: false,
    message: 'Unauthorized access',
  });
};
