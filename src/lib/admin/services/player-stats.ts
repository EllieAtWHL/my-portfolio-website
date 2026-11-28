import { z } from 'zod';
import { invalidatePlayerStatsCache } from '@/lib/data/cache-invalidation';
import { createCrudService, type Row } from './crud';
import { AdminServiceError } from './errors';
import { blankable, count, nonNegativeInt, teamId, uuid } from './schema-helpers';

const bool = z.boolean({ error: 'must be true or false' });
// NOT NULL columns with a 0 default: a missing value takes the default, but
// an explicit null is rejected here rather than by the database.
const tally = (max: number) => nonNegativeInt.max(max, { error: `must be at most ${max}` }).optional();
const minute = count(150).optional();
const stat = count(500).optional();

export const playerStatsFields = z.object({
  player_id: uuid,
  match_id: uuid,
  team_id: teamId,
  started: bool.optional(),
  captain: bool.nullable().optional(),
  was_substitute: bool.optional(),
  was_unused_substitute: bool.optional(),
  minute_on: minute,
  minute_off: minute,
  minutes_played: minute,
  goals: tally(20),
  assists: tally(20),
  yellow_cards: tally(2),
  red_cards: tally(1),
  clean_sheet: bool.nullable().optional(),
  saves: stat,
  shots: stat,
  shots_on_target: stat,
  passes_completed: stat,
  passes_attempted: stat,
  tackles: stat,
  interceptions: stat,
  clearances: stat,
  fouls_committed: stat,
  fouls_won: stat,
  offsides: stat,
  player_rating: blankable(
    z.number({ error: 'must be a number' }).min(0, { error: 'must be 0-10' }).max(10, { error: 'must be 0-10' })
  ).optional(),
  player_of_the_match: bool.optional(),
});

const num = (value: unknown) => (typeof value === 'number' ? value : null);

function checkPlayerStats(row: Row): string[] {
  const errors: string[] = [];
  const pairs: [string, string, string][] = [
    ['minute_on', 'minute_off', 'Minute off can\'t be before minute on.'],
    ['shots_on_target', 'shots', 'Shots on target can\'t be more than shots.'],
    ['passes_completed', 'passes_attempted', 'Passes completed can\'t be more than passes attempted.'],
  ];
  for (const [lower, upper, message] of pairs) {
    const low = num(row[lower]);
    const high = num(row[upper]);
    if (low !== null && high !== null && low > high) errors.push(message);
  }
  if (errors.length > 0) throw new AdminServiceError(errors.join(' '));
  return [];
}

const playerStatsService = createCrudService({
  table: 'player_stats',
  label: 'Player stats',
  idSchema: uuid,
  fields: playerStatsFields,
  check: checkPlayerStats,
  invalidate: invalidatePlayerStatsCache,
  // One row per player per match: saving stats for a pair that already has
  // a row updates it instead of failing on the unique constraint.
  upsertOnConflict: 'player_id, match_id',
});

export const createPlayerStats = playerStatsService.create;
export const updatePlayerStats = playerStatsService.update;
export const deletePlayerStats = playerStatsService.remove;
