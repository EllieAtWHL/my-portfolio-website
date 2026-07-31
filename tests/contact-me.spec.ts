import { test, expect } from '@playwright/test';

test.describe('Contact Me page', () => {
  test('loads with expected heading and form fields', async ({ page }) => {
    await page.goto('/contact-me');

    await expect(page.getByRole('heading', { name: 'Get In Touch' })).toBeVisible();
    await expect(page.getByLabel('First Name')).toBeVisible();
    await expect(page.getByLabel('Last Name')).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Message')).toBeVisible();
  });

  test('required fields block submission when empty', async ({ page }) => {
    await page.goto('/contact-me');

    await page.getByRole('button', { name: 'Send Message' }).click();

    // Browser-native validation should keep us on the same page.
    await expect(page).toHaveURL('/contact-me');
    const isValid = await page.getByLabel('First Name').evaluate(
      (el: HTMLInputElement) => el.checkValidity()
    );
    expect(isValid).toBe(false);
  });

  test('submitting a filled-in form redirects to the thank-you page', async ({ page }) => {
    await page.goto('/contact-me');

    await page.getByLabel('First Name').fill('Ada');
    await page.getByLabel('Last Name').fill('Lovelace');
    await page.getByLabel('Email').fill('ada@example.com');
    await page.getByLabel('Message').fill('Hello, this is a test message.');

    await page.getByRole('button', { name: 'Send Message' }).click();

    await expect(page).toHaveURL('/contact-me/thank-you', { timeout: 5000 });
    await expect(page.getByRole('heading', { name: 'Thank You!' })).toBeVisible();
  });
});
