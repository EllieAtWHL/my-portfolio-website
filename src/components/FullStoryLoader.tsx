'use client';

import Script from 'next/script';
import { useCookieConsent } from './CookieConsentProvider';

// FullStory session recording sets cookies and starts capturing as soon as
// this script runs, so it must not load until the visitor has actively
// allowed it (WEB-102) - unlike the original unconditional beforeInteractive
// <Script> in layout.tsx, this only ever renders once the visitor has allowed
// the session recording category (WEB-104).
export function FullStoryLoader() {
  const { hasConsent } = useCookieConsent();

  if (!hasConsent('sessionRecording')) return null;

  return <Script src="/fullstory-init.js" strategy="afterInteractive" />;
}
