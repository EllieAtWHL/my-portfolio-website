import { z } from 'zod';
import { invalidatePlayerHistoryCache } from '@/lib/data/cache-invalidation';
import { createCrudService, type Row } from './crud';
import { AdminServiceError } from './errors';
import { blankable, count, isoDate, teamId, uuid } from './schema-helpers';

export const playerHistoryFields = z.object({
  player_id: uuid,
  team_id: teamId,
  squad_number: count(99).optional(),
  joined_on: isoDate,
  left_on: blankable(isoDate).optional(),
  // Non-null means the stint is a loan from this parent club (WEB-156).
  on_loan_from_team_id: blankable(teamId).optional(),
});

function checkPlayerHistory(row: Row): string[] {
  const errors: string[] = [];
  if (typeof row.left_on === 'string' && typeof row.joined_on === 'string' && row.left_on < row.joined_on) {
    errors.push('Left On can\'t be before Joined On.');
  }
  if (row.on_loan_from_team_id !== null && row.on_loan_from_team_id !== undefined && row.on_loan_from_team_id === row.team_id) {
    errors.push('A player can\'t be on loan from the team she\'s playing for.');
  }
  if (errors.length > 0) throw new AdminServiceError(errors.join(' '));
  return [];
}

const playerHistoryService = createCrudService({
  table: 'player_history',
  label: 'Player history',
  idSchema: uuid,
  fields: playerHistoryFields,
  check: checkPlayerHistory,
  invalidate: invalidatePlayerHistoryCache,
});

export const createPlayerHistory = playerHistoryService.create;
export const updatePlayerHistory = playerHistoryService.update;
export const deletePlayerHistory = playerHistoryService.remove;
