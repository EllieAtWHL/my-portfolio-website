import { test, expect } from '@playwright/test';

test.describe('Projects page', () => {
  test('loads with expected title and heading', async ({ page }) => {
    await page.goto('/projects');

    await expect(page).toHaveTitle('Projects');
    await expect(page.getByRole('heading', { name: 'Projects', level: 1 })).toBeVisible();
  });

  test('Salesforce card links to the /salesforce section', async ({ page }) => {
    await page.goto('/projects');
    await page.getByRole('button', { name: /Salesforce/ }).click();

    await expect(page.getByRole('link', { name: 'All Salesforce projects' })).toHaveAttribute('href', '/salesforce');
    await expect(page.getByRole('link', { name: 'Lightning Rollout' })).toHaveAttribute('href', '/salesforce/lightning-rollout');
    await expect(page.getByRole('link', { name: 'Fantasy Football Draft Application' })).toHaveAttribute(
      'href',
      '/salesforce/fantasy-football-draft'
    );
  });
});
