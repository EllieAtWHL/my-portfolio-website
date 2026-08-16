'use client';

import { Analytics } from '@vercel/analytics/next';
import { useCookieConsent } from './CookieConsentProvider';

export function ConsentGatedAnalytics() {
  const { consent } = useCookieConsent();

  if (consent !== 'accepted') return null;

  return <Analytics />;
}
