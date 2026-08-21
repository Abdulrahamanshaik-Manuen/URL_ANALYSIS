const mongoose = require('mongoose');
const logger = require('../Utils/logger');

/**
 * Connects to MongoDB with connection pooling and explicit database targeting
 * @returns {Promise<typeof mongoose>}
 */
async function connectDB() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    logger.error('❌ MONGO_URI environment variable is missing from .env');
    return null;
  }

  const options = {
    dbName: 'URL_ANALYSIS', // Enforces URL_ANALYSIS as the explicit target database
    maxPoolSize: 10,
    minPoolSize: 2,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    autoIndex: true
  };

  try {
    mongoose.connection.on('connected', () => {
      logger.success('📦 MongoDB Connected');
    });

    mongoose.connection.on('error', (err) => {
      logger.error(`❌ MongoDB connection error: ${err.message}`);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('⚠️ MongoDB disconnected. Attempting reconnection...');
    });

    const conn = await mongoose.connect(uri, options);
    return conn;
  } catch (err) {
    logger.error(`❌ Initial MongoDB connection failed: ${err.message}`);
    return null;
  }
}

/**
 * Closes the MongoDB connection gracefully
 */
async function closeDB() {
  try {
    await mongoose.connection.close(false);
    logger.info('📦 MongoDB connection closed cleanly');
  } catch (err) {
    logger.error(`Error closing MongoDB connection: ${err.message}`);
  }
}

module.exports = {
  connectDB,
  closeDB
};
