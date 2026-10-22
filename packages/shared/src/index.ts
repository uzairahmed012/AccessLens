import { z } from 'zod';

export const healthResponseSchema = z.object({ status: z.literal('ok') }).strict();
export type HealthResponse = z.infer<typeof healthResponseSchema>;

export const apiErrorCodeSchema = z.enum([
  'VALIDATION_ERROR',
  'NOT_FOUND',
  'INTERNAL_ERROR',
  'ORIGIN_NOT_ALLOWED',
  'PAYLOAD_TOO_LARGE',
  'UNSUPPORTED_MEDIA_TYPE',
  'URL_NOT_ALLOWED',
  'DNS_LOOKUP_FAILED',
  'INTAKE_NOT_CONFIGURED',
  'DATABASE_UNAVAILABLE',
  'RATE_LIMITED',
]);
export type ApiErrorCode = z.infer<typeof apiErrorCodeSchema>;

export const apiErrorSchema = z.object({
  error: z.object({
    code: apiErrorCodeSchema,
    message: z.string(),
    requestId: z.string(),
  }),
});
export type ApiErrorResponse = z.infer<typeof apiErrorSchema>;

export const createScanSchema = z.object({ url: z.string().trim().min(1).max(2048) }).strict();
export type CreateScanInput = z.infer<typeof createScanSchema>;
export const scanStatusSchema = z.enum(['queued', 'running', 'completed', 'failed']);
export const scanSchema = z.object({
  id: z.uuid(),
  url: z.string(),
  normalizedUrl: z.string(),
  status: scanStatusSchema,
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  startedAt: z.iso.datetime().nullable(),
  finishedAt: z.iso.datetime().nullable(),
  errorCode: z.string().nullable(),
  errorSummary: z.string().nullable(),
});
export type Scan = z.infer<typeof scanSchema>;
export const scanListSchema = z.object({
  items: z.array(scanSchema),
  nextCursor: z.string().nullable(),
});
export type ScanList = z.infer<typeof scanListSchema>;
export const scanListQuerySchema = z
  .object({
    limit: z
      .string()
      .regex(/^[1-9]\d?$/)
      .transform(Number)
      .pipe(z.number().max(50))
      .default(20),
    cursor: z.string().min(1).max(256).optional(),
  })
  .strict();
