import type { Match } from '@/lib/data/matches';

/**
 * A complete, scored `Match` (Spurs 2-1 Chelsea at home in the WSL, no extra
 * time or penalties) for component tests. Pass overrides for the fields a test
 * cares about, so adding a column to `Match` means updating one fixture.
 */
export const makeMatch = (overrides: Partial<Match> = {}): Match => ({
  id: 'match-1',
  date: '2026-03-01',
  kickoff_time: '15:00',
  home_team: { id: 1, name: 'Tottenham Hotspur', short_name: 'Spurs', primary_color: '#132257', secondary_color: '#ffffff', is_tottenham: true },
  away_team: { id: 2, name: 'Chelsea', short_name: 'Chelsea', primary_color: '#034694', secondary_color: '#ffffff', is_tottenham: false },
  spurs_score: 2,
  opponent_score: 1,
  spurs_score_aet: null,
  opponent_score_aet: null,
  spurs_score_pens: null,
  opponent_score_pens: null,
  attended: false,
  is_home_match: true,
  is_neutral_venue: false,
  stadium_id: 'stadium-1',
  stadium_display_name: 'Tottenham Hotspur Stadium',
  stadium_slug: 'tottenham-hotspur-stadium',
  attendance: null,
  notes: null,
  competitions: { name: 'Womens Super League' },
  season_id: 'season-1',
  home_possession: null,
  away_possession: null,
  home_total_shots: null,
  away_total_shots: null,
  home_shots_on_target: null,
  away_shots_on_target: null,
  home_corners: null,
  away_corners: null,
  ...overrides,
});
