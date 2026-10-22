import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('inspector tabs, disclosure, clipboard feedback, and rapid selection work', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  await page.getByRole('button', { name: /Button names/ }).click();
  await page.getByRole('button', { name: 'Why this matters' }).click();
  await expect(page.getByRole('button', { name: 'Why this matters' })).toHaveAttribute(
    'aria-expanded',
    'true',
  );
  await page.getByRole('tab', { name: 'Element', exact: true }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('tab', { name: 'Suggested fix' })).toBeFocused();
  await expect(page.getByRole('tabpanel')).toContainText('aria-label="Open shopping bag"');
  await page.getByRole('button', { name: 'Copy example code' }).click();
  await expect(page.getByText('Example code copied. Review it before using.')).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain(
    'aria-label="Open shopping bag"',
  );
  await page.getByRole('button', { name: 'Dismiss notification' }).click();
  await expect(page.getByText('Example code copied. Review it before using.')).toHaveCount(0);
  for (const name of [/Link purpose/, /Image alternatives/, /Button names/])
    await page.getByRole('button', { name }).click();
  await expect(page.getByRole('heading', { name: 'Make the action clear.' })).toBeVisible();
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze()
    ).violations,
  ).toEqual([]);
});

test('dialogs trap focus, close on Escape, and restore their trigger', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/app');
  const trigger = page.getByRole('button', { name: 'About this preview' });
  await trigger.click();
  const dialog = page.getByRole('dialog', { name: 'A foundation you can explore' });
  await expect(dialog).toBeVisible();
  await page.keyboard.press('Tab');
  expect(await dialog.evaluate((node) => node.contains(document.activeElement))).toBe(true);
  await page.keyboard.press('Shift+Tab');
  expect(await dialog.evaluate((node) => node.contains(document.activeElement))).toBe(true);
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze()
    ).violations,
  ).toEqual([]);
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await page.getByRole('button', { name: 'Open workspace navigation' }).click();
  await page
    .getByRole('navigation', { name: 'More workspace navigation' })
    .getByRole('link', { name: 'Findings', exact: true })
    .click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('heading', { level: 1, name: 'Findings explorer' })).toBeVisible();
  await expect(page.getByRole('main')).toBeFocused();
});

test('new workspace layouts remain empty and accessible in both themes', async ({ page }) => {
  test.setTimeout(90_000);
  const posts: string[] = [];
  page.on('request', (request) => {
    if (request.method() === 'POST') posts.push(request.url());
  });
  for (const theme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
    await page.goto('/');
    await page.evaluate(() => localStorage.removeItem('accesslens-theme'));
    for (const route of ['/app/new', '/app/findings', '/app/scans/unavailable']) {
      await page.goto(route);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      if (route.endsWith('/new'))
        await expect(page.getByRole('button', { name: 'Create scan job' })).toBeDisabled();
      if (route.endsWith('/findings')) {
        for (const name of ['Element inspection', 'Fix suggestions', 'Findings']) {
          await page.getByRole('tab', { name, exact: true }).click();
          await expect(page.getByRole('tabpanel')).toBeVisible();
          expect(
            (
              await new AxeBuilder({ page })
                .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
                .analyze()
            ).violations,
            `${route} ${name} ${theme}`,
          ).toEqual([]);
        }
      } else
        expect(
          (
            await new AxeBuilder({ page })
              .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
              .analyze()
          ).violations,
          `${route} ${theme}`,
        ).toEqual([]);
    }
    await page.goto('/app/workspace');
    await page.getByRole('tab', { name: 'Connections & capabilities' }).click();
    await expect(page.getByRole('heading', { name: 'Scanner status' })).toBeVisible();
    expect(
      (
        await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
          .analyze()
      ).violations,
    ).toEqual([]);
  }
  expect(posts).toEqual([]);
});

test('additional laptop, wide desktop, phone and landscape layouts reflow with reduced motion', async ({
  page,
}) => {
  test.setTimeout(90_000);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const viewport of [
    { width: 1920, height: 1080 },
    { width: 1280, height: 800 },
    { width: 1024, height: 768 },
    { width: 375, height: 812 },
    { width: 812, height: 375 },
  ]) {
    await page.setViewportSize(viewport);
    for (const route of ['/', '/app', '/app/history', '/app/findings']) {
      await page.goto(route);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        `${route} ${viewport.width}`,
      ).toBe(true);
      expect(
        await page.evaluate(
          () =>
            document.getAnimations().filter((animation) => animation.playState === 'running')
              .length,
        ),
      ).toBe(0);
    }
  }
});
