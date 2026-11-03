import { test, expect } from '@playwright/test';

test.describe('Home page', () => {
  test('loads with expected title and hero content', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveTitle('Ellie Matthewman | Salesforce Developer & Mentor');
    await expect(page.getByRole('heading', { name: 'Ellie Matthewman', level: 1 })).toBeVisible();
    await expect(page.getByText('Trailblazer.', { exact: true })).toBeVisible();
    await expect(page.getByText('Mentor.', { exact: true })).toBeVisible();
    await expect(page.getByText('Champion.', { exact: true })).toBeVisible();
  });

  test('contact me CTA navigates to the contact page', async ({ page }) => {
    await page.goto('/');

    await page.locator('.contactMe').getByRole('link', { name: 'Contact Me' }).click();

    await expect(page).toHaveURL('/contact-me');
    await expect(page.getByRole('heading', { name: 'Get In Touch' })).toBeVisible();
  });

  test('logo links back to the home page', async ({ page }) => {
    await page.goto('/about-me');

    await page.getByRole('link', { name: 'EllieAtWHL' }).click();

    await expect(page).toHaveURL('/');
  });
});
