const MenuItem = require('../models/Menu.model');
const { body, validationResult } = require('express-validator');
const cloudinary = require('../config/cloudinary');
const fs = require('fs').promises;

// Get all menu items for the restaurant
exports.getAllMenuItems = async (req, res) => {
  try {
    const menuItems = await MenuItem.find({ smartServeId: req.smartServeId })
      .sort({ category: 1, name: 1 });

    res.json({ 
      success: true, 
      count: menuItems.length,
      data: menuItems 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get menu items by category
exports.getMenuItemsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const menuItems = await MenuItem.find({ 
      smartServeId: req.smartServeId,
      category 
    }).sort({ name: 1 });

    res.json({ 
      success: true, 
      count: menuItems.length,
      data: menuItems 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get single menu item
exports.getMenuItem = async (req, res) => {
  try {
    const menuItem = await MenuItem.findOne({
      _id: req.params.id,
      smartServeId: req.smartServeId
    });

    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    res.json({ success: true, data: menuItem });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Create menu item
exports.createMenuItem = async (req, res) => {
  try {
    const { name, description, price, category, imageUrl, isAvailable } = req.body;

    const menuItem = await MenuItem.create({
      smartServeId: req.smartServeId,
      name,
      description,
      price,
      category,
      imageUrl,
      isAvailable: isAvailable !== undefined ? isAvailable : true
    });

    res.status(201).json({ 
      success: true, 
      message: 'Menu item created successfully',
      data: menuItem 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update menu item
exports.updateMenuItem = async (req, res) => {
  try {
    const { name, description, price, category, imageUrl, isAvailable } = req.body;

    const menuItem = await MenuItem.findOneAndUpdate(
      { _id: req.params.id, smartServeId: req.smartServeId },
      { name, description, price, category, imageUrl, isAvailable },
      { new: true, runValidators: true }
    );

    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    res.json({ 
      success: true, 
      message: 'Menu item updated successfully',
      data: menuItem 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Toggle menu item availability
exports.toggleAvailability = async (req, res) => {
  try {
    const menuItem = await MenuItem.findOne({
      _id: req.params.id,
      smartServeId: req.smartServeId
    });

    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    menuItem.isAvailable = !menuItem.isAvailable;
    await menuItem.save();

    res.json({ 
      success: true, 
      message: `Menu item ${menuItem.isAvailable ? 'enabled' : 'disabled'}`,
      data: menuItem 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete menu item
exports.deleteMenuItem = async (req, res) => {
  try {
    const menuItem = await MenuItem.findOneAndDelete({
      _id: req.params.id,
      smartServeId: req.smartServeId
    });

    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    res.json({ 
      success: true, 
      message: 'Menu item deleted successfully' 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get menu categories
exports.getCategories = async (req, res) => {
  try {
    const categories = await MenuItem.distinct('category', { 
      smartServeId: req.smartServeId 
    });

    res.json({ 
      success: true, 
      data: categories 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Upload image
exports.uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No image file provided' 
      });
    }

    // Upload to Cloudinary if configured, otherwise use local path
    let imageUrl;
    
    if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY) {
      // Upload to Cloudinary
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'smartserve/menu-items',
        transformation: [
          { width: 800, height: 800, crop: 'limit' },
          { quality: 'auto' }
        ]
      });
      
      imageUrl = result.secure_url;
      
      // Delete local file after upload
      await fs.unlink(req.file.path);
    } else {
      // Use local file path
      imageUrl = `/uploads/${req.file.filename}`;
    }

    res.json({ 
      success: true, 
      message: 'Image uploaded successfully',
      data: { 
        imageUrl,
        filename: req.file.filename
      }
    });
  } catch (error) {
    console.error('Image upload error:', error);
    // Clean up file on error
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Error deleting file:', unlinkError);
      }
    }
    res.status(500).json({ 
      success: false, 
      message: 'Error uploading image', 
      error: error.message 
    });
  }
};
