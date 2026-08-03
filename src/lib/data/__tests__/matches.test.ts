import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { mockSupabaseFrom } from '@/test-utils/supabase-query-mock';

let currentMockFrom: ReturnType<typeof mockSupabaseFrom>;

jest.mock('@/utils/supabase', () => ({
  supabase: {
    from: (...args: [string]) => currentMockFrom(...args),
  },
}));

import {
  getUpcomingMatches,
  getPreviousMatches,
  getAllMatches,
  getSeasonMatches,
  getMatchById,
  getAdjacentMatches,
  getHomePageMatches,
  getMatchesWithFilter,
  getMatchesBySeason,
} from '../matches';
import { CacheError } from '../cache-utils';

const TABLE = 'matches_with_stadium';

describe('data/matches', () => {
  let errorSpy: jest.SpiedFunction<typeof console.error>;

  beforeEach(() => {
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-08-15T12:00:00.000Z'));
  });

  afterEach(() => {
    errorSpy.mockRestore();
    jest.useRealTimers();
  });

  describe('getUpcomingMatches', () => {
    it('combines today\'s unscored matches with future matches, today first, sliced to the limit', async () => {
      currentMockFrom = mockSupabaseFrom({
        [TABLE]: [
          { data: [{ id: 'today-1' }], error: null },
          { data: [{ id: 'future-1' }, { id: 'future-2' }], error: null },
        ],
      });

      const result = await getUpcomingMatches(3);

      expect(result).toEqual([{ id: 'today-1' }, { id: 'future-1' }, { id: 'future-2' }]);
    });

    it('caps the combined result at the limit even when today + future exceed it', async () => {
      currentMockFrom = mockSupabaseFrom({
        [TABLE]: [
          { data: [{ id: 'today-1' }, { id: 'today-2' }, { id: 'today-3' }], error: null },
          { data: [{ id: 'future-1' }, { id: 'future-2' }], error: null },
        ],
      });

      const result = await getUpcomingMatches(3);

      // Today's 3 matches already fill the limit - future matches must be cut off.
      expect(result).toEqual([{ id: 'today-1' }, { id: 'today-2' }, { id: 'today-3' }]);
    });

    it('requests exactly (limit - today.length) future matches from the second query', async () => {
      currentMockFrom = mockSupabaseFrom({
        [TABLE]: [
          { data: [{ id: 'today-1' }, { id: 'today-2' }], error: null },
          { data: [], error: null },
        ],
      });

      await getUpcomingMatches(5);

      const todayChain = currentMockFrom.mock.results[0].value;
      const futureChain = currentMockFrom.mock.results[1].value;
      expect(todayChain.limit).toHaveBeenCalledWith(5);
      expect(futureChain.limit).toHaveBeenCalledWith(3); // 5 - 2
    });

    it('requests a future-query limit of 0 (not negative) when today already fills the limit', async () => {
      currentMockFrom = mockSupabaseFrom({
        [TABLE]: [
          { data: [{ id: 'a' }, { id: 'b' }, { id: 'c' }], error: null },
          { data: [], error: null },
        ],
      });

      await getUpcomingMatches(3);
      const futureChain = currentMockFrom.mock.results[1].value;
      expect(futureChain.limit).toHaveBeenCalledWith(0);
    });

    it('uses the correct date-range filters for both queries', async () => {
      currentMockFrom = mockSupabaseFrom({
        [TABLE]: [
          { data: [], error: null },
          { data: [], error: null },
        ],
      });

      await getUpcomingMatches(3);
      const todayChain = currentMockFrom.mock.results[0].value;
      const futureChain = currentMockFrom.mock.results[1].value;

      // Today's unscored-match query: [today 00:00, tomorrow 00:00), no score yet.
      expect(todayChain.gte).toHaveBeenCalledWith('date', '2026-08-15T00:00:00.000Z');
      expect(todayChain.lt).toHaveBeenCalledWith('date', '2026-08-16T00:00:00.000Z');
      expect(todayChain.is).toHaveBeenCalledWith('spurs_score', null);
      expect(todayChain.is).toHaveBeenCalledWith('opponent_score', null);
      expect(todayChain.order).toHaveBeenCalledWith('date', { ascending: true });

      // Future-match query: everything from tomorrow 00:00 onward.
      expect(futureChain.gte).toHaveBeenCalledWith('date', '2026-08-16T00:00:00.000Z');
      expect(futureChain.order).toHaveBeenCalledWith('date', { ascending: true });
    });

    it('defaults to a limit of 3 when called with no arguments', async () => {
      currentMockFrom = mockSupabaseFrom({
        [TABLE]: [
          { data: [{ id: '1' }, { id: '2' }, { id: '3' }, { id: '4' }], error: null },
          { data: [], error: null },
        ],
      });

      const result = await getUpcomingMatches();
      expect(result).toHaveLength(3);
    });

    it('rejects when the today-matches query errors', async () => {
      currentMockFrom = mockSupabaseFrom({
        [TABLE]: { data: null, error: { message: 'today query failed' } },
      });

      await expect(getUpcomingMatches(3)).rejects.toBeInstanceOf(CacheError);
      expect(errorSpy).toHaveBeenCalledWith(
        'Error fetching upcoming matches:',
        { message: 'today query failed' }
      );
    });

    it('rejects when the future-matches query errors after the today query succeeds', async () => {
      currentMockFrom = mockSupabaseFrom({
        [TABLE]: [
          { data: [{ id: 'today-1' }], error: null },
          { data: null, error: { message: 'future query failed' } },
        ],
      });

      await expect(getUpcomingMatches(3)).rejects.toBeInstanceOf(CacheError);
      expect(errorSpy).toHaveBeenCalledWith(
        'Error fetching future matches:',
        { message: 'future query failed' }
      );
    });
  });

  describe('getPreviousMatches', () => {
    it('combines today\'s completed matches with earlier matches, today first, sliced to the limit', async () => {
      currentMockFrom = mockSupabaseFrom({
        [TABLE]: [
          { data: [{ id: 'today-1' }], error: null },
          { data: [{ id: 'before-1' }, { id: 'before-2' }], error: null },
        ],
      });

      const result = await getPreviousMatches(3);

      expect(result).toEqual([{ id: 'today-1' }, { id: 'before-1' }, { id: 'before-2' }]);
    });

    it('caps the combined result at the limit even when today + before exceed it', async () => {
      currentMockFrom = mockSupabaseFrom({
        [TABLE]: [
          { data: [{ id: 'today-1' }, { id: 'today-2' }, { id: 'today-3' }], error: null },
          { data: [{ id: 'before-1' }, { id: 'before-2' }], error: null },
        ],
      });

      const result = await getPreviousMatches(3);
      expect(result).toEqual([{ id: 'today-1' }, { id: 'today-2' }, { id: 'today-3' }]);
    });

    it('requests exactly (limit - today.length) earlier matches from the second query', async () => {
      currentMockFrom = mockSupabaseFrom({
        [TABLE]: [
          { data: [{ id: 'today-1' }], error: null },
          { data: [], error: null },
        ],
      });

      await getPreviousMatches(4);
      const todayChain = currentMockFrom.mock.results[0].value;
      const beforeChain = currentMockFrom.mock.results[1].value;
      expect(todayChain.limit).toHaveBeenCalledWith(4);
      expect(beforeChain.limit).toHaveBeenCalledWith(3); // 4 - 1
    });

    it('uses the correct date-range and completed-score filters for both queries', async () => {
      currentMockFrom = mockSupabaseFrom({
        [TABLE]: [
          { data: [], error: null },
          { data: [], error: null },
        ],
      });

      await getPreviousMatches(3);
      const todayChain = currentMockFrom.mock.results[0].value;
      const beforeChain = currentMockFrom.mock.results[1].value;

      expect(todayChain.gte).toHaveBeenCalledWith('date', '2026-08-15T00:00:00.000Z');
      expect(todayChain.lt).toHaveBeenCalledWith('date', '2026-08-16T00:00:00.000Z');
      expect(todayChain.not).toHaveBeenCalledWith('spurs_score', 'is', null);
      expect(todayChain.not).toHaveBeenCalledWith('opponent_score', 'is', null);
      expect(todayChain.order).toHaveBeenCalledWith('date', { ascending: false });

      expect(beforeChain.lt).toHaveBeenCalledWith('date', '2026-08-15T00:00:00.000Z');
      expect(beforeChain.order).toHaveBeenCalledWith('date', { ascending: false });
    });

    it('rejects when the today-completed-matches query errors', async () => {
      currentMockFrom = mockSupabaseFrom({
        [TABLE]: { data: null, error: { message: 'today completed query failed' } },
      });

      await expect(getPreviousMatches(3)).rejects.toBeInstanceOf(CacheError);
      expect(errorSpy).toHaveBeenCalledWith(
        "Error fetching today's completed matches:",
        { message: 'today completed query failed' }
      );
    });

    it('rejects when the earlier-matches query errors after the today query succeeds', async () => {
      currentMockFrom = mockSupabaseFrom({
        [TABLE]: [
          { data: [{ id: 'today-1' }], error: null },
          { data: null, error: { message: 'before query failed' } },
        ],
      });

      await expect(getPreviousMatches(3)).rejects.toBeInstanceOf(CacheError);
      expect(errorSpy).toHaveBeenCalledWith(
        'Error fetching previous matches:',
        { message: 'before query failed' }
      );
    });
  });

  describe('getAllMatches / getMatchesWithFilter', () => {
    it('with no filter: orders by date descending and applies no date bound', async () => {
      currentMockFrom = mockSupabaseFrom({ [TABLE]: { data: [{ id: '1' }], error: null } });

      const result = await getAllMatches();
      const chain = currentMockFrom.mock.results[0].value;

      expect(result).toEqual([{ id: '1' }]);
      expect(chain.order).toHaveBeenCalledWith('date', { ascending: false });
      expect(chain.gte).not.toHaveBeenCalled();
      expect(chain.lt).not.toHaveBeenCalled();
    });

    it('with filter "upcoming": applies a gte date bound at the current instant', async () => {
      currentMockFrom = mockSupabaseFrom({ [TABLE]: { data: [], error: null } });

      await getAllMatches('upcoming');
      const chain = currentMockFrom.mock.results[0].value;

      expect(chain.gte).toHaveBeenCalledWith('date', '2026-08-15T12:00:00.000Z');
      expect(chain.lt).not.toHaveBeenCalled();
    });

    it('with filter "previous": applies an lt date bound at the current instant', async () => {
      currentMockFrom = mockSupabaseFrom({ [TABLE]: { data: [], error: null } });

      await getAllMatches('previous');
      const chain = currentMockFrom.mock.results[0].value;

      expect(chain.lt).toHaveBeenCalledWith('date', '2026-08-15T12:00:00.000Z');
      expect(chain.gte).not.toHaveBeenCalled();
    });

    it('returns [] rather than null when the query succeeds with no data', async () => {
      currentMockFrom = mockSupabaseFrom({ [TABLE]: { data: null, error: null } });

      const result = await getAllMatches();
      expect(result).toEqual([]);
    });

    it('rejects and logs when the query errors', async () => {
      currentMockFrom = mockSupabaseFrom({
        [TABLE]: { data: null, error: { message: 'all matches failed' } },
      });

      await expect(getAllMatches()).rejects.toBeInstanceOf(CacheError);
      expect(errorSpy).toHaveBeenCalledWith(
        'Error fetching all matches:',
        { message: 'all matches failed' }
      );
    });

    it('getMatchesWithFilter("all") behaves the same as no filter (no date bound)', async () => {
      currentMockFrom = mockSupabaseFrom({ [TABLE]: { data: [], error: null } });

      await getMatchesWithFilter('all');
      const chain = currentMockFrom.mock.results[0].value;

      expect(chain.gte).not.toHaveBeenCalled();
      expect(chain.lt).not.toHaveBeenCalled();
    });

    it('getMatchesWithFilter("upcoming") applies the gte bound', async () => {
      currentMockFrom = mockSupabaseFrom({ [TABLE]: { data: [], error: null } });

      await getMatchesWithFilter('upcoming');
      const chain = currentMockFrom.mock.results[0].value;

      expect(chain.gte).toHaveBeenCalledWith('date', '2026-08-15T12:00:00.000Z');
    });

    it('getMatchesWithFilter("previous") applies the lt bound', async () => {
      currentMockFrom = mockSupabaseFrom({ [TABLE]: { data: [], error: null } });

      await getMatchesWithFilter('previous');
      const chain = currentMockFrom.mock.results[0].value;

      expect(chain.lt).toHaveBeenCalledWith('date', '2026-08-15T12:00:00.000Z');
    });

    it('getMatchesWithFilter(undefined) behaves the same as no filter', async () => {
      currentMockFrom = mockSupabaseFrom({ [TABLE]: { data: [], error: null } });

      await getMatchesWithFilter(undefined);
      const chain = currentMockFrom.mock.results[0].value;

      expect(chain.gte).not.toHaveBeenCalled();
      expect(chain.lt).not.toHaveBeenCalled();
    });
  });

  describe('getSeasonMatches / getMatchesBySeason', () => {
    it('filters by season_id and orders by date ascending', async () => {
      currentMockFrom = mockSupabaseFrom({ [TABLE]: { data: [{ id: 'm1' }], error: null } });

      const result = await getSeasonMatches('season-42');
      const chain = currentMockFrom.mock.results[0].value;

      expect(result).toEqual([{ id: 'm1' }]);
      expect(chain.eq).toHaveBeenCalledWith('season_id', 'season-42');
      expect(chain.order).toHaveBeenCalledWith('date', { ascending: true });
    });

    it('returns [] rather than null when the query succeeds with no data', async () => {
      currentMockFrom = mockSupabaseFrom({ [TABLE]: { data: null, error: null } });

      const result = await getSeasonMatches('season-42');
      expect(result).toEqual([]);
    });

    it('rejects and logs when the query errors', async () => {
      currentMockFrom = mockSupabaseFrom({
        [TABLE]: { data: null, error: { message: 'season query failed' } },
      });

      await expect(getSeasonMatches('season-42')).rejects.toBeInstanceOf(CacheError);
      expect(errorSpy).toHaveBeenCalledWith(
        'Error fetching season matches:',
        { message: 'season query failed' }
      );
    });

    it('getMatchesBySeason delegates the season id through unchanged', async () => {
      currentMockFrom = mockSupabaseFrom({ [TABLE]: { data: [], error: null } });

      await getMatchesBySeason('season-99');
      const chain = currentMockFrom.mock.results[0].value;

      expect(chain.eq).toHaveBeenCalledWith('season_id', 'season-99');
    });
  });

  describe('getMatchById', () => {
    const baseMatch = {
      id: 'match-1',
      date: '2026-08-15',
      is_home_match: true,
    };

    it('returns the match unmodified when all stat fields are already present', async () => {
      const fullMatch = {
        ...baseMatch,
        home_possession: 55,
        away_possession: 45,
        home_total_shots: 10,
        away_total_shots: 8,
        home_shots_on_target: 5,
        away_shots_on_target: 3,
        home_corners: 6,
        away_corners: 4,
        is_neutral_venue: true,
      };
      currentMockFrom = mockSupabaseFrom({ [TABLE]: { data: { ...fullMatch }, error: null } });

      const result = await getMatchById('match-1');

      expect(result).toEqual(fullMatch);
    });

    it('fills every undefined stat field with null and is_neutral_venue with false', async () => {
      currentMockFrom = mockSupabaseFrom({ [TABLE]: { data: { ...baseMatch }, error: null } });

      const result = await getMatchById('match-1');

      expect(result).toMatchObject({
        home_possession: null,
        away_possession: null,
        home_total_shots: null,
        away_total_shots: null,
        home_shots_on_target: null,
        away_shots_on_target: null,
        home_corners: null,
        away_corners: null,
        is_neutral_venue: false,
      });
    });

    it('does not overwrite a stat field that is genuinely 0', async () => {
      currentMockFrom = mockSupabaseFrom({
        [TABLE]: { data: { ...baseMatch, home_possession: 0, home_corners: 0 }, error: null },
      });

      const result = await getMatchById('match-1');

      expect(result?.home_possession).toBe(0);
      expect(result?.home_corners).toBe(0);
    });

    it('filters by id and calls .single()', async () => {
      currentMockFrom = mockSupabaseFrom({ [TABLE]: { data: { ...baseMatch }, error: null } });

      await getMatchById('match-1');
      const chain = currentMockFrom.mock.results[0].value;

      expect(chain.eq).toHaveBeenCalledWith('id', 'match-1');
      expect(chain.single).toHaveBeenCalled();
    });

    it('returns null (does not throw) and logs when the query errors', async () => {
      currentMockFrom = mockSupabaseFrom({
        [TABLE]: { data: null, error: { message: 'not found' } },
      });

      const result = await getMatchById('missing');

      expect(result).toBeNull();
      expect(errorSpy).toHaveBeenCalledWith('Error fetching match:', { message: 'not found' });
    });

    it('returns null when there is no error but no data either', async () => {
      currentMockFrom = mockSupabaseFrom({ [TABLE]: { data: null, error: null } });

      const result = await getMatchById('missing');
      expect(result).toBeNull();
    });
  });

  describe('getAdjacentMatches', () => {
    it('returns both previous and next nav summaries when both exist', async () => {
      currentMockFrom = mockSupabaseFrom({
        [TABLE]: [
          { data: { id: 'prev-match', date: '2026-08-01' }, error: null },
          { data: { id: 'next-match', date: '2026-08-20' }, error: null },
        ],
      });

      const result = await getAdjacentMatches('match-mid', '2026-08-10');

      expect(result).toEqual({
        previous: { id: 'prev-match', date: '2026-08-01' },
        next: { id: 'next-match', date: '2026-08-20' },
      });
    });

    it('returns null for previous when there is no earlier match (start of season)', async () => {
      currentMockFrom = mockSupabaseFrom({
        [TABLE]: [
          { data: null, error: null },
          { data: { id: 'next-match', date: '2026-08-20' }, error: null },
        ],
      });

      const result = await getAdjacentMatches('match-first', '2026-08-10');

      expect(result.previous).toBeNull();
      expect(result.next).toEqual({ id: 'next-match', date: '2026-08-20' });
    });

    it('returns null for next when there is no later match (most recent match)', async () => {
      currentMockFrom = mockSupabaseFrom({
        [TABLE]: [
          { data: { id: 'prev-match', date: '2026-08-01' }, error: null },
          { data: null, error: null },
        ],
      });

      const result = await getAdjacentMatches('match-last', '2026-08-10');

      expect(result.previous).toEqual({ id: 'prev-match', date: '2026-08-01' });
      expect(result.next).toBeNull();
    });

    it('returns { previous: null, next: null } when there are no other matches at all', async () => {
      currentMockFrom = mockSupabaseFrom({
        [TABLE]: [
          { data: null, error: null },
          { data: null, error: null },
        ],
      });

      const result = await getAdjacentMatches('only-match', '2026-08-10');
      expect(result).toEqual({ previous: null, next: null });
    });

    it('logs (but does not throw on) a genuine error from either the previous or next query', async () => {
      currentMockFrom = mockSupabaseFrom({
        [TABLE]: [
          { data: null, error: { message: 'connection reset' } },
          { data: { id: 'next-match', date: '2026-08-20' }, error: null },
        ],
      });

      const result = await getAdjacentMatches('match-mid', '2026-08-10');

      expect(result.previous).toBeNull();
      expect(result.next).toEqual({ id: 'next-match', date: '2026-08-20' });
      expect(errorSpy).toHaveBeenCalledWith(
        'Error fetching previous adjacent match:',
        { message: 'connection reset' }
      );
    });

    it('queries previous with lt/descending/limit(1) and next with gt/ascending/limit(1)', async () => {
      currentMockFrom = mockSupabaseFrom({
        [TABLE]: [
          { data: null, error: null },
          { data: null, error: null },
        ],
      });

      await getAdjacentMatches('match-mid', '2026-08-10');
      const previousChain = currentMockFrom.mock.results[0].value;
      const nextChain = currentMockFrom.mock.results[1].value;

      expect(previousChain.lt).toHaveBeenCalledWith('date', '2026-08-10');
      expect(previousChain.order).toHaveBeenCalledWith('date', { ascending: false });
      expect(previousChain.limit).toHaveBeenCalledWith(1);
      expect(previousChain.single).toHaveBeenCalled();

      expect(nextChain.gt).toHaveBeenCalledWith('date', '2026-08-10');
      expect(nextChain.order).toHaveBeenCalledWith('date', { ascending: true });
      expect(nextChain.limit).toHaveBeenCalledWith(1);
      expect(nextChain.single).toHaveBeenCalled();
    });
  });

  describe('getHomePageMatches', () => {
    it('composes upcoming and previous matches (each limited to 3) into one object', async () => {
      // Call order for Promise.all([getUpcomingMatches(3), getPreviousMatches(3)]) is
      // deterministic (verified empirically): upcoming-today, previous-today,
      // upcoming-future, previous-before - each pair's "today" query runs before either
      // function's second query, because both async calls run up to their first await
      // before either resumes.
      currentMockFrom = mockSupabaseFrom({
        [TABLE]: [
          { data: [{ id: 'up-today' }], error: null }, // getUpcomingMatches: today
          { data: [{ id: 'prev-today' }], error: null }, // getPreviousMatches: today
          { data: [{ id: 'up-future' }], error: null }, // getUpcomingMatches: future
          { data: [{ id: 'prev-before' }], error: null }, // getPreviousMatches: before
        ],
      });

      const result = await getHomePageMatches();

      expect(result).toEqual({
        upcoming: [{ id: 'up-today' }, { id: 'up-future' }],
        previous: [{ id: 'prev-today' }, { id: 'prev-before' }],
      });
    });

    it('requests a limit of 3 for both the upcoming and previous "today" queries', async () => {
      currentMockFrom = mockSupabaseFrom({
        [TABLE]: [
          { data: [], error: null },
          { data: [], error: null },
          { data: [], error: null },
          { data: [], error: null },
        ],
      });

      await getHomePageMatches();

      const upcomingTodayChain = currentMockFrom.mock.results[0].value;
      const previousTodayChain = currentMockFrom.mock.results[1].value;
      expect(upcomingTodayChain.limit).toHaveBeenCalledWith(3);
      expect(previousTodayChain.limit).toHaveBeenCalledWith(3);
    });
  });
});
