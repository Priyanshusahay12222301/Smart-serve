import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`⚠️  MongoDB Connection Error: ${error.message}`);
    console.log('⚠️  Server will run without database - some features will be unavailable');
    // Don't exit, let the server run without DB
  }
};

export default connectDB;
