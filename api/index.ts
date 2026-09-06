import type { Request, Response } from 'express';
import { createApp } from '../server/src/app';
import { connectToDatabase, sanitizeDbError } from '../server/src/config/database';

let cachedApp: any = null;

function getApp() {
  if (!cachedApp) {
    cachedApp = createApp();
  }
  return cachedApp;
}

export default async function handler(req: Request, res: Response) {
  const app = getApp();

  const isHealthCheck = req.url === '/api/health' || req.url === '/health' || req.url?.startsWith('/api/health?');

  try {
    // Ensure MongoDB connection is active before executing any route database operations
    await connectToDatabase();
  } catch (error) {
    // If health check route, allow Express to respond with health status
    if (isHealthCheck) {
      return app(req, res);
    }

    const safeMessage = sanitizeDbError(error);
    return res.status(500).json({
      success: false,
      error: 'Database connection error',
      message: safeMessage
    });
  }

  return app(req, res);
}
