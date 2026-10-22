import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import {
  databaseEnvironment,
  validateNeonUrls,
  requireDevelopmentTarget,
} from './database-environment.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const require = createRequire(new URL('../apps/api/package.json', import.meta.url));
const operation = process.argv[2];
const environment = databaseEnvironment();
try {
  if (!['validate', 'generate', 'check', 'migrate', 'status'].includes(operation))
    throw new Error('Unknown database operation.');
  if (['check', 'migrate', 'status'].includes(operation)) validateNeonUrls(environment);
  if (operation === 'check') {
    const { createDatabase } = await import('../apps/api/dist/lib/database.js');
    for (const key of ['DATABASE_URL', 'DIRECT_URL']) {
      const client = createDatabase(environment[key]);
      try {
        await client.$queryRaw`SELECT 1`;
        console.log(`${key}: verified TLS connection and SELECT 1 succeeded.`);
      } finally {
        await client.$disconnect();
      }
    }
  } else {
    if (operation === 'migrate') requireDevelopmentTarget(environment);
    const args =
      operation === 'migrate'
        ? ['migrate', 'deploy']
        : operation === 'status'
          ? ['migrate', 'status']
          : [operation];
    const result = spawnSync(
      process.execPath,
      [require.resolve('prisma/build/index.js'), ...args, '--config', 'apps/api/prisma.config.ts'],
      {
        cwd: root,
        env: environment,
        encoding: 'utf8',
        timeout: 120_000,
      },
    );
    // CLI migration diagnostics can contain database addresses; never forward them.
    if (result.status !== 0)
      throw new Error(
        `Prisma ${operation} failed. Check configuration and network access; raw diagnostics withheld.`,
      );
    console.log(
      operation === 'validate'
        ? 'Offline Prisma schema validation passed. Connectivity not checked.'
        : `Prisma ${operation} succeeded.`,
    );
  }
} catch (error) {
  const safe =
    error instanceof Error &&
    !/postgres(?:ql)?:\/\/|password|@/i.test(error.message) &&
    (error.message.startsWith('Database writes are guarded') ||
      error.message.startsWith('DATABASE_URL must') ||
      error.message.startsWith('DIRECT_URL must') ||
      error.message.startsWith('The pooled and direct') ||
      error.message.startsWith('Prisma '));
  console.error(
    safe
      ? error.message
      : 'Database operation failed. Check credentials, TLS, network access and the production API build. Details withheld.',
  );
  process.exitCode = 1;
}
