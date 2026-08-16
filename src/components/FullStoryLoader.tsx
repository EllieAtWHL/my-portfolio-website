'use client';

import Script from 'next/script';
import { useCookieConsent } from './CookieConsentProvider';

// FullStory session recording sets cookies and starts capturing as soon as
// this script runs, so it must not load until the visitor has actively
// accepted (WEB-102) - unlike the original unconditional beforeInteractive
// <Script> in layout.tsx, this only ever renders once consent === 'accepted'.
export function FullStoryLoader() {
  const { consent } = useCookieConsent();

  if (consent !== 'accepted') return null;

  return <Script src="/fullstory-init.js" strategy="afterInteractive" />;
}
