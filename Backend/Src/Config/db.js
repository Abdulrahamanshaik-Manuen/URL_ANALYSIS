import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const MONGO_URI =
  process.env.MONGO_URI ||
  'mongodb+srv://shaikabdul:shaikabdulr503@data-storage.uleb4ax.mongodb.net/URL_ANALYSIS?retryWrites=true&w=majority&appName=URL_ANALYSIS';

export async function connectDB() {
  try {
    const conn = await mongoose.connect(MONGO_URI);
    console.log(`✓ MongoDB Atlas Connected successfully to host: ${conn.connection.host}`);
    return conn;
  } catch (err) {
    console.error('✗ MongoDB Atlas Connection Failure:', err.message);
    return null;
  }
}

export default connectDB;
