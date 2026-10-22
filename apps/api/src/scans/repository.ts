import type { Scan, ScanList } from '@accesslens/shared';
import type { PrismaClient } from '../generated/prisma/client.js';
import { AppError } from '../middleware/errors.js';
import { z } from 'zod';

const cursorSchema = z.object({ createdAt: z.iso.datetime(), id: z.uuid() }).strict();
export type Cursor = z.infer<typeof cursorSchema>;
export function decodeCursor(value?: string): Cursor | undefined {
  if (!value) return undefined;
  try {
    if (!/^[A-Za-z0-9_-]+$/.test(value)) throw new Error();
    return cursorSchema.parse(JSON.parse(Buffer.from(value, 'base64url').toString('utf8')));
  } catch {
    throw new AppError(400, 'VALIDATION_ERROR', 'The history cursor is invalid.');
  }
}
export interface ScanRepository {
  create(url: string, normalizedUrl: string): Promise<Scan>;
  list(limit: number, cursor?: Cursor): Promise<ScanList>;
  find(id: string): Promise<Scan | null>;
}

type Row = Awaited<ReturnType<PrismaClient['scan']['findMany']>>[number];
function toScan(row: Row): Scan {
  return {
    id: row.id,
    url: row.url,
    normalizedUrl: row.normalizedUrl,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    startedAt: row.startedAt?.toISOString() ?? null,
    finishedAt: row.finishedAt?.toISOString() ?? null,
    // Never return arbitrary worker exception text. Phase 2 must map codes to safe copy.
    errorCode: row.errorCode ? 'SCAN_FAILED' : null,
    errorSummary: row.errorCode ? 'The scan could not be completed.' : null,
  };
}
export function prismaScanRepository(db: PrismaClient): ScanRepository {
  return {
    async create(url, normalizedUrl) {
      return toScan(await db.scan.create({ data: { url, normalizedUrl, status: 'queued' } }));
    },
    async list(limit, cursor) {
      const rows = await db.scan.findMany({
        where: cursor
          ? {
              OR: [
                { createdAt: { lt: new Date(cursor.createdAt) } },
                { createdAt: new Date(cursor.createdAt), id: { lt: cursor.id } },
              ],
            }
          : undefined,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: limit + 1,
      });
      const items = rows.slice(0, limit).map(toScan);
      const last = items.at(-1);
      return {
        items,
        nextCursor:
          rows.length > limit && last
            ? Buffer.from(JSON.stringify({ createdAt: last.createdAt, id: last.id })).toString(
                'base64url',
              )
            : null,
      };
    },
    async find(id) {
      const row = await db.scan.findUnique({ where: { id } });
      return row ? toScan(row) : null;
    },
  };
}
