import { createApp } from './app';
import { connectDB } from './config/database';
import { env } from './config/env';

async function bootstrap() {
  try {
    // 1. Connect to MongoDB
    await connectDB();

    // 2. Start Express Server
    const app = createApp();
    app.listen(env.PORT, () => {
      console.log(`🚀 StudyPal Server running on http://localhost:${env.PORT}`);
      console.log(`📡 Connected with Client URL: ${env.CLIENT_URL}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

bootstrap();
