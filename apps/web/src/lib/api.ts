import { healthResponseSchema, type HealthResponse } from '@accesslens/shared';
import {
  apiErrorSchema,
  scanListSchema,
  scanSchema,
  type CreateScanInput,
} from '@accesslens/shared';
import type { z } from 'zod';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
  }
}
async function request<T>(
  path: string,
  schema: z.ZodType<T>,
  options: RequestInit = {},
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, {
      ...options,
      headers: { Accept: 'application/json', ...options.headers },
      signal: options.signal
        ? AbortSignal.any([options.signal, AbortSignal.timeout(15_000)])
        : AbortSignal.timeout(15_000),
    });
  } catch {
    throw new ApiError(
      'The API could not be reached. Check your connection and try again.',
      'NETWORK_ERROR',
    );
  }
  let data: unknown;
  try {
    data = await response.json();
  } catch {
    throw new ApiError('The API returned an unreadable response.', 'INVALID_RESPONSE');
  }
  if (!response.ok) {
    const error = apiErrorSchema.safeParse(data);
    throw new ApiError(
      error.success ? error.data.error.message : 'The request could not be completed.',
      error.success ? error.data.error.code : 'REQUEST_FAILED',
    );
  }
  const parsed = schema.safeParse(data);
  if (!parsed.success)
    throw new ApiError('The API returned an unexpected response.', 'INVALID_RESPONSE');
  return parsed.data;
}
export const createScan = (input: CreateScanInput) =>
  request('/api/scans', scanSchema, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
export const fetchScans = (cursor?: string, signal?: AbortSignal) =>
  request(
    `/api/scans?limit=10${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`,
    scanListSchema,
    { signal },
  );
export const fetchScan = (id: string, signal?: AbortSignal) =>
  request(`/api/scans/${encodeURIComponent(id)}`, scanSchema, { signal });

export async function fetchHealth(signal?: AbortSignal): Promise<HealthResponse> {
  const timeout = AbortSignal.timeout(5_000);
  const requestSignal = signal ? AbortSignal.any([signal, timeout]) : timeout;
  const response = await fetch('/api/health', {
    signal: requestSignal,
    headers: { Accept: 'application/json' },
  });
  if (!response.ok)
    throw new Error('The API could not be reached. Check that the backend is running.');
  const result = healthResponseSchema.safeParse(await response.json());
  if (!result.success) throw new Error('The API returned an unexpected health response.');
  return result.data;
}
