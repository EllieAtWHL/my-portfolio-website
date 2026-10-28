import { getCurrentStadiumName, groupStadiumNamesByStadium, StadiumName } from '../stadiums';

describe('getCurrentStadiumName', () => {
  it('returns null when stadium names array is empty', () => {
    const result = getCurrentStadiumName([]);
    expect(result).toBeNull();
  })

  it('returns null when stadium names is null', () => {
    const result = getCurrentStadiumName(null as unknown as StadiumName[]);
    expect(result).toBeNull();
  })

  it('returns current valid name for given date', () => {
    const stadiumNames: StadiumName[] = [
      {
        id: '1',
        stadium_id: 'stadium-1',
        name: 'Current Name',
        valid_from: '2020-01-01',
        valid_to: '2030-01-01'
      }
    ]

    const result = getCurrentStadiumName(stadiumNames, new Date('2025-01-01'))
    expect(result).toBe('Current Name')
  })

  it('returns most recent name when no currently valid name exists', () => {
    const stadiumNames: StadiumName[] = [
      {
        id: '2',
        stadium_id: 'stadium-1',
        name: 'Recent Name',
        valid_from: '2010-01-01',
        valid_to: '2020-01-01'
      },
      {
        id: '1',
        stadium_id: 'stadium-1',
        name: 'Old Name',
        valid_from: '2000-01-01',
        valid_to: '2010-01-01'
      }
    ]

    const result = getCurrentStadiumName(stadiumNames, new Date('2025-01-01'))
    expect(result).toBe('Recent Name')
  })

  it('handles names with no valid_from date', () => {
    const stadiumNames: StadiumName[] = [
      {
        id: '1',
        stadium_id: 'stadium-1',
        name: 'Name Without From',
        valid_from: null,
        valid_to: '2030-01-01'
      }
    ]

    const result = getCurrentStadiumName(stadiumNames, new Date('2025-01-01'))
    expect(result).toBe('Name Without From')
  })

  it('handles names with no valid_to date', () => {
    const stadiumNames: StadiumName[] = [
      {
        id: '1',
        stadium_id: 'stadium-1',
        name: 'Name Without To',
        valid_from: '2020-01-01',
        valid_to: null
      }
    ]

    const result = getCurrentStadiumName(stadiumNames, new Date('2025-01-01'))
    expect(result).toBe('Name Without To')
  })

  it('handles names with no date boundaries', () => {
    const stadiumNames: StadiumName[] = [
      {
        id: '1',
        stadium_id: 'stadium-1',
        name: 'Eternal Name',
        valid_from: null,
        valid_to: null
      }
    ]

    const result = getCurrentStadiumName(stadiumNames, new Date('2025-01-01'))
    expect(result).toBe('Eternal Name')
  })

  it('treats valid_from as an inclusive lower bound (target date exactly on valid_from is valid)', () => {
    const stadiumNames: StadiumName[] = [
      {
        id: '1',
        stadium_id: 'stadium-1',
        name: 'Starts Today',
        valid_from: '2025-01-01',
        valid_to: '2030-01-01'
      }
    ]

    const result = getCurrentStadiumName(stadiumNames, new Date('2025-01-01'))
    expect(result).toBe('Starts Today')
  })

  it('treats valid_to as an inclusive upper bound (target date exactly on valid_to is still valid)', () => {
    const stadiumNames: StadiumName[] = [
      {
        id: '1',
        stadium_id: 'stadium-1',
        name: 'Ends Today',
        valid_from: '2020-01-01',
        valid_to: '2025-01-01'
      }
    ]

    const result = getCurrentStadiumName(stadiumNames, new Date('2025-01-01'))
    expect(result).toBe('Ends Today')
  })

  it('uses current date when no date provided', () => {
    const stadiumNames: StadiumName[] = [
      {
        id: '1',
        stadium_id: 'stadium-1',
        name: 'Current Name',
        valid_from: '2020-01-01',
        valid_to: '2030-01-01'
      }
    ]

    const result = getCurrentStadiumName(stadiumNames)
    expect(result).toBe('Current Name')
  })

  it('falls back to the most recent name when the ONLY name is not yet valid', () => {
    // With a single-item array, the fallback (stadiumNames[0]) is
    // indistinguishable from "rejection was a no-op" - see the two-item
    // tests below for cases that actually prove rejection happened.
    const stadiumNames: StadiumName[] = [
      {
        id: '1',
        stadium_id: 'stadium-1',
        name: 'Future Name',
        valid_from: '2030-01-01',
        valid_to: '2040-01-01'
      }
    ]

    const result = getCurrentStadiumName(stadiumNames, new Date('2025-01-01'))
    expect(result).toBe('Future Name') // Falls back to most recent
  })

  it('falls back to the most recent name when the ONLY name is no longer valid', () => {
    const stadiumNames: StadiumName[] = [
      {
        id: '1',
        stadium_id: 'stadium-1',
        name: 'Past Name',
        valid_from: '2000-01-01',
        valid_to: '2010-01-01'
      }
    ]

    const result = getCurrentStadiumName(stadiumNames, new Date('2025-01-01'))
    expect(result).toBe('Past Name') // Falls back to most recent
  })

  it('actually rejects a not-yet-valid name in favour of a currently-valid one later in the array', () => {
    // Two-item version of the "not yet valid" case: proves rejection is a
    // real check, not a no-op that happens to match the array-order fallback.
    const stadiumNames: StadiumName[] = [
      {
        id: '1',
        stadium_id: 'stadium-1',
        name: 'Announced Future Name',
        valid_from: '2030-01-01',
        valid_to: '2040-01-01'
      },
      {
        id: '2',
        stadium_id: 'stadium-1',
        name: 'Currently Valid Name',
        valid_from: '2015-01-01',
        valid_to: '2030-01-01'
      }
    ]

    const result = getCurrentStadiumName(stadiumNames, new Date('2025-01-01'))
    expect(result).toBe('Currently Valid Name')
  })

  it('actually rejects an expired name in favour of a currently-valid one later in the array', () => {
    const stadiumNames: StadiumName[] = [
      {
        id: '1',
        stadium_id: 'stadium-1',
        name: 'Expired Name',
        valid_from: '2000-01-01',
        valid_to: '2010-01-01'
      },
      {
        id: '2',
        stadium_id: 'stadium-1',
        name: 'Currently Valid Name',
        valid_from: '2010-01-01',
        valid_to: '2030-01-01'
      }
    ]

    const result = getCurrentStadiumName(stadiumNames, new Date('2025-01-01'))
    expect(result).toBe('Currently Valid Name')
  })
})

describe('groupStadiumNamesByStadium', () => {
  const name = (id: string, stadium_id: string, valid_from: string | null): StadiumName =>
    ({ id, stadium_id, name: `Name ${id}`, valid_from, valid_to: null });

  it('returns an empty object for no names', () => {
    expect(groupStadiumNamesByStadium([])).toEqual({});
  })

  it('groups names by stadium_id, keeping their order within each stadium', () => {
    const newer = name('1', 'stadium-1', '2020-01-01');
    const other = name('2', 'stadium-2', '2015-01-01');
    const older = name('3', 'stadium-1', '2000-01-01');

    expect(groupStadiumNamesByStadium([newer, other, older])).toEqual({
      'stadium-1': [newer, older],
      'stadium-2': [other],
    });
  })

  it('gives the same current name as a per-stadium lookup would', () => {
    // getCurrentStadiumName falls back to the first name when none is valid,
    // so the grouped lists have to stay most-recent-first.
    const names = [
      { ...name('1', 'stadium-1', '2020-01-01'), valid_to: '2021-01-01' },
      { ...name('2', 'stadium-1', '2000-01-01'), valid_to: '2001-01-01' },
    ];

    const grouped = groupStadiumNamesByStadium(names);

    expect(getCurrentStadiumName(grouped['stadium-1'], new Date('2025-01-01'))).toBe('Name 1');
  })
})
