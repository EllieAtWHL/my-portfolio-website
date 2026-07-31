import { test, expect } from '@playwright/test';

test.describe('About Me page', () => {
  test('loads with expected title and heading', async ({ page }) => {
    await page.goto('/about-me');

    await expect(page).toHaveTitle('About Me');
    await expect(page.getByRole('heading', { name: 'About Me', level: 1 })).toBeVisible();
    await expect(page.getByText('Trailblazer. Mentor. Champion.')).toBeVisible();
  });

  test('"Get In Touch" CTA navigates to the contact page', async ({ page }) => {
    await page.goto('/about-me');

    await page.getByRole('link', { name: 'Get In Touch' }).click();

    await expect(page).toHaveURL('/contact-me');
  });

  test('"View My Experience" CTA navigates to the experience page', async ({ page }) => {
    await page.goto('/about-me');

    await page.getByRole('link', { name: 'View My Experience' }).click();

    await expect(page).toHaveURL('/experience');
  });
});
