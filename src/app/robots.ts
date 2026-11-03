import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

// Served at /robots.txt (WEB-238). Only the auth-gated / non-content paths
// are excluded; everything else is crawlable. /contact-me/thank-you is
// deliberately NOT disallowed: it's kept out of results by its noindex meta,
// which crawlers can only see if they're allowed to fetch the page.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/',
        '/spurs-women/admin',
        '/spurs-women/profile',
        '/spurs-women/login',
        '/spurs-women/unauthorised',
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
