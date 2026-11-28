import { z } from 'zod';
import { invalidateTeamCache } from '@/lib/data/cache-invalidation';
import { createCrudService } from './crud';
import { optionalText, requiredText, teamId } from './schema-helpers';

// Colours are Tailwind colour names from the admin ColorPicker (e.g.
// "blue-800", "white"), stored in varchar(20) columns.
const colour = optionalText(20).optional();

export const teamFields = z.object({
  name: requiredText(100),
  short_name: optionalText(50).optional(),
  primary_color: colour,
  secondary_color: colour,
  is_tottenham: z.boolean({ error: 'must be true or false' }).optional(),
});

const teamService = createCrudService({
  table: 'teams',
  label: 'Team',
  idSchema: teamId,
  fields: teamFields,
  invalidate: invalidateTeamCache,
});

export const createTeam = teamService.create;
export const updateTeam = teamService.update;
export const deleteTeam = teamService.remove;
