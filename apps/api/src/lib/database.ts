import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';

export function createDatabase(connectionString: string) {
  const url = new URL(connectionString);
  if (
    !['postgres:', 'postgresql:'].includes(url.protocol) ||
    !['require', 'verify-full'].includes(url.searchParams.get('sslmode') ?? '')
  ) {
    throw new Error('Database TLS configuration is invalid.');
  }
  const schema = url.searchParams.get('schema') ?? 'public';
  if (!/^[a-z][a-z0-9_]{0,62}$/.test(schema)) throw new Error('Database schema is invalid.');
  // pg's URL sslmode=require can replace the explicit TLS options. Remove it
  // after validation so certificate and hostname verification stay enabled.
  for (const key of [
    'sslmode',
    'ssl',
    'sslcert',
    'sslkey',
    'sslrootcert',
    'sslaccept',
    'schema',
    'channel_binding',
  ])
    url.searchParams.delete(key);
  const adapter = new PrismaPg(
    {
      connectionString: url.toString(),
      ssl: { rejectUnauthorized: true },
      max: 5,
      connectionTimeoutMillis: 10_000,
      idleTimeoutMillis: 30_000,
      statement_timeout: 5_000,
      query_timeout: 10_000,
      application_name: 'accesslens-api',
    },
    { schema, onPoolError: () => {}, onConnectionError: () => {} },
  );
  return new PrismaClient({ adapter, log: [] });
}
