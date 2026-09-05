import mongoose from 'mongoose';
import dns from 'dns';
import { env } from './env';

// Ensure reliable DNS resolution for MongoDB Atlas SRV connection strings
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch (e) {
  // Ignore in environments where setting DNS servers is restricted
}

export async function connectDB(): Promise<void> {
  if (!env.MONGODB_URI) {
    console.error('❌ MONGODB_URI is not defined in environment variables.');
    throw new Error('MONGODB_URI environment variable is missing.');
  }

  try {
    const conn = await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 8000
    });
    console.log(` Connected to MongoDB: ${conn.connection.host} / ${conn.connection.name}`);
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error);
    throw error;
  }
}

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ MongoDB disconnected.');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB event error:', err);
});
