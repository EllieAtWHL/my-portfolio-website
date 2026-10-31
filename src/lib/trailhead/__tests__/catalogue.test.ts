// Validates src/data/trick-or-trailhead-badges.json, so adding next year's
// badge needs no code changes (FR-7) and a typo fails CI instead of quietly
// mis-scoring every lookup.
import badges from '@/data/trick-or-trailhead-badges.json';
import { CATALOGUE, catalogueVersion } from '../catalogue';
import { AWARD_TYPES } from '../client';

const entries = badges as unknown as Array<Record<string, unknown>>;
const FIELDS = ['year', 'title', 'awardType', 'matchIds', 'matchTitles', 'imageUrl', 'sourceUrl'];

describe('Trick or Trailhead catalogue', () => {
  it('has every edition since 2015', () => {
    expect(entries.length).toBeGreaterThanOrEqual(12);
    expect(entries.at(-1)?.year).toBe(2015);
  });

  it.each(entries.map((entry) => [entry.year, entry]))('%s has exactly the expected fields', (_year, entry) => {
    expect(Object.keys(entry).sort()).toEqual([...FIELDS].sort());
  });

  it.each(entries.map((entry) => [entry.year, entry]))('%s has valid values', (_year, entry) => {
    expect(Number.isInteger(entry.year)).toBe(true);
    expect(typeof entry.title).toBe('string');
    expect((entry.title as string).trim()).toBe(entry.title);
    expect(AWARD_TYPES).toContain(entry.awardType);

    expect(Array.isArray(entry.matchIds)).toBe(true);
    expect((entry.matchIds as unknown[]).length).toBeGreaterThan(0);
    for (const id of entry.matchIds as unknown[]) {
      expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    }

    expect(Array.isArray(entry.matchTitles)).toBe(true);
    expect((entry.matchTitles as unknown[]).length).toBeGreaterThan(0);
    for (const title of entry.matchTitles as unknown[]) {
      expect(typeof title).toBe('string');
      expect((title as string).toLowerCase()).toContain('trick or trailhead');
    }

    expect(entry.imageUrl).toMatch(/^https:\/\/[^\s]+\.(png|jpe?g|svg|webp)$/i);
    if (entry.sourceUrl !== null) {
      expect(entry.sourceUrl).toMatch(/^https:\/\/\S+$/);
    }
  });

  it('is sorted newest first with one entry per year', () => {
    const years = entries.map((entry) => entry.year as number);
    expect(years).toEqual([...years].sort((a, b) => b - a));
    expect(new Set(years).size).toBe(years.length);
  });

  it('never uses an award ID twice', () => {
    const ids = entries.flatMap((entry) => entry.matchIds as string[]);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('is what CATALOGUE exports', () => {
    expect(CATALOGUE).toBe(badges);
  });

  it('changes version when the catalogue changes, so cached results are recomputed', () => {
    expect(catalogueVersion()).toBe(catalogueVersion([...CATALOGUE]));
    const edited = CATALOGUE.map((badge, i) => (i === 0 ? { ...badge, matchIds: ['new-id'] } : badge));
    expect(catalogueVersion(edited)).not.toBe(catalogueVersion());
    expect(catalogueVersion(CATALOGUE.slice(1))).not.toBe(catalogueVersion());
  });
});
