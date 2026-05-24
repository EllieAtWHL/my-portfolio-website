import { Button } from '@/components/Button';

interface Team {
  id: number;
  name: string;
  is_tottenham: boolean;
}

interface Player {
  id: string;
  first_name: string | null;
  last_name: string;
}

interface PlayerHistory {
  id: string;
  player_id: string;
  team_id: number;
  joined_on: string | null;
  left_on: string | null;
  squad_number: number | null;
}

interface PlayerHistoryFormProps {
  players: Player[];
  teams: Team[];
  loading: boolean;
  playerHistoryForm: Partial<PlayerHistory>;
  setPlayerHistoryForm: (form: Partial<PlayerHistory>) => void;
  isEditMode: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onDelete: () => void;
  onCancel: () => void;
}

export function PlayerHistoryForm({
  players,
  teams,
  loading,
  playerHistoryForm,
  setPlayerHistoryForm,
  isEditMode,
  onSubmit,
  onDelete,
  onCancel,
}: PlayerHistoryFormProps) {
  return (
    <div className="spurs-accent-card rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold spurs-text">
          {isEditMode ? 'Edit Player History' : 'Add New Player History'}
        </h2>
        {isEditMode && (
          <div className="flex gap-2">
            <Button
              variant="spurs"
              size="sm"
              onClick={onDelete}
            >
              Delete
            </Button>
            <Button
              variant="spurs"
              size="sm"
              onClick={onCancel}
            >
              Cancel
            </Button>
          </div>
        )}
      </div>
      
      <form onSubmit={onSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2" htmlFor="player-history-player">Player <span style={{ color: 'var(--spurs-dark-accent)' }} aria-hidden="true">*</span></label>
            <select
              id="player-history-player"
              name="player_id"
              value={playerHistoryForm.player_id || ''}
              onChange={(e) => setPlayerHistoryForm({ ...playerHistoryForm, player_id: e.target.value })}
              required
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white spurs-text"
              aria-required="true"
            >
              <option value="">Select player</option>
              {players.map(player => (
                <option key={player.id} value={player.id}>
                  {player.first_name} {player.last_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" htmlFor="player-history-team">Team <span style={{ color: 'var(--spurs-dark-accent)' }} aria-hidden="true">*</span></label>
            <select
              id="player-history-team"
              name="team_id"
              value={playerHistoryForm.team_id?.toString() || ''}
              onChange={(e) => setPlayerHistoryForm({ ...playerHistoryForm, team_id: parseInt(e.target.value) })}
              required
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white spurs-text"
              aria-required="true"
            >
              <option value="">Select team</option>
              {teams.map(team => (
                <option key={team.id} value={team.id}>
                  {team.name} {team.is_tottenham && '(Default)'}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" htmlFor="player-history-joined">Joined On <span className="text-gray-400">(optional)</span></label>
            <input
              id="player-history-joined"
              name="joined_on"
              type="date"
              value={playerHistoryForm.joined_on || ''}
              onChange={(e) => setPlayerHistoryForm({ ...playerHistoryForm, joined_on: e.target.value || null })}
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white spurs-text"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" htmlFor="player-history-left">Left On <span className="text-gray-400">(optional)</span></label>
            <input
              id="player-history-left"
              name="left_on"
              type="date"
              value={playerHistoryForm.left_on || ''}
              onChange={(e) => setPlayerHistoryForm({ ...playerHistoryForm, left_on: e.target.value || null })}
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white spurs-text"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" htmlFor="player-history-squad">Squad Number <span className="text-gray-400">(optional)</span></label>
            <input
              id="player-history-squad"
              name="squad_number"
              type="number"
              min="1"
              max="99"
              value={playerHistoryForm.squad_number ?? ''}
              onChange={(e) => setPlayerHistoryForm({ ...playerHistoryForm, squad_number: e.target.value ? parseInt(e.target.value) : null })}
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white spurs-text"
            />
          </div>
        </div>
        <Button
          type="submit"
          variant="spurs"
          disabled={loading}
          loading={loading}
          fullWidth
        >
          {loading ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Player History' : 'Create Player History')}
        </Button>
      </form>
    </div>
  );
}
