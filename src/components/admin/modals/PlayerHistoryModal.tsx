import { Button } from '@/components/Button';
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-bold text-white mb-4">
          {editingPlayerHistoryId ? 'Edit Player History' : 'Add Player History'}
        </h3>
        {error && (
          <div className="mb-4 p-3 rounded bg-red-600 text-white text-sm">
            {error}
          </div>
        )}
        <div className="space-y-4">
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
        </div>
        <div className="flex justify-end space-x-2 mt-6">
          {editingPlayerHistoryId && (
            <Button variant="spurs" onClick={onDelete}>
              Delete
            </Button>
          )}
          <Button variant="spurs" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="spurs" onClick={onSubmit}>
            {editingPlayerHistoryId ? 'Update' : 'Create'}
          </Button>
        </div>
      </div>
    </div>
  );
}
