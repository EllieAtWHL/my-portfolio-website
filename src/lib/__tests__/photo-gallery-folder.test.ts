import { buildGalleryFolderKey } from '../photo-gallery-folder';

describe('buildGalleryFolderKey', () => {
  it('builds the SEASON/YYYYMMDD Competition Team1 vs Team2 key', () => {
    const key = buildGalleryFolderKey({
      date: '2026-02-08',
      home_team: { short_name: 'Spurs' },
      away_team: { short_name: 'Chelsea' },
      competitions: { name: 'Womens Super League' },
    });

    expect(key).toBe('2025-26/20260208 WSL Spurs vs Chelsea');
  });

  it('maps every supported competition to its abbreviation', () => {
    const cases: [string, string][] = [
      ['Womens Super League', 'WSL'],
      ["Women's FA Cup", 'WFA Cup'],
      ["Women's League Cup", 'WLeague Cup'],
      ['Friendly', 'Friendly'],
    ];

    for (const [competitionName, abbreviation] of cases) {
      const key = buildGalleryFolderKey({
        date: '2026-01-01',
        home_team: { short_name: 'Spurs' },
        away_team: { short_name: 'Arsenal' },
        competitions: { name: competitionName },
      });
      expect(key).toContain(abbreviation);
    }
  });

  it('starts a new season in August and keeps the prior one in July', () => {
    const julyKey = buildGalleryFolderKey({
      date: '2026-07-31',
      home_team: { short_name: 'Spurs' },
      away_team: { short_name: 'Arsenal' },
      competitions: { name: 'Friendly' },
    });
    const augustKey = buildGalleryFolderKey({
      date: '2026-08-01',
      home_team: { short_name: 'Spurs' },
      away_team: { short_name: 'Arsenal' },
      competitions: { name: 'Friendly' },
    });

    expect(julyKey.startsWith('2025-26/')).toBe(true);
    expect(augustKey.startsWith('2026-27/')).toBe(true);
  });

  it('throws for an unrecognised competition', () => {
    expect(() =>
      buildGalleryFolderKey({
        date: '2026-01-01',
        home_team: { short_name: 'Spurs' },
        away_team: { short_name: 'Arsenal' },
        competitions: { name: 'Made Up League' },
      })
    ).toThrow(/Unknown competition/);
  });
});
