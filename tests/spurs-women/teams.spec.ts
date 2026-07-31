import { test, expect } from '@playwright/test';

test.describe('Teams page', () => {
  test('loads with expected title and at least one team', async ({ page }) => {
    await page.goto('/spurs-women/teams');

    await expect(page).toHaveTitle('Teams - Tottenham Hotspur Women');
    await expect(page.getByRole('heading', { name: 'Teams', level: 1 })).toBeVisible();

    const teamLinks = page.getByRole('main').getByRole('link');
    await expect(teamLinks.first()).toBeVisible();
  });

  test('clicking a team navigates to its detail page', async ({ page }) => {
    await page.goto('/spurs-women/teams');

    const firstTeam = page.getByRole('main').getByRole('link').first();
    // Accessible name is "<Team Name> N match(es)" - strip the trailing count.
    const fullName = (await firstTeam.textContent())?.trim() ?? '';
    const teamName = fullName.replace(/\s*\d[\d,]*\smatch(es)?$/, '');
    await firstTeam.click();

    await expect(page).toHaveURL(/\/spurs-women\/teams\/[^/]+$/, { timeout: 15000 });
    await expect(page.getByRole('heading', { name: `Matches involving ${teamName}` })).toBeVisible();
  });
});
