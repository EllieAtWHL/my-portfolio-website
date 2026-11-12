import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

test.describe('Privacy policy', () => {
  test('a first-time visitor can reach it from the cookie banner', async ({ page }) => {
    await page.goto('/');

    await page
      .getByRole('region', { name: 'Cookie consent' })
      .getByRole('link', { name: 'privacy policy' })
      .click();

    await expect(page).toHaveURL('/privacy-policy');
    await expect(page.getByRole('heading', { level: 1, name: 'Privacy Policy' })).toBeVisible();
  });

  test('is linked from both site footers', async ({ page }) => {
    // The open banner sits over the fixed footer, so answer it once up front
    // (waiting for it - it opens after hydration); the stored choice then
    // keeps it closed on the second page.
    await page.goto('/about-me');
    await page
      .getByRole('region', { name: 'Cookie consent' })
      .getByRole('button', { name: 'Reject all' })
      .click();

    for (const start of ['/about-me', '/spurs-women']) {
      await page.goto(start);
      await page.locator('footer').getByRole('link', { name: 'Privacy' }).click();

      await expect(page).toHaveURL('/privacy-policy');
    }
  });

  test('has no automatically detectable WCAG 2.1 AA violations', async ({ page }) => {
    await page.goto('/privacy-policy');
    await page.getByRole('button', { name: 'Reject all' }).click();

    const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();

    expect(results.violations).toEqual([]);
  });
});
