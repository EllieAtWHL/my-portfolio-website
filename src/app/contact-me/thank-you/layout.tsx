import type { Metadata } from 'next';
import { SITE_NAME } from '@/lib/site';

// Post-submit confirmation page: nothing useful for search results, so it's
// kept out of the index (and out of sitemap.ts). Its own canonical so it
// doesn't inherit contact-me's, and an absolute title because the parent
// layout's plain-string title stops the root template reaching this segment.
export const metadata: Metadata = {
  title: { absolute: `Thank You | ${SITE_NAME}` },
  robots: { index: false, follow: true },
  alternates: { canonical: '/contact-me/thank-you' },
};

export default function ThankYouLayout({ children }: { children: React.ReactNode }) {
  return children;
}
