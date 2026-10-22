import { randomUUID } from 'node:crypto';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import type { Logger } from 'pino';
import type { Env } from './config/env.js';
import { createLogger } from './lib/logger.js';
import { AppError, errorHandler } from './middleware/errors.js';
import { healthRouter } from './routes/health.js';
import { scansRouter } from './routes/scans.js';
import type { ScanRepository } from './scans/repository.js';
import type { DnsResolver } from './scans/url-policy.js';

export function createApp(
  env: Env,
  logger: Logger = createLogger(env.LOG_LEVEL),
  dependencies: {
    repository?: ScanRepository;
    resolver?: DnsResolver;
  } = {},
) {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', false);
  app.use(
    pinoHttp({
      logger,
      genReqId: (_req, res) => {
        const id = randomUUID();
        res.setHeader('X-Request-ID', id);
        return id;
      },
      // Request URLs, bodies, headers and raw errors are deliberately omitted.
      serializers: {
        req: (req) => ({ id: req.id, method: req.method }),
        res: (res) => ({ statusCode: res.statusCode }),
        err: () => ({ message: 'HTTP request failed' }),
      },
    }),
  );
  app.use(helmet());
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || env.CORS_ORIGINS.includes(origin)) callback(null, true);
        else callback(new AppError(403, 'ORIGIN_NOT_ALLOWED', 'This origin is not allowed.'));
      },
      methods: ['GET', 'POST', 'HEAD', 'OPTIONS'],
      credentials: false,
    }),
  );
  app.use(express.json({ limit: '16kb', strict: true }));
  app.use('/api', healthRouter);
  app.use(
    '/api/scans',
    scansRouter(dependencies.repository, env.SCAN_ALLOWED_HOSTS, dependencies.resolver),
  );
  app.use((_req, _res, next) =>
    next(new AppError(404, 'NOT_FOUND', 'This endpoint does not exist.')),
  );
  app.use(errorHandler(logger));
  return app;
}
