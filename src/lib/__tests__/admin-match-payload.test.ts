import { describe, it, expect } from '@jest/globals';
import { buildMatchPayload, MatchFormInput } from '../admin-match-payload';

const spursTeam = { id: 1 };

const baseForm: MatchFormInput = {
  season_id: 'season-1',
  competition_id: 'comp-1',
  date: '2026-08-09',
  kickoff_time: '15:00:00',
  is_home_match: true,
  away_team_id: 2,
  stadium_id: 'stadium-1',
  attended: true,
  notes: 'Season opener',
};

describe('buildMatchPayload', () => {
  it('defaults every blank score/stat field to null, not 0', () => {
    const payload = buildMatchPayload(baseForm, spursTeam);

    expect(payload.spurs_score).toBeNull();
    expect(payload.opponent_score).toBeNull();
    expect(payload.spurs_score_aet).toBeNull();
    expect(payload.opponent_score_aet).toBeNull();
    expect(payload.spurs_score_pens).toBeNull();
    expect(payload.opponent_score_pens).toBeNull();
    expect(payload.attendance).toBeNull();
    expect(payload.home_possession).toBeNull();
    expect(payload.away_possession).toBeNull();
    expect(payload.home_total_shots).toBeNull();
    expect(payload.away_total_shots).toBeNull();
    expect(payload.home_shots_on_target).toBeNull();
    expect(payload.away_shots_on_target).toBeNull();
    expect(payload.home_corners).toBeNull();
    expect(payload.away_corners).toBeNull();
  });

  it('preserves a real score of 0 (a genuine 0-0 draw) instead of treating it as blank', () => {
    const payload = buildMatchPayload(
      { ...baseForm, spurs_score: 0, opponent_score: 0 },
      spursTeam
    );

    expect(payload.spurs_score).toBe(0);
    expect(payload.opponent_score).toBe(0);
  });

  it('preserves non-zero scores and stats as-is', () => {
    const payload = buildMatchPayload(
      {
        ...baseForm,
        spurs_score: 3,
        opponent_score: 1,
        home_possession: 55,
        home_corners: 6,
      },
      spursTeam
    );

    expect(payload.spurs_score).toBe(3);
    expect(payload.opponent_score).toBe(1);
    expect(payload.home_possession).toBe(55);
    expect(payload.home_corners).toBe(6);
  });

  it('defaults a blank kickoff_time to null rather than an empty string', () => {
    const payload = buildMatchPayload({ ...baseForm, kickoff_time: '' }, spursTeam);
    expect(payload.kickoff_time).toBeNull();
  });

  it('assigns Spurs as the home team and the selected opponent as away when is_home_match is true', () => {
    const payload = buildMatchPayload({ ...baseForm, is_home_match: true, away_team_id: 7 }, spursTeam);

    expect(payload.home_team_id).toBe(spursTeam.id);
    expect(payload.away_team_id).toBe(7);
  });

  it('assigns Spurs as the away team and the selected opponent as home when is_home_match is false', () => {
    const payload = buildMatchPayload(
      { ...baseForm, is_home_match: false, home_team_id: 9, away_team_id: undefined },
      spursTeam
    );

    expect(payload.home_team_id).toBe(9);
    expect(payload.away_team_id).toBe(spursTeam.id);
  });

  it('passes through season, competition, date and stadium unchanged', () => {
    const payload = buildMatchPayload(baseForm, spursTeam);

    expect(payload.season_id).toBe('season-1');
    expect(payload.competition_id).toBe('comp-1');
    expect(payload.date).toBe('2026-08-09');
    expect(payload.stadium_id).toBe('stadium-1');
  });
});
