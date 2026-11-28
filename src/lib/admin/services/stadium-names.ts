import { z } from 'zod';
import { invalidateStadiumNamesCache } from '@/lib/data/cache-invalidation';
import { createCrudService, type Row } from './crud';
import { AdminServiceError } from './errors';
import { blankable, isoDate, requiredText, uuid } from './schema-helpers';

export const stadiumNameFields = z.object({
  stadium_id: uuid,
  name: requiredText(200),
  valid_from: isoDate,
  valid_to: blankable(isoDate).optional(),
  is_primary: z.boolean({ error: 'must be true or false' }).optional(),
});

function checkStadiumName(row: Row): string[] {
  if (typeof row.valid_to === 'string' && typeof row.valid_from === 'string' && row.valid_to < row.valid_from) {
    throw new AdminServiceError('Valid To can\'t be before Valid From.');
  }
  return [];
}

const stadiumNameService = createCrudService({
  table: 'stadium_names',
  label: 'Stadium name',
  idSchema: uuid,
  fields: stadiumNameFields,
  check: checkStadiumName,
  invalidate: invalidateStadiumNamesCache,
});

export const createStadiumName = stadiumNameService.create;
export const updateStadiumName = stadiumNameService.update;
export const deleteStadiumName = stadiumNameService.remove;
