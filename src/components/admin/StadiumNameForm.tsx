import { Button } from '@/components/Button';

interface Stadium {
  id: string;
  name: string;
  city: string | null;
}

interface StadiumNameFormProps {
  stadiums: Stadium[];
  stadiumNameForm: {
    stadium_id?: string;
    name?: string;
    valid_from?: string | null;
    valid_to?: string | null;
  };
  setStadiumNameForm: (form: {
    stadium_id?: string;
    name?: string;
    valid_from?: string | null;
    valid_to?: string | null;
  }) => void;
  isStadiumNameEditMode: boolean;
  editingStadiumNameId: string | null;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onDelete: () => void;
  onCancel: () => void;
}

export function StadiumNameForm({
  stadiums,
  stadiumNameForm,
  setStadiumNameForm,
  isStadiumNameEditMode,
  editingStadiumNameId,
  loading,
  onSubmit,
  onDelete,
  onCancel,
}: StadiumNameFormProps) {
  return (
    <div className="spurs-accent-card rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold spurs-text">
          {isStadiumNameEditMode && editingStadiumNameId ? 'Edit Stadium Name' : 'Add New Stadium Name'}
        </h2>
        {isStadiumNameEditMode && editingStadiumNameId && (
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
            <label className="block text-sm font-medium mb-2" htmlFor="stadium-name-stadium">Stadium <span style={{ color: 'var(--spurs-dark-accent)' }} aria-hidden="true">*</span></label>
            <select
              id="stadium-name-stadium"
              name="stadium_id"
              value={stadiumNameForm.stadium_id || ''}
              onChange={(e) => setStadiumNameForm({ ...stadiumNameForm, stadium_id: e.target.value })}
              required
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white spurs-text"
              aria-required="true"
            >
              <option value="">Select stadium</option>
              {stadiums.map(stadium => (
                <option key={stadium.id} value={stadium.id}>
                  {stadium.name} {stadium.city && `(${stadium.city})`}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" htmlFor="stadium-name-name">Stadium Name <span style={{ color: 'var(--spurs-dark-accent)' }} aria-hidden="true">*</span></label>
            <input
              id="stadium-name-name"
              name="name"
              type="text"
              value={stadiumNameForm.name || ''}
              onChange={(e) => setStadiumNameForm({ ...stadiumNameForm, name: e.target.value })}
              required
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white spurs-text"
              aria-required="true"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" htmlFor="stadium-name-valid-from">Valid From <span className="text-gray-400">(optional)</span></label>
            <input
              id="stadium-name-valid-from"
              name="valid_from"
              type="date"
              value={stadiumNameForm.valid_from || ''}
              onChange={(e) => setStadiumNameForm({ ...stadiumNameForm, valid_from: e.target.value || null })}
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white spurs-text"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" htmlFor="stadium-name-valid-to">Valid To <span className="text-gray-400">(optional)</span></label>
            <input
              id="stadium-name-valid-to"
              name="valid_to"
              type="date"
              value={stadiumNameForm.valid_to || ''}
              onChange={(e) => setStadiumNameForm({ ...stadiumNameForm, valid_to: e.target.value || null })}
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white spurs-text"
            />
          </div>
        </div>
        <div className="text-sm text-gray-400 mb-4">
          <p>Use this form to add historical stadium names or naming variations. For example:</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Previous names (e.g., &ldquo;White Hart Lane&rdquo;)</li>
            <li>Sponsored names (e.g., &ldquo;Tottenham Hotspur Stadium&rdquo;)</li>
            <li>Historical variations</li>
          </ul>
        </div>
        <Button
          type="submit"
          variant="spurs"
          disabled={loading}
          loading={loading}
          fullWidth
        >
          {loading ? (isStadiumNameEditMode ? 'Updating...' : 'Creating...') : (isStadiumNameEditMode ? 'Update Stadium Name' : 'Create Stadium Name')}
        </Button>
      </form>
    </div>
  );
}
