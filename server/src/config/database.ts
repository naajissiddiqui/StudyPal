import mongoose from 'mongoose';
import dns from 'dns';
import { env } from './env';

// Ensure reliable DNS resolution for MongoDB Atlas SRV connection strings
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch {
  // Ignore in environments where setting DNS servers is restricted
}

// Disable query buffering globally so operations fail immediately on connection errors
mongoose.set('bufferCommands', false);

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

let cached: MongooseCache = global.mongooseCache || { conn: null, promise: null };
if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

export function sanitizeDbError(err: unknown): string {
  if (!err) return 'Unknown database error';
  const str = err instanceof Error ? err.message : String(err);
  return str.replace(/(mongodb(?:\+srv)?:\/\/)([^:]+):([^@]+)@/g, '$1***:***@');
}

export async function connectToDatabase(): Promise<typeof mongoose> {
  // If already connected, return cached connection immediately
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  const mongoUri = env.MONGODB_URI || process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!mongoUri) {
    throw new Error('MONGODB_URI environment variable is missing.');
  }

  if (!cached.promise || mongoose.connection.readyState === 0) {
    const opts: mongoose.ConnectOptions = {
      serverSelectionTimeoutMS: 5000,
      bufferCommands: false,
      maxPoolSize: 10
    };

    cached.promise = mongoose
      .connect(mongoUri, opts)
      .then((m) => {
        console.log(` Connected to MongoDB: ${m.connection.host} / ${m.connection.name}`);
        cached.conn = m;
        return m;
      })
      .catch((err) => {
        cached.promise = null;
        cached.conn = null;
        console.error('❌ MongoDB Connection Error:', sanitizeDbError(err));
        throw new Error('Database connection failed. Please check MONGODB_URI configuration.');
      });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (err) {
    cached.promise = null;
    cached.conn = null;
    throw err;
  }
}

export async function connectDB(): Promise<void> {
  await connectToDatabase();
}

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ MongoDB disconnected.');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB event error:', sanitizeDbError(err));
});

export { mongoose };
