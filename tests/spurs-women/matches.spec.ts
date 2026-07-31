import { test, expect } from '@playwright/test';

test.describe('Matches page', () => {
  test('loads with expected title, heading, and filter controls', async ({ page }) => {
    await page.goto('/spurs-women/matches');

    await expect(page).toHaveTitle('Matches - Tottenham Hotspur Women');
    await expect(page.getByText('Loading matches...')).toHaveCount(0, { timeout: 10000 });
    await expect(page.getByRole('heading', { name: 'All Tottenham Hotspur Women Matches' })).toBeVisible();
  });

  test('"Back to Seasons" link navigates to the seasons page', async ({ page }) => {
    await page.goto('/spurs-women/matches');
    await expect(page.getByText('Loading matches...')).toHaveCount(0, { timeout: 10000 });

    await page.getByRole('link', { name: 'Back to Seasons' }).click();

    await expect(page).toHaveURL('/spurs-women/seasons');
  });

  test('clicking a match navigates to its detail page', async ({ page }) => {
    await page.goto('/spurs-women/matches');
    await expect(page.getByText('Loading matches...')).toHaveCount(0, { timeout: 10000 });

    const firstMatch = page.locator('main a[href^="/spurs-women/matches/"]').first();
    await expect(firstMatch).toBeVisible();
    await firstMatch.click();

    await expect(page).toHaveURL(/\/spurs-women\/matches\/[^/]+$/, { timeout: 15000 });
    await expect(page.getByRole('heading', { name: 'Match Info' })).toBeVisible();
  });
});
