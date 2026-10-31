import mongoose from 'mongoose';
import { env } from './env.js';

export let demoMode = true;

export const setDemoMode = (value) => {
  demoMode = Boolean(value);
};

export const connectDatabase = async () => {
  mongoose.set('strictQuery', true);

  if (process.env.NODE_ENV === 'production' && process.env.DEMO_MODE === 'true') {
    throw new Error('DEMO_MODE=true is not allowed in production.');
  }

  // If explicitly DEMO_MODE=true, use in-memory store directly
  if (process.env.DEMO_MODE === 'true') {
    demoMode = true;
    console.log('[DB] Running with in-memory bank data store with all original accounts.');
    return;
  }

  try {
    await mongoose.connect(env.MONGO_URI, {
      serverSelectionTimeoutMS: 2000,
      connectTimeoutMS: 2500,
      bufferCommands: false
    });
    demoMode = false;
    console.log('[DB] MongoDB connected successfully');

    // Auto-seed if database is empty so original accounts always exist
    try {
      const { Employee } = await import('../models/Employee.js');
      const count = await Employee.countDocuments();
      if (count === 0) {
        console.log('[DB] Database is empty. Seeding original bank accounts and records...');
        const { seedDataDirectly } = await import('../utils/seedDirect.js');
        if (typeof seedDataDirectly === 'function') {
          await seedDataDirectly();
        }
      }
    } catch (seedErr) {
      console.warn('[DB] Auto-seed check warning:', seedErr.message);
    }
  } catch (error) {
    demoMode = true;
    try {
      await mongoose.disconnect();
    } catch {
      // ignore disconnect errors
    }
    console.log(`[DB] MongoDB not available (${error.message}). Running with in-memory bank store with all original accounts.`);
  }
};
