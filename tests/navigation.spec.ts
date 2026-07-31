import { test, expect } from '@playwright/test';

const navLinks: Array<{ label: string; href: string }> = [
  { label: 'About Me', href: '/about-me' },
  { label: 'Experience', href: '/experience' },
  { label: 'Projects', href: '/projects' },
  { label: 'London 2012', href: '/london-2012' },
  { label: 'Spurs Women', href: '/spurs-women' },
  { label: 'Contact Me', href: '/contact-me' },
];

test.describe('Main navigation', () => {
  for (const { label, href } of navLinks) {
    test(`"${label}" link navigates to ${href}`, async ({ page }) => {
      await page.goto('/');

      await page.getByRole('navigation').getByRole('link', { name: label, exact: true }).click();

      await expect(page).toHaveURL(href);
    });
  }

  test('mobile menu toggles nav visibility', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');

    const nav = page.getByRole('navigation');
    await expect(nav).not.toHaveClass(/active/);

    await page.getByRole('button', { name: 'Toggle menu' }).click();
    await expect(nav).toHaveClass(/active/);

    await nav.getByRole('link', { name: 'About Me', exact: true }).click();
    await expect(page).toHaveURL('/about-me');
  });
});
