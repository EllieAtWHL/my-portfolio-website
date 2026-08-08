import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// WCAG 2.1 AA smoke checks (WEB-53) - catches automatically detectable
// regressions (missing alt text, contrast, ARIA misuse, etc.) on a handful of
// representative pages. Deliberately not exhaustive: axe-core only catches
// ~30-40% of WCAG issues (things like "does this modal trap focus correctly"
// need a real keyboard-driven test, not a static analysis pass) - this guards
// against regressions on what's already fixed, it isn't a substitute for the
// manual/keyboard verification each accessibility ticket in WEB-39 did.
const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

test.describe('Accessibility smoke checks', () => {
  test('home page has no automatically detectable WCAG 2.1 AA violations', async ({ page }) => {
    await page.goto('/');

    const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();

    expect(results.violations).toEqual([]);
  });

  test('Spurs Women home page has no automatically detectable WCAG 2.1 AA violations', async ({ page }) => {
    await page.goto('/spurs-women');
    // Matches/news/videos load asynchronously after navigation; without
    // waiting for the network to settle, axe can catch the page mid-render
    // (e.g. a video link whose title/thumbnail hasn't populated yet, which
    // is a real but transient "no accessible name" state, not a bug) - this
    // is timing-sensitive enough that it only showed up on webkit in testing.
    await page.waitForLoadState('networkidle');

    const results = await new AxeBuilder({ page })
      .withTags(WCAG_TAGS)
      // color-contrast excluded here only: 27 known, tracked failures across
      // NewsCard/VideoCard text (dark:-gated Tailwind classes on a card whose
      // background is always dark, not toggle-dependent) and dynamically
      // generated team badge colors. See WEB-95 - remove this exclusion once
      // that's fixed rather than adding to it.
      .disableRules(['color-contrast'])
      .analyze();

    expect(results.violations).toEqual([]);
  });

  test('admin login page has no automatically detectable WCAG 2.1 AA violations', async ({ page }) => {
    // The actual admin dashboard is behind Google OAuth with no test-credential
    // bypass available in this environment - the login page is the closest
    // publicly-reachable proxy for admin-surface coverage. See WEB-87/88/90-92's
    // Jira history for why the admin panel itself couldn't be exercised live.
    await page.goto('/spurs-women/login');

    const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();

    expect(results.violations).toEqual([]);
  });

  test('an open modal has no automatically detectable WCAG 2.1 AA violations', async ({ page }) => {
    await page.goto('/experience');
    await page.getByRole('tab', { name: 'Awards' }).click();
    await page.getByRole('button').filter({ hasText: 'National Apprenticeship Awards 2023' }).click();

    await expect(page.getByRole('dialog')).toBeVisible();
    // .modal-content has a 0.3s opacity/transform entrance animation - without
    // waiting for it to settle, axe samples mid-fade colors (blended with the
    // backdrop) and reports false color-contrast failures that don't reflect
    // the modal's actual resting appearance.
    await expect(page.locator('.modal-content')).toHaveCSS('opacity', '1');

    const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();

    expect(results.violations).toEqual([]);
  });
});
