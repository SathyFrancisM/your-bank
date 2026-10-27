import mongoose from 'mongoose';
import { env } from './env.js';

export let demoMode = false;

export const connectDatabase = async () => {
  mongoose.set('strictQuery', true);
  if (process.env.NODE_ENV === 'production' && process.env.DEMO_MODE === 'true') {
    throw new Error('DEMO_MODE=true is not allowed in production.');
  }

  if (process.env.DEMO_MODE === 'true' || (process.env.DEMO_MODE !== 'false' && process.env.NODE_ENV !== 'production')) {
    demoMode = true;
    console.warn('MongoDB disabled for demo mode; using in-memory prototype data.');
    return;
  }
  try {
    await mongoose.connect(env.MONGO_URI);
    console.log('MongoDB connected');
  } catch (error) {
    if (process.env.NODE_ENV === 'production') {
      throw error;
    }
    demoMode = true;
    console.warn(`MongoDB unavailable, starting in demo mode: ${error.message}`);
  }
};
