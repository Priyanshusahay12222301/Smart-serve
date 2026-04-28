const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const { authenticate, authorizeSmartAdmin } = require('../middleware/auth.middleware');

// All routes require authentication and Smart Admin role
router.use(authenticate, authorizeSmartAdmin);

// Order routes
router.get('/', orderController.getAllOrders);
router.get('/stats', orderController.getOrderStats);
router.get('/recent', orderController.getRecentOrders);
router.get('/:id', orderController.getOrder);
router.patch('/:id/status', orderController.updateOrderStatus);
router.delete('/:id', orderController.cancelOrder);

module.exports = router;
