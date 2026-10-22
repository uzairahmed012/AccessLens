import { Router } from 'express';
import type { HealthResponse } from '@accesslens/shared';

export const healthRouter = Router();
healthRouter.get('/health', (_req, res) => {
  const body: HealthResponse = { status: 'ok' };
  res.setHeader('Cache-Control', 'no-store');
  res.json(body);
});
