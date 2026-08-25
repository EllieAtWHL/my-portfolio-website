import { describe, it, expect, beforeEach } from '@jest/globals';

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- param exists only to give the mock the right call signature
const mockSelect = jest.fn((_query: string) => 'select-result');
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- param exists only to give the mock the right call signature
const mockFrom = jest.fn((_table: string) => ({ select: mockSelect }));

jest.mock('@/utils/supabase', () => ({
  supabase: { from: (table: string) => mockFrom(table) },
}));

import { buildMatchQuery, buildMatchNavQuery } from '../query-builders';

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

});
