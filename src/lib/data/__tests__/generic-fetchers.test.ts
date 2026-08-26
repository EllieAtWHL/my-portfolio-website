import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { mockSupabaseFrom } from '@/test-utils/supabase-query-mock';

// mockFrom is reassigned per-test via jest.mock's factory closure trick:
// we keep a mutable reference so each test can configure its own responses.
let currentMockFrom: ReturnType<typeof mockSupabaseFrom>;

jest.mock('@/utils/supabase', () => ({
  supabase: {
    from: (...args: [string]) => currentMockFrom(...args),
  },
}));

import {
  fetchAllFromDB,
  fetchByIdFromDB,
  fetchWithMatchCountFromDB,
  fetchWithSingleMatchCountFromDB,
} from '../generic-fetchers';

describe('generic-fetchers', () => {
  let errorSpy: jest.SpiedFunction<typeof console.error>;

  beforeEach(() => {
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    errorSpy.mockRestore();
  });

  describe('fetchAllFromDB', () => {
    it('returns the fetched rows on success', async () => {
      currentMockFrom = mockSupabaseFrom({
        teams: { data: [{ id: 1, name: 'A' }, { id: 2, name: 'B' }], error: null },
      });

      const result = await fetchAllFromDB('teams');
      expect(result).toEqual([{ id: 1, name: 'A' }, { id: 2, name: 'B' }]);
    });

    it('defaults to ordering by "name" ascending when no order args given', async () => {
      currentMockFrom = mockSupabaseFrom({ teams: { data: [], error: null } });

      await fetchAllFromDB('teams');
      const chain = currentMockFrom.mock.results[0].value;

      expect(chain.order).toHaveBeenCalledWith('name', { ascending: true });
    });

    it('passes through a custom order column and direction', async () => {
      currentMockFrom = mockSupabaseFrom({ stadia: { data: [], error: null } });

      await fetchAllFromDB('stadia', 'capacity', false);
      const chain = currentMockFrom.mock.results[0].value;

      expect(chain.order).toHaveBeenCalledWith('capacity', { ascending: false });
    });

    it('queries the exact table name passed in', async () => {
      currentMockFrom = mockSupabaseFrom({ players: { data: [], error: null } });

      await fetchAllFromDB('players');

      expect(currentMockFrom).toHaveBeenCalledWith('players');
    });

    it('logs and re-throws the error when the query fails', async () => {
      const dbError = { message: 'boom' };
      currentMockFrom = mockSupabaseFrom({ teams: { data: null, error: dbError } });

      await expect(fetchAllFromDB('teams')).rejects.toEqual(dbError);
      expect(errorSpy).toHaveBeenCalledWith('Error fetching teams:', dbError);
    });
  });

  describe('fetchByIdFromDB', () => {
    it('returns the single matching row on success', async () => {
      currentMockFrom = mockSupabaseFrom({
        teams: { data: { id: 5, name: 'Spurs' }, error: null },
      });

      const result = await fetchByIdFromDB('teams', 5);
      expect(result).toEqual({ id: 5, name: 'Spurs' });
    });

    it('filters by the exact id field and value passed in', async () => {
      currentMockFrom = mockSupabaseFrom({ teams: { data: { id: 5 }, error: null } });

      await fetchByIdFromDB('teams', 5);
      const chain = currentMockFrom.mock.results[0].value;

      expect(chain.eq).toHaveBeenCalledWith('id', 5);
      expect(chain.single).toHaveBeenCalled();
    });

    it('works with a string id as well as a numeric id', async () => {
      currentMockFrom = mockSupabaseFrom({ stadia: { data: { id: 'abc' }, error: null } });

      await fetchByIdFromDB('stadia', 'abc');
      const chain = currentMockFrom.mock.results[0].value;

      expect(chain.eq).toHaveBeenCalledWith('id', 'abc');
    });

    it('returns null (not throw) and logs when the query errors', async () => {
      const dbError = { message: 'not found' };
      currentMockFrom = mockSupabaseFrom({ teams: { data: null, error: dbError } });

      const result = await fetchByIdFromDB('teams', 999);

      expect(result).toBeNull();
      expect(errorSpy).toHaveBeenCalledWith('Error fetching teams by ID:', dbError);
    });
  });

  describe('fetchWithMatchCountFromDB', () => {
    it('throws and logs if fetching the base entities fails (never attempts count queries)', async () => {
      const dbError = { message: 'entities failed' };
      currentMockFrom = mockSupabaseFrom({ teams: { data: null, error: dbError } });

      await expect(fetchWithMatchCountFromDB('teams')).rejects.toEqual(dbError);
      expect(errorSpy).toHaveBeenCalledWith('Error fetching teams:', dbError);
    });

    it('sums home and away counts across multiple entities using one batched query per column', async () => {
      currentMockFrom = mockSupabaseFrom({
        teams: {
          data: [{ id: 1, name: 'Spurs' }, { id: 2, name: 'Arsenal' }],
          error: null,
        },
        matches: [
          {
            data: [{ home_team_id: 1 }, { home_team_id: 1 }, { home_team_id: 2 }],
            error: null,
          }, // home counts
          { data: [{ away_team_id: 1 }], error: null }, // away counts
        ],
      });

      const result = await fetchWithMatchCountFromDB<{ id: number; name: string }>('teams');

      expect(result).toEqual([
        { id: 1, name: 'Spurs', match_count: 3 },
        { id: 2, name: 'Arsenal', match_count: 1 },
      ]);
      // Entities + one count query per column, regardless of how many entities there are.
      expect(currentMockFrom).toHaveBeenCalledTimes(3);
    });

    it('falls back to 0 for the home contribution only when the home-count query errors', async () => {
      currentMockFrom = mockSupabaseFrom({
        teams: { data: [{ id: 1, name: 'Spurs' }], error: null },
        matches: [
          { data: null, error: { message: 'fail' } }, // home count errored - should NOT count
          { data: [{ away_team_id: 1 }], error: null }, // away count succeeded
        ],
      });

      const result = await fetchWithMatchCountFromDB<{ id: number; name: string }>('teams');

      expect(result).toEqual([{ id: 1, name: 'Spurs', match_count: 1 }]);
    });

    it('falls back to 0 for the away contribution only when the away-count query errors', async () => {
      currentMockFrom = mockSupabaseFrom({
        teams: { data: [{ id: 1, name: 'Spurs' }], error: null },
        matches: [
          { data: [{ home_team_id: 1 }], error: null }, // home count succeeded
          { data: null, error: { message: 'fail' } }, // away count errored - should NOT count
        ],
      });

      const result = await fetchWithMatchCountFromDB<{ id: number; name: string }>('teams');

      expect(result).toEqual([{ id: 1, name: 'Spurs', match_count: 1 }]);
    });

    it('treats no matching rows as 0', async () => {
      currentMockFrom = mockSupabaseFrom({
        teams: { data: [{ id: 1, name: 'Spurs' }], error: null },
        matches: [
          { data: [], error: null },
          { data: [], error: null },
        ],
      });

      const result = await fetchWithMatchCountFromDB<{ id: number; name: string }>('teams');

      expect(result).toEqual([{ id: 1, name: 'Spurs', match_count: 0 }]);
    });

    it('returns an empty array when there are no entities (no count queries attempted)', async () => {
      currentMockFrom = mockSupabaseFrom({ teams: { data: [], error: null } });

      const result = await fetchWithMatchCountFromDB('teams');

      expect(result).toEqual([]);
      expect(currentMockFrom).toHaveBeenCalledTimes(1);
    });

    it('queries counts against the custom match table/columns, filtered by entity ids, when provided', async () => {
      currentMockFrom = mockSupabaseFrom({
        stadia: { data: [{ id: 1, name: 'Stadium A' }], error: null },
        appearances: [
          { data: [{ home_stadium_id: 1 }], error: null },
          { data: [], error: null },
        ],
      });

      await fetchWithMatchCountFromDB(
        'stadia',
        'appearances',
        'home_stadium_id',
        'away_stadium_id'
      );

      // Call 0 = entities('stadia'); call 1 = home counts('appearances'); call 2 = away
      // counts('appearances') - deterministic order since Promise.all evaluates its array
      // left-to-right and each query resolves synchronously up to its first await.
      expect(currentMockFrom).toHaveBeenNthCalledWith(2, 'appearances');
      expect(currentMockFrom).toHaveBeenNthCalledWith(3, 'appearances');
      const homeChain = currentMockFrom.mock.results[1].value;
      const awayChain = currentMockFrom.mock.results[2].value;
      expect(homeChain.in).toHaveBeenCalledWith('home_stadium_id', [1]);
      expect(awayChain.in).toHaveBeenCalledWith('away_stadium_id', [1]);
    });
  });

  describe('fetchWithSingleMatchCountFromDB', () => {
    it('throws and logs if fetching the base entities fails', async () => {
      const dbError = { message: 'entities failed' };
      currentMockFrom = mockSupabaseFrom({ stadia: { data: null, error: dbError } });

      await expect(fetchWithSingleMatchCountFromDB('stadia')).rejects.toEqual(dbError);
      expect(errorSpy).toHaveBeenCalledWith('Error fetching stadia:', dbError);
    });

    it('attaches match counts for multiple entities using a single batched query', async () => {
      currentMockFrom = mockSupabaseFrom({
        stadia: {
          data: [{ id: 1, name: 'Stadium A' }, { id: 2, name: 'Stadium B' }],
          error: null,
        },
        matches: {
          data: [{ stadium_id: 1 }, { stadium_id: 1 }, { stadium_id: 2 }],
          error: null,
        },
      });

      const result = await fetchWithSingleMatchCountFromDB<{ id: number; name: string }>('stadia');

      expect(result).toEqual([
        { id: 1, name: 'Stadium A', match_count: 2 },
        { id: 2, name: 'Stadium B', match_count: 1 },
      ]);
      // Entities + a single count query, regardless of how many entities there are.
      expect(currentMockFrom).toHaveBeenCalledTimes(2);
    });

    it('falls back to 0 for every entity when the count query errors', async () => {
      currentMockFrom = mockSupabaseFrom({
        stadia: { data: [{ id: 1, name: 'Stadium A' }], error: null },
        matches: { data: null, error: { message: 'fail' } },
      });

      const result = await fetchWithSingleMatchCountFromDB<{ id: number; name: string }>('stadia');

      expect(result).toEqual([{ id: 1, name: 'Stadium A', match_count: 0 }]);
    });

    it('treats no matching rows as 0', async () => {
      currentMockFrom = mockSupabaseFrom({
        stadia: { data: [{ id: 1, name: 'Stadium A' }], error: null },
        matches: { data: [], error: null },
      });

      const result = await fetchWithSingleMatchCountFromDB<{ id: number; name: string }>('stadia');

      expect(result).toEqual([{ id: 1, name: 'Stadium A', match_count: 0 }]);
    });

    it('filters the count query by the custom match column against all entity ids', async () => {
      currentMockFrom = mockSupabaseFrom({
        stadia: { data: [{ id: 9, name: 'Stadium A' }], error: null },
        matches: { data: [{ stadium_id: 9 }], error: null },
      });

      await fetchWithSingleMatchCountFromDB('stadia', 'matches', 'stadium_id');
      // Call 0 = entities('stadia'); call 1 = counts('matches')
      const matchesChain = currentMockFrom.mock.results[1].value;

      expect(matchesChain.in).toHaveBeenCalledWith('stadium_id', [9]);
    });

    it('returns an empty array when there are no entities (no count query attempted)', async () => {
      currentMockFrom = mockSupabaseFrom({ stadia: { data: [], error: null } });

      const result = await fetchWithSingleMatchCountFromDB('stadia');

      expect(result).toEqual([]);
      expect(currentMockFrom).toHaveBeenCalledTimes(1);
    });
  });
});
