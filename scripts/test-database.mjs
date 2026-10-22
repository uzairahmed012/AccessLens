// Opt-in integration test. Uses a new schema in the confirmed development branch.
// Never truncates or resets public tables, and never writes invented findings.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { spawn, spawnSync } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import {
  databaseEnvironment,
  validateNeonUrls,
  requireDevelopmentTarget,
} from './database-environment.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const require = createRequire(new URL('../apps/api/package.json', import.meta.url));
const environment = databaseEnvironment();
const schema = `phase1_test_${randomUUID().replaceAll('-', '')}`;
let admin;
let client;
let child;
let web;
let browser;
let created = false;
let failed = false;
let checks = 0;
let browserStep = '';
const pass = (message) => {
  checks++;
  console.log(`PASS ${checks}: ${message}`);
};
async function stop() {
  if (!child) return;
  const current = child;
  child = undefined;
  if (current.exitCode !== null || current.signalCode !== null) return;
  await new Promise((resolve) => {
    current.once('exit', resolve);
    current.kill();
  });
}
try {
  validateNeonUrls(environment);
  requireDevelopmentTarget(environment);
  const { createDatabase } = await import('../apps/api/dist/lib/database.js');
  admin = createDatabase(environment.DIRECT_URL);
  await admin.$queryRaw`SELECT 1`;
  pass('Direct Neon connection with certificate verification');
  // Name is generated internally; validate again before interpolating an identifier.
  assert.match(schema, /^phase1_test_[a-f0-9]{32}$/);
  await admin.$executeRawUnsafe(`CREATE SCHEMA "${schema}"`);
  created = true;
  const isolated = { ...environment };
  for (const key of ['DATABASE_URL', 'DIRECT_URL']) {
    const url = new URL(environment[key]);
    url.searchParams.set('schema', schema);
    isolated[key] = url.href;
  }
  const migrate = spawnSync(
    process.execPath,
    [
      require.resolve('prisma/build/index.js'),
      'migrate',
      'deploy',
      '--config',
      'apps/api/prisma.config.ts',
    ],
    { cwd: root, env: isolated, encoding: 'utf8', timeout: 120_000 },
  );
  assert.equal(migrate.status, 0, 'Migration deploy failed; raw connection diagnostics withheld.');
  pass('Versioned migration applied in a new isolated test schema');
  client = createDatabase(isolated.DATABASE_URL);
  await client.$queryRaw`SELECT 1`;
  pass('Pooled Prisma application connection');
  const timestamp = new Date();
  const rows = await Promise.all(
    Array.from({ length: 4 }, (_, index) =>
      client.scan.create({
        data: {
          url: `https://example.com/page-${index}`,
          normalizedUrl: `https://example.com/page-${index}`,
          createdAt: timestamp,
        },
      }),
    ),
  );
  assert.ok(rows.every((row) => row.status === 'queued' && row.startedAt === null));
  pass('Actual queued writes with lifecycle defaults');
  await assert.rejects(() =>
    client.scan.create({
      data: { id: rows[0].id, url: 'https://example.com', normalizedUrl: 'https://example.com' },
    }),
  );
  await assert.rejects(() =>
    client.scan.create({ data: { url: 'x'.repeat(2049), normalizedUrl: 'https://example.com' } }),
  );
  await assert.rejects(() =>
    client.$executeRawUnsafe(`UPDATE "${schema}"."Scan" SET status = 'invented'`),
  );
  pass('Primary key, URL length and status enum constraints');
  const foreignKeys =
    await client.$queryRaw`SELECT c.conname FROM pg_constraint c JOIN pg_namespace n ON n.oid=c.connamespace
    WHERE n.nspname=${schema} AND c.contype='f'`;
  assert.equal(foreignKeys.length, 1);
  assert.equal(await client.finding.count(), 0);
  pass('Finding relationship exists; no artificial findings');
  // Reserve an OS-assigned port without touching the user's running API server.
  const { createServer } = await import('node:net');
  const reservation = createServer();
  await new Promise((resolve) => reservation.listen(0, '127.0.0.1', resolve));
  const port = reservation.address().port;
  await new Promise((resolve) => reservation.close(resolve));
  const origin = `http://127.0.0.1:${port}`;
  async function start() {
    child = spawn(process.execPath, ['apps/api/dist/server.js'], {
      cwd: root,
      env: {
        ...isolated,
        NODE_ENV: 'test',
        HOST: '127.0.0.1',
        PORT: String(port),
        LOG_LEVEL: 'silent',
        SCAN_ALLOWED_HOSTS: 'example.com',
      },
      stdio: 'ignore',
      windowsHide: true,
    });
    child.on('error', () => {});
    for (let attempt = 0; attempt < 100; attempt++) {
      if (child.exitCode !== null) throw new Error('Isolated API exited before readiness.');
      try {
        if ((await fetch(`${origin}/api/health`, { signal: AbortSignal.timeout(1000) })).ok) return;
      } catch {
        /* readiness retry */
      }
      await delay(100);
    }
    throw new Error('Isolated API startup timed out.');
  }
  await start();
  const response = await fetch(`${origin}/api/scans`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: 'https://example.com/phase1-integration#fragment' }),
  });
  assert.equal(response.status, 202);
  const scan = await response.json();
  assert.equal(scan.status, 'queued');
  assert.equal(scan.normalizedUrl, 'https://example.com/phase1-integration');
  assert.ok(await client.scan.findUnique({ where: { id: scan.id } }));
  pass('HTTP creation performs real DNS validation and persists a queued row in Neon');
  await stop();
  await start();
  const detailResponse = await fetch(`${origin}/api/scans/${scan.id}`);
  assert.equal(detailResponse.status, 200);
  assert.equal((await detailResponse.json()).id, scan.id);
  pass('Persisted job retrieved after stopping and restarting the API process');
  const ids = [];
  let cursor;
  do {
    const list = await (
      await fetch(`${origin}/api/scans?limit=2${cursor ? `&cursor=${cursor}` : ''}`)
    ).json();
    assert.ok(list.items.length <= 2);
    ids.push(...list.items.map((row) => row.id));
    cursor = list.nextCursor;
  } while (cursor);
  assert.equal(ids.length, 5);
  assert.equal(new Set(ids).size, 5);
  const ordered = await client.scan.findMany({ orderBy: [{ createdAt: 'desc' }, { id: 'desc' }] });
  assert.deepEqual(
    ids,
    ordered.map((row) => row.id),
  );
  pass('Stable cursor pagination including equal timestamps, no duplicates or omissions');
  assert.equal((await fetch(`${origin}/api/scans/${randomUUID()}`)).status, 404);
  const blocked = await fetch(`${origin}/api/scans`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: 'http://127.0.0.1' }),
  });
  assert.equal(blocked.status, 403);
  assert.equal(await client.scan.count(), 5);
  pass('Missing-job error and rejected URL do not create records');
  if (process.argv.includes('--browser')) {
    browserStep = 'reserve web port';
    const webReservation = createServer();
    await new Promise((resolve) => webReservation.listen(0, '127.0.0.1', resolve));
    const webPort = webReservation.address().port;
    await new Promise((resolve) => webReservation.close(resolve));
    const webOrigin = `http://127.0.0.1:${webPort}`;
    isolated.CORS_ORIGINS = webOrigin;
    browserStep = 'restart API with browser origin';
    await stop();
    await start();
    browserStep = 'start Vite';
    web = spawn(
      process.execPath,
      [
        fileURLToPath(new URL('../node_modules/vite/bin/vite.js', import.meta.url)),
        '--host',
        '127.0.0.1',
        '--port',
        String(webPort),
        '--strictPort',
      ],
      {
        cwd: fileURLToPath(new URL('../apps/web', import.meta.url)),
        env: { ...isolated, API_PROXY_TARGET: origin },
        stdio: 'ignore',
        windowsHide: true,
      },
    );
    web.on('error', () => {});
    let ready = false;
    for (let attempt = 0; attempt < 100; attempt++) {
      try {
        if ((await fetch(webOrigin, { signal: AbortSignal.timeout(1000) })).ok) {
          ready = true;
          break;
        }
      } catch {
        /* readiness retry */
      }
      await delay(100);
    }
    assert.ok(ready, 'Isolated web process was not ready.');
    browserStep = 'launch Chrome';
    const { chromium } = await import('@playwright/test');
    const { default: AxeBuilder } = await import('@axe-core/playwright');
    browser = await chromium.launch({
      channel: environment.PLAYWRIGHT_CHANNEL === 'chrome' ? 'chrome' : undefined,
    });
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
      reducedMotion: 'reduce',
    });
    const page = await context.newPage();
    browserStep = 'open local new-job form';
    await page.goto(`${webOrigin}/app/new`);
    await page.getByLabel('Website URL').fill('https://example.com/browser-persistence');
    await page.getByRole('button', { name: 'Create scan job', exact: true }).click();
    browserStep = 'submit and open job details';
    await page.waitForURL(/\/app\/scans\/[a-f0-9-]+$/);
    const browserId = page.url().split('/').at(-1);
    assert.ok(await client.scan.findUnique({ where: { id: browserId } }));
    await page.getByText(/Queued — awaiting the scanning engine/).waitFor();
    await page.reload();
    await page.getByText(/Queued — awaiting the scanning engine/).waitFor();
    await page.screenshot({ path: 'artifacts/phase1-real-detail-desktop.png', fullPage: true });
    browserStep = 'audit detail accessibility';
    const detailAxe = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .analyze();
    assert.equal(detailAxe.violations.length, 0);
    browserStep = 'open persisted history';
    await page.getByRole('link', { name: 'Back to scan history' }).click();
    await page
      .getByRole('link', { name: 'https://example.com/browser-persistence', exact: true })
      .waitFor();
    await page.screenshot({ path: 'artifacts/phase1-real-history-desktop.png', fullPage: true });
    await page.setViewportSize({ width: 375, height: 812 });
    browserStep = 'mobile history reflow';
    await page.waitForFunction(
      () => globalThis.document.documentElement.scrollWidth <= globalThis.innerWidth,
    );
    await page.screenshot({ path: 'artifacts/phase1-real-history-mobile.png', fullPage: true });
    assert.ok(
      await page.evaluate(
        () => globalThis.document.documentElement.scrollWidth <= globalThis.innerWidth,
      ),
    );
    browserStep = 'audit mobile history accessibility';
    const historyAxe = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .analyze();
    assert.equal(historyAxe.violations.length, 0);
    pass(
      'Real browser creates a Neon-backed job, reloads details and reads history; desktop/mobile axe checks pass',
    );
  }
  console.log(`Database integration: ${checks}/${checks} checks passed.`);
} catch (error) {
  failed = true;
  console.error(
    `Database integration failed after ${checks} successful checks. Connection details withheld; see setup and isolation requirements in README.md.`,
  );
  if (browserStep)
    console.error(
      `Browser verification stage: ${browserStep}; error type: ${error instanceof Error ? error.name : 'unknown'}.`,
    );
} finally {
  await browser?.close().catch(() => {});
  if (web && web.exitCode === null && web.signalCode === null) {
    const current = web;
    await new Promise((resolve) => {
      current.once('exit', resolve);
      current.kill();
    });
  }
  await stop();
  await client?.$disconnect().catch(() => {});
  if (created && admin && /^phase1_test_[a-f0-9]{32}$/.test(schema)) {
    try {
      await admin.$executeRawUnsafe(`DROP SCHEMA "${schema}" CASCADE`);
      console.log('Removed only this run’s generated test schema.');
    } catch {
      failed = true;
      console.error(
        'Could not clean up the generated test schema. Inspect phase1_test_ schemas in the development branch.',
      );
    }
  }
  await admin?.$disconnect().catch(() => {});
}
if (failed) process.exitCode = 1;
