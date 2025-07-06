const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Support both MONGO_URI and MONGODB_URI environment variables
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    
    console.log('🔍 Debugging MongoDB connection:');
    console.log('MONGO_URI:', process.env.MONGO_URI ? process.env.MONGO_URI.replace(/\/\/[^:]*:[^@]*@/, '//***:***@') : 'undefined');
    console.log('MONGODB_URI:', process.env.MONGODB_URI ? process.env.MONGODB_URI.replace(/\/\/[^:]*:[^@]*@/, '//***:***@') : 'undefined');
    console.log('Final mongoUri:', mongoUri ? mongoUri.replace(/\/\/[^:]*:[^@]*@/, '//***:***@') : 'undefined');
    
    if (!mongoUri) {
      console.error('MongoDB URI not found in environment variables');
      process.exit(1);
    }
    
    const conn = await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB; 