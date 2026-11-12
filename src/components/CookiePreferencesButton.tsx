'use client';

import { Button } from './Button';
import { useCookieConsent } from './CookieConsentProvider';

interface CookiePreferencesButtonProps {
  // Spurs Women pages need the spurs button styling (it only applies inside
  // <SpursWrapper>); the main site's secondary style otherwise.
  theme?: 'main' | 'spurs';
  className?: string;
}

// A labelled "Cookie preferences" button that reopens the cookie banner, for
// use in page content - the privacy policy and the blocked-embed fallback
// (EmbedConsentFallback). The footers use their own icon-only version.
export function CookiePreferencesButton({ theme = 'main', className }: CookiePreferencesButtonProps) {
  const { openPreferences } = useCookieConsent();

  return (
    <Button
      variant={theme === 'spurs' ? 'spurs' : 'secondary'}
      size="sm"
      className={className}
      onClick={openPreferences}
    >
      Cookie preferences
    </Button>
  );
}
