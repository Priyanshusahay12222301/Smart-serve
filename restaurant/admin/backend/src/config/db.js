const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ Error connecting to MongoDB: ${error.message}`);
    // Do NOT call process.exit() in serverless — log and continue
    // Mongoose will queue commands and retry once the connection is up
  }
};

module.exports = connectDB;
