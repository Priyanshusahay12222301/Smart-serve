const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customer.controller');

// Public routes for customers
router.get('/restaurant/:name', customerController.getRestaurantByName);
router.get('/restaurant/id/:restaurantId', customerController.getRestaurantById);
router.get('/menu/:restaurantId', customerController.getMenu);
router.get('/menu/:restaurantId/categories', customerController.getCategories);
router.post('/orders', customerController.createOrder);
router.get('/orders/:id', customerController.getOrder);

module.exports = router;
