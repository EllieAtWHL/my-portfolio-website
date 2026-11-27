import { z } from 'zod';
import { invalidatePlayerCache } from '@/lib/data/cache-invalidation';
import { createCrudService } from './crud';
import { blankable, isoDate, optionalText, requiredText, uuid } from './schema-helpers';

export const PLAYER_POSITIONS = ['Goalkeeper', 'Defender', 'Midfielder', 'Forward'] as const;

const positiveInt = (max: number) =>
  blankable(
    z
      .int({ error: 'must be a whole number' })
      .positive({ error: 'must be more than 0' })
      .max(max, { error: `must be at most ${max}` })
  ).optional();

export const playerFields = z.object({
  first_name: optionalText(100).optional(),
  last_name: requiredText(100),
  date_of_birth: blankable(isoDate).optional(),
  nationality: optionalText(100).optional(),
  position: blankable(z.enum(PLAYER_POSITIONS, { error: `must be one of ${PLAYER_POSITIONS.join(', ')}` })).optional(),
  height_cm: positiveInt(250),
  weight_kg: positiveInt(200),
  profile_image_url: blankable(z.url({ protocol: /^https?$/, error: 'must be an http(s) URL' })).optional(),
  legacy_number: positiveInt(10_000),
});

const playerService = createCrudService({
  table: 'players',
  label: 'Player',
  idSchema: uuid,
  fields: playerFields,
  invalidate: invalidatePlayerCache,
});

export const createPlayer = playerService.create;
export const updatePlayer = playerService.update;
export const deletePlayer = playerService.remove;
