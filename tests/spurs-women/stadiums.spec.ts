import { test, expect } from '@playwright/test';

test.describe('Stadiums page', () => {
  test('loads with expected title and at least one stadium', async ({ page }) => {
    await page.goto('/spurs-women/stadiums');

    await expect(page).toHaveTitle('Stadiums - Tottenham Hotspur Women');
    await expect(page.getByRole('heading', { name: 'Stadiums', level: 1 })).toBeVisible();

    const stadiumLinks = page.getByRole('main').getByRole('link');
    await expect(stadiumLinks.first()).toBeVisible();
  });

  test('clicking a stadium navigates to its detail page', async ({ page }) => {
    await page.goto('/spurs-women/stadiums');

    const firstStadium = page.getByRole('main').getByRole('link').first();
    await firstStadium.click();

    await expect(page).toHaveURL(/\/spurs-women\/stadiums\/[^/]+$/, { timeout: 15000 });
    // The detail page's h1 can differ from the list's "current name" label
    // (historic stadium name vs. current sponsor name), so just assert structure.
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
});
