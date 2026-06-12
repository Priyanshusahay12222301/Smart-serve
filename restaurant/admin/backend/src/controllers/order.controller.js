const Order = require('../models/Order.model');
const MenuItem = require('../models/Menu.model');
const SmartServe = require('../models/SmartServe.model');

// Get all orders for the restaurant
exports.getAllOrders = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { smartServeId: req.smartServeId };
    
    if (status) {
      filter.status = status;
    }

    const orders = await Order.find(filter)
      .populate('items.menuItem', 'name price imageUrl')
      .sort({ createdAt: -1 });

    res.json({ 
      success: true, 
      count: orders.length,
      data: orders 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get single order
exports.getOrder = async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      smartServeId: req.smartServeId
    }).populate('items.menuItem', 'name price imageUrl');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update order status
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    const validStatuses = ['PENDING', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    // Get the current order first to check if status is changing to COMPLETED
    const currentOrder = await Order.findOne({ _id: req.params.id, smartServeId: req.smartServeId });
    
    const order = await Order.findOneAndUpdate(
      { _id: req.params.id, smartServeId: req.smartServeId },
      { status },
      { new: true }
    ).populate('items.menuItem', 'name price imageUrl');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // If order is being marked as COMPLETED, update the SmartServe stats
    if (status === 'COMPLETED' && currentOrder.status !== 'COMPLETED') {
      await SmartServe.findByIdAndUpdate(req.smartServeId, {
        $inc: {
          'stats.totalOrders': 1,
          'stats.totalRevenue': order.totalAmount
        }
      });
    }

    res.json({ 
      success: true, 
      message: `Order status updated to ${status}`,
      data: order 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get order statistics
exports.getOrderStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const completedOrders = await Order.find({
      smartServeId: req.smartServeId,
      status: 'COMPLETED'
    }).select('totalAmount');

    const totalRevenue = completedOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    const [
      todayOrders,
      pendingOrders,
      preparingOrders,
      readyOrders
    ] = await Promise.all([
      Order.countDocuments({ 
        smartServeId: req.smartServeId,
        createdAt: { $gte: today }
      }),
      Order.countDocuments({ 
        smartServeId: req.smartServeId,
        status: 'PENDING'
      }),
      Order.countDocuments({ 
        smartServeId: req.smartServeId,
        status: 'PREPARING'
      }),
      Order.countDocuments({ 
        smartServeId: req.smartServeId,
        status: 'READY'
      })
    ]);

    res.json({
      success: true,
      data: {
        todayOrders,
        pendingOrders,
        preparingOrders,
        readyOrders,
        completedOrders: completedOrders.length,
        todayRevenue: totalRevenue
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get recent orders
exports.getRecentOrders = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    const orders = await Order.find({ smartServeId: req.smartServeId })
      .populate('items.menuItem', 'name price imageUrl')
      .sort({ createdAt: -1 })
      .limit(limit);

    res.json({ 
      success: true, 
      count: orders.length,
      data: orders 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete order (cancel)
exports.cancelOrder = async (req, res) => {
  try {
    const order = await Order.findOneAndUpdate(
      { _id: req.params.id, smartServeId: req.smartServeId },
      { status: 'CANCELLED' },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json({ 
      success: true, 
      message: 'Order cancelled successfully',
      data: order 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
