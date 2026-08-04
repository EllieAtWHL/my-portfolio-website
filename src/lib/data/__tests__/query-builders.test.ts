import { describe, it, expect, beforeEach } from '@jest/globals';

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- param exists only to give the mock the right call signature
const mockSelect = jest.fn((_query: string) => 'select-result');
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- param exists only to give the mock the right call signature
const mockFrom = jest.fn((_table: string) => ({ select: mockSelect }));

jest.mock('@/utils/supabase', () => ({
  supabase: { from: (table: string) => mockFrom(table) },
}));

import {
  buildMatchQuery,
  buildMatchNavQuery,
  buildPlayerStatsQuery,
  buildPlayerHistoryQuery,
  buildTeamWithRelationsQuery,
  buildStadiumWithRelationsQuery,
} from '../query-builders';

describe('query-builders', () => {
  beforeEach(() => {
    mockFrom.mockClear();
    mockSelect.mockClear();
  });

  describe('buildMatchQuery', () => {
    it('queries the matches_with_stadium table', () => {
      buildMatchQuery();
      expect(mockFrom).toHaveBeenCalledWith('matches_with_stadium');
      expect(mockFrom).toHaveBeenCalledTimes(1);
    });

    it('selects all match fields plus home/away team and competition joins', () => {
      buildMatchQuery();
      const selectArg = mockSelect.mock.calls[0][0] as string;

      expect(selectArg).toContain('*');
      expect(selectArg).toContain(
        'home_team:home_team_id(id, name, short_name, primary_color, secondary_color, is_tottenham)'
      );
      expect(selectArg).toContain(
        'away_team:away_team_id(id, name, short_name, primary_color, secondary_color, is_tottenham)'
      );
      expect(selectArg).toContain('competitions:competition_id(name, icon_svg)');
    });

    it('returns the chain produced by select', () => {
      const result = buildMatchQuery();
      expect(result).toBe('select-result');
    });
  });

  describe('buildMatchNavQuery', () => {
    it('queries the matches_with_stadium table', () => {
      buildMatchNavQuery();
      expect(mockFrom).toHaveBeenCalledWith('matches_with_stadium');
    });

    it('selects only the lightweight nav fields (no stats, no competitions)', () => {
      buildMatchNavQuery();
      const selectArg = mockSelect.mock.calls[0][0] as string;

      expect(selectArg).toContain('id');
      expect(selectArg).toContain('date');
      expect(selectArg).toContain('home_team:home_team_id(id, name, short_name)');
      expect(selectArg).toContain('away_team:away_team_id(id, name, short_name)');
      // Must NOT pull in the heavier fields buildMatchQuery pulls in
      expect(selectArg).not.toContain('primary_color');
      expect(selectArg).not.toContain('competitions');
      expect(selectArg.trim()).not.toBe('*');
    });
  });

  describe('buildPlayerStatsQuery', () => {
    it('queries the player_stats table', () => {
      buildPlayerStatsQuery();
      expect(mockFrom).toHaveBeenCalledWith('player_stats');
    });

    it('selects stats plus player, team and match joins', () => {
      buildPlayerStatsQuery();
      const selectArg = mockSelect.mock.calls[0][0] as string;

      expect(selectArg).toContain('*');
      expect(selectArg).toContain('player:players(id, first_name, last_name, squad_number)');
      expect(selectArg).toContain('team:teams(id, name, short_name)');
      expect(selectArg).toContain(
        'match:matches(id, date, home_team_id, away_team_id, spurs_score, opponent_score)'
      );
    });
  });

  describe('buildPlayerHistoryQuery', () => {
    it('queries the player_history table', () => {
      buildPlayerHistoryQuery();
      expect(mockFrom).toHaveBeenCalledWith('player_history');
    });

    it('selects history plus player and team joins (no squad_number, unlike stats)', () => {
      buildPlayerHistoryQuery();
      const selectArg = mockSelect.mock.calls[0][0] as string;

      expect(selectArg).toContain('*');
      expect(selectArg).toContain('player:players(id, first_name, last_name)');
      expect(selectArg).toContain('team:teams(id, name, short_name)');
      expect(selectArg).not.toContain('squad_number');
      expect(selectArg).not.toContain('match:matches');
    });
  });

  describe('buildTeamWithRelationsQuery', () => {
    it('queries the teams table and selects all columns with no joins', () => {
      buildTeamWithRelationsQuery();
      expect(mockFrom).toHaveBeenCalledWith('teams');
      expect(mockSelect).toHaveBeenCalledWith('*');
    });
  });

  describe('buildStadiumWithRelationsQuery', () => {
    it('queries the stadia table', () => {
      buildStadiumWithRelationsQuery();
      expect(mockFrom).toHaveBeenCalledWith('stadia');
    });

    it('selects stadium fields plus the home_team join', () => {
      buildStadiumWithRelationsQuery();
      const selectArg = mockSelect.mock.calls[0][0] as string;

      expect(selectArg).toContain('*');
      expect(selectArg).toContain(
        'home_team:home_team_id(id, name, short_name, primary_color, secondary_color, is_tottenham)'
      );
    });
  });
});
