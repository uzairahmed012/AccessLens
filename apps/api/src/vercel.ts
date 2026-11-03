import { createApp } from './app.js';
import { loadEnv } from './config/env.js';
import { createLogger } from './lib/logger.js';
import { createDatabase } from './lib/database.js';
import { prismaScanRepository } from './scans/repository.js';

const env = loadEnv();

// Vercel reuses this module's app/client across invocations. No port listener or
// process shutdown hooks are needed here; server.ts remains the native entrypoint.
const db = env.DATABASE_URL ? createDatabase(env.DATABASE_URL) : undefined;
const app = createApp(env, createLogger(env.LOG_LEVEL), {
  repository: db ? prismaScanRepository(db) : undefined,
});

export default app;
