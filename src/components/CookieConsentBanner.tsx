'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Button } from './Button';
import {
  CONSENT_CATEGORIES,
  allChoices,
  useCookieConsent,
  type ConsentCategory,
  type ConsentChoices,
} from './CookieConsentProvider';

const CATEGORY_COPY: Record<ConsentCategory, { label: string; description: string }> = {
  sessionRecording: {
    label: 'Session recording',
    description:
      'FullStory records how you move around and interact with pages, to show where the site is confusing or broken. The most detailed of these.',
  },
  analytics: {
    label: 'Analytics',
    description:
      'Vercel Analytics and Speed Insights count page visits and measure how fast pages load.',
  },
  spamProtection: {
    label: 'Spam protection',
    description:
      'Google reCAPTCHA on the contact form, which sets a Google cookie. The form still sends without it.',
  },
  embeds: {
    label: 'Embedded content',
    description:
      'Shows YouTube videos, a Spotify track and Instagram posts in place, instead of as links. Those services set their own cookies.',
  },
};

export function CookieConsentBanner() {
  const { isBannerOpen, shouldFocusBanner } = useCookieConsent();
  const regionRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  // This banner is rendered once at the root layout (consent must be shared
  // across both site sections), so it sits outside the per-route
  // <SpursWrapper> that normally scopes the spurs-button/navy-gradient CSS
  // in spurs-theme.css - reusing the same "spurs-wrapper" class here (with
  // its page-background padding-top reset for this bottom-fixed context)
  // opts back into that exact styling instead of duplicating it.
  const isSpursSection = pathname?.startsWith('/spurs-women') ?? false;

  // When the visitor opened the banner on purpose ("Cookie preferences" in
  // the footer or under a blocked embed), move focus into it - it's fixed to
  // the bottom of the viewport but its DOM position may be far from the
  // button they pressed. A first-visit banner doesn't take focus (it isn't a
  // modal, and the visitor didn't ask for it).
  useEffect(() => {
    if (isBannerOpen && shouldFocusBanner) {
      regionRef.current?.focus();
    }
  }, [isBannerOpen, shouldFocusBanner]);

  if (!isBannerOpen) return null;

  return (
    <div
      ref={regionRef}
      role="region"
      aria-label="Cookie consent"
      tabIndex={-1}
      // Fixed + above the site's fixed navbar (z-index: 100 in main-theme.css;
      // z-[200] matches OfflineBanner/SkipLink's convention for the same reason).
      // max-h + overflow keeps the expanded choices list reachable on short
      // phone screens rather than pushing the buttons off-screen.
      className={`fixed bottom-0 inset-x-0 z-[200] px-4 py-4 shadow-lg border-t max-h-[85vh] overflow-y-auto focus:outline-none ${
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
      {/* Mounted only while open, so its local state (which view, unsaved
          checkbox edits) resets each time the banner is reopened. */}
      <BannerContent isSpursSection={isSpursSection} />
    </div>
  );
}

function BannerContent({ isSpursSection }: { isSpursSection: boolean }) {
  const { choices, acceptAll, rejectAll, saveChoices } = useCookieConsent();
  // First visit opens the short summary; reopening via "Cookie preferences"
  // (a choice already exists) goes straight to the per-category view, since
  // that's what someone changing their mind came to see.
  const [showDetails, setShowDetails] = useState(choices !== null);
  const [draft, setDraft] = useState<ConsentChoices>(choices ?? allChoices(false));
  const idPrefix = useId();

  // Main-theme .button.secondary carries an explicit min-width:150px that
  // .button.primary doesn't, so the buttons would render at different widths
  // here (unlike the spurs variant, where they all share one CSS class) - pin
  // them to the same width AND min-width explicitly (main-theme.css is
  // imported layer(base) in globals.css, so plain Tailwind utilities here
  // already win without needing !important).
  // w-36 is the narrowest width that fits "Manage choices" on one line.
  const buttonWidth = 'w-36 min-w-36 whitespace-nowrap';
  const secondaryVariant = isSpursSection ? 'spurs' : 'secondary';
  const primaryVariant = isSpursSection ? 'spurs' : 'primary';

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-4">
      {/* Only the summary is a live region - announcing the banner when it
          appears without stealing focus. The checkbox list stays out of it,
          or expanding it would read every description out unprompted. */}
      <p className="text-sm" aria-live="polite">
        This site uses optional cookies for session recording, analytics, spam protection on the
        contact form, and embedded YouTube, Spotify and Instagram content. They stay off unless you
        allow them, and you can change your mind any time via &quot;Cookie preferences&quot; in the
        footer.
      </p>

      {showDetails && (
        <fieldset className="flex flex-col gap-3">
          <legend className="sr-only">Choose which optional cookies to allow</legend>
          {CONSENT_CATEGORIES.map((category) => {
            const id = `${idPrefix}-${category}`;
            const { label, description } = CATEGORY_COPY[category];
            return (
              <div key={category} className="flex items-start gap-3">
                <input
                  id={id}
                  type="checkbox"
                  checked={draft[category]}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, [category]: event.target.checked }))
                  }
                  aria-describedby={`${id}-description`}
                  className={`mt-1 h-4 w-4 flex-shrink-0 cursor-pointer ${
                    isSpursSection
                      ? 'accent-[var(--accent-spurs)]'
                      : 'accent-[var(--brand-primary-light)] dark:accent-[var(--dark-accent)]'
                  }`}
                />
                <div className="text-sm">
                  <label htmlFor={id} className="font-semibold cursor-pointer">
                    {label}
                  </label>
                  <p id={`${id}-description`} className="opacity-80">
                    {description}
                  </p>
                </div>
              </div>
            );
          })}
        </fieldset>
      )}

      <div className="flex flex-wrap justify-center sm:justify-end gap-2">
        {/* Reject all and Accept all stay the same size and always visible
            in both views, so declining is never harder than accepting. */}
        <Button variant={secondaryVariant} size="sm" className={buttonWidth} onClick={rejectAll}>
          Reject all
        </Button>
        {showDetails ? (
          <Button
            variant={secondaryVariant}
            size="sm"
            className={buttonWidth}
            onClick={() => saveChoices(draft)}
          >
            Save choices
          </Button>
        ) : (
          <Button
            variant={secondaryVariant}
            size="sm"
            className={buttonWidth}
            onClick={() => setShowDetails(true)}
          >
            Manage choices
          </Button>
        )}
        <Button variant={primaryVariant} size="sm" className={buttonWidth} onClick={acceptAll}>
          Accept all
        </Button>
      </div>
    </div>
  );
}
