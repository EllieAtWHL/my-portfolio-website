'use client';

import { usePathname } from 'next/navigation';
import { Button } from './Button';
import { useCookieConsent } from './CookieConsentProvider';

export function CookieConsentBanner() {
  const { isBannerOpen, accept, reject } = useCookieConsent();
  const pathname = usePathname();
  // This banner is rendered once at the root layout (consent must be shared
  // across both site sections), so it sits outside the per-route
  // <SpursWrapper> that normally scopes the spurs-button/navy-gradient CSS
  // in spurs-theme.css - reusing the same "spurs-wrapper" class here (with
  // its page-background padding-top reset for this bottom-fixed context)
  // opts back into that exact styling instead of duplicating it.
  const isSpursSection = pathname?.startsWith('/spurs-women') ?? false;

  if (!isBannerOpen) return null;

  return (
    <div
      role="region"
      aria-label="Cookie consent"
      // Fixed + above the site's fixed navbar (z-index: 100 in main-theme.css;
      // z-[200] matches OfflineBanner/SkipLink's convention for the same reason).
      className={`fixed bottom-0 inset-x-0 z-[200] px-4 py-4 shadow-lg border-t ${
        isSpursSection
          ? 'spurs-wrapper pt-4 border-white/10'
          : // dark:bg-gray-900/border-gray-700 are generic Tailwind grays with a
            // blue cast that clash with the main site's actual dark theme
            // (a green gradient, per .dark body in globals.css) - these
            // reference the same --dark-bg-1/--dark-accent/--dark-text
            // variables main-theme.css uses for other dark-mode surfaces
            // (e.g. .dark .mobile-nav-button, .dark .button.secondary).
            'bg-white dark:bg-[var(--dark-bg-1)] border-gray-300 dark:border-[var(--dark-accent)] text-gray-700 dark:text-[var(--dark-text)]'
      }`}
    >
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center gap-4">
        <p className="text-sm flex-1">
          This site uses optional cookies for session recording (FullStory) and analytics (Vercel
          Analytics) to help improve the site. They stay off unless you accept, and you can change
          your mind any time via &quot;Cookie preferences&quot; in the footer.
        </p>
        <div className="flex gap-2 flex-shrink-0">
          <Button
            variant={isSpursSection ? 'spurs' : 'secondary'}
            size="sm"
            // Main-theme .button.secondary carries an explicit min-width:150px
            // that .button.primary doesn't, so the two would render at
            // different widths here (unlike the spurs variant, where both
            // buttons already share one CSS class) - pin both to the same
            // width AND min-width explicitly (main-theme.css is imported
            // layer(base) in globals.css, so plain Tailwind utilities here
            // already win without needing !important).
            className="w-28 min-w-28"
            onClick={reject}
          >
            Reject
          </Button>
          <Button
            variant={isSpursSection ? 'spurs' : 'primary'}
            size="sm"
            className="w-28 min-w-28"
            onClick={accept}
          >
            Accept
          </Button>
        </div>
      </div>
    </div>
  );
}
