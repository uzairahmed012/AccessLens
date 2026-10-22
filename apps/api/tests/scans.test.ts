import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { scanSchema } from '@accesslens/shared';
import { createApp } from '../src/app.js';
import { envSchema } from '../src/config/env.js';
import type { ScanRepository } from '../src/scans/repository.js';

const env = envSchema.parse({ LOG_LEVEL: 'silent', SCAN_ALLOWED_HOSTS: 'example.com' });
const row = {
  id: randomUUID(),
  url: 'https://example.com',
  normalizedUrl: 'https://example.com/',
  status: 'queued' as const,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  startedAt: null,
  finishedAt: null,
  errorCode: null,
  errorSummary: null,
};
function fixture(overrides: Partial<ScanRepository> = {}) {
  const repository: ScanRepository = {
    create: vi.fn(async () => row),
    list: vi.fn(async () => ({ items: [row], nextCursor: null })),
    find: vi.fn(async () => row),
    ...overrides,
  };
  const resolver = vi.fn(async () => ['93.184.216.34']);
  return { app: createApp(env, undefined, { repository, resolver }), repository, resolver };
}
describe('scan job HTTP contract', () => {
  it('accepts a safe URL as 202 queued with a Location header and no target fetch', async () => {
    const { app, repository, resolver } = fixture();
    const result = await request(app)
      .post('/api/scans')
      .send({ url: 'HTTPS://Example.com:443#fragment' });
    expect(result.status).toBe(202);
    expect(scanSchema.parse(result.body).status).toBe('queued');
    expect(result.headers.location).toBe(`/api/scans/${row.id}`);
    expect(repository.create).toHaveBeenCalledWith(
      'HTTPS://Example.com:443#fragment',
      'https://example.com/',
    );
    expect(resolver).toHaveBeenCalledWith('example.com');
  });
  it.each([
    {},
    { url: '' },
    { url: 'a'.repeat(2049) },
    { url: 'https://example.com', status: 'completed' },
    { url: 123 },
  ])('rejects invalid bodies without DNS or a write', async (body) => {
    const { app, repository, resolver } = fixture();
    expect((await request(app).post('/api/scans').send(body)).status).toBe(400);
    expect(resolver).not.toHaveBeenCalled();
    expect(repository.create).not.toHaveBeenCalled();
  });
  it('rejects media types other than JSON', async () => {
    expect(
      (
        await request(fixture().app)
          .post('/api/scans')
          .type('form')
          .send({ url: 'https://example.com' })
      ).status,
    ).toBe(415);
  });
  it('never writes rejected hosts', async () => {
    const { app, repository } = fixture();
    expect((await request(app).post('/api/scans').send({ url: 'http://127.0.0.1' })).status).toBe(
      403,
    );
    expect(repository.create).not.toHaveBeenCalled();
  });
  it('returns list/detail and safe 404 for missing IDs', async () => {
    const { app, repository } = fixture({ find: vi.fn(async () => null) });
    expect((await request(app).get('/api/scans?limit=2')).body.items).toEqual([row]);
    expect(repository.list).toHaveBeenCalledWith(2, undefined);
    expect((await request(app).get(`/api/scans/${randomUUID()}`)).status).toBe(404);
    expect((await request(fixture().app).get(`/api/scans/${row.id}`)).body).toEqual(row);
  });
  it.each([
    'limit=0',
    'limit=-1',
    'limit=51',
    'limit=1.5',
    'limit=abc',
    'limit=1&limit=2',
    'other=true',
    'cursor=bad',
    'cursor=%25',
  ])('bounds queries: %s', async (query) => {
    const { app, repository } = fixture();
    expect((await request(app).get(`/api/scans?${query}`)).status).toBe(400);
    expect(repository.list).not.toHaveBeenCalled();
  });
  it('rejects malformed IDs before querying', async () => {
    const { app, repository } = fixture();
    expect((await request(app).get('/api/scans/not-an-id')).status).toBe(400);
    expect(repository.find).not.toHaveBeenCalled();
  });
  it('hides database credentials and keeps health independent of storage', async () => {
    const fail = async () => {
      throw new Error('postgresql://username:SECRET@private-host/database');
    };
    const { app } = fixture({ list: fail, create: fail, find: fail });
    for (const result of [
      await request(app).get('/api/scans'),
      await request(app).get(`/api/scans/${row.id}`),
      await request(app).post('/api/scans').send({ url: 'https://example.com' }),
    ]) {
      expect(result.status).toBe(503);
      expect(result.body.error.code).toBe('DATABASE_UNAVAILABLE');
      expect(result.text).not.toMatch(/SECRET|private-host|postgresql/);
    }
    expect((await request(app).get('/api/health')).status).toBe(200);
  });
  it('limits submissions even when the client supplies spoofed forwarding headers', async () => {
    const { app, repository } = fixture();
    for (let i = 0; i < 10; i++)
      await request(app).post('/api/scans').send({ url: 'https://example.com' });
    const result = await request(app)
      .post('/api/scans')
      .set('Forwarded', 'for=8.8.8.8')
      .send({ url: 'https://example.com' });
    expect(result.status).toBe(429);
    expect(result.headers['retry-after']).toBeDefined();
    expect(repository.create).toHaveBeenCalledTimes(10);
  });
});
