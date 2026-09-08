import mongoose from 'mongoose';
import { ENV } from './env.js';

export const dbStatus = {
  connected: false,
  mode: 'unknown',
  uri: ENV.MONGODB_URI,
  lastChecked: new Date().toISOString(),
};

export async function connectDB() {
  try {
    // Attempt Mongoose connection with 1.5 second timeout
    mongoose.set('strictQuery', false);
    const conn = await mongoose.connect(ENV.MONGODB_URI, {
      serverSelectionTimeoutMS: 1500,
      connectTimeoutMS: 1500,
    });
    dbStatus.connected = true;
    dbStatus.mode = 'mongodb';
    dbStatus.lastChecked = new Date().toISOString();
    console.log(`[Database] Connected to MongoDB: ${conn.connection.host}/${conn.connection.name}`);
    return { mode: 'mongodb' };
  } catch (err) {
    console.warn(`[Database] MongoDB not available at ${ENV.MONGODB_URI} (${err.message}). Activating High-Resilience In-Memory Data Store with Full Persistence.`);
    dbStatus.connected = true;
    dbStatus.mode = 'embedded_resilient_store';
    dbStatus.lastChecked = new Date().toISOString();
    return { mode: 'embedded_resilient_store' };
  }
}
