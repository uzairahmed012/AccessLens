import { existsSync, readFileSync } from 'node:fs';
import { parse } from 'dotenv';

export function databaseEnvironment() {
  const file = new URL('../.env', import.meta.url);
  return { ...(existsSync(file) ? parse(readFileSync(file)) : {}), ...process.env };
}
export function validateNeonUrls(environment) {
  const urls = {};
  for (const key of ['DATABASE_URL', 'DIRECT_URL']) {
    try {
      const url = new URL(environment[key]);
      if (
        !['postgres:', 'postgresql:'].includes(url.protocol) ||
        !url.hostname.endsWith('.neon.tech') ||
        !url.username ||
        !url.password ||
        url.pathname === '/' ||
        !['require', 'verify-full'].includes(url.searchParams.get('sslmode')) ||
        /YOUR-NEON|USER:PASSWORD/.test(environment[key])
      )
        throw new Error();
      urls[key] = url;
    } catch {
      throw new Error(
        `${key} must be a real Neon PostgreSQL URL with TLS. Connection details withheld.`,
      );
    }
  }
  const pooled = urls.DATABASE_URL;
  const direct = urls.DIRECT_URL;
  if (
    !pooled.hostname.includes('-pooler.') ||
    direct.hostname.includes('-pooler.') ||
    pooled.hostname.replace('-pooler.', '.') !== direct.hostname ||
    pooled.pathname !== direct.pathname ||
    pooled.username !== direct.username ||
    pooled.password !== direct.password
  )
    throw new Error(
      'The pooled and direct URLs must refer to the same Neon endpoint, database and role. Details withheld.',
    );
  return urls;
}
export function requireDevelopmentTarget(environment) {
  if (
    environment.DATABASE_TARGET_CONFIRMED !== 'development' ||
    environment.NODE_ENV === 'production'
  )
    throw new Error(
      'Database writes are guarded. Confirm an isolated non-production Neon branch, then set DATABASE_TARGET_CONFIRMED=development.',
    );
}
