import { describe, expect, it, vi } from 'vitest';
import { fetchHealth } from './api';

describe('health client', () => {
  it('rejects non-success responses', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
    await expect(fetchHealth()).rejects.toThrow('The API could not be reached');
  });
  it('rejects a response that falsely claims database connectivity', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ status: 'ok', database: 'connected' }),
      }),
    );
    await expect(fetchHealth()).rejects.toThrow('unexpected health response');
  });
  it('forwards the cancellation signal', async () => {
    const fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ status: 'ok' }) });
    vi.stubGlobal('fetch', fetch);
    const controller = new AbortController();
    await fetchHealth(controller.signal);
    const forwardedSignal = fetch.mock.calls[0]?.[1]?.signal as AbortSignal;
    expect(forwardedSignal.aborted).toBe(false);
    controller.abort();
    expect(forwardedSignal.aborted).toBe(true);
  });
});
