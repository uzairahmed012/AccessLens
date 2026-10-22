import { describe, expect, it } from 'vitest';
import { healthResponseSchema, apiErrorSchema } from '../src/index.js';

describe('API contracts', () => {
  it('accepts only the defined health payload', () => {
    expect(healthResponseSchema.parse({ status: 'ok' })).toEqual({ status: 'ok' });
    expect(healthResponseSchema.safeParse({ status: 'connected' }).success).toBe(false);
    expect(healthResponseSchema.safeParse({ status: 'ok', database: 'connected' }).success).toBe(
      false,
    );
  });
  it('requires an error code and correlation ID', () => {
    expect(apiErrorSchema.safeParse({ error: { message: 'failed' } }).success).toBe(false);
  });
});
