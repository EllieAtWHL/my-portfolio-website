import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { mockSupabaseFrom } from '@/test-utils/supabase-query-mock';

// NOTE: getCurrentStadiumName's date-range branching and invalidateStadiumCache/
// invalidateAllStadiumCaches are already covered thoroughly in
// stadiums-import.test.ts - this file focuses on the Supabase-backed data
// fetchers (getStadiumBySlug, getAllStadiums, getStadiumsWithMatchCounts,
// getStadiumNames, getMatchesAtStadium) to avoid duplicating that coverage.

describe('stadiums data layer', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  describe('getStadiumBySlug', () => {
    it('returns the stadium (with joined home_team) on success', async () => {
      const stadium = {
        id: 's1',
        name: 'Tottenham Hotspur Stadium',
        slug: 'tottenham-hotspur-stadium',
        home_team: { id: 1, name: 'Tottenham', short_name: 'Spurs', primary_color: null, secondary_color: null, is_tottenham: true },
      };
      const mockFrom = mockSupabaseFrom({ stadia: { data: stadium, error: null } });
      jest.doMock('@/utils/supabase', () => ({ supabase: { from: mockFrom } }));

      const { getStadiumBySlug } = await import('@/lib/data/stadiums');
      const result = await getStadiumBySlug('tottenham-hotspur-stadium');

      expect(result).toEqual(stadium);
      expect(mockFrom).toHaveBeenCalledWith('stadia');
      const chain = mockFrom.mock.results[0].value;
      expect(chain.eq).toHaveBeenCalledWith('slug', 'tottenham-hotspur-stadium');
      expect(chain.single).toHaveBeenCalled();
    });

    it('returns null (not throw) when the query errors', async () => {
      const mockFrom = mockSupabaseFrom({ stadia: { data: null, error: { message: 'not found' } } });
      jest.doMock('@/utils/supabase', () => ({ supabase: { from: mockFrom } }));

      const { getStadiumBySlug } = await import('@/lib/data/stadiums');
      const result = await getStadiumBySlug('missing-slug');

      expect(result).toBeNull();
    });
  });

  describe('getStadiumNames', () => {
    it('returns the stadium name history on success', async () => {
      const names = [
        { id: '1', stadium_id: 's1', name: 'New Name', valid_from: '2020-01-01', valid_to: null },
        { id: '2', stadium_id: 's1', name: 'Old Name', valid_from: '2000-01-01', valid_to: '2020-01-01' },
      ];
      const mockFrom = mockSupabaseFrom({ stadium_names: { data: names, error: null } });
      jest.doMock('@/utils/supabase', () => ({ supabase: { from: mockFrom } }));

      const { getStadiumNames } = await import('@/lib/data/stadiums');
      const result = await getStadiumNames('s1');

      expect(result).toEqual(names);
      const chain = mockFrom.mock.results[0].value;
      expect(chain.eq).toHaveBeenCalledWith('stadium_id', 's1');
      expect(chain.order).toHaveBeenCalledWith('valid_from', { ascending: false });
    });

    it('throws (unlike the other fetchers, which return null/[]) when the query errors', async () => {
      const mockFrom = mockSupabaseFrom({ stadium_names: { data: null, error: { message: 'db down' } } });
      jest.doMock('@/utils/supabase', () => ({ supabase: { from: mockFrom } }));

      const { getStadiumNames } = await import('@/lib/data/stadiums');
      await expect(getStadiumNames('s1')).rejects.toBeTruthy();
    });
  });

  describe('getMatchesAtStadium', () => {
    it('returns matches played at the stadium on success', async () => {
      const matches = [{ id: 'm1', date: '2024-01-01' }];
      const mockFrom = mockSupabaseFrom({ matches_with_stadium: { data: matches, error: null } });
      jest.doMock('@/utils/supabase', () => ({ supabase: { from: mockFrom } }));

      const { getMatchesAtStadium } = await import('@/lib/data/stadiums');
      const result = await getMatchesAtStadium('tottenham-hotspur-stadium');

      expect(result).toEqual(matches);
      expect(mockFrom).toHaveBeenCalledWith('matches_with_stadium');
      const chain = mockFrom.mock.results[0].value;
      expect(chain.eq).toHaveBeenCalledWith('stadium_slug', 'tottenham-hotspur-stadium');
      expect(chain.order).toHaveBeenCalledWith('date', { ascending: false });
    });

    it('returns [] when data is null but there is no error', async () => {
      const mockFrom = mockSupabaseFrom({ matches_with_stadium: { data: null, error: null } });
      jest.doMock('@/utils/supabase', () => ({ supabase: { from: mockFrom } }));

      const { getMatchesAtStadium } = await import('@/lib/data/stadiums');
      const result = await getMatchesAtStadium('some-slug');

      expect(result).toEqual([]);
    });

    it('returns [] (not throw) when the query errors', async () => {
      const mockFrom = mockSupabaseFrom({ matches_with_stadium: { data: null, error: { message: 'db down' } } });
      jest.doMock('@/utils/supabase', () => ({ supabase: { from: mockFrom } }));

      const { getMatchesAtStadium } = await import('@/lib/data/stadiums');
      const result = await getMatchesAtStadium('some-slug');

      expect(result).toEqual([]);
    });
  });

  describe('getAllStadiums / getStadiumsWithMatchCounts (thin wrappers)', () => {
    it('getAllStadiums delegates to fetchAllFromDB with the stadia table ordered by name', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const fetchAllFromDB = jest.fn(async (..._args: unknown[]) => [{ id: 's1', name: 'Tottenham Hotspur Stadium' }]);
      jest.doMock('@/lib/data/generic-fetchers', () => ({
        fetchAllFromDB,
        fetchWithSingleMatchCountFromDB: jest.fn(),
      }));

      const { getAllStadiums } = await import('@/lib/data/stadiums');
      const result = await getAllStadiums();

      expect(fetchAllFromDB).toHaveBeenCalledWith('stadia', 'name');
      expect(result).toEqual([{ id: 's1', name: 'Tottenham Hotspur Stadium' }]);
    });

    it('getStadiumsWithMatchCounts delegates to fetchWithSingleMatchCountFromDB with the stadium_id column', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const fetchWithSingleMatchCountFromDB = jest.fn(async (..._args: unknown[]) => [{ id: 's1', name: 'Tottenham Hotspur Stadium', match_count: 12 }]);
      jest.doMock('@/lib/data/generic-fetchers', () => ({
        fetchAllFromDB: jest.fn(),
        fetchWithSingleMatchCountFromDB,
      }));

      const { getStadiumsWithMatchCounts } = await import('@/lib/data/stadiums');
      const result = await getStadiumsWithMatchCounts();

      expect(fetchWithSingleMatchCountFromDB).toHaveBeenCalledWith('stadia', 'matches', 'stadium_id', 'name');
      expect(result).toEqual([{ id: 's1', name: 'Tottenham Hotspur Stadium', match_count: 12 }]);
    });
  });
});
