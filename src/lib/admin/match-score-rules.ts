// Consistency rules for a match's score fields (WEB-83). Pure, with no server
// imports, so the admin match form can show the same errors and warnings live
// that the match service enforces on save.
//
// spurs_score/opponent_score are the 90-minute score, *_aet the score after
// extra time, *_pens the penalty shootout. getFinalScore/getMatchResult in
// src/lib/utils/match-result.ts rely on these being consistent: a half-entered
// pair is silently ignored there, so the result and goal totals would be wrong
// everywhere.

export interface MatchScores {
  spurs_score?: number | null;
  opponent_score?: number | null;
  spurs_score_aet?: number | null;
  opponent_score_aet?: number | null;
  spurs_score_pens?: number | null;
  opponent_score_pens?: number | null;
}

export interface MatchScoreCheck {
  /** Block the save. */
  errors: string[];
  /** Shown to the user, but the save goes ahead. */
  warnings: string[];
}

export const PENS_WITHOUT_EXTRA_TIME_WARNING =
  'Penalties are entered with no extra-time score. Did this match go to extra time? If so, enter the extra-time score, even if nobody scored.';

type Pair = { spurs: number; opponent: number } | null;

const isSet = (value: number | null | undefined): value is number =>
  value !== null && value !== undefined;

/** The pair if both sides are entered, null if neither; records an error if only one is. */
function readPair(
  spurs: number | null | undefined,
  opponent: number | null | undefined,
  label: string,
  errors: string[]
): Pair {
  if (isSet(spurs) && isSet(opponent)) return { spurs, opponent };
  if (isSet(spurs) || isSet(opponent)) {
    errors.push(`Enter both ${label} scores, or neither.`);
  }
  return null;
}

export function checkMatchScores(scores: MatchScores): MatchScoreCheck {
  const errors: string[] = [];
  const warnings: string[] = [];

  const fullTime = readPair(scores.spurs_score, scores.opponent_score, '90-minute', errors);
  const extraTime = readPair(scores.spurs_score_aet, scores.opponent_score_aet, 'extra-time', errors);
  const pens = readPair(scores.spurs_score_pens, scores.opponent_score_pens, 'penalty', errors);

  if (extraTime) {
    if (!fullTime) {
      errors.push('An extra-time score needs a 90-minute score too.');
    } else if (fullTime.spurs !== fullTime.opponent) {
      errors.push('Extra time is only possible when the 90-minute score is level.');
    } else if (extraTime.spurs < fullTime.spurs || extraTime.opponent < fullTime.opponent) {
      errors.push('The extra-time score includes the 90-minute goals, so it can\'t be lower than the 90-minute score.');
    }
  }

  if (pens) {
    const deciding = extraTime ?? fullTime;
    if (!deciding) {
      errors.push('A penalty shootout needs a 90-minute score too.');
    } else if (deciding.spurs !== deciding.opponent) {
      errors.push(
        extraTime
          ? 'Penalties are only possible when the extra-time score is level.'
          : 'Penalties are only possible when the 90-minute score is level.'
      );
    }
    if (pens.spurs === pens.opponent) {
      errors.push('A penalty shootout can\'t end level.');
    }
    // Not an error: some competitions go straight to penalties (every League
    // Cup shootout on record so far), but FA Cup ties have been entered
    // without their extra-time score by mistake before. Only worth saying
    // once the scores are otherwise valid.
    if (!extraTime && errors.length === 0) {
      warnings.push(PENS_WITHOUT_EXTRA_TIME_WARNING);
    }
  }

  return { errors, warnings };
}
