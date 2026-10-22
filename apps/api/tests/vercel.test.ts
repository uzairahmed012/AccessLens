import type { Express } from 'express';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

// Missing-credential tests must not connect to storage. Production imports are
// exercised separately through the compiled entrypoint smoke check.
vi.mock('../src/lib/database.js', () => ({
  createDatabase: vi.fn(() => {
    throw new Error('Unexpected database access in entrypoint tests.');
  }),
}));

let app: Express;

beforeAll(async () => {
  const variables = {
    NODE_ENV: 'production',
    LOG_LEVEL: 'silent',
    DATABASE_URL: '',
    DIRECT_URL: '',
    SCAN_ALLOWED_HOSTS: '',
    CORS_ORIGINS: 'https://custom.example.org',
    VERCEL: '1',
    VERCEL_URL: 'accesslens-preview.vercel.app',
    VERCEL_PROJECT_PRODUCTION_URL: 'accesslens.vercel.app',
  };
  for (const [name, value] of Object.entries(variables)) vi.stubEnv(name, value);
  app = (await import('../src/vercel.js')).default;
});

afterAll(() => vi.unstubAllEnvs());

describe('Vercel API entrypoint', () => {
  it('exports a working app with the existing liveness contract', async () => {
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });
  it.each([
    'https://accesslens-preview.vercel.app',
    'https://accesslens.vercel.app',
    'https://custom.example.org',
  ])('allows the exact deployment or configured origin %s', async (origin) => {
    const response = await request(app)
      .options('/api/scans')
      .set('Origin', origin)
      .set('Access-Control-Request-Method', 'POST');
    expect(response.status).toBe(204);
    expect(response.headers['access-control-allow-origin']).toBe(origin);
    expect(response.headers['access-control-allow-methods']).toContain('POST');
  });
  it('rejects an unrelated Vercel project origin', async () => {
    const response = await request(app)
      .get('/api/health')
      .set('Origin', 'https://untrusted.vercel.app');
    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe('ORIGIN_NOT_ALLOWED');
  });
  it('does not imply database readiness when credentials are missing', async () => {
    const response = await request(app).get('/api/scans');
    expect(response.status).toBe(503);
    expect(response.body.error.code).toBe('DATABASE_UNAVAILABLE');
  });
  it('keeps intake disabled when no approved hosts are configured', async () => {
    const response = await request(app).post('/api/scans').send({ url: 'https://example.com' });
    expect(response.status).toBe(503);
    expect(response.body.error.code).toBe('INTAKE_NOT_CONFIGURED');
  });
});
