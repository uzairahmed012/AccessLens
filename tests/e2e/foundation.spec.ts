import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Deterministic empty-state fixture for layout tests, independent of local history.
test.beforeEach(async ({ page }) => {
  await page.route('**/api/scans?*', (route) =>
    route.fulfill({ json: { items: [], nextCursor: null } }),
  );
});

for (const width of [360, 768, 1440]) {
  for (const theme of ['light', 'dark']) {
    test(`${width}px ${theme}: responsive, accessible foundation`, async ({ page }) => {
      await page.setViewportSize({ width, height: 1000 });
      await page.emulateMedia({ colorScheme: theme as 'light' | 'dark', reducedMotion: 'reduce' });
      const errors: string[] = [];
      const posts: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      page.on('request', (request) => {
        if (request.method() === 'POST') posts.push(request.url());
      });
      await page.goto('/app');
      await expect(page.getByText('API online', { exact: true })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Create scan job' })).toBeDisabled();
      await expect(page.getByLabel('Website URL')).toBeEnabled();
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Overview');
      await page.evaluate(() => document.fonts.ready);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      ).toBe(true);
      const a11y = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze();
      expect(a11y.violations).toEqual([]);
      await page.screenshot({ path: `artifacts/phase0-${width}-${theme}.png`, fullPage: true });
      expect(errors).toEqual([]);
      expect(posts).toEqual([]);
    });
  }
}

test('keyboard navigation, themes, route refresh and empty history', async ({ page }) => {
  await page.goto('/app');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('main')).toBeFocused();
  await page.getByRole('button', { name: 'Switch to dark theme' }).click();
  await page.reload();
  await expect(page.locator('html')).toHaveClass('dark');
  await page.getByRole('link', { name: 'Scan history', exact: true }).click();
  await expect(page.getByRole('main')).toBeFocused();
  await expect(page.getByText('No scan history yet')).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Scan history', exact: true })).toBeVisible();
});

test('all foundation routes have no automated accessibility violations in both themes', async ({
  page,
}) => {
  test.setTimeout(60_000);
  for (const colorScheme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme });
    await page.evaluate(() => localStorage.removeItem('accesslens-theme')).catch(() => {});
    for (const route of ['/app/history', '/app/workspace', '/app/guide', '/app/missing']) {
      await page.goto(route);
      await expect(page.getByText('API online', { exact: true })).toBeVisible();
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze();
      expect(results.violations, `${route} ${colorScheme}`).toEqual([]);
    }
  }
});

test('API failure is visible and can be retried', async ({ page }) => {
  await page.route('**/api/health', (route) =>
    route.fulfill({ status: 503, json: { error: 'Unavailable' } }),
  );
  await page.goto('/app');
  await expect(page.getByText('API unavailable', { exact: true })).toBeVisible();
  await page.unroute('**/api/health');
  await page.getByRole('button', { name: 'Retry API connection' }).click();
  await expect(page.getByText('API online', { exact: true })).toBeVisible();
});

test('content reflows at narrow and 200-percent-equivalent desktop widths', async ({ page }) => {
  // 640 CSS px represents the available width of a 1280px viewport at 200% zoom.
  // This verifies reflow; it does not claim a manual browser-zoom or screen-reader audit.
  for (const width of [320, 640]) {
    await page.setViewportSize({ width, height: 700 });
    await page.goto('/app');
    await expect(page.getByText('API online', { exact: true })).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    await expect(page.getByRole('button', { name: /Switch to .* theme/ })).toBeVisible();
    await page.getByRole('link', { name: 'Scan history', exact: true }).click();
    await expect(page.getByText('No scan history yet')).toBeVisible();
    const explanation = page.getByText(/Create your first queued job/);
    expect(
      await explanation.evaluate((node) => {
        const bounds = node.getBoundingClientRect();
        return (
          bounds.left >= 0 && bounds.right <= innerWidth && node.scrollWidth <= node.clientWidth
        );
      }),
    ).toBe(true);
  }
});
