import { z } from 'zod';
import { supabaseAdmin } from '@/lib/admin-api';
import { invalidateStadiumCache } from '@/lib/data/cache-invalidation';
import { createCrudService, type CheckContext, type Row } from './crud';
import { AdminServiceError, fromDatabaseError } from './errors';
import { blankable, isoDate, optionalText, requiredText, teamId, uuid } from './schema-helpers';

const coordinate = (limit: number) =>
  blankable(
    z
      .number({ error: 'must be a number' })
      .min(-limit, { error: `must be between -${limit} and ${limit}` })
      .max(limit, { error: `must be between -${limit} and ${limit}` })
  ).optional();

export const stadiumFields = z.object({
  name: requiredText(200),
  slug: requiredText(200).regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, {
    error: 'must be lowercase letters, numbers and single hyphens',
  }),
  city: optionalText(100).optional(),
  country: optionalText(100).optional(),
  address_line_1: optionalText(200).optional(),
  postcode: optionalText(20).optional(),
  latitude: coordinate(90),
  longitude: coordinate(180),
  capacity: blankable(
    z.int({ error: 'must be a whole number' }).positive({ error: 'must be more than 0' }).max(200_000, { error: 'must be at most 200000' })
  ).optional(),
  opened_date: blankable(isoDate).optional(),
  closed_date: blankable(isoDate).optional(),
  home_team_id: blankable(teamId).optional(),
  spurs_women: z.boolean({ error: 'must be true or false' }).optional(),
  wikidata_qid: blankable(z.string().regex(/^Q[1-9][0-9]*$/, { error: 'must be a Wikidata id like Q19542' })).optional(),
});

async function checkStadium(row: Row, context: CheckContext): Promise<string[]> {
  if (typeof row.opened_date === 'string' && typeof row.closed_date === 'string' && row.closed_date < row.opened_date) {
    throw new AdminServiceError('The closed date can\'t be before the opened date.');
  }

  // Every match's ground has to be a Spurs Women ground (the WEB-224 trigger
  // promotes one when a match is saved there), so un-ticking "Spurs Women
  // ground" is refused while any match is still linked to it.
  if (context.mode === 'update' && row.spurs_women === false) {
    const { count: matchCount, error } = await supabaseAdmin
      .from('matches')
      .select('id', { count: 'exact', head: true })
      .eq('stadium_id', context.id as string);
    if (error) throw fromDatabaseError(error);
    if (matchCount) {
      throw new AdminServiceError(
        `This ground has ${matchCount} match${matchCount === 1 ? '' : 'es'}, so it has to stay a Spurs Women ground.`
      );
    }
  }
  return [];
}

const stadiumService = createCrudService({
  table: 'stadia',
  label: 'Stadium',
  idSchema: uuid,
  fields: stadiumFields,
  check: checkStadium,
  invalidate: invalidateStadiumCache,
});

export const createStadium = stadiumService.create;
export const updateStadium = stadiumService.update;
export const deleteStadium = stadiumService.remove;
