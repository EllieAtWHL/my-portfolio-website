// A match's result from Tottenham's point of view, following the usual football
// record-keeping convention:
// - a blank score means the match hasn't been played/scored yet (scores are
//   stored as null, never 0, for exactly this reason - see CLAUDE.md), so
//   that's "no result", not a 0-0 draw;
// - extra time counts: a match level at 90 minutes but won after extra time is
//   a win (spurs_score/opponent_score hold the 90-minute score, the _aet
//   columns the score after extra time);
// - a penalty shootout does NOT change the result: a match still level after
//   extra time is a draw in the record, with the shootout reported separately
//   by getShootoutWinner.
export type MatchResult = 'W' | 'D' | 'L';

export interface MatchScoreFields {
  spurs_score?: number | null;
  opponent_score?: number | null;
  spurs_score_aet?: number | null;
  opponent_score_aet?: number | null;
  spurs_score_pens?: number | null;
  opponent_score_pens?: number | null;
}

/** The deciding score: after extra time when it was played, else 90 minutes. */
export function getFinalScore(match: MatchScoreFields): { spurs: number; opponent: number } | null {
  if (match.spurs_score == null || match.opponent_score == null) {
    return null;
  }
  if (match.spurs_score_aet != null && match.opponent_score_aet != null) {
    return { spurs: match.spurs_score_aet, opponent: match.opponent_score_aet };
  }
  return { spurs: match.spurs_score, opponent: match.opponent_score };
}

export function getMatchResult(match: MatchScoreFields): MatchResult | null {
  const score = getFinalScore(match);
  if (!score) return null;
  if (score.spurs === score.opponent) return 'D';
  return score.spurs > score.opponent ? 'W' : 'L';
}

/** Who won a penalty shootout, or null if there wasn't one. */
export function getShootoutWinner(match: MatchScoreFields): 'spurs' | 'opponent' | null {
  if (match.spurs_score_pens == null || match.opponent_score_pens == null || match.spurs_score_pens === match.opponent_score_pens) {
    return null;
  }
  return match.spurs_score_pens > match.opponent_score_pens ? 'spurs' : 'opponent';
}
