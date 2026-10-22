import { Writable } from 'node:stream';
import request from 'supertest';
import pino from 'pino';
import express from 'express';
import { z } from 'zod';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { envSchema } from '../src/config/env.js';
import { errorHandler } from '../src/middleware/errors.js';
import { validateBody } from '../src/middleware/validate.js';
import { apiErrorSchema, healthResponseSchema } from '../../../packages/shared/src/index.js';

const env = envSchema.parse({ NODE_ENV: 'test', LOG_LEVEL: 'silent' });

describe('Phase 0 API', () => {
  it('reports liveness with safe headers and a generated request ID', async () => {
    const response = await request(createApp(env))
      .get('/api/health')
      .set('X-Request-ID', 'untrusted');
    expect(response.status).toBe(200);
    expect(healthResponseSchema.parse(response.body)).toEqual({ status: 'ok' });
    expect(response.headers['cache-control']).toBe('no-store');
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['x-powered-by']).toBeUndefined();
    expect(response.headers['x-request-id']).toMatch(/^[a-f0-9-]{36}$/);
  });
  it('supports HEAD without returning a body', async () => {
    const response = await request(createApp(env)).head('/api/health');
    expect(response.status).toBe(200);
    expect(response.text).toBeUndefined();
  });
  it('allows configured CORS origins and preflight', async () => {
    const response = await request(createApp(env))
      .options('/api/health')
      .set('Origin', 'http://localhost:5173')
      .set('Access-Control-Request-Method', 'GET');
    expect(response.status).toBe(204);
    expect(response.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    expect(response.headers['access-control-allow-credentials']).toBeUndefined();
  });
  it('returns a typed error for denied origins', async () => {
    const response = await request(createApp(env))
      .get('/api/health')
      .set('Origin', 'https://untrusted.example');
    expect(response.status).toBe(403);
    expect(apiErrorSchema.parse(response.body).error.code).toBe('ORIGIN_NOT_ALLOWED');
    expect(response.headers['access-control-allow-origin']).toBeUndefined();
  });
  it('fails closed when URL intake is not configured', async () => {
    const response = await request(createApp(env))
      .post('/api/scans')
      .send({ url: 'https://example.com' });
    expect(response.status).toBe(503);
    const error = apiErrorSchema.parse(response.body).error;
    expect(error.code).toBe('INTAKE_NOT_CONFIGURED');
    expect(error.requestId).toBe(response.headers['x-request-id']);
  });
  it('handles malformed JSON without echoing the submitted body', async () => {
    const response = await request(createApp(env))
      .post('/api/unknown')
      .set('Content-Type', 'application/json')
      .send('{"secret":"do-not-echo"');
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(response.text).not.toContain('do-not-echo');
  });
  it('rejects oversized bodies', async () => {
    const response = await request(createApp(env))
      .post('/api/unknown')
      .send({ data: 'a'.repeat(20_000) });
    expect(response.status).toBe(413);
    expect(response.body.error.code).toBe('PAYLOAD_TOO_LARGE');
  });
  it('omits URL queries, cookies, authorization and body from request logs', async () => {
    let output = '';
    const stream = new Writable({
      write(chunk, _encoding, done) {
        output += String(chunk);
        done();
      },
    });
    const logger = pino({}, stream);
    await request(createApp(env, logger))
      .post('/api/unknown?secret=QUERY_SECRET')
      .set('Authorization', 'Bearer AUTH_SECRET')
      .set('Cookie', 'session=COOKIE_SECRET')
      .send({ token: 'BODY_SECRET' });
    expect(output).toContain('statusCode');
    for (const secret of ['QUERY_SECRET', 'AUTH_SECRET', 'COOKIE_SECRET', 'BODY_SECRET'])
      expect(output).not.toContain(secret);
  });
});

describe('validation and centralized failure handling', () => {
  function fixture() {
    const app = express();
    app.use(express.json());
    app.post('/test', validateBody(z.object({ name: z.string().min(1) }).strict()), (_req, res) =>
      res.json(res.locals.body),
    );
    app.get('/failure', () => {
      throw new Error('postgresql://private-credentials');
    });
    app.use(errorHandler(pino({ level: 'silent' })));
    return app;
  }
  it('passes parsed input to the controller', async () => {
    const response = await request(fixture()).post('/test').send({ name: 'AccessLens' });
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ name: 'AccessLens' });
  });
  it('rejects unknown fields and invalid inputs', async () => {
    const response = await request(fixture()).post('/test').send({ name: '', arbitrary: true });
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });
  it('hides raw unexpected errors', async () => {
    const response = await request(fixture()).get('/failure');
    expect(response.status).toBe(500);
    expect(response.body.error.message).toBe('An unexpected error occurred.');
    expect(response.text).not.toContain('private-credentials');
  });
});
