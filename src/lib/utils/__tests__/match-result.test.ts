import { getFinalScore, getMatchResult, getShootoutWinner } from '../match-result';

describe('getMatchResult', () => {
  it('returns null for an unscored fixture rather than a 0-0 draw', () => {
    expect(getMatchResult({ spurs_score: null, opponent_score: null })).toBeNull();
    expect(getMatchResult({})).toBeNull();
    expect(getMatchResult({ spurs_score: 1, opponent_score: null })).toBeNull();
  });

  it('treats a genuine 0-0 as a draw', () => {
    expect(getMatchResult({ spurs_score: 0, opponent_score: 0 })).toBe('D');
  });

  it('scores a win, draw and loss in 90 minutes', () => {
    expect(getMatchResult({ spurs_score: 3, opponent_score: 1 })).toBe('W');
    expect(getMatchResult({ spurs_score: 2, opponent_score: 2 })).toBe('D');
    expect(getMatchResult({ spurs_score: 0, opponent_score: 4 })).toBe('L');
  });

  it('uses the after-extra-time score when extra time was played', () => {
    // 2024 FA Cup semi-final v Leicester: 1-1 at 90, 2-1 AET.
    expect(getMatchResult({ spurs_score: 1, opponent_score: 1, spurs_score_aet: 2, opponent_score_aet: 1 })).toBe('W');
    expect(getMatchResult({ spurs_score: 1, opponent_score: 1, spurs_score_aet: 1, opponent_score_aet: 2 })).toBe('L');
  });

  it('ignores a half-entered extra-time score', () => {
    expect(getMatchResult({ spurs_score: 1, opponent_score: 1, spurs_score_aet: 2, opponent_score_aet: null })).toBe('D');
  });

  it('records a match decided on penalties as a draw', () => {
    // 2023 League Cup v Arsenal: 3-3, lost 3-4 on penalties.
    expect(getMatchResult({ spurs_score: 3, opponent_score: 3, spurs_score_pens: 3, opponent_score_pens: 4 })).toBe('D');
    expect(getMatchResult({
      spurs_score: 0, opponent_score: 0, spurs_score_aet: 0, opponent_score_aet: 0, spurs_score_pens: 5, opponent_score_pens: 4,
    })).toBe('D');
  });
});

describe('getFinalScore', () => {
  it('returns null when unscored', () => {
    expect(getFinalScore({ spurs_score: null, opponent_score: 2 })).toBeNull();
  });

  it('prefers the extra-time score over the 90-minute one', () => {
    expect(getFinalScore({ spurs_score: 1, opponent_score: 1 })).toEqual({ spurs: 1, opponent: 1 });
    expect(getFinalScore({ spurs_score: 1, opponent_score: 1, spurs_score_aet: 2, opponent_score_aet: 1 })).toEqual({ spurs: 2, opponent: 1 });
  });
});

describe('getShootoutWinner', () => {
  it('returns null when there was no shootout', () => {
    expect(getShootoutWinner({ spurs_score: 2, opponent_score: 1 })).toBeNull();
    expect(getShootoutWinner({ spurs_score_pens: 3, opponent_score_pens: null })).toBeNull();
  });

  it('names the shootout winner', () => {
    expect(getShootoutWinner({ spurs_score_pens: 5, opponent_score_pens: 4 })).toBe('spurs');
    expect(getShootoutWinner({ spurs_score_pens: 3, opponent_score_pens: 4 })).toBe('opponent');
  });

  it('returns null for an impossible level shootout rather than guessing', () => {
    expect(getShootoutWinner({ spurs_score_pens: 4, opponent_score_pens: 4 })).toBeNull();
  });
});
