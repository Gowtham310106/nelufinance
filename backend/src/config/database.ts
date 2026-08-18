// src/config/database.ts
import mongoose from 'mongoose';
import { env } from './env';

// Cache connection promise for serverless functions (e.g. Vercel)
let cachedConnection: typeof mongoose | null = null;
let cachedPromise: Promise<typeof mongoose> | null = null;

export async function connectDatabase(): Promise<typeof mongoose> {
  // If already connected, return cached connection
  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }

  if (cachedConnection) {
    return cachedConnection;
  }

  if (!cachedPromise) {
    const opts: mongoose.ConnectOptions = {
      dbName: 'vetrinel',
      serverSelectionTimeoutMS: 20000,
      connectTimeoutMS: 20000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
    };

    cachedPromise = mongoose.connect(env.MONGODB_URI, opts).then((m) => {
      cachedConnection = m;
      console.log('✅ MongoDB Atlas connected successfully');
      return m;
    });
  }

  try {
    cachedConnection = await cachedPromise;
    return cachedConnection;
  } catch (error) {
    cachedPromise = null;
    console.error('❌ MongoDB Atlas connection error:', error);
    throw error;
  }
}
