import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import { env } from './config/env';
import authRoutes from './routes/auth.routes';
import planRoutes from './routes/plan.routes';
import taskRoutes from './routes/task.routes';
import aiRoutes from './routes/ai.routes';
import { errorHandler } from './middleware/error.middleware';

export function createApp(): Express {
  const app = express();

  // Middleware
  app.use(cors({
    origin: [env.CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000'],
    credentials: true
  }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Health Check
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'StudyPal AI Study Planner API',
      env: env.NODE_ENV,
      timestamp: new Date().toISOString()
    });
  });

  // App Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/plans', planRoutes);
  app.use('/api/tasks', taskRoutes);
  app.use('/api/ai', aiRoutes);

  // Central Error Handler
  app.use(errorHandler);

  return app;
}
