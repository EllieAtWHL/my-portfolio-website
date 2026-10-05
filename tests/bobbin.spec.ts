import { test, expect } from '@playwright/test';

// Bobbin (reference/bobbin/README.md) is a static Vite build in public/bobbin/,
// served at /bobbin/play by a next.config.ts rewrite (/bobbin redirects there). playwright.config.ts builds it
// before starting the dev server.
test.describe('Bobbin', () => {
  test('serves the game at /bobbin/play (via /bobbin) with no console or CSP errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/bobbin');

    await expect(page).toHaveURL(/\/bobbin\/play$/);
    await expect(page).toHaveTitle('Bobbin');
    await expect(page.locator('#code')).toHaveText(/^E-[2-9A-HJ-NP-Z]{4}$/);
    await expect(page.getByRole('button', { name: /^Send .+ bobbin with \d+$/ }).first()).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('plays: sending a bobbin puts it on the belt', async ({ page }) => {
    await page.goto('/bobbin');
    await page.getByLabel('Play a code').fill('E-4K7P');
    await page.getByRole('button', { name: 'Play' }).click();
    await expect(page.locator('#code')).toHaveText('E-4K7P');

    await page.getByRole('button', { name: /^Send .+ bobbin with \d+$/ }).first().click();

    await expect(page.locator('#beltStatus')).toHaveText(/Belt [1-4] of 4/);
  });

  test('is installable: manifest, icons and a correctly scoped service worker', async ({ page, request }) => {
    await page.goto('/bobbin');
    const href = await page.locator('link[rel="manifest"]').getAttribute('href');
    expect(href).toBe('/bobbin/manifest.webmanifest');

    const manifest = await (await request.get(href!)).json();
    // The scope must end in a slash and contain start_url - see next.config.ts.
    expect(manifest).toMatchObject({ id: '/bobbin/', start_url: '/bobbin/play', scope: '/bobbin/', display: 'standalone' });
    for (const icon of manifest.icons) {
      expect((await request.get(icon.src)).status()).toBe(200);
    }

    const sw = await request.get('/bobbin/sw.js');
    expect(sw.status()).toBe(200);
  });

  test('is controlled by a /bobbin/-scoped worker and works offline once loaded', async ({ page, context, browserName }) => {
    // Playwright only exposes service workers reliably in Chromium.
    test.skip(browserName !== 'chromium', 'Service worker offline check runs in Chromium');

    await page.goto('/bobbin/play');
    const scope = await page.evaluate(async () => (await navigator.serviceWorker.ready).scope);
    expect(new URL(scope).pathname).toBe('/bobbin/');
    await page.reload();
    await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);

    await context.setOffline(true);
    try {
      await page.reload();
      await expect(page).toHaveTitle('Bobbin');
      await expect(page.getByRole('button', { name: /^Send .+ bobbin with \d+$/ }).first()).toBeVisible();
    } finally {
      await context.setOffline(false);
    }
  });

  test('is linked from the Projects page', async ({ page }) => {
    await page.goto('/projects');
    const link = page.getByRole('link', { name: 'Bobbin' });
    await expect(link).toHaveAttribute('href', '/bobbin');
  });
});
