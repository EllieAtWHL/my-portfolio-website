import { resolveOpponentName, matchesPlayerStatsSearch } from '../PlayersTabPanel';
import type { Match, PlayerStats, Team } from '@/types/spurs-women-admin';

const spurs: Team = { id: 1, name: 'Tottenham Hotspur', short_name: 'Spurs', is_tottenham: true, primary_color: null, secondary_color: null };
const chelsea: Team = { id: 5, name: 'Chelsea', short_name: 'Chelsea', primary_color: null, secondary_color: null, is_tottenham: false };
const noShortName: Team = { id: 9, name: 'Wolverhampton Wanderers', short_name: '', is_tottenham: false, primary_color: null, secondary_color: null };
const teams = [spurs, chelsea, noShortName];

function makeMatch(overrides: Partial<Match> = {}): Match {
  return {
    id: 'match-1',
    season_id: 'season-1',
    competition_id: 'comp-1',
    date: '2026-03-01',
    kickoff_time: '15:00',
    is_home_match: true,
    spurs_score: 2,
    opponent_score: 1,
    spurs_score_aet: null,
    opponent_score_aet: null,
    spurs_score_pens: null,
    opponent_score_pens: null,
    stadium_id: 'stadium-1',
    stadium_display_name: null,
    attended: false,
    notes: null,
    home_team_id: 1,
    away_team_id: 5,
    attendance: null,
    home_possession: null,
    ...overrides,
  } as Match;
}

function makeStat(overrides: Partial<PlayerStats> = {}): PlayerStats {
  return {
    id: 'stat-1',
    player_id: 'player-1',
    match_id: 'match-1',
    team_id: 1,
    started: true,
    captain: false,
    was_substitute: false,
    was_unused_substitute: false,
    minute_on: null,
    minute_off: null,
    minutes_played: 90,
    goals: 0,
    assists: 0,
    yellow_cards: 0,
    red_cards: 0,
    clean_sheet: null,
    saves: null,
    shots: 0,
    shots_on_target: 0,
    passes_completed: null,
    passes_attempted: null,
    tackles: null,
    interceptions: null,
    clearances: null,
    fouls_committed: null,
    fouls_won: null,
    offsides: null,
    player_rating: null,
    player_of_the_match: false,
    created_at: '2026-03-01T17:00:00.000Z',
    ...overrides,
  };
}

describe('resolveOpponentName', () => {
  it('returns the away team when the player\'s stat is for the home team', () => {
    const match = makeMatch({ home_team_id: 1, away_team_id: 5 });
    const stat = makeStat({ team_id: 1 });

    expect(resolveOpponentName(stat, match, teams)).toBe('Chelsea');
  });

  it('returns the home team when the player\'s stat is for the away team', () => {
    const match = makeMatch({ home_team_id: 5, away_team_id: 1 });
    const stat = makeStat({ team_id: 1 });

    expect(resolveOpponentName(stat, match, teams)).toBe('Chelsea');
  });

  it('falls back to the full name when the opponent has no short_name', () => {
    const match = makeMatch({ home_team_id: 1, away_team_id: 9 });
    const stat = makeStat({ team_id: 1 });

    expect(resolveOpponentName(stat, match, teams)).toBe('Wolverhampton Wanderers');
  });

  it('returns an empty string when the match is not found', () => {
    const stat = makeStat({ team_id: 1 });

    expect(resolveOpponentName(stat, undefined, teams)).toBe('');
  });

  it('returns an empty string when the opponent team is not in the given teams list', () => {
    const match = makeMatch({ home_team_id: 1, away_team_id: 999 });
    const stat = makeStat({ team_id: 1 });

    expect(resolveOpponentName(stat, match, teams)).toBe('');
  });
});

describe('matchesPlayerStatsSearch', () => {
  const matches = [makeMatch({ id: 'match-1', date: '2026-03-01', home_team_id: 1, away_team_id: 5 })];

  it('matches on the match date', () => {
    const stat = makeStat({ match_id: 'match-1', team_id: 1 });

    expect(matchesPlayerStatsSearch(stat, '2026-03', matches, teams)).toBe(true);
    expect(matchesPlayerStatsSearch(stat, '2025', matches, teams)).toBe(false);
  });

  it('matches on the opponent name, case-insensitively', () => {
    const stat = makeStat({ match_id: 'match-1', team_id: 1 });

    expect(matchesPlayerStatsSearch(stat, 'chelsea', matches, teams)).toBe(true);
    expect(matchesPlayerStatsSearch(stat, 'CHELSEA', matches, teams)).toBe(true);
    expect(matchesPlayerStatsSearch(stat, 'arsenal', matches, teams)).toBe(false);
  });

  it('returns false when the stat has no matching match, rather than throwing', () => {
    const stat = makeStat({ match_id: 'does-not-exist', team_id: 1 });

    expect(matchesPlayerStatsSearch(stat, 'chelsea', matches, teams)).toBe(false);
  });
});
