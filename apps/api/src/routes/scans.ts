import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { z } from 'zod';
import { createScanSchema, scanListQuerySchema } from '@accesslens/shared';
import type { ScanRepository } from '../scans/repository.js';
import { decodeCursor } from '../scans/repository.js';
import { createUrlPolicy, type DnsResolver } from '../scans/url-policy.js';
import { AppError } from '../middleware/errors.js';

export function scansRouter(
  repository: ScanRepository | undefined,
  hosts: string[],
  resolver?: DnsResolver,
) {
  const router = Router();
  const validateUrl = createUrlPolicy(hosts, resolver);
  router.use((_req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    next();
  });
  router.use(
    rateLimit({
      windowMs: 60_000,
      limit: 120,
      standardHeaders: 'draft-8',
      legacyHeaders: false,
      handler: (_req, _res, next) =>
        next(new AppError(429, 'RATE_LIMITED', 'Too many requests. Please wait a minute.')),
    }),
  );
  function requireRepository() {
    if (!repository)
      throw new AppError(
        503,
        'DATABASE_UNAVAILABLE',
        'The database is unavailable. Check the local database configuration.',
      );
    return repository;
  }
  async function databaseCall<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch {
      throw new AppError(
        503,
        'DATABASE_UNAVAILABLE',
        'The database is unavailable. Please try again later.',
      );
    }
  }
  router.post(
    '/',
    rateLimit({
      windowMs: 60_000,
      limit: 10,
      standardHeaders: 'draft-8',
      legacyHeaders: false,
      handler: (_req, _res, next) =>
        next(new AppError(429, 'RATE_LIMITED', 'Too many submissions. Please wait a minute.')),
    }),
    async (req, res) => {
      if (!req.is('application/json'))
        throw new AppError(415, 'UNSUPPORTED_MEDIA_TYPE', 'Send an application/json request.');
      const parsed = createScanSchema.safeParse(req.body);
      if (!parsed.success)
        throw new AppError(
          400,
          'VALIDATION_ERROR',
          'Provide a website URL of at most 2048 characters and no extra fields.',
        );
      const normalized = await validateUrl(parsed.data.url);
      const db = requireRepository();
      const scan = await databaseCall(() => db.create(parsed.data.url, normalized));
      res.location(`/api/scans/${scan.id}`).status(202).json(scan);
    },
  );
  router.get('/', async (req, res) => {
    const parsed = scanListQuerySchema.safeParse(req.query);
    if (!parsed.success)
      throw new AppError(
        400,
        'VALIDATION_ERROR',
        'Use a limit from 1 to 50 and an optional history cursor.',
      );
    const cursor = decodeCursor(parsed.data.cursor);
    const db = requireRepository();
    res.json(await databaseCall(() => db.list(parsed.data.limit, cursor)));
  });
  router.get('/:id', async (req, res) => {
    const id = z.uuid().safeParse(req.params.id);
    if (!id.success) throw new AppError(400, 'VALIDATION_ERROR', 'The scan ID is invalid.');
    const db = requireRepository();
    const scan = await databaseCall(() => db.find(id.data));
    if (!scan) throw new AppError(404, 'NOT_FOUND', 'This scan job was not found.');
    res.json(scan);
  });
  return router;
}
