import { createApp } from './app.js';
import { loadEnv } from './config/env.js';
import { createLogger } from './lib/logger.js';
import { createDatabase } from './lib/database.js';
import { prismaScanRepository } from './scans/repository.js';

const env = loadEnv();

// Trust only this deployment's platform-provided hostnames, never *.vercel.app.
// This lets first deploys and previews work before a custom domain is configured.
if (process.env.VERCEL === '1') {
  const origins = process.env.CORS_ORIGINS ? [...env.CORS_ORIGINS] : [];
  for (const hostname of [process.env.VERCEL_URL, process.env.VERCEL_PROJECT_PRODUCTION_URL]) {
    if (!hostname) continue;
    try {
      const origin = `https://${hostname}`;
      if (new URL(origin).origin === origin) origins.push(origin);
    } catch {
      // Ignore invalid platform overrides; do not broaden the origin policy.
    }
  }
  env.CORS_ORIGINS = [...new Set(origins)];
}

// Vercel reuses this module's app/client across invocations. No port listener or
// process shutdown hooks are needed here; server.ts remains the native entrypoint.
const db = env.DATABASE_URL ? createDatabase(env.DATABASE_URL) : undefined;
const app = createApp(env, createLogger(env.LOG_LEVEL), {
  repository: db ? prismaScanRepository(db) : undefined,
});

export default app;
