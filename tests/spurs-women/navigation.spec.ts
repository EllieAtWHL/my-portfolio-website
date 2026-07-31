import { test, expect } from '@playwright/test';

const navLinks: Array<{ label: string; href: string }> = [
  { label: 'Seasons', href: '/spurs-women/seasons' },
  { label: 'Matches', href: '/spurs-women/matches' },
  { label: 'Teams', href: '/spurs-women/teams' },
  { label: 'Stadiums', href: '/spurs-women/stadiums' },
];

test.describe('Spurs Women navigation', () => {
  for (const { label, href } of navLinks) {
    test(`"${label}" link navigates to ${href}`, async ({ page }) => {
      await page.goto('/spurs-women');

      await page.getByRole('navigation').getByRole('link', { name: label, exact: true }).click();

      await expect(page).toHaveURL(href);
    });
  }

  test('logo links back to the main portfolio home page', async ({ page }) => {
    await page.goto('/spurs-women');

    await page.getByRole('link', { name: 'EllieAtWHL' }).click();

    await expect(page).toHaveURL('/');
  });

  test('mobile menu toggles nav visibility', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/spurs-women');

    const nav = page.getByRole('navigation');
    await expect(nav).not.toHaveClass(/active/);

    await page.getByRole('button', { name: 'Toggle menu' }).click();
    await expect(nav).toHaveClass(/active/);

    await nav.getByRole('link', { name: 'Teams', exact: true }).click();
    await expect(page).toHaveURL('/spurs-women/teams');
  });
});
