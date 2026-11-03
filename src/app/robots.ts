import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

// Served at /robots.txt (WEB-238). Only the auth-gated / non-content paths
// are excluded; everything else is crawlable.
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
        '/contact-me/thank-you',
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
