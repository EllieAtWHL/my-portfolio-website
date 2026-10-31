import { CATALOGUE, type CatalogueBadge } from '../catalogue';
import {
  findCatalogueBadge,
  hasEveryBadge,
  isTrickOrTrailheadTitle,
  matchBadges,
  normaliseTitle,
} from '../match';
import type { TrailheadAward } from '../schema';

const profile = { name: 'Test Trailblazer', avatarUrl: null };

function award(overrides: Partial<TrailheadAward>): TrailheadAward {
  return { id: 'some-id', title: 'Some badge', type: 'EVENT', icon: null, webUrl: null, ...overrides };
}

function badge(year: number, overrides: Partial<CatalogueBadge> = {}): CatalogueBadge {
  return {
    year,
    title: `Trick or Trailhead ${year}`,
    awardType: 'EVENT',
    matchIds: [`id-${year}`],
    matchTitles: [`Trick or Trailhead ${year}`],
    imageUrl: `https://example.com/${year}.png`,
    sourceUrl: null,
    ...overrides,
  };
}

const catalogue = [badge(2026, { awardType: 'MODULE' }), badge(2025), badge(2024)];

describe('normaliseTitle', () => {
  it('trims, collapses whitespace, lowercases and straightens apostrophes', () => {
    expect(normaliseTitle(' Trick or Trailhead VI')).toBe('trick or trailhead vi');
    expect(normaliseTitle('Tell Us S’more  Campfire Stories')).toBe("tell us s'more campfire stories");
    expect(normaliseTitle('S‘more Sʼmore')).toBe("s'more s'more");
  });
});

describe('isTrickOrTrailheadTitle', () => {
  it('matches every catalogue title, and nothing unrelated', () => {
    for (const entry of CATALOGUE) {
      expect(isTrickOrTrailheadTitle(entry.title)).toBe(true);
    }
    expect(isTrickOrTrailheadTitle(' TRICK OR TRAILHEAD IX')).toBe(true);
    expect(isTrickOrTrailheadTitle('Dreamforce 2025')).toBe(false);
  });
});

describe('findCatalogueBadge', () => {
  it('matches by award ID', () => {
    expect(findCatalogueBadge(award({ id: 'id-2025', title: 'Renamed' }), catalogue)).toBe(catalogue[1]);
  });

  it('falls back to the normalised title when the ID is unknown', () => {
    expect(findCatalogueBadge(award({ id: 'new-id', title: '  trick OR trailhead 2024 ' }), catalogue)).toBe(catalogue[2]);
  });

  it('prefers an ID match over a title match on another entry', () => {
    expect(findCatalogueBadge(award({ id: 'id-2024', title: 'Trick or Trailhead 2025' }), catalogue)).toBe(catalogue[2]);
  });

  it('matches the real API titles that differ from a plain string compare', () => {
    // 2020's leading space and 2026's curly apostrophe, with the IDs changed
    // so only the title fallback can match them.
    const realCatalogue = CATALOGUE.map((entry) => ({ ...entry, matchIds: [] }));
    expect(findCatalogueBadge(award({ title: ' Trick or Trailhead VI' }), realCatalogue)?.year).toBe(2020);
    expect(
      findCatalogueBadge(award({ title: "Trick or Trailhead: Tell Us S'more Campfire Stories" }), realCatalogue)?.year
    ).toBe(2026);
  });

  it('returns undefined for anything else', () => {
    expect(findCatalogueBadge(award({}), catalogue)).toBeUndefined();
  });
});

describe('hasEveryBadge', () => {
  it('is true only once every badge is matched', () => {
    const events = catalogue.slice(1);
    expect(hasEveryBadge(events, [award({ id: 'id-2025' })])).toBe(false);
    expect(hasEveryBadge(events, [award({ id: 'id-2025' }), award({ title: 'Trick or Trailhead 2024' })])).toBe(true);
  });

  it('does not count an award twice towards one badge', () => {
    expect(hasEveryBadge(catalogue.slice(1), [award({ id: 'id-2025' }), award({ id: 'id-2025' })])).toBe(false);
  });

  it('is vacuously true for an empty catalogue', () => {
    expect(hasEveryBadge([], [])).toBe(true);
  });
});

describe('matchBadges', () => {
  it('splits the catalogue into earned and missing, in catalogue order', () => {
    const result = matchBadges(catalogue, [award({ id: 'id-2024' }), award({ id: 'id-2026', type: 'MODULE' })], profile);

    expect(result.earned.map((b) => b.year)).toEqual([2026, 2024]);
    expect(result.missing.map((b) => b.year)).toEqual([2025]);
    expect(result.total).toBe(3);
    expect(result.profile).toBe(profile);
    expect(result.incomplete).toBe(false);
  });

  it('never counts a badge twice when matched by both ID and title, or earned twice', () => {
    const result = matchBadges(
      catalogue,
      [award({ id: 'id-2025' }), award({ id: 'other', title: 'Trick or Trailhead 2025' }), award({ id: 'id-2025' })],
      profile
    );

    expect(result.earned.map((b) => b.year)).toEqual([2025]);
    expect(result.earned.length + result.missing.length).toBe(result.total);
    expect(result.unmatched).toEqual([]);
  });

  it('lists unknown Trick or Trailhead badges as unmatched, once each (FR-8)', () => {
    const newEdition = award({ id: 'id-2027', title: 'Trick or Trailhead: Something New', type: 'MODULE' });
    const result = matchBadges(catalogue, [newEdition, newEdition, award({ id: 'df', title: 'Dreamforce' })], profile);

    expect(result.unmatched).toEqual([newEdition]);
    expect(result.earned).toEqual([]);
  });

  it('passes the incomplete flag through', () => {
    expect(matchBadges(catalogue, [], profile, true).incomplete).toBe(true);
  });
});
