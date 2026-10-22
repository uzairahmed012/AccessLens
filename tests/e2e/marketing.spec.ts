import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

for (const width of [360, 768, 1440]) {
  for (const theme of ['light', 'dark'] as const) {
    test(`public site ${width}px ${theme}: responsive, accessible and separate`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 1000 });
      await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
      const errors: string[] = [];
      const apiCalls: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      page.on('request', (request) => {
        if (new URL(request.url()).pathname.startsWith('/api/')) apiCalls.push(request.url());
      });
      await page.goto('/');
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(
        'Find accessibility issues. Fix them with confidence.',
      );
      await expect(page.getByRole('complementary', { name: 'Workspace sidebar' })).toHaveCount(0);
      await expect(page.getByText(/Example content, not live scan results/)).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      if (width === 1440) {
        const preview = await page.locator('.product-window').boundingBox();
        expect(preview).not.toBeNull();
        expect(preview!.width).toBeGreaterThan(preview!.height * 1.5);
        expect(preview!.height).toBeLessThan(540);
      }
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      ).toBe(true);
      await page.getByRole('button', { name: /Button names/ }).click();
      await expect(page.getByRole('heading', { name: 'Make the action clear.' })).toBeVisible();
      await page.getByRole('button', { name: /Image alternatives/ }).click();
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze();
      expect(results.violations).toEqual([]);
      await page.screenshot({
        path: `artifacts/redesign-public-${width}-${theme}.png`,
        fullPage: true,
      });
      expect(apiCalls).toEqual([]);
      expect(errors).toEqual([]);
    });
  }
}

test('public navigation, anchors, mobile disclosure and workspace handoff', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('main')).toBeFocused();
  const menu = page.getByRole('button', { name: 'Open navigation' });
  await menu.click();
  await expect(page.getByRole('navigation', { name: 'Mobile public navigation' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(menu).toBeFocused();
  await menu.click();
  await page
    .getByRole('navigation', { name: 'Mobile public navigation' })
    .getByRole('link', { name: 'Features', exact: true })
    .click();
  await expect(page).toHaveURL(/#features$/);
  await expect(page.getByRole('navigation', { name: 'Mobile public navigation' })).toBeHidden();
  await expect(page.getByRole('heading', { name: /An issue is only useful/ })).toBeInViewport();
  await page.getByRole('link', { name: 'Explore AccessLens', exact: true }).click();
  await expect(page).toHaveURL(/\/app$/);
  await expect(page.getByRole('heading', { name: 'Overview', exact: true })).toBeVisible();
  await expect(page.getByText('You’re exploring the workspace preview.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Create scan job' })).toBeDisabled();
});

test('public reflow and legacy routes remain usable', async ({ page }) => {
  for (const width of [320, 640]) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
  }
  await page.goto('/history');
  await expect(page).toHaveURL(/\/app\/history$/);
  await expect(page.getByRole('heading', { name: 'Scan history', exact: true })).toBeVisible();
  await page.goto('/a-page-that-does-not-exist');
  await expect(page.getByRole('link', { name: 'Back to AccessLens' })).toBeVisible();
  await expect(page.getByRole('complementary')).toHaveCount(0);
});
