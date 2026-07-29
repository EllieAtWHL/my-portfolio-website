interface MatchFormNumericFields {
  spurs_score: number | null;
  opponent_score: number | null;
  spurs_score_aet: number | null;
  opponent_score_aet: number | null;
  spurs_score_pens: number | null;
  opponent_score_pens: number | null;
  attendance: number | null;
  home_possession: number | null;
  away_possession: number | null;
  home_total_shots: number | null;
  away_total_shots: number | null;
  home_shots_on_target: number | null;
  away_shots_on_target: number | null;
  home_corners: number | null;
  away_corners: number | null;
}

// Shape of the admin match form state that buildMatchPayload reads from.
// Matches the local `Match`/`MatchForm` shapes in page.tsx / MatchForm.tsx
// structurally, so no import coupling is needed to those page-local types.
export interface MatchFormInput extends Partial<MatchFormNumericFields> {
  season_id?: string;
  competition_id?: string;
  date?: string;
  kickoff_time?: string;
  is_home_match?: boolean;
  stadium_id?: string;
  attended?: boolean;
  notes?: string | null;
  home_team_id?: number;
  away_team_id?: number;
}

// Fields that must default to null (never 0/''/false) when left blank in the
// admin match form, so unscored/incomplete matches aren't misread elsewhere
// (e.g. matches.ts filters on `spurs_score is null` to find upcoming fixtures).
const NULLABLE_NUMERIC_FIELDS: (keyof MatchFormNumericFields)[] = [
  'spurs_score',
  'opponent_score',
  'spurs_score_aet',
  'opponent_score_aet',
  'spurs_score_pens',
  'opponent_score_pens',
  'attendance',
  'home_possession',
  'away_possession',
  'home_total_shots',
  'away_total_shots',
  'home_shots_on_target',
  'away_shots_on_target',
  'home_corners',
  'away_corners',
];

function orNull<T>(value: T | null | undefined): T | null {
  return value !== null && value !== undefined ? value : null;
}

/**
 * Builds the payload sent to /api/admin/matches when creating or updating a
 * match from the admin form. Preserves nulls for any blank score/stat field
 * instead of coercing them to 0.
 */
export function buildMatchPayload(matchForm: MatchFormInput, spursTeam: { id: number }) {
  const nullableFields = Object.fromEntries(
    NULLABLE_NUMERIC_FIELDS.map((field) => [field, orNull(matchForm[field])])
  ) as Record<keyof MatchFormNumericFields, number | null>;

  return {
    season_id: matchForm.season_id,
    competition_id: matchForm.competition_id,
    date: matchForm.date,
    kickoff_time: matchForm.kickoff_time || null,
    is_home_match: matchForm.is_home_match,
    ...nullableFields,
    stadium_id: matchForm.stadium_id || '',
    attended: matchForm.attended || false,
    notes: matchForm.notes || '',
    home_team_id: matchForm.is_home_match ? spursTeam.id : (matchForm.home_team_id || matchForm.away_team_id),
    away_team_id: matchForm.is_home_match ? (matchForm.away_team_id || matchForm.home_team_id) : spursTeam.id,
  };
}
