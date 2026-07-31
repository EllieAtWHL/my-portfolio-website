import { test, expect } from '@playwright/test';

test.describe('Spurs Women home page', () => {
  test('loads with expected title and heading', async ({ page }) => {
    await page.goto('/spurs-women');

    await expect(page).toHaveTitle('Home - Tottenham Hotspur Women');
    await expect(page.getByRole('heading', { name: 'Tottenham Hotspur Women', level: 1 })).toBeVisible();
  });

  test('shows matches, news, podcast, and video sections', async ({ page }) => {
    await page.goto('/spurs-women');

    await expect(page.getByRole('heading', { name: /^(Next|Previous|No (upcoming|previous))/ })).toHaveCount(2);
    await expect(page.getByRole('heading', { name: 'Latest Spurs Women News' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Latest Podcast Episodes' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Latest Videos' })).toBeVisible();
  });

  test('"View All Seasons" link navigates to the seasons page', async ({ page }) => {
    await page.goto('/spurs-women');

    await page.getByRole('link', { name: 'View All Seasons' }).click();

    await expect(page).toHaveURL('/spurs-women/seasons');
    await expect(page.getByRole('heading', { name: 'Seasons', level: 1 })).toBeVisible();
  });
});
