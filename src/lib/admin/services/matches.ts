import { z } from 'zod';
import { invalidateMatchCache, invalidateStadiumCache } from '@/lib/data/cache-invalidation';
import { checkMatchScores } from '@/lib/admin/match-score-rules';
import { createCrudService, type Row } from './crud';
import { AdminServiceError } from './errors';
import { blankable, count, isoDate, optionalText, teamId, uuid } from './schema-helpers';

const score = count(99).optional();
const percentage = blankable(
  z.number({ error: 'must be a number' }).min(0, { error: 'must be 0-100' }).max(100, { error: 'must be 0-100' })
).optional();

// The writable columns of `matches`. Built by buildMatchPayload
// (src/lib/admin-match-payload.ts) in the admin form; blank scores and stats
// arrive as null and stay null - never 0 (matches.ts reads a null
// spurs_score as "not played yet").
export const matchFields = z.object({
  season_id: uuid,
  competition_id: uuid,
  date: isoDate,
  kickoff_time: blankable(
    z.string().regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/, { error: 'must be a time (HH:MM)' })
  ).optional(),
  is_home_match: z.boolean({ error: 'must be true or false' }),
  is_neutral_venue: z.boolean({ error: 'must be true or false' }).nullable().optional(),
  home_team_id: teamId,
  away_team_id: teamId,
  stadium_id: blankable(uuid).optional(),
  attended: z.boolean({ error: 'must be true or false' }).optional(),
  notes: optionalText(5000).optional(),
  spurs_score: score,
  opponent_score: score,
  spurs_score_aet: score,
  opponent_score_aet: score,
  spurs_score_pens: score,
  opponent_score_pens: score,
  attendance: count(200_000).optional(),
  home_possession: percentage,
  away_possession: percentage,
  home_total_shots: count(100).optional(),
  away_total_shots: count(100).optional(),
  home_shots_on_target: count(100).optional(),
  away_shots_on_target: count(100).optional(),
  home_corners: count(50).optional(),
  away_corners: count(50).optional(),
});

const num = (value: unknown) => (typeof value === 'number' ? value : null);

function checkMatch(row: Row): string[] {
  const errors: string[] = [];

  if (row.home_team_id === row.away_team_id) {
    errors.push('The home and away teams must be different.');
  }
  for (const side of ['home', 'away'] as const) {
    const onTarget = num(row[`${side}_shots_on_target`]);
    const total = num(row[`${side}_total_shots`]);
    if (onTarget !== null && total !== null && onTarget > total) {
      errors.push(`${side === 'home' ? 'Home' : 'Away'} shots on target can't be more than total shots.`);
    }
  }

  const scores = checkMatchScores({
    spurs_score: num(row.spurs_score),
    opponent_score: num(row.opponent_score),
    spurs_score_aet: num(row.spurs_score_aet),
    opponent_score_aet: num(row.opponent_score_aet),
    spurs_score_pens: num(row.spurs_score_pens),
    opponent_score_pens: num(row.opponent_score_pens),
  });
  errors.push(...scores.errors);

  if (errors.length > 0) {
    throw new AdminServiceError(errors.join(' '));
  }
  return scores.warnings;
}

const matchService = createCrudService({
  table: 'matches',
  label: 'Match',
  idSchema: uuid,
  fields: matchFields,
  check: checkMatch,
  invalidate: () => {
    invalidateMatchCache();
    // Saving a match at a Groundhopper-only ground promotes it to a Spurs
    // Women ground (WEB-224 trigger), so stadium pages and lists change too.
    invalidateStadiumCache();
  },
});

export const createMatch = matchService.create;
export const updateMatch = matchService.update;
export const deleteMatch = matchService.remove;
