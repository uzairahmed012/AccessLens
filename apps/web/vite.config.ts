import { fileURLToPath } from 'node:url';
import { existsSync, readFileSync } from 'node:fs';
import { parse } from 'dotenv';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import type { InlineConfig } from 'vitest/node';

export default defineConfig(({ mode }) => {
  // Read only proxy configuration without loadEnv's NODE_ENV side effect.
  // The API's root NODE_ENV=development must not ship development React in builds.
  let proxyTarget = '';
  for (const name of ['.env', '.env.local', `.env.${mode}`, `.env.${mode}.local`]) {
    const file = new URL(`../../${name}`, import.meta.url);
    if (existsSync(file)) proxyTarget = parse(readFileSync(file)).API_PROXY_TARGET ?? proxyTarget;
  }
  proxyTarget = process.env.API_PROXY_TARGET || proxyTarget || 'http://127.0.0.1:3001';
  return {
    plugins: [react(), tailwindcss()],
    resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
    server: { proxy: { '/api': { target: proxyTarget } } },
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      include: ['src/**/*.test.{ts,tsx}'],
      css: false,
      execArgv: ['--no-experimental-webstorage'],
    } satisfies InlineConfig,
  };
});
