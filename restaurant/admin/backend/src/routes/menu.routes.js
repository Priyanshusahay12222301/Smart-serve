const express = require('express');
const router = express.Router();
const menuController = require('../controllers/menu.controller');
const { authenticate, authorizeSmartAdmin } = require('../middleware/auth.middleware');
const upload = require('../config/multer');

// All routes require authentication and Smart Admin role
router.use(authenticate, authorizeSmartAdmin);

// Image upload route
router.post('/upload-image', upload.single('image'), menuController.uploadImage);

// Menu CRUD routes
router.get('/', menuController.getAllMenuItems);
router.get('/categories', menuController.getCategories);
router.get('/category/:category', menuController.getMenuItemsByCategory);
router.get('/:id', menuController.getMenuItem);
router.post('/', menuController.createMenuItem);
router.put('/:id', menuController.updateMenuItem);
router.patch('/:id/toggle', menuController.toggleAvailability);
router.delete('/:id', menuController.deleteMenuItem);

module.exports = router;
