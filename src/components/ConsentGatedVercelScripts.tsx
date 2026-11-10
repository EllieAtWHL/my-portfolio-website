'use client';

import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { useCookieConsent } from './CookieConsentProvider';

export function ConsentGatedVercelScripts() {
  const { hasConsent } = useCookieConsent();

  if (!hasConsent('analytics')) return null;

  return (
    <>
      <Analytics />
      <SpeedInsights />
    </>
  );
}
