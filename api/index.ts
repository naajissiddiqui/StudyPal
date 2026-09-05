import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import dns from 'dns';
import { createApp } from '../server/src/app';

try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch (e) {
  // Ignore in restricted environments
}

let cachedApp: any = null;

async function getApp() {
  if (cachedApp) return cachedApp;

  const mongoUri = process.env.MONGODB_URI;
  if (mongoUri && mongoose.connection.readyState === 0) {
    try {
      await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 8000
      });
      console.log('[Vercel Serverless] MongoDB connected successfully');
    } catch (err) {
      console.error('[Vercel Serverless] MongoDB connection error:', err);
    }
  }

  cachedApp = createApp();
  return cachedApp;
}

export default async function handler(req: Request, res: Response) {
  const app = await getApp();
  return app(req, res);
}
