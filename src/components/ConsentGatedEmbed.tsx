'use client';

import { Button } from './Button';
import { useCookieConsent } from './CookieConsentProvider';

interface EmbedConsentFallbackProps {
  // e.g. "YouTube" - named in the note, so the visitor knows who sets the cookies
  service: string;
  href: string;
  linkLabel: string;
  // Spurs Women pages need the spurs link/button styling; the main site's
  // global <a> and secondary button styles apply otherwise.
  theme?: 'main' | 'spurs';
}

// Shown in place of a third-party embed that sets cookies (YouTube, Spotify,
// Instagram) until the visitor allows the "Embedded content" category - the
// content stays reachable via a plain link, and the button reopens the
// banner rather than silently opting the visitor in from here.
export function EmbedConsentFallback({ service, href, linkLabel, theme = 'main' }: EmbedConsentFallbackProps) {
  const { openPreferences } = useCookieConsent();
  const isSpurs = theme === 'spurs';

  return (
    <div className="text-sm">
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={isSpurs ? 'spurs-text venue-link hover:underline' : undefined}
      >
        {linkLabel}
      </a>{' '}
      <span aria-hidden="true" className="opacity-60">
        ↗
      </span>
      <p className="mt-1">
        {/* One string rather than "{service} sets ..." across two JSX lines:
            written that way, the space after {service} went missing in the
            Jest render (textContent "YouTubesets cookies"). */}
        {`${service} sets cookies, so this only shows here once you allow "Embedded content" cookies.`}
      </p>
      <Button
        variant={isSpurs ? 'spurs' : 'secondary'}
        size="sm"
        className="mt-2"
        onClick={openPreferences}
      >
        Cookie preferences
      </Button>
    </div>
  );
}

interface ConsentGatedEmbedProps extends EmbedConsentFallbackProps {
  // The embed itself (typically an <iframe> and its wrapper) - only rendered,
  // and so only requested from the third party, once "Embedded content" is allowed.
  children: React.ReactNode;
}

export function ConsentGatedEmbed({ children, ...fallbackProps }: ConsentGatedEmbedProps) {
  const { hasConsent, isConsentKnown } = useCookieConsent();

  // Until the stored choice has been read, render nothing rather than the
  // fallback, so a visitor who already allowed embeds isn't told to.
  if (!isConsentKnown) return null;

  if (!hasConsent('embeds')) return <EmbedConsentFallback {...fallbackProps} />;

  return <>{children}</>;
}
