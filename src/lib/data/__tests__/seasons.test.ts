import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { mockSupabaseFrom } from '@/test-utils/supabase-query-mock';
import type { Match } from '@/lib/data/matches';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function makeMatch(overrides: Partial<Match> & Record<string, any> = {}): Match {
  return {
    id: 'm',
    date: '2024-01-01',
    kickoff_time: '15:00:00',
    home_team: null,
    away_team: null,
    spurs_score: null,
    opponent_score: null,
    attended: false,
    is_home_match: true,
    is_neutral_venue: false,
    stadium_id: 's1',
    stadium_display_name: null,
    stadium_slug: null,
    attendance: null,
    notes: null,
    competitions: { name: 'Women\'s Super League' },
    season_id: 1,
    home_possession: null,
    away_possession: null,
    home_total_shots: null,
    away_total_shots: null,
    home_shots_on_target: null,
    away_shots_on_target: null,
    home_corners: null,
    away_corners: null,
    ...overrides,
  } as Match;
}

describe('seasons data layer', () => {
  describe('thin wrappers around generic-fetchers', () => {
    beforeEach(() => {
      jest.resetModules();
    });

    it('getSeasonsList delegates to fetchWithSingleMatchCountFromDB via getSeasonsWithMatchCounts', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const fetchWithSingleMatchCountFromDB = jest.fn(async (..._args: unknown[]) => [{ id: 1, name: '2023/24', match_count: 20 }]);
      jest.doMock('@/lib/data/generic-fetchers', () => ({
        fetchAllFromDB: jest.fn(),
        fetchByIdFromDB: jest.fn(),
        fetchWithSingleMatchCountFromDB,
      }));

      const { getSeasonsList } = await import('@/lib/data/seasons');
      const result = await getSeasonsList();

      expect(fetchWithSingleMatchCountFromDB).toHaveBeenCalledWith('seasons', 'matches', 'season_id', 'start_date');
      expect(result).toEqual([{ id: 1, name: '2023/24', match_count: 20 }]);
    });

    it('getSeasonDetails delegates to fetchByIdFromDB via getSeasonById', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const fetchByIdFromDB = jest.fn(async (..._args: unknown[]) => ({ id: 5, name: '2021/22' }));
      jest.doMock('@/lib/data/generic-fetchers', () => ({
        fetchAllFromDB: jest.fn(),
        fetchByIdFromDB,
        fetchWithSingleMatchCountFromDB: jest.fn(),
      }));

      const { getSeasonDetails } = await import('@/lib/data/seasons');
      const result = await getSeasonDetails('5');

      expect(fetchByIdFromDB).toHaveBeenCalledWith('seasons', '5');
      expect(result).toEqual({ id: 5, name: '2021/22' });
    });

    it('getSeasonDetails returns null when the season does not exist', async () => {
      const fetchByIdFromDB = jest.fn(async () => null);
      jest.doMock('@/lib/data/generic-fetchers', () => ({
        fetchAllFromDB: jest.fn(),
        fetchByIdFromDB,
        fetchWithSingleMatchCountFromDB: jest.fn(),
      }));

      const { getSeasonDetails } = await import('@/lib/data/seasons');
      const result = await getSeasonDetails('missing');

      expect(result).toBeNull();
    });
  });

  describe('getSeasonReviewDetails / fetchSeasonReviewFromDB', () => {
    beforeEach(() => {
      jest.resetModules();
    });

    it('returns a SeasonReview when season_review is populated', async () => {
      const mockFrom = mockSupabaseFrom({
        seasons: { data: { season_review: 'What a season!' }, error: null },
      });
      jest.doMock('@/utils/supabase', () => ({ supabase: { from: mockFrom } }));

      const { getSeasonReviewDetails } = await import('@/lib/data/seasons');
      const result = await getSeasonReviewDetails('3');

      expect(result).toEqual({
        season_id: 3,
        title: 'Season Review',
        content: 'What a season!',
        highlights: [],
      });
    });

    it('returns null when season_review is null', async () => {
      const mockFrom = mockSupabaseFrom({
        seasons: { data: { season_review: null }, error: null },
      });
      jest.doMock('@/utils/supabase', () => ({ supabase: { from: mockFrom } }));

      const { getSeasonReviewDetails } = await import('@/lib/data/seasons');
      const result = await getSeasonReviewDetails('3');

      expect(result).toBeNull();
    });

    it('returns null when season_review is an empty string', async () => {
      const mockFrom = mockSupabaseFrom({
        seasons: { data: { season_review: '' }, error: null },
      });
      jest.doMock('@/utils/supabase', () => ({ supabase: { from: mockFrom } }));

      const { getSeasonReviewDetails } = await import('@/lib/data/seasons');
      const result = await getSeasonReviewDetails('3');

      expect(result).toBeNull();
    });

    it('returns null (not throw) when the query errors', async () => {
      const mockFrom = mockSupabaseFrom({
        seasons: { data: null, error: { message: 'db down' } },
      });
      jest.doMock('@/utils/supabase', () => ({ supabase: { from: mockFrom } }));

      const { getSeasonReviewDetails } = await import('@/lib/data/seasons');
      const result = await getSeasonReviewDetails('3');

      expect(result).toBeNull();
    });

    it('returns null (not throw) when supabase.from throws synchronously', async () => {
      const mockFrom = jest.fn(() => {
        throw new Error('unexpected failure');
      });
      jest.doMock('@/utils/supabase', () => ({ supabase: { from: mockFrom } }));

      const { getSeasonReviewDetails } = await import('@/lib/data/seasons');
      const result = await getSeasonReviewDetails('3');

      expect(result).toBeNull();
    });
  });

  describe('getAllSeasonStats (fetchAllSeasonStatsFromDB aggregation)', () => {
    beforeEach(() => {
      jest.resetModules();
    });

    it('computes win %, goals/game, attendance %, and per-match stat averages from hand-computed fixture data', async () => {
      const seasons = [{ id: 10, name: '2024/25' }];

      // League match, home, win 3-1, attended, full stats
      const matchA = makeMatch({
        id: 'A',
        spurs_score: 3,
        opponent_score: 1,
        attended: true,
        is_home_match: true,
        home_possession: 60,
        home_total_shots: 15,
        home_shots_on_target: 7,
        home_corners: 6,
      });
      // League match, away, draw 1-1, not attended, full stats
      const matchB = makeMatch({
        id: 'B',
        spurs_score: 1,
        opponent_score: 1,
        attended: false,
        is_home_match: false,
        away_possession: 45,
        away_total_shots: 10,
        away_shots_on_target: 4,
        away_corners: 3,
      });
      // League match, draw 2-2, attended, but NO possession stats -> excluded from stat averages
      const matchF = makeMatch({
        id: 'F',
        spurs_score: 2,
        opponent_score: 2,
        attended: true,
        is_home_match: true,
        home_possession: null,
        away_possession: null,
      });
      // Cup match (FA Cup), scored, attended -> counts toward attendance but not league win/goals
      const matchC = makeMatch({
        id: 'C',
        spurs_score: 2,
        opponent_score: 0,
        attended: true,
        competitions: { name: 'FA Cup' },
      });
      // Friendly, scored -> excluded entirely (neither league nor cup)
      const matchD = makeMatch({
        id: 'D',
        spurs_score: 5,
        opponent_score: 0,
        attended: true,
        competitions: { name: 'Friendly' },
      });
      // Unscored fixture -> excluded entirely
      const matchE = makeMatch({
        id: 'E',
        spurs_score: null,
        opponent_score: null,
      });

      jest.doMock('@/lib/data/generic-fetchers', () => ({
        fetchAllFromDB: jest.fn(async () => seasons),
        fetchByIdFromDB: jest.fn(),
        fetchWithSingleMatchCountFromDB: jest.fn(),
      }));
      jest.doMock('@/lib/data/matches', () => ({
        getSeasonMatches: jest.fn(async () => [matchA, matchB, matchF, matchC, matchD, matchE]),
      }));

      const { getAllSeasonStats } = await import('@/lib/data/seasons');
      const [stats] = await getAllSeasonStats();

      expect(stats.seasonId).toBe(10);
      expect(stats.seasonName).toBe('2024/25');

      // leagueMatches = [A, B, F] -> wins = [A] (3>1); B draw, F draw
      expect(stats.winPercentage).toBeCloseTo(100 / 3, 5);
      // goalsScored = 3+1+2=6 over 3 games; goalsConceded = 1+1+2=4 over 3 games
      expect(stats.goalsPerGame).toBe(2);
      expect(stats.goalsConcededPerGame).toBeCloseTo(4 / 3, 5);

      // allCompetitiveMatches = leagueMatches(3) + cupMatches([C])=4; attended = A,F,C = 3
      expect(stats.attendancePercentage).toBe(75);

      // matchesWithStats = [A, B] only (F has no possession data)
      // possession: A home=60, B away=45 -> avg 52.5
      expect(stats.averagePossession).toBe(52.5);
      // shots: A home=15, B away=10 -> avg 12.5
      expect(stats.averageTotalShots).toBe(12.5);
      // shots on target: A home=7, B away=4 -> avg 5.5
      expect(stats.averageShotsOnTarget).toBe(5.5);
      // corners: A home=6, B away=3 -> avg 4.5
      expect(stats.averageCorners).toBe(4.5);
    });

    it('returns all-zero stats for a season with no scored league matches (avoids division by zero)', async () => {
      const seasons = [{ id: 20, name: '2019/20' }];

      jest.doMock('@/lib/data/generic-fetchers', () => ({
        fetchAllFromDB: jest.fn(async () => seasons),
        fetchByIdFromDB: jest.fn(),
        fetchWithSingleMatchCountFromDB: jest.fn(),
      }));
      jest.doMock('@/lib/data/matches', () => ({
        getSeasonMatches: jest.fn(async () => []),
      }));

      const { getAllSeasonStats } = await import('@/lib/data/seasons');
      const [stats] = await getAllSeasonStats();

      expect(stats.winPercentage).toBe(0);
      expect(stats.goalsPerGame).toBe(0);
      expect(stats.goalsConcededPerGame).toBe(0);
      expect(stats.attendancePercentage).toBe(0);
      expect(stats.averagePossession).toBe(0);
      expect(stats.averageTotalShots).toBe(0);
      expect(stats.averageShotsOnTarget).toBe(0);
      expect(stats.averageCorners).toBe(0);
    });

    it('computes stats independently per season and preserves season order', async () => {
      const seasons = [{ id: 1, name: 'S1' }, { id: 2, name: 'S2' }];

      const winMatch = makeMatch({ spurs_score: 2, opponent_score: 0, attended: true, is_home_match: true, home_possession: 50 });
      const lossMatch = makeMatch({ spurs_score: 0, opponent_score: 1, attended: true, is_home_match: true, home_possession: 40 });

      jest.doMock('@/lib/data/generic-fetchers', () => ({
        fetchAllFromDB: jest.fn(async () => seasons),
        fetchByIdFromDB: jest.fn(),
        fetchWithSingleMatchCountFromDB: jest.fn(),
      }));
      // Keyed by seasonId (rather than call order) so this stays correct
      // regardless of how fetchAllSeasonStatsFromDB schedules its Promise.all.
      const getSeasonMatches = jest.fn(async (seasonId: string) =>
        (seasonId === '1' ? [winMatch] : [lossMatch])
      );
      jest.doMock('@/lib/data/matches', () => ({ getSeasonMatches }));

      const { getAllSeasonStats } = await import('@/lib/data/seasons');
      const results = await getAllSeasonStats();

      expect(results).toHaveLength(2);
      expect(results[0].seasonId).toBe(1);
      expect(results[0].winPercentage).toBe(100);
      expect(results[1].seasonId).toBe(2);
      expect(results[1].winPercentage).toBe(0);
      expect(getSeasonMatches).toHaveBeenCalledWith('1');
      expect(getSeasonMatches).toHaveBeenCalledWith('2');
    });
  });
});
