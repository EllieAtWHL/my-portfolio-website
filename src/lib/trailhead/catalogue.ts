// Every Trick or Trailhead badge that has existed, newest first. Trailhead has
// no "all badges" API, so this is hand-curated: adding next October's badge is
// one new entry at the top of src/data/trick-or-trailhead-badges.json, no code
// changes (FR-7). __tests__/catalogue.test.ts validates the file, which is why
// the cast below is safe.
import badges from '@/data/trick-or-trailhead-badges.json';
import type { AwardType } from './client';

export interface CatalogueBadge {
  year: number;
  title: string;
  awardType: AwardType;
  /** Trailhead award IDs; the same on every profile. Matched first. */
  matchIds: string[];
  /** Fallback if an ID ever changes. Compared trimmed, case- and apostrophe-insensitively. */
  matchTitles: string[];
  imageUrl: string;
  /** Module page or announcement post, for provenance. Null where only the API has it. */
  sourceUrl: string | null;
}

export const CATALOGUE = badges as CatalogueBadge[];

// Part of the results cache key, so a catalogue change (next year's badge, a
// corrected ID) isn't hidden behind up to 24 hours of results computed against
// the old one - Vercel's data cache survives deploys.
export function catalogueVersion(catalogue: CatalogueBadge[] = CATALOGUE): string {
  const text = JSON.stringify(catalogue);
  let hash = 5381;
  for (let i = 0; i < text.length; i++) {
    hash = ((hash * 33) ^ text.charCodeAt(i)) >>> 0;
  }
  return hash.toString(36);
}
