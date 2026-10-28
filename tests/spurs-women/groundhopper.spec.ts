import { test, expect } from '@playwright/test';

test.describe('Groundhopper', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/spurs-women/groundhopper');
    await page.evaluate(() => window.localStorage.clear());
    await page.reload();
  });

  test('loads a round with a map and drops a pin on tap', async ({ page }) => {
    await expect(page).toHaveTitle('Groundhopper - Tottenham Hotspur Women');
    await expect(page.getByText(/Ground 1 of \d/)).toBeVisible();

    const map = page.locator('.groundhopper-map');
    await expect(map).toBeVisible();
    // Tiles come from a third party; just check Leaflet set up its panes.
    await expect(map.locator('.leaflet-tile-pane')).toBeAttached();

    const lockIn = page.getByRole('button', { name: 'Lock in guess' });
    await expect(lockIn).toBeDisabled();
    await map.click({ position: { x: 150, y: 150 } });
    await expect(lockIn).toBeEnabled();

    await lockIn.click();
    await expect(page.getByText(/points · .* away/)).toBeVisible();
  });

  test('is linked from the stadiums page and the main site games', async ({ page }) => {
    await page.goto('/spurs-women/stadiums');
    await expect(page.getByRole('link', { name: 'Play Groundhopper' })).toHaveAttribute('href', '/spurs-women/groundhopper');

    await page.goto('/projects');
    await expect(page.locator('a[href="/spurs-women/groundhopper"]')).toHaveCount(1);
  });
});
