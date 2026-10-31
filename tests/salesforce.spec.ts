import { test, expect } from '@playwright/test';

// The Salesforce pages moved under /salesforce in WEB-229. Their old URLs are
// shared externally, so each must permanently redirect to its new home
// (redirects() in next.config.ts).
const MOVED_PAGES = [
  { from: '/salesforce-orgs', to: '/salesforce/free-and-trial-orgs' },
  { from: '/lightning-rollout', to: '/salesforce/lightning-rollout' },
  { from: '/lightning-rollout/part-1', to: '/salesforce/lightning-rollout/part-1' },
  { from: '/lightning-rollout/part-2', to: '/salesforce/lightning-rollout/part-2' },
  { from: '/lightning-rollout/part-3', to: '/salesforce/lightning-rollout/part-3' },
  { from: '/ghl', to: '/salesforce/fantasy-football-draft' },
];

test.describe('Salesforce section', () => {
  test('landing page lists the Salesforce projects', async ({ page }) => {
    await page.goto('/salesforce');

    await expect(page).toHaveTitle('Salesforce');
    await expect(page.getByRole('heading', { name: 'Salesforce', level: 1 })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Lightning Rollout' })).toHaveAttribute('href', '/salesforce/lightning-rollout');
    await expect(page.getByRole('link', { name: 'Fantasy Football Draft Application' })).toHaveAttribute(
      'href',
      '/salesforce/fantasy-football-draft'
    );
  });

  for (const { from, to } of MOVED_PAGES) {
    test(`${from} permanently redirects to ${to}`, async ({ page, request }) => {
      const response = await request.get(from, { maxRedirects: 0 });
      expect(response.status()).toBe(308);
      expect(response.headers()['location']).toBe(to);

      const pageResponse = await page.goto(from);
      await expect(page).toHaveURL(new RegExp(`${to}$`));
      expect(pageResponse?.ok()).toBe(true);
    });
  }
});
