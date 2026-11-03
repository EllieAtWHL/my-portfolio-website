import fs from 'fs';
import path from 'path';
import sitemap, { CORE_SITE_ROUTES, EXCLUDED_ROUTES } from '../sitemap';
import robots from '../robots';
import { SITE_URL } from '@/lib/site';

const APP_DIR = path.join(__dirname, '..');

/** Every core-site page.tsx under src/app, as a route path. */
function findCoreSitePageRoutes(dir: string, route = ''): string[] {
  const routes: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (['api', 'spurs-women', '__tests__'].includes(entry.name)) continue;
      routes.push(...findCoreSitePageRoutes(path.join(dir, entry.name), `${route}/${entry.name}`));
    } else if (entry.name === 'page.tsx') {
      routes.push(route || '/');
    }
  }
  return routes;
}

describe('sitemap', () => {
  it('lists every core-site page (or explicitly excludes it)', () => {
    const listed = new Set<string>([...CORE_SITE_ROUTES.map((r) => r.path), ...EXCLUDED_ROUTES]);
    const missing = findCoreSitePageRoutes(APP_DIR).filter((r) => !listed.has(r));
    expect(missing).toEqual([]);
  });

  it('only lists pages that exist', () => {
    const existing = new Set(findCoreSitePageRoutes(APP_DIR));
    const stale = CORE_SITE_ROUTES.map((r) => r.path).filter((r) => !existing.has(r));
    expect(stale).toEqual([]);
  });

  it('uses absolute canonical-domain URLs with the home page first', () => {
    const entries = sitemap();
    expect(entries[0].url).toBe(SITE_URL);
    for (const entry of entries) {
      expect(entry.url.startsWith(SITE_URL)).toBe(true);
      expect(entry.url.endsWith('/')).toBe(false);
    }
    expect(new Set(entries.map((e) => e.url)).size).toBe(entries.length);
  });
});

describe('robots', () => {
  it('points at the sitemap and blocks admin/API paths', () => {
    const result = robots();
    expect(result.sitemap).toBe(`${SITE_URL}/sitemap.xml`);
    const rules = Array.isArray(result.rules) ? result.rules[0] : result.rules;
    expect(rules.disallow).toEqual(expect.arrayContaining(['/api/', '/spurs-women/admin']));
  });
});
