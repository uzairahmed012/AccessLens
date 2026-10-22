import { fileURLToPath } from 'node:url';
import { config } from 'dotenv';
import { defineConfig } from 'prisma/config';

config({ path: fileURLToPath(new URL('../../.env', import.meta.url)), quiet: true });
// DDL must never silently fall back to the pooled runtime connection.
const url = process.env.DIRECT_URL;

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  // Prisma can validate an empty foundation schema offline without credentials.
  ...(url ? { datasource: { url } } : {}),
});
