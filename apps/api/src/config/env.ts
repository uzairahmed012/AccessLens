import { fileURLToPath } from 'node:url';
import { config } from 'dotenv';
import { z } from 'zod';

const optionalDatabaseUrl = z.preprocess(
  (value) => (value === '' ? undefined : value),
  z
    .url()
    .refine(
      (value) =>
        URL.canParse(value) && ['postgres:', 'postgresql:'].includes(new URL(value).protocol),
      'Expected a PostgreSQL URL',
    )
    .optional(),
);

const originSchema = z.url().refine((value) => {
  if (!URL.canParse(value)) return false;
  const url = new URL(value);
  return ['http:', 'https:'].includes(url.protocol) && url.origin === value;
}, 'Expected an HTTP(S) origin without a path or credentials');

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  HOST: z.string().min(1).default('127.0.0.1'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  CORS_ORIGINS: z
    .string()
    .default('http://localhost:5173,http://127.0.0.1:5173')
    .transform((value) => value.split(',').map((origin) => origin.trim()))
    .pipe(z.array(originSchema).min(1)),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  DATABASE_URL: optionalDatabaseUrl,
  DIRECT_URL: optionalDatabaseUrl,
  SCAN_ALLOWED_HOSTS: z
    .string()
    .default('')
    .transform((value) =>
      value
        .split(',')
        .map((host) => host.trim().toLowerCase())
        .filter(Boolean),
    ),
});

export type Env = z.infer<typeof envSchema>;

export function withPlatformOrigins(env: Env, source: NodeJS.ProcessEnv = process.env): Env {
  if (source.VERCEL !== '1') return env;
  const origins = source.CORS_ORIGINS ? [...env.CORS_ORIGINS] : [];
  for (const hostname of [source.VERCEL_URL, source.VERCEL_PROJECT_PRODUCTION_URL]) {
    if (!hostname) continue;
    try {
      const origin = `https://${hostname}`;
      if (new URL(origin).origin === origin) origins.push(origin);
    } catch {
      // Ignore invalid platform overrides; do not broaden the origin policy.
    }
  }
  return { ...env, CORS_ORIGINS: [...new Set(origins)] };
}

export function loadEnv(): Env {
  config({ path: fileURLToPath(new URL('../../../../.env', import.meta.url)), quiet: true });
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    // Never echo environment values or connection strings in startup errors.
    throw new Error(
      `Invalid environment variables: ${Object.keys(result.error.flatten().fieldErrors).join(', ')}`,
    );
  }
  return withPlatformOrigins(result.data);
}
