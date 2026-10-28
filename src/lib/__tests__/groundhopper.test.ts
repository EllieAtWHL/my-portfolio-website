import {
  activeStreak,
  dailyStadiums,
  dayNumber,
  distanceKm,
  formatDistance,
  scoreForDistance,
  shareText,
  toGroundhopperStadium,
  ukDateKey,
  updateStreak,
  type GroundhopperStadium,
  type RoundResult,
} from '../groundhopper';
import type { Stadium } from '../data/stadiums';

const baseStadium: Stadium = {
  id: 'id-1',
  name: 'Madejski Stadium',
  slug: 'madejski-stadium',
  city: 'Reading',
  country: 'England',
  capacity: 24161,
  opened_date: '1998-08-22',
  address_line_1: null,
  postcode: null,
  latitude: 51.422222,
  longitude: -0.982778,
  home_team_id: null,
  spurs_women: true,
  wikidata_qid: null,
};

function playable(n: number): GroundhopperStadium[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `stadium-${String(i).padStart(2, '0')}`,
    slug: `s-${i}`,
    name: `Stadium ${i}`,
    currentName: null,
    city: null,
    country: null,
    capacity: null,
    openedYear: null,
    latitude: 51 + i / 10,
    longitude: -1 + i / 10,
    spursWomen: i % 4 === 0,
  }));
}

describe('toGroundhopperStadium', () => {
  it('maps a stadium with coordinates, keeping the current name only when it differs', () => {
    expect(toGroundhopperStadium(baseStadium, 'Select Car Leasing Stadium')).toEqual({
      id: 'id-1',
      slug: 'madejski-stadium',
      name: 'Madejski Stadium',
      currentName: 'Select Car Leasing Stadium',
      city: 'Reading',
      country: 'England',
      capacity: 24161,
      openedYear: 1998,
      latitude: 51.422222,
      longitude: -0.982778,
      spursWomen: true,
    });
    expect(toGroundhopperStadium(baseStadium, 'Madejski Stadium')?.currentName).toBeNull();
    expect(toGroundhopperStadium(baseStadium, null)?.currentName).toBeNull();
  });

  it('skips stadiums without usable coordinates', () => {
    expect(toGroundhopperStadium({ ...baseStadium, latitude: null }, null)).toBeNull();
    expect(toGroundhopperStadium({ ...baseStadium, longitude: null }, null)).toBeNull();
    expect(toGroundhopperStadium({ ...baseStadium, longitude: 200 }, null)).toBeNull();
    expect(toGroundhopperStadium({ ...baseStadium, latitude: Number.NaN }, null)).toBeNull();
    expect(toGroundhopperStadium({ ...baseStadium, latitude: 0, longitude: 0 }, null)).toBeNull();
  });

  it('treats a missing opened date as unknown', () => {
    expect(toGroundhopperStadium({ ...baseStadium, opened_date: null }, null)?.openedYear).toBeNull();
  });
});

describe('distanceKm', () => {
  it('is zero for the same point', () => {
    expect(distanceKm({ latitude: 51.5, longitude: -0.1 }, { latitude: 51.5, longitude: -0.1 })).toBe(0);
  });

  it('matches the known Wembley to Tottenham Hotspur Stadium distance (~15 km)', () => {
    const km = distanceKm({ latitude: 51.5556, longitude: -0.2794 }, { latitude: 51.604028, longitude: -0.066675 });
    expect(km).toBeGreaterThan(15);
    expect(km).toBeLessThan(16);
  });
});

describe('scoreForDistance', () => {
  it('gives full marks within a kilometre', () => {
    expect(scoreForDistance(0)).toBe(100);
    expect(scoreForDistance(1)).toBe(100);
  });

  it('decays with distance: about half at 35 km, nothing much past 250 km', () => {
    expect(scoreForDistance(35)).toBe(50);
    expect(scoreForDistance(250)).toBe(1);
    expect(scoreForDistance(1000)).toBe(0);
  });

  it('caps the score at 50 when the hint was used', () => {
    expect(scoreForDistance(0, true)).toBe(50);
    expect(scoreForDistance(100, true)).toBe(scoreForDistance(100));
  });
});

describe('ukDateKey', () => {
  it('uses the UK calendar date, not UTC', () => {
    // 23:30 UTC on 1 July is 00:30 BST on 2 July.
    expect(ukDateKey(new Date('2026-07-01T23:30:00Z'))).toBe('2026-07-02');
    // In winter the UK is on UTC.
    expect(ukDateKey(new Date('2026-12-01T23:30:00Z'))).toBe('2026-12-01');
  });
});

describe('dailyStadiums', () => {
  const pool = playable(12);

  it('is stable for a given day regardless of input order', () => {
    const a = dailyStadiums(pool, '2026-10-28');
    const b = dailyStadiums([...pool].reverse(), '2026-10-28');
    expect(a.map(s => s.id)).toEqual(b.map(s => s.id));
    expect(a).toHaveLength(5);
    expect(new Set(a.map(s => s.id)).size).toBe(5);
  });

  it('changes from one day to the next', () => {
    const today = dailyStadiums(pool, '2026-10-28').map(s => s.id);
    const tomorrow = dailyStadiums(pool, '2026-10-29').map(s => s.id);
    expect(tomorrow).not.toEqual(today);
  });

  it('always includes at least one Spurs Women ground, in varying rounds', () => {
    const days = Array.from({ length: 60 }, (_, i) => `2026-11-${String((i % 28) + 1).padStart(2, '0')}-${i}`);
    const positions = new Set<number>();
    for (const day of days) {
      const set = dailyStadiums(pool, day);
      expect(set).toHaveLength(5);
      expect(set.some(s => s.spursWomen)).toBe(true);
      positions.add(set.findIndex(s => s.spursWomen));
    }
    // Not always round 1.
    expect(positions.size).toBeGreaterThan(1);
  });

  it('still includes the one Spurs Women ground when it is the only one', () => {
    const onlyOne = playable(12).map((s, i) => ({ ...s, spursWomen: i === 7 }));
    for (const day of ['2026-10-28', '2026-10-29', '2026-10-30']) {
      expect(dailyStadiums(onlyOne, day).map(s => s.id)).toContain('stadium-07');
    }
  });

  it('falls back to the plain shuffle when there are no Spurs Women grounds', () => {
    const none = playable(12).map(s => ({ ...s, spursWomen: false }));
    const set = dailyStadiums(none, '2026-10-28');
    expect(set).toHaveLength(5);
    expect(new Set(set.map(s => s.id)).size).toBe(5);
  });

  it('uses every stadium available when there are fewer than five', () => {
    expect(dailyStadiums(playable(3), '2026-10-28')).toHaveLength(3);
    expect(dailyStadiums([], '2026-10-28')).toEqual([]);
    expect(dailyStadiums(pool, '2026-10-28', 0)).toEqual([]);
  });
});

describe('updateStreak / activeStreak', () => {
  const empty = { lastPlayed: null, current: 0, best: 0 };

  it('starts at one, extends on consecutive days and resets after a gap', () => {
    const day1 = updateStreak(empty, '2026-10-28');
    expect(day1).toEqual({ lastPlayed: '2026-10-28', current: 1, best: 1 });

    const day2 = updateStreak(day1, '2026-10-29');
    expect(day2).toEqual({ lastPlayed: '2026-10-29', current: 2, best: 2 });

    const afterGap = updateStreak(day2, '2026-11-02');
    expect(afterGap).toEqual({ lastPlayed: '2026-11-02', current: 1, best: 2 });
  });

  it('counts across a month boundary', () => {
    expect(updateStreak({ lastPlayed: '2026-10-31', current: 4, best: 4 }, '2026-11-01').current).toBe(5);
  });

  it('does not double-count the same day', () => {
    const day1 = updateStreak(empty, '2026-10-28');
    expect(updateStreak(day1, '2026-10-28')).toBe(day1);
  });

  it('shows a streak as lapsed once a day has been missed', () => {
    const streak = { lastPlayed: '2026-10-28', current: 3, best: 3 };
    expect(activeStreak(streak, '2026-10-28')).toBe(3);
    expect(activeStreak(streak, '2026-10-29')).toBe(3);
    expect(activeStreak(streak, '2026-10-30')).toBe(0);
  });
});

describe('formatDistance', () => {
  it('uses metres under a kilometre, one decimal under ten', () => {
    expect(formatDistance(0.42)).toBe('420 m');
    expect(formatDistance(3.456)).toBe('3.5 km');
    expect(formatDistance(1234.4)).toBe('1,234 km');
  });
});

describe('dayNumber / shareText', () => {
  it('numbers days from launch', () => {
    expect(dayNumber('2026-10-28')).toBe(1);
    expect(dayNumber('2026-11-28')).toBe(32);
  });

  it('builds a spoiler-free share text', () => {
    const result = (score: number, hintUsed = false): RoundResult => ({
      stadiumId: 'x',
      guess: { latitude: 0, longitude: 0 },
      distanceKm: 1,
      hintUsed,
      score,
    });
    expect(shareText('2026-10-29', [result(80), result(45, true), result(12)], 'https://example.com/g')).toBe(
      'Groundhopper #2 - 137/300\n80 · 45* · 12\n* used a hint\nhttps://example.com/g'
    );
    expect(shareText('2026-10-28', [result(100)], 'u')).toBe('Groundhopper #1 - 100/100\n100\nu');
  });
});
