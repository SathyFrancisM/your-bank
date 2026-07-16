import mongoose from 'mongoose';
import { env } from './env.js';

export let demoMode = false;

export const connectDatabase = async () => {
  mongoose.set('strictQuery', true);
  if (process.env.DEMO_MODE !== 'false') {
    demoMode = true;
    console.warn('MongoDB disabled for demo mode; using in-memory prototype data.');
    return;
  }
  try {
    await mongoose.connect(env.MONGO_URI);
    console.log('MongoDB connected');
  } catch (error) {
    demoMode = true;
    console.warn(`MongoDB unavailable, starting in demo mode: ${error.message}`);
  }
};
