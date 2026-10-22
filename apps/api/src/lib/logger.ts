import pino from 'pino';
import type { Env } from '../config/env.js';

export function createLogger(level: Env['LOG_LEVEL']) {
  return pino({
    level,
    redact: {
      paths: [
        'req.headers.authorization',
        'req.headers.cookie',
        'res.headers["set-cookie"]',
        'DATABASE_URL',
        'DIRECT_URL',
        'password',
        'token',
      ],
      censor: '[REDACTED]',
    },
  });
}
