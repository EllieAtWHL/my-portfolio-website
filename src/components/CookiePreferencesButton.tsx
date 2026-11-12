'use client';

import { Button } from './Button';
import { useCookieConsent } from './CookieConsentProvider';

// A labelled "Cookie preferences" button for use in page content (the
// privacy policy), so a server-component page can reopen the cookie banner.
// The footers use their own icon-only version.
export function CookiePreferencesButton() {
  const { openPreferences } = useCookieConsent();

  return (
    <Button variant="secondary" size="sm" onClick={openPreferences}>
      Cookie preferences
    </Button>
  );
}
