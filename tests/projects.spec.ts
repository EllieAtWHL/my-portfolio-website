import { test, expect } from '@playwright/test';

test.describe('Projects page', () => {
  test('loads with expected title and heading', async ({ page }) => {
    await page.goto('/projects');

    await expect(page).toHaveTitle('Projects');
    await expect(page.getByRole('heading', { name: 'Projects', level: 1 })).toBeVisible();
  });
});
