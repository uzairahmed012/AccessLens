import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Browser-only contract fixtures; product code always uses the real API.
const scan = {
  id: '5cb0a6ac-3050-49bf-9c69-33f5be130001',
  url: 'https://example.com/',
  normalizedUrl: 'https://example.com/',
  status: 'queued',
  createdAt: '2026-10-22T00:00:00.000Z',
  updatedAt: '2026-10-22T00:00:00.000Z',
  startedAt: null,
  finishedAt: null,
  errorCode: null,
  errorSummary: null,
};

test('queued job submission, details, reload and history use HTTP contracts', async ({ page }) => {
  let saved = false;
  let submissions = 0;
  await page.route('**/api/scans**', async (route) => {
    if (route.request().method() === 'POST') {
      submissions++;
      expect(route.request().postDataJSON()).toEqual({ url: 'https://example.com/' });
      saved = true;
      await route.fulfill({ status: 202, json: scan });
    } else if (new URL(route.request().url()).pathname.endsWith(scan.id))
      await route.fulfill({ json: scan });
    else await route.fulfill({ json: { items: saved ? [scan] : [], nextCursor: null } });
  });
  await page.goto('/app/new');
  await page.getByLabel('Website URL').fill('https://example.com/');
  await page.getByRole('button', { name: 'Create scan job', exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/app/scans/${scan.id}$`));
  await expect(page.getByText(/Queued — awaiting the scanning engine/)).toBeVisible();
  await expect(page.getByText(scan.id, { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText(/No website has been visited/)).toBeVisible();
  await page.getByRole('link', { name: 'Back to scan history' }).click();
  await expect(page.getByRole('link', { name: scan.normalizedUrl, exact: true })).toBeVisible();
  expect(submissions).toBe(1);
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze()
    ).violations,
  ).toEqual([]);
});

test('intake failures are announced without losing the entered URL', async ({ page }) => {
  await page.route('**/api/scans', (route) =>
    route.fulfill({
      status: 403,
      json: {
        error: {
          code: 'URL_NOT_ALLOWED',
          message: 'Use an approved public website.',
          requestId: 'browser-test',
        },
      },
    }),
  );
  await page.goto('/app/new');
  await page.getByLabel('Website URL').fill('https://unapproved.com/');
  await page.getByRole('button', { name: 'Create scan job', exact: true }).click();
  await expect(page.getByRole('alert')).toHaveText('Use an approved public website.');
  await expect(page.getByLabel('Website URL')).toHaveValue('https://unapproved.com/');
  await expect(page.getByLabel('Website URL')).toHaveAttribute('aria-invalid', 'true');
  await expect(page.getByRole('button', { name: 'Create scan job', exact: true })).toBeEnabled();
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze()
    ).violations,
  ).toEqual([]);
});

test('history retries storage failure and requests the next cursor page', async ({ page }) => {
  let requests = 0;
  await page.route('**/api/scans?*', (route) => {
    requests++;
    if (requests === 1)
      return route.fulfill({
        status: 503,
        json: {
          error: {
            code: 'DATABASE_UNAVAILABLE',
            message: 'The database is unavailable.',
            requestId: 'browser-test',
          },
        },
      });
    const cursor = new URL(route.request().url()).searchParams.get('cursor');
    return route.fulfill({
      json: {
        items: cursor
          ? [
              {
                ...scan,
                id: '5cb0a6ac-3050-49bf-9c69-33f5be130002',
                normalizedUrl: 'https://example.com/older',
              },
            ]
          : [scan],
        nextCursor: cursor ? null : 'next-test-cursor',
      },
    });
  });
  await page.goto('/app/history');
  await expect(page.getByRole('alert')).toHaveText('The database is unavailable.');
  await page.getByRole('button', { name: 'Retry scan history' }).click();
  await expect(page.getByRole('link', { name: scan.normalizedUrl, exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Load more scan jobs' }).click();
  await expect(
    page.getByRole('link', { name: 'https://example.com/older', exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Load more scan jobs' })).toHaveCount(0);
  expect(requests).toBe(3);
});

test('missing jobs have a recoverable detail page', async ({ page }) => {
  await page.route('**/api/scans/*', (route) =>
    route.fulfill({
      status: 404,
      json: {
        error: {
          code: 'NOT_FOUND',
          message: 'This scan job was not found.',
          requestId: 'browser-test',
        },
      },
    }),
  );
  await page.goto(`/app/scans/${scan.id}`);
  await expect(page.getByRole('heading', { name: 'Scan job not found' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Back to scan history' })).toBeVisible();
});

test('populated history stays inside a narrow viewport', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.route('**/api/scans?*', (route) =>
    route.fulfill({
      json: {
        items: Array.from({ length: 6 }, (_, index) => ({
          ...scan,
          id: `5cb0a6ac-3050-49bf-9c69-33f5be13000${index}`,
          normalizedUrl: 'https://example.com/browser-persistence',
        })),
        nextCursor: null,
      },
    }),
  );
  await page.goto('/app/history');
  await expect(
    page
      .getByRole('link', { name: 'https://example.com/browser-persistence', exact: true })
      .first(),
  ).toBeVisible();
  await page.setViewportSize({ width: 375, height: 812 });
  await page.screenshot({ path: 'artifacts/phase1-fixture-history-mobile.png', fullPage: true });
  const overflow = await page.evaluate(() =>
    Array.from(document.querySelectorAll('*'))
      .filter((node) => {
        const bounds = node.getBoundingClientRect();
        return bounds.right > innerWidth + 1 && getComputedStyle(node).position !== 'fixed';
      })
      .map((node) => ({
        tag: node.tagName,
        class: node.className,
        width: node.getBoundingClientRect().width,
      })),
  );
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    JSON.stringify(overflow),
  ).toBe(true);
});
