import { Button } from '@/components/Button';
import { ColorPicker } from './ColorPicker';

interface TeamFormProps {
  teamForm: {
    name?: string;
    short_name?: string;
    primary_color?: string | null;
    secondary_color?: string | null;
    is_tottenham?: boolean;
  };
  setTeamForm: (form: {
    name?: string;
    short_name?: string;
    primary_color?: string | null;
    secondary_color?: string | null;
    is_tottenham?: boolean;
  }) => void;
  isTeamEditMode: boolean;
  editingTeamId: number | null;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onDelete: () => void;
  onCancel: () => void;
}

export function TeamForm({
  teamForm,
  setTeamForm,
  isTeamEditMode,
  editingTeamId,
  loading,
  onSubmit,
  onDelete,
  onCancel,
}: TeamFormProps) {
  return (
    <div className="spurs-accent-card rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold spurs-text">
          {isTeamEditMode && editingTeamId ? 'Edit Team' : 'Add New Team'}
        </h2>
        {isTeamEditMode && editingTeamId && (
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
            <label className="block text-sm font-medium mb-2" htmlFor="team-name">Team Name <span style={{ color: 'var(--spurs-dark-accent)' }} aria-hidden="true">*</span></label>
            <input
              id="team-name"
              name="name"
              type="text"
              value={teamForm.name || ''}
              onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })}
              required
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white spurs-text"
              aria-required="true"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" htmlFor="team-short-name">Short Name <span style={{ color: 'var(--spurs-dark-accent)' }} aria-hidden="true">*</span></label>
            <input
              id="team-short-name"
              name="short_name"
              type="text"
              value={teamForm.short_name || ''}
              onChange={(e) => setTeamForm({ ...teamForm, short_name: e.target.value })}
              required
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white spurs-text"
              aria-required="true"
            />
          </div>
          <div>
            <ColorPicker
              value={teamForm.primary_color || null}
              onChange={(color) => setTeamForm({ ...teamForm, primary_color: color })}
              label="Primary Color"
            />
          </div>
          <div>
            <ColorPicker
              value={teamForm.secondary_color || null}
              onChange={(color) => setTeamForm({ ...teamForm, secondary_color: color })}
              label="Secondary Color"
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
          {loading ? (isTeamEditMode ? 'Updating...' : 'Creating...') : (isTeamEditMode ? 'Update Team' : 'Create Team')}
        </Button>
      </form>
    </div>
  );
}
