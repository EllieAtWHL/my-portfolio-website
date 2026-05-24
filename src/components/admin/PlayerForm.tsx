import { Button } from '@/components/Button';

interface PlayerForm {
  first_name: string | null;
  last_name: string;
  date_of_birth: string | null;
  nationality: string | null;
  position: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  profile_image_url: string | null;
  is_active: boolean;
}

interface PlayerFormProps {
  playerForm: Partial<PlayerForm>;
  setPlayerForm: (form: Partial<PlayerForm>) => void;
  isPlayerEditMode: boolean;
  editingPlayerId: string | null;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onDelete: () => void;
  onCancel: () => void;
}

export function PlayerForm({
  playerForm,
  setPlayerForm,
  isPlayerEditMode,
  editingPlayerId,
  loading,
  onSubmit,
  onDelete,
  onCancel,
}: PlayerFormProps) {
  return (
    <div className="spurs-accent-card rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold spurs-text">
          {isPlayerEditMode && editingPlayerId ? 'Edit Player' : 'Add New Player'}
        </h2>
        {isPlayerEditMode && editingPlayerId && (
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
            <label className="block text-sm font-medium mb-2" htmlFor="player-first-name">First Name <span className="text-gray-400">(optional)</span></label>
            <input
              id="player-first-name"
              name="first_name"
              type="text"
              value={playerForm.first_name || ''}
              onChange={(e) => setPlayerForm({ ...playerForm, first_name: e.target.value })}
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white spurs-text"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" htmlFor="player-last-name">Last Name <span style={{ color: 'var(--spurs-dark-accent)' }} aria-hidden="true">*</span></label>
            <input
              id="player-last-name"
              name="last_name"
              type="text"
              value={playerForm.last_name || ''}
              onChange={(e) => setPlayerForm({ ...playerForm, last_name: e.target.value })}
              required
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white spurs-text"
              aria-required="true"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" htmlFor="player-dob">Date of Birth <span className="text-gray-400">(optional)</span></label>
            <input
              id="player-dob"
              name="date_of_birth"
              type="date"
              value={playerForm.date_of_birth || ''}
              onChange={(e) => setPlayerForm({ ...playerForm, date_of_birth: e.target.value })}
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white spurs-text"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" htmlFor="player-nationality">Nationality <span className="text-gray-400">(optional)</span></label>
            <input
              id="player-nationality"
              name="nationality"
              type="text"
              value={playerForm.nationality || ''}
              onChange={(e) => setPlayerForm({ ...playerForm, nationality: e.target.value })}
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white spurs-text"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" htmlFor="player-position">Position <span className="text-gray-400">(optional)</span></label>
            <select
              id="player-position"
              name="position"
              value={playerForm.position || ''}
              onChange={(e) => setPlayerForm({ ...playerForm, position: e.target.value })}
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white spurs-text"
            >
              <option value="">Select position</option>
              <option value="Goalkeeper">Goalkeeper</option>
              <option value="Defender">Defender</option>
              <option value="Midfielder">Midfielder</option>
              <option value="Forward">Forward</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" htmlFor="player-height">Height (cm) <span className="text-gray-400">(optional)</span></label>
            <input
              id="player-height"
              name="height_cm"
              type="number"
              value={playerForm.height_cm === null || playerForm.height_cm === undefined ? '' : playerForm.height_cm}
              onChange={(e) => setPlayerForm({ ...playerForm, height_cm: e.target.value !== '' ? parseInt(e.target.value) : null })}
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white spurs-text"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" htmlFor="player-weight">Weight (kg) <span className="text-gray-400">(optional)</span></label>
            <input
              id="player-weight"
              name="weight_kg"
              type="number"
              value={playerForm.weight_kg === null || playerForm.weight_kg === undefined ? '' : playerForm.weight_kg}
              onChange={(e) => setPlayerForm({ ...playerForm, weight_kg: e.target.value !== '' ? parseInt(e.target.value) : null })}
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white spurs-text"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" htmlFor="player-image-url">Profile Image URL <span className="text-gray-400">(optional)</span></label>
            <input
              id="player-image-url"
              name="profile_image_url"
              type="text"
              value={playerForm.profile_image_url || ''}
              onChange={(e) => setPlayerForm({ ...playerForm, profile_image_url: e.target.value })}
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white spurs-text"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" htmlFor="player-is-active">Is Active? <span className="text-gray-400">(optional)</span></label>
            <select
              id="player-is-active"
              name="is_active"
              value={playerForm.is_active ? 'true' : 'false'}
              onChange={(e) => setPlayerForm({ ...playerForm, is_active: e.target.value === 'true' })}
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white spurs-text"
            >
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>
        </div>
        <Button
          type="submit"
          variant="spurs"
          disabled={loading}
          loading={loading}
          fullWidth
        >
          {loading ? (isPlayerEditMode ? 'Updating...' : 'Creating...') : (isPlayerEditMode ? 'Update Player' : 'Create Player')}
        </Button>
      </form>
    </div>
  );
}
