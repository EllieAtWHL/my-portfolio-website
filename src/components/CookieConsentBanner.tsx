'use client';

import { Button } from './Button';
import { useCookieConsent } from './CookieConsentProvider';

export function CookieConsentBanner() {
  const { isBannerOpen, accept, reject } = useCookieConsent();

  if (!isBannerOpen) return null;

  return (
    <div
      role="region"
      aria-label="Cookie consent"
      // Fixed + above the site's fixed navbar (z-index: 100 in main-theme.css;
      // z-[200] matches OfflineBanner/SkipLink's convention for the same reason).
      className="fixed bottom-0 inset-x-0 z-[200] bg-white dark:bg-gray-900 border-t border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 px-4 py-4 shadow-lg"
    >
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center gap-4">
        <p className="text-sm flex-1">
          This site uses optional cookies for session recording (FullStory) and analytics (Vercel
          Analytics) to help improve the site. They stay off unless you accept, and you can change
          your mind any time via &quot;Cookie preferences&quot; in the footer.
        </p>
        <div className="flex gap-2 flex-shrink-0">
          <Button variant="secondary" size="sm" onClick={reject}>
            Reject
          </Button>
          <Button variant="primary" size="sm" onClick={accept}>
            Accept
          </Button>
        </div>
      </div>
    </div>
  );
}
