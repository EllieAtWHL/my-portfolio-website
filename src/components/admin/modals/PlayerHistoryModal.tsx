import { FormModal } from './FormModal';
import type { PlayerHistory, Team } from '@/types/spurs-women-admin';

interface PlayerHistoryModalProps {
  editingPlayerHistoryId: string | null;
  form: Partial<PlayerHistory>;
  onChange: (form: Partial<PlayerHistory>) => void;
  error: string | null;
  teams: Team[];
  onCancel: () => void;
  onDelete: () => void;
  onSubmit: () => void;
}

export function PlayerHistoryModal({
  editingPlayerHistoryId,
  form,
  onChange,
  error,
  teams,
  onCancel,
  onDelete,
  onSubmit,
}: PlayerHistoryModalProps) {
  return (
    <FormModal
      title={editingPlayerHistoryId ? 'Edit Player History' : 'Add Player History'}
      error={error}
      onCancel={onCancel}
      onDelete={editingPlayerHistoryId ? onDelete : undefined}
      onSubmit={onSubmit}
      submitLabel={editingPlayerHistoryId ? 'Update' : 'Create'}
    >
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Team</label>
        <select
          value={form.team_id}
          onChange={(e) => onChange({ ...form, team_id: parseInt(e.target.value) })}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
        >
          <option value="">Select a team</option>
          {teams.map((team) => (
            <option key={team.id} value={team.id}>
              {team.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Joined On</label>
        <input
          type="date"
          value={form.joined_on || ''}
          onChange={(e) => onChange({ ...form, joined_on: e.target.value })}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Left On</label>
        <input
          type="date"
          value={form.left_on || ''}
          onChange={(e) => onChange({ ...form, left_on: e.target.value })}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Squad Number</label>
        <input
          type="number"
          value={form.squad_number || ''}
          onChange={(e) => onChange({ ...form, squad_number: e.target.value ? parseInt(e.target.value) : null })}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
        />
      </div>
    </FormModal>
  );
}
