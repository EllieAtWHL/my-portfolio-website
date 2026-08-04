import { getCurrentStadiumName, StadiumName, invalidateStadiumCache, invalidateAllStadiumCaches } from '../stadiums';

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

describe('Stadium Cache Invalidation', () => {
  it('invalidateStadiumCache should complete without error', async () => {
    await expect(invalidateStadiumCache('stadium-123', 'test-slug')).resolves.not.toThrow()
  })

  it('invalidateStadiumCache should handle stadiumId only', async () => {
    await expect(invalidateStadiumCache('stadium-123')).resolves.not.toThrow()
  })

  it('invalidateStadiumCache should handle stadiumSlug only', async () => {
    await expect(invalidateStadiumCache(undefined, 'test-slug')).resolves.not.toThrow()
  })

  it('invalidateStadiumCache should handle no parameters', async () => {
    await expect(invalidateStadiumCache()).resolves.not.toThrow()
  })

  it('invalidateAllStadiumCaches should complete without error', async () => {
    await expect(invalidateAllStadiumCaches()).resolves.not.toThrow()
  })
})
