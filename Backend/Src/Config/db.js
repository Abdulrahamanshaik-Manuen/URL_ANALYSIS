import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

export async function connectDB() {
  if (!MONGO_URI) {
    console.error(' MONGO_URI environment variable is missing from .env');
    return null;
  }
  try {
    const conn = await mongoose.connect(MONGO_URI);
    console.log(` MongoDB Atlas Connected successfully to host: ${conn.connection.host}`);
    return conn;
  } catch (err) {
    console.error(' MongoDB Atlas Connection Failure:', err.message);
    return null;
  }
}

export default connectDB;
