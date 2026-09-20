import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("MONGODB_URI is not set. Copy .env.example to .env.local and fill it in.");
}

/**
 * Next.js reloads modules in dev and reuses lambdas in serverless prod, so
 * we cache the connection promise on `global` to avoid opening a new
 * connection (and hitting Atlas connection limits) on every request.
 */
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var __mongooseCache: MongooseCache | undefined;
}

const cache: MongooseCache = global.__mongooseCache ?? { conn: null, promise: null };
global.__mongooseCache = cache;

export async function connectToDatabase(): Promise<typeof mongoose> {
  if (cache.conn) return cache.conn;

  if (!cache.promise) {
    cache.promise = mongoose.connect(MONGODB_URI as string, {
      maxPoolSize: 20,
      bufferCommands: false,
    });
  }

  cache.conn = await cache.promise;
  return cache.conn;
}
