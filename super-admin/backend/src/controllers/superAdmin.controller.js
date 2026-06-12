import SmartServe from '../models/SmartServe.model.js';
import User from '../models/User.model.js';
import Branding from '../models/Branding.model.js';
import Order from '../models/Order.model.js';
import MenuItem from '../models/Menu.model.js';
import PlatformSettings from '../models/PlatformSettings.model.js';
import SupportTicket from '../models/SupportTicket.model.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Get io instance (will be set by server.js)
let io;
export const setSocketIO = (socketIO) => {
  io = socketIO;
};

// @desc    Quick fix for demo restaurant
// @route   POST /api/super-admin/smartserve/fix-demo-restaurant
// @access  Private (SUPER_ADMIN only)
export const fixDemoRestaurant = async (req, res) => {
  try {
    // Find restaurant with email admin@restaurant.com or address "123 Food Street"
    const restaurant = await SmartServe.findOne({
      $or: [
        { ownerEmail: 'admin@restaurant.com' },
        { address: '123 Food Street' }
      ]
    });

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Demo restaurant not found'
      });
    }

    // Generate Restaurant ID and QR Code
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 7).toUpperCase();
    restaurant.restaurantId = `REST-${timestamp}-${random}`;
    restaurant.restaurantName = restaurant.restaurantName || '123 Food Street';
    restaurant.ownerName = restaurant.ownerName || 'Demo Owner';
    
    const customerAppUrl = process.env.CUSTOMER_APP_URL || 'http://localhost:3002';
    restaurant.qrCode = {
      uniqueId: restaurant.restaurantId,
      url: `${customerAppUrl}/${restaurant.restaurantId}`
    };

    await restaurant.save();

    res.status(200).json({
      success: true,
      message: 'Demo restaurant fixed successfully!',
      data: {
        restaurantId: restaurant.restaurantId,
        restaurantName: restaurant.restaurantName,
        qrCodeUrl: restaurant.qrCode.url,
        _id: restaurant._id
      }
    });
  } catch (error) {
    console.error('Error fixing demo restaurant:', error);
    res.status(500).json({
      success: false,
      message: 'Error fixing demo restaurant',
      error: error.message
    });
  }
};


// @desc    Create new Smart Serve (Restaurant)
// @route   POST /api/super-admin/smartserve/create
// @access  Private (SUPER_ADMIN only)
export const createSmartServe = async (req, res) => {
  try {
    const {
      restaurantName,
      ownerName,
      email,
      phone,
      address,
      password,
      subscription,
    } = req.body;

    // Validate required fields
    if (!restaurantName || !ownerName || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: restaurantName, ownerName, email, phone, password',
      });
    }

    // Check if restaurant already exists
    const existingRestaurant = await SmartServe.findOne({ ownerEmail: email });
    if (existingRestaurant) {
      return res.status(400).json({
        success: false,
        message: 'Restaurant with this email already exists',
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists',
      });
    }

    // Create SmartServe
    const smartServe = await SmartServe.create({
      restaurantName,
      ownerName,
      ownerEmail: email,
      ownerPhone: phone,
      address,
      subscription: subscription || {
        plan: 'TRIAL',
        status: 'ACTIVE',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days trial
      },
    });

    // Create Smart Admin user for the restaurant (password will be hashed by pre-save hook)
    await User.create({
      email,
      password,
      name: ownerName,
      phone,
      role: 'SMART_ADMIN',
      smartServeId: smartServe._id,
    });

    // Create default branding for the restaurant
    await Branding.create({
      smartServeId: smartServe._id,
    });

    // Emit real-time event to super admin dashboard
    if (io) {
      io.to('super-admin').emit('restaurant-created', {
        restaurant: smartServe,
        message: `New restaurant "${restaurantName}" created successfully`
      });
    }

    res.status(201).json({
      success: true,
      message: 'Restaurant created successfully',
      data: smartServe,
    });
  } catch (error) {
    console.error('Error creating restaurant:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `A restaurant with this ${field} already exists. Please use a different ${field}.`,
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error creating restaurant',
      error: error.message,
    });
  }
};

// @desc    Create Smart Admin for a restaurant
// @route   POST /api/super-admin/user/create-admin
// @access  Private (SUPER_ADMIN only)
export const createSmartAdmin = async (req, res) => {
  try {
    const { email, password, name, phone, smartServeId } = req.body;

    // Validate input
    if (!email || !password || !smartServeId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields',
      });
    }

    // Check if SmartServe exists
    const smartServe = await SmartServe.findById(smartServeId);
    if (!smartServe) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found',
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists',
      });
    }

    // Create user
    const user = await User.create({
      email,
      password,
      name,
      phone,
      role: 'SMART_ADMIN',
      smartServeId,
    });

    res.status(201).json({
      success: true,
      message: 'Smart Admin created successfully',
      data: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        smartServeId: user.smartServeId,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error creating admin',
      error: error.message,
    });
  }
};

// @desc    Get all SmartServe restaurants
// @route   GET /api/super-admin/smartserve/all
// @access  Private (SUPER_ADMIN only)
export const getAllSmartServe = async (req, res) => {
  try {
    const restaurants = await SmartServe.find().sort({ createdAt: -1 });

    // Get order counts for each restaurant
    const restaurantsWithStats = await Promise.all(
      restaurants.map(async (restaurant) => {
        const totalOrders = await Order.countDocuments({ smartServeId: restaurant._id });
        return {
          ...restaurant.toObject(),
          stats: {
            totalOrders,
          },
        };
      })
    );

    res.status(200).json({
      success: true,
      count: restaurantsWithStats.length,
      data: restaurantsWithStats,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error fetching restaurants',
      error: error.message,
    });
  }
};

// @desc    Get single SmartServe details
// @route   GET /api/super-admin/smartserve/:id
// @access  Private (SUPER_ADMIN only)
export const getSmartServeById = async (req, res) => {
  try {
    const smartServe = await SmartServe.findById(req.params.id);

    if (!smartServe) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found',
      });
    }

    // Get associated admins
    const admins = await User.find({
      smartServeId: smartServe._id,
      role: 'SMART_ADMIN',
    }).select('-password');

    res.status(200).json({
      success: true,
      data: {
        ...smartServe.toObject(),
        admins,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error fetching restaurant details',
    });
  }
};

// @desc    Update SmartServe
// @route   PUT /api/super-admin/smartserve/:id
// @access  Private (SUPER_ADMIN only)
export const updateSmartServe = async (req, res) => {
  try {
    const { password, ...updateData } = req.body;

    const smartServe = await SmartServe.findById(req.params.id);

    if (!smartServe) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found',
      });
    }

    // Update SmartServe data
    if (updateData.restaurantName) smartServe.restaurantName = updateData.restaurantName;
    if (updateData.ownerName) smartServe.ownerName = updateData.ownerName;
    if (updateData.phone) smartServe.ownerPhone = updateData.phone;
    if (updateData.address) smartServe.address = updateData.address;
    if (typeof updateData.isActive !== 'undefined') smartServe.isActive = updateData.isActive;
    
    await smartServe.save();

    // Update associated user if needed
    if (updateData.ownerName || password) {
      const userUpdate = {};
      if (updateData.ownerName) userUpdate.name = updateData.ownerName;
      if (password) userUpdate.password = password;

      const user = await User.findOne({ smartServeId: smartServe._id, role: 'SMART_ADMIN' });
      if (user) {
        Object.assign(user, userUpdate);
        await user.save();
      }
    }

    res.status(200).json({
      success: true,
      message: 'Restaurant updated successfully',
      data: smartServe,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error updating restaurant',
      error: error.message,
    });
  }
};

// @desc    Delete/Deactivate SmartServe
// @route   DELETE /api/super-admin/smartserve/:id
// @access  Private (SUPER_ADMIN only)
export const deleteSmartServe = async (req, res) => {
  try {
    // Check if hard delete is requested
    const hardDelete = req.query.permanent === 'true';

    const smartServe = await SmartServe.findById(req.params.id);

    if (!smartServe) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found',
      });
    }

    if (hardDelete) {
      // Permanently delete restaurant and all associated data
      await SmartServe.findByIdAndDelete(req.params.id);
      await User.deleteMany({ smartServeId: smartServe._id });
      await Branding.deleteMany({ smartServeId: smartServe._id });
      await MenuItem.deleteMany({ smartServeId: smartServe._id });
      await Order.deleteMany({ smartServeId: smartServe._id });

      res.status(200).json({
        success: true,
        message: 'Restaurant permanently deleted successfully',
      });
    } else {
      // Soft delete - just deactivate
      smartServe.isActive = false;
      await smartServe.save();

      // Deactivate all associated users
      await User.updateMany(
        { smartServeId: smartServe._id },
        { isActive: false }
      );

      res.status(200).json({
        success: true,
        message: 'Restaurant deactivated successfully',
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error deleting restaurant',
      error: error.message,
    });
  }
};

// @desc    Update restaurant subscription
// @route   PUT /api/super-admin/smartserve/:id/subscription
// @access  Private (SUPER_ADMIN only)
export const updateSubscription = async (req, res) => {
  try {
    const { plan, status, startDate, endDate } = req.body;

    const smartServe = await SmartServe.findById(req.params.id);

    if (!smartServe) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found',
      });
    }

    // Update subscription fields
    if (plan) smartServe.subscription.plan = plan;
    if (status) smartServe.subscription.status = status;
    if (startDate) smartServe.subscription.startDate = startDate;
    if (endDate) smartServe.subscription.endDate = endDate;

    await smartServe.save();

    res.status(200).json({
      success: true,
      message: 'Subscription updated successfully',
      data: smartServe,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error updating subscription',
      error: error.message,
    });
  }
};

// @desc    Get system analytics
// @route   GET /api/super-admin/stats
// @access  Private (SUPER_ADMIN only)
export const getSystemStats = async (req, res) => {
  try {
    const totalRestaurants = await SmartServe.countDocuments();
    const activeRestaurants = await SmartServe.countDocuments({ isActive: true });
    const totalAdmins = await User.countDocuments({ role: 'SMART_ADMIN' });
    const totalOrders = await Order.countDocuments();
    const totalMenuItems = await MenuItem.countDocuments();

    // Calculate total revenue across all restaurants
    const revenueAggregation = await Order.aggregate([
      { $match: { status: 'COMPLETED' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]);

    const totalRevenue = revenueAggregation[0]?.total || 0;

    res.status(200).json({
      success: true,
      data: {
        totalRestaurants,
        activeRestaurants,
        totalAdmins,
        totalOrders,
        totalMenuItems,
        totalRevenue,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error fetching system stats',
    });
  }
};

// @desc    Get analytics data
// @route   GET /api/super-admin/analytics
// @access  Private (SUPER_ADMIN only)
export const getAnalytics = async (req, res) => {
  try {
    const { period = '7days' } = req.query;

    // Calculate date range
    let startDate;
    const endDate = new Date();

    switch (period) {
      case '7days':
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30days':
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90days':
        startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1year':
        startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    }

    // Restaurant growth over time
    const restaurantGrowth = await SmartServe.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Orders over time
    const ordersOverTime = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          orders: { $sum: 1 },
          revenue: { $sum: '$totalAmount' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Plan distribution
    const planDistribution = await SmartServe.aggregate([
      {
        $group: {
          _id: '$subscription.plan',
          count: { $sum: 1 }
        }
      }
    ]);

    // Status distribution
    const statusDistribution = await SmartServe.aggregate([
      {
        $group: {
          _id: '$subscription.status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Top restaurants by orders
    const topRestaurants = await Order.aggregate([
      {
        $group: {
          _id: '$smartServeId',
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$totalAmount' }
        }
      },
      { $sort: { totalOrders: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'smartserves',
          localField: '_id',
          foreignField: '_id',
          as: 'restaurant'
        }
      },
      { $unwind: '$restaurant' }
    ]);

    // Recent activity
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('smartServeId', 'restaurantName');

    res.status(200).json({
      success: true,
      data: {
        restaurantGrowth,
        ordersOverTime,
        planDistribution,
        statusDistribution,
        topRestaurants,
        recentOrders,
        period
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error fetching analytics',
      error: error.message
    });
  }
};

// @desc    Get platform settings
// @route   GET /api/super-admin/settings
// @access  Private (SUPER_ADMIN only)
export const getPlatformSettings = async (req, res) => {
  try {
    let settings = await PlatformSettings.findOne();

    // If no settings exist, create default settings
    if (!settings) {
      settings = await PlatformSettings.create({});
    }

    res.status(200).json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error fetching platform settings',
      error: error.message,
    });
  }
};

// @desc    Update platform settings
// @route   PUT /api/super-admin/settings
// @access  Private (SUPER_ADMIN only)
export const updatePlatformSettings = async (req, res) => {
  try {
    const { regional, tax, features, system, email, subscription } = req.body;

    let settings = await PlatformSettings.findOne();

    if (!settings) {
      settings = await PlatformSettings.create(req.body);
    } else {
      // Update only provided fields
      if (regional) settings.regional = { ...settings.regional, ...regional };
      if (tax) settings.tax = { ...settings.tax, ...tax };
      if (features) settings.features = { ...settings.features, ...features };
      if (system) settings.system = { ...settings.system, ...system };
      if (email) settings.email = { ...settings.email, ...email };
      if (subscription) settings.subscription = { ...settings.subscription, ...subscription };

      settings.lastUpdatedBy = req.user?.email || 'Super Admin';
      await settings.save();
    }

    res.status(200).json({
      success: true,
      message: 'Platform settings updated successfully',
      data: settings,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error updating platform settings',
      error: error.message,
    });
  }
};

// @desc    Reset restaurant owner password
// @route   POST /api/super-admin/support/reset-password
// @access  Private (SUPER_ADMIN only)
export const resetRestaurantPassword = async (req, res) => {
  try {
    const { restaurantId, newPassword } = req.body;

    if (!restaurantId || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Restaurant ID and new password are required',
      });
    }

    // Find the restaurant
    const restaurant = await SmartServe.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found',
      });
    }

    // Find and update the user
    const user = await User.findOne({ email: restaurant.ownerEmail });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Set new password (the pre-save middleware will hash it automatically)
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successfully',
      data: {
        restaurantName: restaurant.restaurantName,
        email: restaurant.ownerEmail,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error resetting password',
      error: error.message,
    });
  }
};

// @desc    Generate impersonation token for restaurant
// @route   POST /api/super-admin/support/impersonate/:id
// @access  Private (SUPER_ADMIN only)
export const impersonateRestaurant = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the restaurant
    const restaurant = await SmartServe.findById(id);
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found',
      });
    }

    // Find the user
    const user = await User.findOne({ email: restaurant.ownerEmail });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Generate impersonation token with special flag
    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
        restaurantId: restaurant._id,
        impersonatedBy: req.user.id,
        isImpersonation: true,
      },
      process.env.JWT_SECRET,
      { expiresIn: '2h' } // Shorter expiry for security
    );

    res.status(200).json({
      success: true,
      message: 'Impersonation token generated',
      data: {
        token,
        restaurant: {
          id: restaurant._id,
          name: restaurant.restaurantName,
          email: restaurant.ownerEmail,
        },
        expiresIn: '2 hours',
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error generating impersonation token',
      error: error.message,
    });
  }
};

// @desc    Create support ticket
// @route   POST /api/super-admin/support/tickets
// @access  Private (SUPER_ADMIN only)
export const createSupportTicket = async (req, res) => {
  try {
    const { restaurantId, subject, description, category, priority } = req.body;

    if (!restaurantId || !subject || !description) {
      return res.status(400).json({
        success: false,
        message: 'Restaurant ID, subject, and description are required',
      });
    }

    // Verify restaurant exists
    const restaurant = await SmartServe.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found',
      });
    }

    // Create ticket
    const ticket = await SupportTicket.create({
      restaurant: restaurantId,
      subject,
      description,
      category: category || 'other',
      priority: priority || 'medium',
      assignedTo: req.user.id,
    });

    await ticket.populate('restaurant', 'restaurantName ownerEmail ownerPhone');

    res.status(201).json({
      success: true,
      message: 'Support ticket created successfully',
      data: ticket,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error creating support ticket',
      error: error.message,
    });
  }
};

// @desc    Get all support tickets
// @route   GET /api/super-admin/support/tickets
// @access  Private (SUPER_ADMIN only)
export const getSupportTickets = async (req, res) => {
  try {
    const { status, priority, category } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (category) filter.category = category;

    const tickets = await SupportTicket.find(filter)
      .populate('restaurant', 'restaurantName ownerEmail ownerPhone')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: tickets,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error fetching support tickets',
      error: error.message,
    });
  }
};

// @desc    Update support ticket
// @route   PUT /api/super-admin/support/tickets/:id
// @access  Private (SUPER_ADMIN only)
export const updateSupportTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, priority, message, isInternal } = req.body;

    const ticket = await SupportTicket.findById(id);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found',
      });
    }

    // Update fields
    if (status) {
      ticket.status = status;
      if (status === 'resolved') {
        ticket.resolvedAt = new Date();
      } else if (status === 'closed') {
        ticket.closedAt = new Date();
      }
    }
    if (priority) ticket.priority = priority;

    // Add message if provided
    if (message) {
      ticket.messages.push({
        sender: 'support',
        message,
        isInternal: isInternal || false,
      });
    }

    await ticket.save();
    await ticket.populate('restaurant', 'restaurantName ownerEmail ownerPhone');
    await ticket.populate('assignedTo', 'name email');

    res.status(200).json({
      success: true,
      message: 'Ticket updated successfully',
      data: ticket,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error updating ticket',
      error: error.message,
    });
  }
};

// @desc    Fix restaurants without Restaurant ID
// @route   POST /api/super-admin/smartserve/fix-missing-ids
// @access  Private (SUPER_ADMIN only)
export const fixMissingRestaurantIds = async (req, res) => {
  try {
    console.log('🔧 Starting fix for restaurants without IDs...');
    
    // Find all restaurants without restaurantId
    const restaurantsWithoutId = await SmartServe.find({
      $or: [
        { restaurantId: { $exists: false } },
        { restaurantId: null },
        { restaurantId: '' },
        { restaurantId: 'N/A' }
      ]
    });

    console.log(`Found ${restaurantsWithoutId.length} restaurants without IDs`);

    if (restaurantsWithoutId.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'All restaurants have valid IDs',
        data: []
      });
    }

    const updatedRestaurants = [];
    const customerAppUrl = process.env.CUSTOMER_APP_URL || 'http://localhost:3002';

    for (const restaurant of restaurantsWithoutId) {
      try {
        // Generate unique restaurant ID
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substring(2, 7).toUpperCase();
        restaurant.restaurantId = `REST-${timestamp}-${random}`;
        
        // Ensure restaurantName is set
        if (!restaurant.restaurantName) {
          restaurant.restaurantName = restaurant.name || restaurant.address || 'Restaurant';
        }
        
        // Ensure ownerEmail is set (REQUIRED field)
        if (!restaurant.ownerEmail) {
          restaurant.ownerEmail = restaurant.email || 'demo@restaurant.com';
        }
        
        // Ensure ownerName is set
        if (!restaurant.ownerName) {
          restaurant.ownerName = restaurant.ownerEmail.split('@')[0] || 'Owner';
        }
        
        // Ensure ownerPhone is set
        if (!restaurant.ownerPhone) {
          restaurant.ownerPhone = restaurant.phone || '555-0123';
        }
        
        // Generate QR code
        restaurant.qrCode = {
          uniqueId: restaurant.restaurantId,
          url: `${customerAppUrl}/${restaurant.restaurantId}`
        };

        await restaurant.save();
        
        console.log(`✅ Fixed: ${restaurant.restaurantName} - ${restaurant.restaurantId}`);
        
        updatedRestaurants.push({
          _id: restaurant._id,
          restaurantName: restaurant.restaurantName,
          restaurantId: restaurant.restaurantId,
          qrCodeUrl: restaurant.qrCode.url
        });
      } catch (err) {
        console.error(`❌ Error fixing restaurant ${restaurant._id}:`, err);
      }
    }

    res.status(200).json({
      success: true,
      message: `Fixed ${updatedRestaurants.length} restaurant(s)`,
      data: updatedRestaurants
    });
  } catch (error) {
    console.error('❌ Error fixing restaurant IDs:', error);
    res.status(500).json({
      success: false,
      message: 'Error fixing restaurant IDs',
      error: error.message
    });
  }
};
