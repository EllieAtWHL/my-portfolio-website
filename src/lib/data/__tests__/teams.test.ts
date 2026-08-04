import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { mockSupabaseFrom } from '@/test-utils/supabase-query-mock';

describe('teams data layer', () => {
  describe('thin wrappers around generic-fetchers', () => {
    beforeEach(() => {
      jest.resetModules();
    });

    it('getAllTeams delegates to fetchAllFromDB with the teams table ordered by name', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const fetchAllFromDB = jest.fn(async (..._args: unknown[]) => [{ id: 1, name: 'Tottenham' }]);
      jest.doMock('@/lib/data/generic-fetchers', () => ({
        fetchAllFromDB,
        fetchByIdFromDB: jest.fn(),
        fetchWithMatchCountFromDB: jest.fn(),
      }));

      const { getAllTeams } = await import('@/lib/data/teams');
      const result = await getAllTeams();

      expect(fetchAllFromDB).toHaveBeenCalledWith('teams', 'name');
      expect(result).toEqual([{ id: 1, name: 'Tottenham' }]);
    });

    it('getTeamsWithMatchCounts delegates to fetchWithMatchCountFromDB with home/away columns', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const fetchWithMatchCountFromDB = jest.fn(async (..._args: unknown[]) => [{ id: 1, name: 'Tottenham', match_count: 5 }]);
      jest.doMock('@/lib/data/generic-fetchers', () => ({
        fetchAllFromDB: jest.fn(),
        fetchByIdFromDB: jest.fn(),
        fetchWithMatchCountFromDB,
      }));

      const { getTeamsWithMatchCounts } = await import('@/lib/data/teams');
      const result = await getTeamsWithMatchCounts();

      expect(fetchWithMatchCountFromDB).toHaveBeenCalledWith('teams', 'matches', 'home_team_id', 'away_team_id', 'name');
      expect(result).toEqual([{ id: 1, name: 'Tottenham', match_count: 5 }]);
    });

    it('getTeamById delegates to fetchByIdFromDB with the teams table and given id', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const fetchByIdFromDB = jest.fn(async (..._args: unknown[]) => ({ id: 7, name: 'Arsenal' }));
      jest.doMock('@/lib/data/generic-fetchers', () => ({
        fetchAllFromDB: jest.fn(),
        fetchByIdFromDB,
        fetchWithMatchCountFromDB: jest.fn(),
      }));

      const { getTeamById } = await import('@/lib/data/teams');
      const result = await getTeamById('7');

      expect(fetchByIdFromDB).toHaveBeenCalledWith('teams', '7');
      expect(result).toEqual({ id: 7, name: 'Arsenal' });
    });
  });

  describe('getMatchesForTeam', () => {
    beforeEach(() => {
      jest.resetModules();
    });

    it('returns [] and never calls supabase when teamId is not a valid integer', async () => {
      const mockFrom = mockSupabaseFrom({});
      jest.doMock('@/utils/supabase', () => ({ supabase: { from: mockFrom } }));

      const { getMatchesForTeam } = await import('@/lib/data/teams');
      const result = await getMatchesForTeam('not-a-number');

      expect(result).toEqual([]);
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('rejects non-integer numeric strings like "1.5"', async () => {
      const mockFrom = mockSupabaseFrom({});
      jest.doMock('@/utils/supabase', () => ({ supabase: { from: mockFrom } }));

      const { getMatchesForTeam } = await import('@/lib/data/teams');
      const result = await getMatchesForTeam('1.5');

      expect(result).toEqual([]);
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('queries matches_with_stadium for a valid integer teamId and returns the data', async () => {
      const matches = [{ id: 'm1', date: '2024-01-01' }];
      const mockFrom = mockSupabaseFrom({
        matches_with_stadium: { data: matches, error: null },
      });
      jest.doMock('@/utils/supabase', () => ({ supabase: { from: mockFrom } }));

      const { getMatchesForTeam } = await import('@/lib/data/teams');
      const result = await getMatchesForTeam('3');

      expect(mockFrom).toHaveBeenCalledWith('matches_with_stadium');
      expect(result).toEqual(matches);
    });

    it('returns [] when data is null but there is no error', async () => {
      const mockFrom = mockSupabaseFrom({
        matches_with_stadium: { data: null, error: null },
      });
      jest.doMock('@/utils/supabase', () => ({ supabase: { from: mockFrom } }));

      const { getMatchesForTeam } = await import('@/lib/data/teams');
      const result = await getMatchesForTeam('3');

      expect(result).toEqual([]);
    });

    it('returns [] (not throw) when the query errors', async () => {
      const mockFrom = mockSupabaseFrom({
        matches_with_stadium: { data: null, error: { message: 'db down' } },
      });
      jest.doMock('@/utils/supabase', () => ({ supabase: { from: mockFrom } }));

      const { getMatchesForTeam } = await import('@/lib/data/teams');
      const result = await getMatchesForTeam('3');

      expect(result).toEqual([]);
    });
  });

  describe('getPlayersForTeam', () => {
    beforeEach(() => {
      jest.resetModules();
    });

    it('returns { current: [], former: [] } when the player_history query errors', async () => {
      const mockFrom = mockSupabaseFrom({
        player_history: { data: null, error: { message: 'db down' } },
        player_stats: { data: [], error: null },
      });
      jest.doMock('@/utils/supabase', () => ({ supabase: { from: mockFrom } }));

      const { getPlayersForTeam } = await import('@/lib/data/teams');
      const result = await getPlayersForTeam('1');

      expect(result).toEqual({ current: [], former: [] });
    });

    it('splits players into current/former, dedupes, aggregates stats, and sorts by last name', async () => {
      const playerHistory = [
        // Duplicate current record for player A (should not produce a duplicate entry)
        { player: { id: 'A', last_name: 'Zeta', first_name: 'X' }, left_on: null, squad_number: 10 },
        { player: { id: 'A', last_name: 'Zeta', first_name: 'X' }, left_on: null, squad_number: 10 },
        // Current player B
        { player: { id: 'B', last_name: 'Alpha', first_name: 'Y' }, left_on: null, squad_number: 4 },
        // Former player C (left in the past)
        { player: { id: 'C', last_name: 'Mid', first_name: 'Z' }, left_on: '2000-01-01', squad_number: 7 },
        // Record with a null player - should be skipped entirely
        { player: null, left_on: null, squad_number: 1 },
      ];

      const playerStats = [
        { player_id: 'A', goals: 2, assists: 1, yellow_cards: 0, red_cards: 0 },
        { player_id: 'A', goals: 1, assists: 0, yellow_cards: 1, red_cards: 0 },
        { player_id: 'B', goals: 0, assists: null, yellow_cards: null, red_cards: null },
      ];

      const mockFrom = mockSupabaseFrom({
        player_history: { data: playerHistory, error: null },
        player_stats: { data: playerStats, error: null },
      });
      jest.doMock('@/utils/supabase', () => ({ supabase: { from: mockFrom } }));

      const { getPlayersForTeam } = await import('@/lib/data/teams');
      const result = await getPlayersForTeam('1');

      // current sorted by last_name: Alpha (B) before Zeta (A)
      expect(result.current.map((p) => p.id)).toEqual(['B', 'A']);
      expect(result.current).toHaveLength(2); // player A deduped despite two history rows

      const playerA = result.current.find((p) => p.id === 'A')!;
      expect(playerA.appearances).toBe(2);
      expect(playerA.goals).toBe(3);
      expect(playerA.assists).toBe(1);
      expect(playerA.yellow_cards).toBe(1);
      expect(playerA.red_cards).toBe(0);
      expect(playerA.squad_number).toBe(10);

      const playerB = result.current.find((p) => p.id === 'B')!;
      expect(playerB.appearances).toBe(1);
      expect(playerB.goals).toBe(0);
      expect(playerB.assists).toBe(0); // null coalesced to 0
      expect(playerB.yellow_cards).toBe(0);

      expect(result.former.map((p) => p.id)).toEqual(['C']);
      const playerC = result.former[0];
      // C never appears in player_stats, so default zero stats apply
      expect(playerC.appearances).toBe(0);
      expect(playerC.goals).toBe(0);
      expect(playerC.squad_number).toBe(7);
    });

    it('treats a future left_on date as still current', async () => {
      const playerHistory = [
        { player: { id: 'A', last_name: 'Future', first_name: 'X' }, left_on: '2099-01-01', squad_number: 1 },
      ];
      const mockFrom = mockSupabaseFrom({
        player_history: { data: playerHistory, error: null },
        player_stats: { data: [], error: null },
      });
      jest.doMock('@/utils/supabase', () => ({ supabase: { from: mockFrom } }));

      const { getPlayersForTeam } = await import('@/lib/data/teams');
      const result = await getPlayersForTeam('1');

      expect(result.current.map((p) => p.id)).toEqual(['A']);
      expect(result.former).toEqual([]);
    });

    it('still aggregates stats and returns current/former even if the player_stats query errors', async () => {
      const playerHistory = [
        { player: { id: 'A', last_name: 'Solo', first_name: 'X' }, left_on: null, squad_number: 1 },
      ];
      const mockFrom = mockSupabaseFrom({
        player_history: { data: playerHistory, error: null },
        player_stats: { data: null, error: { message: 'stats down' } },
      });
      jest.doMock('@/utils/supabase', () => ({ supabase: { from: mockFrom } }));

      const { getPlayersForTeam } = await import('@/lib/data/teams');
      const result = await getPlayersForTeam('1');

      expect(result.current).toHaveLength(1);
      expect(result.current[0].appearances).toBe(0);
    });
  });
});
