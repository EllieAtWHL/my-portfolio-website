// Merges the catalogue with a profile's earned awards. Pure, so the scoring
// rules are tested without any network.
import type { CatalogueBadge } from './catalogue';
import type { TrailheadAward, TrailheadProfile } from './schema';

export interface TrickOrTrailheadResult {
  profile: TrailheadProfile;
  /** Catalogue badges the profile has, in catalogue order (newest first). */
  earned: CatalogueBadge[];
  missing: CatalogueBadge[];
  /** Trick or Trailhead-looking awards matching no catalogue entry (FR-8). */
  unmatched: TrailheadAward[];
  total: number;
  /** Paging hit its cap, so `missing` may include badges the profile has. */
  incomplete: boolean;
}

// Real titles differ from what you'd type: 2020's has a leading space, and
// 2026's uses a curly apostrophe.
export function normaliseTitle(title: string): string {
  return title
    .replace(/[‘’ʼ]/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

// The FR-8 heuristic: every one of the 12 known editions' titles contains this.
export function isTrickOrTrailheadTitle(title: string): boolean {
  return normaliseTitle(title).includes('trick or trailhead');
}

/** The catalogue entry an award counts towards: by ID first, then by title. */
export function findCatalogueBadge(
  award: TrailheadAward,
  catalogue: CatalogueBadge[]
): CatalogueBadge | undefined {
  const title = normaliseTitle(award.title);
  return (
    catalogue.find((badge) => badge.matchIds.includes(award.id)) ??
    catalogue.find((badge) => badge.matchTitles.some((matchTitle) => normaliseTitle(matchTitle) === title))
  );
}

/** Whether every badge in `catalogue` is matched by one of `awards`. */
export function hasEveryBadge(catalogue: CatalogueBadge[], awards: TrailheadAward[]): boolean {
  const found = new Set(awards.map((award) => findCatalogueBadge(award, catalogue)));
  return catalogue.every((badge) => found.has(badge));
}

export function matchBadges(
  catalogue: CatalogueBadge[],
  awards: TrailheadAward[],
  profile: TrailheadProfile,
  incomplete = false
): TrickOrTrailheadResult {
  const found = new Set<CatalogueBadge>();
  const unmatched = new Map<string, TrailheadAward>();

  for (const award of awards) {
    const badge = findCatalogueBadge(award, catalogue);
    if (badge) {
      found.add(badge);
    } else if (isTrickOrTrailheadTitle(award.title)) {
      unmatched.set(award.id, award);
    }
  }

  return {
    profile,
    earned: catalogue.filter((badge) => found.has(badge)),
    missing: catalogue.filter((badge) => !found.has(badge)),
    unmatched: [...unmatched.values()],
    total: catalogue.length,
    incomplete,
  };
}
