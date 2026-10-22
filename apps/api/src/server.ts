import { createApp } from './app.js';
import { loadEnv } from './config/env.js';
import { createLogger } from './lib/logger.js';
import { createDatabase } from './lib/database.js';
import { prismaScanRepository } from './scans/repository.js';

try {
  const env = loadEnv();
  const logger = createLogger(env.LOG_LEVEL);
  const db = env.DATABASE_URL ? createDatabase(env.DATABASE_URL) : undefined;
  const server = createApp(env, logger, {
    repository: db ? prismaScanRepository(db) : undefined,
  }).listen(env.PORT, env.HOST, () => {
    logger.info({ host: env.HOST, port: env.PORT }, 'AccessLens API listening');
  });
  server.requestTimeout = 15_000;
  server.headersTimeout = 10_000;
  server.on('error', () => {
    logger.fatal('API could not listen; check HOST and PORT.');
    process.exitCode = 1;
  });
  for (const signal of ['SIGINT', 'SIGTERM'] as const) {
    process.once(signal, () => {
      logger.info({ signal }, 'Stopping API');
      server.close(() => {
        void (db?.$disconnect() ?? Promise.resolve()).finally(() => process.exit(0));
      });
      setTimeout(() => process.exit(1), 10_000).unref();
    });
  }
} catch (error) {
  // Only loadEnv's variable-name diagnostic is safe to echo. Driver/adapter
  // construction failures must not disclose connection configuration.
  const message =
    error instanceof Error && /^Invalid environment variables: [A-Z_, ]+$/.test(error.message)
      ? error.message
      : 'API startup failed. Check environment configuration and the generated Prisma client.';
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
}
