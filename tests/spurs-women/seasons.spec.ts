import { test, expect } from '@playwright/test';

test.describe('Seasons page', () => {
  test('loads with expected title and at least one season', async ({ page }) => {
    await page.goto('/spurs-women/seasons');

    await expect(page).toHaveTitle('Seasons - Tottenham Hotspur Women');
    await expect(page.getByRole('heading', { name: 'Seasons', level: 1 })).toBeVisible();

    const seasonLinks = page.getByRole('main').getByRole('link');
    await expect(seasonLinks.first()).toBeVisible();
  });

  test('clicking a season navigates to its detail page', async ({ page }) => {
    await page.goto('/spurs-women/seasons');

    const firstSeason = page.getByRole('main').getByRole('link').first();
    const fullName = (await firstSeason.textContent())?.trim() ?? '';
    const seasonName = fullName.replace(/\s*\d[\d,]*\smatch(es)?$/, '');
    await firstSeason.click();

    await expect(page).toHaveURL(/\/spurs-women\/seasons\/[^/]+$/, { timeout: 15000 });
    await expect(page.getByRole('heading', { name: seasonName, level: 1 })).toBeVisible();
  });
});
