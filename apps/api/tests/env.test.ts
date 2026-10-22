import { describe, expect, it } from 'vitest';
import { envSchema } from '../src/config/env.js';

describe('environment validation', () => {
  it('starts without database credentials and uses safe native development defaults', () => {
    const env = envSchema.parse({ DATABASE_URL: '', DIRECT_URL: '' });
    expect(env.HOST).toBe('127.0.0.1');
    expect(env.PORT).toBe(3001);
    expect(env.DATABASE_URL).toBeUndefined();
  });
  it.each(['0', '65536', 'abc', '1.5', ''])('rejects invalid port %s', (PORT) => {
    expect(envSchema.safeParse({ PORT }).success).toBe(false);
  });
  it.each(['*', 'https://example.com/path', 'https://user:pass@example.com', 'file:///tmp'])(
    'rejects unsafe CORS origin %s',
    (CORS_ORIGINS) => {
      expect(envSchema.safeParse({ CORS_ORIGINS }).success).toBe(false);
    },
  );
  it('trims multiple explicit origins', () => {
    expect(
      envSchema.parse({ CORS_ORIGINS: 'https://example.com, http://localhost:5173' }).CORS_ORIGINS,
    ).toEqual(['https://example.com', 'http://localhost:5173']);
  });
  it.each(['https://example.com', 'not-a-url', 'file:///tmp'])(
    'rejects invalid database URL %s',
    (DATABASE_URL) => {
      expect(envSchema.safeParse({ DATABASE_URL }).success).toBe(false);
    },
  );
});
