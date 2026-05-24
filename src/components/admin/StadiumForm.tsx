import { Button } from '@/components/Button';

interface Team {
  id: number;
  name: string;
}

interface StadiumFormProps {
  teams: Team[];
  stadiumForm: {
    name?: string;
    slug?: string;
    city?: string | null;
    country?: string | null;
    capacity?: number | null;
    opened_date?: string | null;
    address_line_1?: string | null;
    postcode?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    home_team_id?: number | null;
  };
  setStadiumForm: (form: {
    name?: string;
    slug?: string;
    city?: string | null;
    country?: string | null;
    capacity?: number | null;
    opened_date?: string | null;
    address_line_1?: string | null;
    postcode?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    home_team_id?: number | null;
  }) => void;
  isStadiumEditMode: boolean;
  editingStadiumId: string | null;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onDelete: () => void;
  onCancel: () => void;
}

export function StadiumForm({
  teams,
  stadiumForm,
  setStadiumForm,
  isStadiumEditMode,
  editingStadiumId,
  loading,
  onSubmit,
  onDelete,
  onCancel,
}: StadiumFormProps) {
  return (
    <div className="spurs-accent-card rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold spurs-text">
          {isStadiumEditMode && editingStadiumId ? 'Edit Stadium' : 'Add New Stadium'}
        </h2>
        {isStadiumEditMode && editingStadiumId && (
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
            <label className="block text-sm font-medium mb-2" htmlFor="stadium-name">Stadium Name <span style={{ color: 'var(--spurs-dark-accent)' }} aria-hidden="true">*</span></label>
            <input
              id="stadium-name"
              name="name"
              type="text"
              value={stadiumForm.name || ''}
              onChange={(e) => setStadiumForm({ ...stadiumForm, name: e.target.value })}
              required
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white spurs-text"
              aria-required="true"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" htmlFor="stadium-slug">Slug <span style={{ color: 'var(--spurs-dark-accent)' }} aria-hidden="true">*</span></label>
            <input
              id="stadium-slug"
              name="slug"
              type="text"
              value={stadiumForm.slug || ''}
              onChange={(e) => setStadiumForm({ ...stadiumForm, slug: e.target.value })}
              required
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white spurs-text"
              aria-required="true"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" htmlFor="stadium-city">City <span className="text-gray-400">(optional)</span></label>
            <input
              id="stadium-city"
              name="city"
              type="text"
              value={stadiumForm.city || ''}
              onChange={(e) => setStadiumForm({ ...stadiumForm, city: e.target.value || null })}
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white spurs-text"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" htmlFor="stadium-country">Country <span className="text-gray-400">(optional)</span></label>
            <input
              id="stadium-country"
              name="country"
              type="text"
              value={stadiumForm.country || ''}
              onChange={(e) => setStadiumForm({ ...stadiumForm, country: e.target.value || null })}
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white spurs-text"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" htmlFor="stadium-capacity">Capacity <span className="text-gray-400">(optional)</span></label>
            <input
              id="stadium-capacity"
              name="capacity"
              type="number"
              value={stadiumForm.capacity === null || stadiumForm.capacity === undefined ? '' : stadiumForm.capacity}
              onChange={(e) => setStadiumForm({ ...stadiumForm, capacity: e.target.value !== '' ? parseInt(e.target.value) : null })}
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white spurs-text"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" htmlFor="stadium-opened">Opened Date <span className="text-gray-400">(optional)</span></label>
            <input
              id="stadium-opened"
              name="opened_date"
              type="date"
              value={stadiumForm.opened_date || ''}
              onChange={(e) => setStadiumForm({ ...stadiumForm, opened_date: e.target.value || null })}
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white spurs-text"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" htmlFor="stadium-address">Address Line 1 <span className="text-gray-400">(optional)</span></label>
            <input
              id="stadium-address"
              name="address_line_1"
              type="text"
              value={stadiumForm.address_line_1 || ''}
              onChange={(e) => setStadiumForm({ ...stadiumForm, address_line_1: e.target.value || null })}
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white spurs-text"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" htmlFor="stadium-postcode">Postcode <span className="text-gray-400">(optional)</span></label>
            <input
              id="stadium-postcode"
              name="postcode"
              type="text"
              value={stadiumForm.postcode || ''}
              onChange={(e) => setStadiumForm({ ...stadiumForm, postcode: e.target.value || null })}
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white spurs-text"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" htmlFor="stadium-home-team">Home Team <span className="text-gray-400">(optional)</span></label>
            <select
              id="stadium-home-team"
              name="home_team_id"
              value={stadiumForm.home_team_id?.toString() || ''}
              onChange={(e) => setStadiumForm({ ...stadiumForm, home_team_id: e.target.value ? parseInt(e.target.value) : null })}
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white spurs-text"
            >
              <option value="">Select team</option>
              {teams.map(team => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2" htmlFor="stadium-latitude">Latitude <span className="text-gray-400">(optional)</span></label>
            <input
              id="stadium-latitude"
              name="latitude"
              type="number"
              step="any"
              value={stadiumForm.latitude === null || stadiumForm.latitude === undefined ? '' : stadiumForm.latitude}
              onChange={(e) => setStadiumForm({ ...stadiumForm, latitude: e.target.value !== '' ? parseFloat(e.target.value) : null })}
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white spurs-text"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" htmlFor="stadium-longitude">Longitude <span className="text-gray-400">(optional)</span></label>
            <input
              id="stadium-longitude"
              name="longitude"
              type="number"
              step="any"
              value={stadiumForm.longitude === null || stadiumForm.longitude === undefined ? '' : stadiumForm.longitude}
              onChange={(e) => setStadiumForm({ ...stadiumForm, longitude: e.target.value !== '' ? parseFloat(e.target.value) : null })}
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
          {loading ? (isStadiumEditMode ? 'Updating...' : 'Creating...') : (isStadiumEditMode ? 'Update Stadium' : 'Create Stadium')}
        </Button>
      </form>
    </div>
  );
}
