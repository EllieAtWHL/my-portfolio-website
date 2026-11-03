import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

/**
 * Core-site pages listed in /sitemap.xml (WEB-238). Kept as an explicit list
 * rather than read from the filesystem at runtime (src/ isn't deployed), with
 * a Jest test that fails if a new core-site page.tsx isn't listed here or in
 * EXCLUDED_ROUTES. Spurs Women's data-driven routes (matches, players,
 * seasons, stadiums, teams) are tracked separately in WEB-58, which can
 * append them here.
 */
export const CORE_SITE_ROUTES: ReadonlyArray<{
  path: string;
  priority: number;
  changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'];
}> = [
  { path: '/', priority: 1, changeFrequency: 'monthly' },
  { path: '/about-me', priority: 0.9, changeFrequency: 'monthly' },
  { path: '/experience', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/projects', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/contact-me', priority: 0.7, changeFrequency: 'yearly' },
  { path: '/salesforce', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/salesforce/lightning-rollout', priority: 0.5, changeFrequency: 'yearly' },
  { path: '/salesforce/lightning-rollout/part-1', priority: 0.5, changeFrequency: 'yearly' },
  { path: '/salesforce/lightning-rollout/part-2', priority: 0.5, changeFrequency: 'yearly' },
  { path: '/salesforce/lightning-rollout/part-3', priority: 0.5, changeFrequency: 'yearly' },
  { path: '/salesforce/fantasy-football-draft', priority: 0.5, changeFrequency: 'yearly' },
  { path: '/salesforce/free-and-trial-orgs', priority: 0.5, changeFrequency: 'monthly' },
  { path: '/london-2012', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/london-2012/an-invitation-to-audition', priority: 0.4, changeFrequency: 'yearly' },
  { path: '/london-2012/my-first-audition', priority: 0.4, changeFrequency: 'yearly' },
  { path: '/london-2012/drumming-audition', priority: 0.4, changeFrequency: 'yearly' },
  { path: '/london-2012/the-decision-arrives', priority: 0.4, changeFrequency: 'yearly' },
  { path: '/london-2012/it-begins', priority: 0.4, changeFrequency: 'yearly' },
  { path: '/london-2012/my-first-rehearsal', priority: 0.4, changeFrequency: 'yearly' },
  { path: '/london-2012/1000-drummers', priority: 0.4, changeFrequency: 'yearly' },
  { path: '/london-2012/costume-fitting', priority: 0.4, changeFrequency: 'yearly' },
  { path: '/regicide', priority: 0.5, changeFrequency: 'monthly' },
  { path: '/microbrew', priority: 0.4, changeFrequency: 'monthly' },
];

/** Core-site pages deliberately left out of the sitemap (noindex'd). */
export const EXCLUDED_ROUTES = ['/contact-me/thank-you'] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  return CORE_SITE_ROUTES.map(({ path, priority, changeFrequency }) => ({
    url: path === '/' ? SITE_URL : `${SITE_URL}${path}`,
    changeFrequency,
    priority,
  }));
}
