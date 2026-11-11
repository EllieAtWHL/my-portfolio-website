import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Every Playwright test starts as a first-time visitor, so the banner is
// open across the whole suite - the other specs check the site still works
// around it (WEB-104 made its height reserve page clearance for exactly
// that). This spec covers the banner's own behaviour.

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

test.describe('Cookie consent banner', () => {
  test('shows on a first visit, and Reject all dismisses it for good', async ({ page }) => {
    await page.goto('/');
    const banner = page.getByRole('region', { name: 'Cookie consent' });

    await expect(banner).toBeVisible();
    await expect(banner.getByRole('checkbox')).toHaveCount(0);

    await banner.getByRole('button', { name: 'Reject all' }).click();
    await expect(banner).toBeHidden();

    await page.reload();
    await expect(page.getByRole('heading', { name: 'Ellie Matthewman', level: 1 })).toBeVisible();
    await expect(banner).toBeHidden();
  });

  test('saves per-category choices and shows them again from Cookie preferences', async ({ page }) => {
    await page.goto('/');
    const banner = page.getByRole('region', { name: 'Cookie consent' });

    await banner.getByRole('button', { name: 'Manage choices' }).click();
    await banner.getByRole('checkbox', { name: 'Analytics' }).check();
    await banner.getByRole('button', { name: 'Save choices' }).click();
    await expect(banner).toBeHidden();

    await page.getByRole('button', { name: 'Cookie preferences' }).click();

    await expect(banner).toBeFocused();
    await expect(banner.getByRole('checkbox', { name: 'Analytics' })).toBeChecked();
    await expect(banner.getByRole('checkbox', { name: 'Session recording' })).not.toBeChecked();
    await expect(banner.getByRole('checkbox', { name: 'Spam protection' })).not.toBeChecked();
    await expect(banner.getByRole('checkbox', { name: 'Embedded content' })).not.toBeChecked();
  });

  test('has no automatically detectable WCAG 2.1 AA violations, in either view', async ({ page }) => {
    await page.goto('/');
    const banner = page.getByRole('region', { name: 'Cookie consent' });
    await expect(banner).toBeVisible();

    const summary = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
    expect(summary.violations).toEqual([]);

    await banner.getByRole('button', { name: 'Manage choices' }).click();
    await expect(banner.getByRole('checkbox')).toHaveCount(4);

    const details = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
    expect(details.violations).toEqual([]);
  });

  test('keeps a YouTube embed behind Embedded content until it is allowed', async ({ page }) => {
    await page.goto('/salesforce/lightning-rollout/part-1');
    const banner = page.getByRole('region', { name: 'Cookie consent' });
    await banner.getByRole('button', { name: 'Reject all' }).click();

    await expect(page.getByRole('link', { name: 'Watch this video on YouTube' })).toBeVisible();
    await expect(page.locator('iframe[src*="youtube.com"]')).toHaveCount(0);

    await page.getByRole('button', { name: 'Cookie preferences' }).first().click();
    await banner.getByRole('checkbox', { name: 'Embedded content' }).check();
    await banner.getByRole('button', { name: 'Save choices' }).click();

    await expect(page.locator('iframe[src*="youtube.com"]')).toHaveCount(1);
    await expect(page.getByRole('link', { name: 'Watch this video on YouTube' })).toHaveCount(0);
  });
});
