require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');
const User = require('./models/User.model');
const SmartServe = require('./models/SmartServe.model');
const MenuItem = require('./models/Menu.model');
const bcrypt = require('bcryptjs');

const PORT = process.env.PORT || 5002;

const createDemoData = async () => {
  try {
    // Check if demo restaurant exists
    let demoRestaurant = await SmartServe.findOne({ 
      name: process.env.DEMO_RESTAURANT_NAME 
    });

    if (!demoRestaurant) {
      console.log('Creating demo restaurant...');
      demoRestaurant = await SmartServe.create({
        name: process.env.DEMO_RESTAURANT_NAME,
        email: process.env.DEMO_SMART_ADMIN_EMAIL,
        phone: '555-0123',
        address: '123 Food Street',
        subscriptionStatus: 'ACTIVE',
        subscriptionPlan: 'PREMIUM',
        subscriptionStartDate: new Date(),
        subscriptionEndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      });
      console.log('✅ Demo restaurant created:', demoRestaurant.name);
    }

    // Check if demo admin exists
    const demoAdminExists = await User.findOne({ 
      email: process.env.DEMO_SMART_ADMIN_EMAIL 
    });

    if (!demoAdminExists) {
      console.log('Creating demo Smart Admin user...');
      
      await User.create({
        name: 'Admin',
        email: process.env.DEMO_SMART_ADMIN_EMAIL,
        password: process.env.DEMO_SMART_ADMIN_PASSWORD,
        role: 'SMART_ADMIN',
        smartServeId: demoRestaurant._id
      });
      
      console.log('✅ Demo Smart Admin created');
      console.log('📧 Email:', process.env.DEMO_SMART_ADMIN_EMAIL);
      console.log('🔑 Password:', process.env.DEMO_SMART_ADMIN_PASSWORD);
    }

    // Check if demo menu items exist
    const menuCount = await MenuItem.countDocuments({ 
      smartServeId: demoRestaurant._id 
    });

    if (menuCount === 0) {
      console.log('Creating demo menu items...');
      
      const demoMenuItems = [
        {
          smartServeId: demoRestaurant._id,
          name: 'Classic Burger',
          description: 'Juicy beef patty with fresh lettuce, tomato, and special sauce',
          price: 12.99,
          category: 'Main Course',
          imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500',
          isAvailable: true
        },
        {
          smartServeId: demoRestaurant._id,
          name: 'Margherita Pizza',
          description: 'Fresh mozzarella, tomato sauce, and basil on thin crust',
          price: 14.99,
          category: 'Main Course',
          imageUrl: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=500',
          isAvailable: true
        },
        {
          smartServeId: demoRestaurant._id,
          name: 'Creamy Pasta',
          description: 'Fettuccine in rich Alfredo sauce with parmesan',
          price: 13.99,
          category: 'Main Course',
          imageUrl: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=500',
          isAvailable: true
        },
        {
          smartServeId: demoRestaurant._id,
          name: 'Caesar Salad',
          description: 'Crisp romaine lettuce with Caesar dressing and croutons',
          price: 8.99,
          category: 'Starters',
          imageUrl: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=500',
          isAvailable: true
        },
        {
          smartServeId: demoRestaurant._id,
          name: 'Soft Drink',
          description: 'Refreshing cold beverage',
          price: 2.99,
          category: 'Beverages',
          imageUrl: 'https://images.unsplash.com/photo-1581006852262-e4307cf6283a?w=500',
          isAvailable: true
        },
        {
          smartServeId: demoRestaurant._id,
          name: 'Ice Cream',
          description: 'Creamy vanilla ice cream with toppings',
          price: 5.99,
          category: 'Desserts',
          imageUrl: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=500',
          isAvailable: true
        },
        {
          smartServeId: demoRestaurant._id,
          name: 'Grilled Chicken',
          description: 'Tender grilled chicken breast with vegetables',
          price: 16.99,
          category: 'Main Course',
          imageUrl: 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=500',
          isAvailable: true
        }
      ];

      await MenuItem.insertMany(demoMenuItems);
      console.log('✅ Demo menu items created');
    }

  } catch (error) {
    console.error('❌ Error creating demo data:', error.message);
  }
};

const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    
    // Create demo data
    await createDemoData();

    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📡 Environment: ${process.env.NODE_ENV}`);
      console.log(`🔗 API: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
