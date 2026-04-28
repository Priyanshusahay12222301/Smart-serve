const User = require('../models/User.model');
const { generateToken } = require('../utils/jwt');
const bcrypt = require('bcryptjs');

// Login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('🔐 Login attempt:', { email, passwordLength: password?.length });

    // Find user and include password field
    const user = await User.findOne({ email }).select('+password');
    console.log('👤 User found:', user ? { id: user._id, email: user.email, role: user.role, hasPassword: !!user.password } : 'No user found');
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if user is SMART_ADMIN
    if (user.role !== 'SMART_ADMIN') {
      console.log('❌ Access denied - Role:', user.role);
      return res.status(403).json({ message: 'Access denied. Smart Admin only.' });
    }

    // Verify password
    console.log('🔑 Comparing passwords...');
    const isMatch = await bcrypt.compare(password, user.password);
    console.log('✅ Password match:', isMatch);
    
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken(user._id, user.role, user.smartServeId);

    console.log('🎉 Login successful for:', user.email);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        smartServeId: user.smartServeId
      }
    });
  } catch (error) {
    console.error('💥 Login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get current user
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Change password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
