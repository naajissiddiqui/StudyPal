import dotenv from 'dotenv';
import path from 'path';

// Explicitly load the single root .env file
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
dotenv.config();

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5000', 10),
  MONGODB_URI: process.env.MONGODB_URI || process.env.MONGO_URI || '',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || 'studypal_jwt_access_secret_key_default_32bytes',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'studypal_jwt_refresh_secret_key_default_32bytes',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || process.env.AI_API_KEY || ''
};
