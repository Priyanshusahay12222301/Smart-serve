import app from './app.js';
import User from './models/User.model.js';
import SmartServe from './models/SmartServe.model.js';
import mongoose from 'mongoose';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { setSocketIO } from './controllers/superAdmin.controller.js';

const PORT = process.env.PORT || 5000;

// Create HTTP server and Socket.io
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  }
});

// Make io available to controllers
setSocketIO(io);

// Socket.io connection handler
io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);
  
  // Join room for restaurant-specific updates
  socket.on('join-restaurant', (restaurantId) => {
    socket.join(`restaurant-${restaurantId}`);
    console.log(`📍 Socket ${socket.id} joined restaurant-${restaurantId}`);
  });

  // Join super admin room
  socket.on('join-super-admin', () => {
    socket.join('super-admin');
    console.log(`👑 Socket ${socket.id} joined super-admin room`);
  });

  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
});

// Export io for use in controllers
export { io };

// Create default Super Admin if not exists
const createSuperAdmin = async () => {
  try {
    // Wait for MongoDB connection
    if (mongoose.connection.readyState !== 1) {
      console.log('⏳ Waiting for MongoDB connection...');
      await new Promise((resolve) => {
        mongoose.connection.once('connected', resolve);
        setTimeout(() => resolve(), 15000); // Timeout after 15s
      });
    }

    if (mongoose.connection.readyState === 1) {
      // Drop old 'email' index if it exists (migration fix)
      try {
        await SmartServe.collection.dropIndex('email_1');
        console.log('✅ Dropped old email_1 index');
      } catch (err) {
        // Index doesn't exist, that's fine
      }

      const superAdminExists = await User.findOne({ role: 'SUPER_ADMIN' });

      if (!superAdminExists) {
        await User.create({
          email: process.env.SUPER_ADMIN_EMAIL || 'admin@smartserve.com',
          password: process.env.SUPER_ADMIN_PASSWORD || 'SuperAdmin@123',
          name: 'Super Administrator',
          role: 'SUPER_ADMIN',
        });
        console.log('✅ Super Admin created successfully');
      } else {
        console.log('✅ Super Admin already exists');
      }
    } else {
      console.log('⚠️  MongoDB not connected - Super Admin creation skipped');
    }
  } catch (error) {
    console.error('⚠️  Error creating Super Admin:', error.message);
  }
};

// Start server
httpServer.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔌 Socket.IO ready for real-time updates`);
  
  // Create super admin on startup (non-blocking)
  createSuperAdmin().catch(console.error);
});
