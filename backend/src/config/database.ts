// src/config/database.ts
import mongoose from 'mongoose';
import { env } from './env';

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 3000;

export async function connectDatabase(): Promise<void> {
  let retries = 0;

  while (retries < MAX_RETRIES) {
    try {
      await mongoose.connect(env.MONGODB_URI, {
        dbName: 'vetrinel',
      });
      console.log('✅ MongoDB connected successfully');

      mongoose.connection.on('error', (err) => {
        console.error('MongoDB connection error:', err);
      });

      mongoose.connection.on('disconnected', () => {
        console.warn('MongoDB disconnected. Attempting reconnect...');
      });

      return;
    } catch (error) {
      retries++;
      console.error(`❌ MongoDB connection attempt ${retries}/${MAX_RETRIES} failed:`, error);

      if (retries === MAX_RETRIES) {
        console.error('Failed to connect to MongoDB after maximum retries.');
        process.exit(1);
      }

      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    }
  }
}
