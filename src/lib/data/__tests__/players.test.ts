import { describe, it, expect, jest } from '@jest/globals';
import { mockSupabaseFrom } from '@/test-utils/supabase-query-mock';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function makePlayer(overrides: Record<string, any> = {}) {
  return {
    id: 'player-1',
    first_name: 'Bethany',
    last_name: 'England',
    date_of_birth: '1994-06-09',
    nationality: 'England',
    position: 'Forward',
    height_cm: 173,
    weight_kg: 65,
    profile_image_url: null,
    squad_number: null,
    is_active: true,
    created_at: '2020-01-01T00:00:00.000Z',
    updated_at: '2020-01-01T00:00:00.000Z',
    player_history: [],
    ...overrides,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function makeStatRow(overrides: Record<string, any> = {}) {
  return {
    id: 'stat-1',
    player_id: 'player-1',
    match_id: 'match-1',
    team_id: 1,
    started: true,
    was_substitute: false,
    was_unused_substitute: false,
    minute_on: 0,
    minute_off: null,
    minutes_played: 90,
    goals: 1,
    assists: 0,
    yellow_cards: 0,
    red_cards: 0,
    clean_sheet: null,
    saves: null,
    shots: 3,
    shots_on_target: 2,
    passes_completed: 40,
    passes_attempted: 50,
    tackles: 1,
    interceptions: 2,
    clearances: 0,
    fouls_committed: 1,
    fouls_won: 2,
    offsides: 0,
    player_rating: 7.5,
    player_of_the_match: false,
    created_at: '2024-01-01T00:00:00.000Z',
    player: makePlayer(),
    ...overrides,
  };
}

describe('players data layer', () => {
  describe('getPlayersByMatch', () => {
    it('maps player_stats rows to PlayerWithStats, resolving squad_number from active Tottenham history', async () => {
      jest.resetModules();
      const statRow = makeStatRow({
        player: makePlayer({
          player_history: [
            { team_id: 2, squad_number: 99, left_on: null }, // wrong team, ignored
            { team_id: 1, squad_number: 9, left_on: null }, // active Tottenham history
          ],
        }),
      });
      const mockFrom = mockSupabaseFrom({
        player_stats: { data: [statRow], error: null },
      });
      jest.doMock('@/utils/supabase', () => ({ supabase: { from: mockFrom } }));

      const { getPlayersByMatch } = await import('@/lib/data/players');
      const result = await getPlayersByMatch('match-1');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('player-1');
      expect(result[0].squad_number).toBe(9);
      expect(result[0].player_stats).toMatchObject({
        id: 'stat-1',
        player_id: 'player-1',
        match_id: 'match-1',
        goals: 1,
        player_rating: 7.5,
      });
    });

    it('returns squad_number null when the only history entry has already left the team', async () => {
      jest.resetModules();
      const statRow = makeStatRow({
        player: makePlayer({
          player_history: [{ team_id: 1, squad_number: 9, left_on: '2000-01-01' }],
        }),
      });
      const mockFrom = mockSupabaseFrom({
        player_stats: { data: [statRow], error: null },
      });
      jest.doMock('@/utils/supabase', () => ({ supabase: { from: mockFrom } }));

      const { getPlayersByMatch } = await import('@/lib/data/players');
      const result = await getPlayersByMatch('match-1');

      expect(result[0].squad_number).toBeNull();
    });

    it('returns squad_number null when a future left_on has not yet taken effect (still counts as active)', async () => {
      jest.resetModules();
      const statRow = makeStatRow({
        player: makePlayer({
          player_history: [{ team_id: 1, squad_number: 4, left_on: '2099-01-01' }],
        }),
      });
      const mockFrom = mockSupabaseFrom({
        player_stats: { data: [statRow], error: null },
      });
      jest.doMock('@/utils/supabase', () => ({ supabase: { from: mockFrom } }));

      const { getPlayersByMatch } = await import('@/lib/data/players');
      const result = await getPlayersByMatch('match-1');

      // left_on is in the future, so this history record is still "current" -> squad number applies
      expect(result[0].squad_number).toBe(4);
    });

    it('returns squad_number null when player has no player_history at all', async () => {
      jest.resetModules();
      const statRow = makeStatRow({ player: makePlayer({ player_history: undefined }) });
      const mockFrom = mockSupabaseFrom({
        player_stats: { data: [statRow], error: null },
      });
      jest.doMock('@/utils/supabase', () => ({ supabase: { from: mockFrom } }));

      const { getPlayersByMatch } = await import('@/lib/data/players');
      const result = await getPlayersByMatch('match-1');

      expect(result[0].squad_number).toBeNull();
    });

    it('propagates the error when the query fails', async () => {
      jest.resetModules();
      const mockFrom = mockSupabaseFrom({
        player_stats: { data: null, error: { message: 'db down' } },
      });
      jest.doMock('@/utils/supabase', () => ({ supabase: { from: mockFrom } }));

      const { getPlayersByMatch } = await import('@/lib/data/players');
      await expect(getPlayersByMatch('match-1')).rejects.toBeTruthy();
    });
  });

  describe('getTeamLineupsByMatch', () => {
    it('groups player_stats rows by team_id into separate lineups', async () => {
      jest.resetModules();
      const rowTeam1 = makeStatRow({
        id: 'stat-1',
        team_id: 1,
        player_id: 'p1',
        player: makePlayer({ id: 'p1', last_name: 'Blindkilde Brown' }),
      });
      const rowTeam2a = makeStatRow({
        id: 'stat-2',
        team_id: 2,
        player_id: 'p2',
        player: makePlayer({ id: 'p2', last_name: 'Opponent One' }),
      });
      const rowTeam2b = makeStatRow({
        id: 'stat-3',
        team_id: 2,
        player_id: 'p3',
        player: makePlayer({ id: 'p3', last_name: 'Opponent Two' }),
      });

      const mockFrom = mockSupabaseFrom({
        player_history: { data: [], error: null },
        player_stats: { data: [rowTeam1, rowTeam2a, rowTeam2b], error: null },
      });
      jest.doMock('@/utils/supabase', () => ({ supabase: { from: mockFrom } }));

      const { getTeamLineupsByMatch } = await import('@/lib/data/players');
      const result = await getTeamLineupsByMatch('match-1');

      expect(result).toHaveLength(2);

      const team1 = result.find((t) => t.team_id === 1);
      const team2 = result.find((t) => t.team_id === 2);

      expect(team1?.players).toHaveLength(1);
      expect(team1?.players[0].id).toBe('p1');

      expect(team2?.players).toHaveLength(2);
      expect(team2?.players.map((p) => p.id)).toEqual(['p2', 'p3']);
    });

    it('parses team_id keys as numbers, not strings', async () => {
      jest.resetModules();
      const row = makeStatRow({ team_id: 42 });
      const mockFrom = mockSupabaseFrom({
        player_history: { data: [], error: null },
        player_stats: { data: [row], error: null },
      });
      jest.doMock('@/utils/supabase', () => ({ supabase: { from: mockFrom } }));

      const { getTeamLineupsByMatch } = await import('@/lib/data/players');
      const result = await getTeamLineupsByMatch('match-1');

      expect(result[0].team_id).toBe(42);
      expect(typeof result[0].team_id).toBe('number');
    });

    it('propagates the error when the player_stats query fails', async () => {
      jest.resetModules();
      const mockFrom = mockSupabaseFrom({
        player_history: { data: [], error: null },
        player_stats: { data: null, error: { message: 'db down' } },
      });
      jest.doMock('@/utils/supabase', () => ({ supabase: { from: mockFrom } }));

      const { getTeamLineupsByMatch } = await import('@/lib/data/players');
      await expect(getTeamLineupsByMatch('match-1')).rejects.toBeTruthy();
    });
  });

  describe('getPlayerById', () => {
    it('returns the player on success', async () => {
      jest.resetModules();
      const player = makePlayer({ id: 'player-42' });
      const mockFrom = mockSupabaseFrom({
        players: { data: player, error: null },
      });
      jest.doMock('@/utils/supabase', () => ({ supabase: { from: mockFrom } }));

      const { getPlayerById } = await import('@/lib/data/players');
      const result = await getPlayerById('player-42');

      expect(result).toEqual(player);
    });

    it('resolves squad_number from active Tottenham history rather than the players table', async () => {
      // squad_number doesn't live on the players table - it's per team_id stint
      // in player_history, since it can change (e.g. a renumbering).
      jest.resetModules();
      const player = makePlayer({
        id: 'player-42',
        player_history: [
          { team_id: 5, squad_number: 99, left_on: null }, // different team, ignored
          { team_id: 1, squad_number: 32, left_on: '2020-01-01' }, // past Tottenham stint, ignored
          { team_id: 1, squad_number: 7, left_on: null }, // current Tottenham stint
        ],
      });
      const mockFrom = mockSupabaseFrom({
        players: { data: player, error: null },
      });
      jest.doMock('@/utils/supabase', () => ({ supabase: { from: mockFrom } }));

      const { getPlayerById } = await import('@/lib/data/players');
      const result = await getPlayerById('player-42');

      expect(result?.squad_number).toBe(7);
    });

    it('returns null (not throw) when the query errors', async () => {
      jest.resetModules();
      const mockFrom = mockSupabaseFrom({
        players: { data: null, error: { message: 'not found' } },
      });
      jest.doMock('@/utils/supabase', () => ({ supabase: { from: mockFrom } }));

      const { getPlayerById } = await import('@/lib/data/players');
      const result = await getPlayerById('missing');

      expect(result).toBeNull();
    });
  });

  describe('getActivePlayers', () => {
    it('returns the active players list on success', async () => {
      jest.resetModules();
      const players = [makePlayer({ id: 'a' }), makePlayer({ id: 'b' })];
      const mockFrom = mockSupabaseFrom({
        players: { data: players, error: null },
      });
      jest.doMock('@/utils/supabase', () => ({ supabase: { from: mockFrom } }));

      const { getActivePlayers } = await import('@/lib/data/players');
      const result = await getActivePlayers();

      expect(result).toEqual(players);
    });

    it('resolves squad_number from active Tottenham history for each player', async () => {
      jest.resetModules();
      const players = [
        makePlayer({ id: 'a', player_history: [{ team_id: 1, squad_number: 4, left_on: null }] }),
        makePlayer({ id: 'b', player_history: [{ team_id: 1, squad_number: 11, left_on: null }] }),
      ];
      const mockFrom = mockSupabaseFrom({
        players: { data: players, error: null },
      });
      jest.doMock('@/utils/supabase', () => ({ supabase: { from: mockFrom } }));

      const { getActivePlayers } = await import('@/lib/data/players');
      const result = await getActivePlayers();

      expect(result.map((p) => p.squad_number)).toEqual([4, 11]);
    });

    it('throws when the query fails', async () => {
      jest.resetModules();
      const mockFrom = mockSupabaseFrom({
        players: { data: null, error: { message: 'db down' } },
      });
      jest.doMock('@/utils/supabase', () => ({ supabase: { from: mockFrom } }));

      const { getActivePlayers } = await import('@/lib/data/players');
      await expect(getActivePlayers()).rejects.toBeTruthy();
    });
  });
});
