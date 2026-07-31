import { test, expect } from '@playwright/test';

test.describe('Experience page', () => {
  test('loads with expected title and heading', async ({ page }) => {
    await page.goto('/experience');

    await expect(page).toHaveTitle('Experience');
    await expect(page.getByRole('heading', { name: 'Experience', level: 1 })).toBeVisible();
    await expect(page.getByText('14+ Years of Technological Excellence')).toBeVisible();
  });
});
