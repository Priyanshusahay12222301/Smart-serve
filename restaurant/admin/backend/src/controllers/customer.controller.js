const MenuItem = require('../models/Menu.model');
const Order = require('../models/Order.model');

// Get all available menu items for customers
exports.getMenu = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    
    // Find menu items for the specific restaurant
    const menuItems = await MenuItem.find({ 
      smartServeId: restaurantId,
      isAvailable: true 
    }).sort({ category: 1, name: 1 });

    res.json({ 
      success: true, 
      count: menuItems.length,
      data: menuItems 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get menu categories
exports.getCategories = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    
    const categories = await MenuItem.distinct('category', { 
      smartServeId: restaurantId,
      isAvailable: true 
    });
    res.json({ success: true, data: categories });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Create customer order
exports.createOrder = async (req, res) => {
  try {
    const { restaurantId, tableNumber, items, totalAmount, customerName, customerPhone, notes } = req.body;

    if (!restaurantId) {
      return res.status(400).json({ message: 'Restaurant ID is required' });
    }

    if (!tableNumber || !items || items.length === 0) {
      return res.status(400).json({ message: 'Table number and items are required' });
    }

    // Get the specific restaurant by _id (MongoDB ObjectId)
    const SmartServe = require('../models/SmartServe.model');
    const restaurant = await SmartServe.findById(restaurantId);
    
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    console.log('🍽️ Creating order for restaurant:', restaurant.restaurantName, '(_id:', restaurant._id, ')');

    // Drop old orderNumber index if it exists
    try {
      await Order.collection.dropIndex('orderNumber_1');
    } catch (err) {
      // Index doesn't exist, ignore
    }

    // Generate orderId manually since pre-save hook isn't working
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    const orderId = `order-${timestamp}${random}`;

    const order = await Order.create({
      smartServeId: restaurant._id,
      orderId,
      tableNumber,
      items,
      totalAmount,
      customerName: customerName || 'Guest',
      customerPhone,
      notes,
      status: 'PENDING'
    });

    await order.populate('items.menuItem', 'name price imageUrl');

    console.log('✅ Order created successfully:', orderId, 'for smartServeId:', restaurant._id);

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      data: order
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get order by ID (for tracking)
exports.getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('items.menuItem', 'name price imageUrl');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get restaurant info by name (for QR code landing)
exports.getRestaurantByName = async (req, res) => {
  try {
    const { name } = req.params;
    const SmartServe = require('../models/SmartServe.model');
    
    const restaurant = await SmartServe.findOne({ 
      name: { $regex: name, $options: 'i' }
    }).select('_id name address phone');
    
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }
    
    res.json({ success: true, data: restaurant });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get restaurant info by unique restaurantId (from QR code)
exports.getRestaurantById = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    console.log('🔍 Looking for restaurant with ID:', restaurantId);
    
    const SmartServe = require('../models/SmartServe.model');
    
    // Case-insensitive search for restaurantId
    const restaurant = await SmartServe.findOne({ 
      restaurantId: { $regex: new RegExp(`^${restaurantId}$`, 'i') }
    }).select('_id restaurantId restaurantName ownerName address ownerPhone qrCode');
    
    console.log('📋 Restaurant found:', restaurant ? { id: restaurant._id, name: restaurant.restaurantName, restaurantId: restaurant.restaurantId } : 'NOT FOUND');
    
    if (!restaurant) {
      // Try to list all restaurants to help debug
      const allRestaurants = await SmartServe.find({}).select('restaurantId restaurantName').limit(5);
      console.log('📍 Available restaurants:', allRestaurants.map(r => ({ id: r.restaurantId, name: r.restaurantName })));
      
      return res.status(404).json({ 
        success: false,
        message: 'Restaurant not found. Please scan a valid QR code.' 
      });
    }
    
    console.log('✅ Sending restaurant data:', restaurant.restaurantName);
    res.json({ success: true, data: restaurant });
  } catch (error) {
    console.error('💥 Error fetching restaurant:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};
