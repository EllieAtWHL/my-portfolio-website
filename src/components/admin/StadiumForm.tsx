import { FormWrapper } from './FormWrapper';
import { FormField, TextInput, NumberInput, SelectInput } from './FormField';

interface Team {
  id: number;
  name: string;
}

interface StadiumFormValues {
  name: string;
  slug: string;
  city: string | null;
  country: string | null;
  capacity: number | null;
  opened_date: string | null;
  address_line_1: string | null;
  postcode: string | null;
  latitude: number | null;
  longitude: number | null;
  home_team_id: number | null;
}

interface StadiumFormProps {
  teams: Team[];
  stadiumForm: Partial<StadiumFormValues>;
  setStadiumForm: (form: Partial<StadiumFormValues>) => void;
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
    <FormWrapper
      title="Stadium"
      isEditMode={isStadiumEditMode}
      editingId={editingStadiumId}
      loading={loading}
      onSubmit={onSubmit}
      onDelete={onDelete}
      onCancel={onCancel}
    >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField label="Stadium Name" required htmlFor="stadium-name">
            <TextInput
              id="stadium-name"
              name="name"
              value={stadiumForm.name || ''}
              onChange={(value) => setStadiumForm({ ...stadiumForm, name: value })}
              required
            />
          </FormField>
          <FormField label="Slug" required htmlFor="stadium-slug">
            <TextInput
              id="stadium-slug"
              name="slug"
              value={stadiumForm.slug || ''}
              onChange={(value) => setStadiumForm({ ...stadiumForm, slug: value })}
              required
            />
          </FormField>
          <FormField label="City" htmlFor="stadium-city">
            <TextInput
              id="stadium-city"
              name="city"
              value={stadiumForm.city || ''}
              onChange={(value) => setStadiumForm({ ...stadiumForm, city: value })}
            />
          </FormField>
          <FormField label="Country" htmlFor="stadium-country">
            <TextInput
              id="stadium-country"
              name="country"
              value={stadiumForm.country || ''}
              onChange={(value) => setStadiumForm({ ...stadiumForm, country: value })}
            />
          </FormField>
          <FormField label="Capacity" htmlFor="stadium-capacity">
            <NumberInput
              id="stadium-capacity"
              name="capacity"
              value={stadiumForm.capacity}
              onChange={(value) => setStadiumForm({ ...stadiumForm, capacity: value })}
            />
          </FormField>
          <FormField label="Opened Date" htmlFor="stadium-opened">
            <TextInput
              id="stadium-opened"
              name="opened_date"
              type="date"
              value={stadiumForm.opened_date || ''}
              onChange={(value) => setStadiumForm({ ...stadiumForm, opened_date: value })}
            />
          </FormField>
          <FormField label="Address Line 1" htmlFor="stadium-address">
            <TextInput
              id="stadium-address"
              name="address_line_1"
              value={stadiumForm.address_line_1 || ''}
              onChange={(value) => setStadiumForm({ ...stadiumForm, address_line_1: value })}
            />
          </FormField>
          <FormField label="Postcode" htmlFor="stadium-postcode">
            <TextInput
              id="stadium-postcode"
              name="postcode"
              value={stadiumForm.postcode || ''}
              onChange={(value) => setStadiumForm({ ...stadiumForm, postcode: value })}
            />
          </FormField>
          <FormField label="Home Team" htmlFor="stadium-home-team">
            <SelectInput
              id="stadium-home-team"
              name="home_team_id"
              value={stadiumForm.home_team_id?.toString() || ''}
              onChange={(value) => setStadiumForm({ ...stadiumForm, home_team_id: value ? parseInt(value) : null })}
              options={teams.map(team => ({ value: team.id, label: team.name }))}
              placeholder="Select team"
            />
          </FormField>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField label="Latitude" htmlFor="stadium-latitude">
            <NumberInput
              id="stadium-latitude"
              name="latitude"
              step="any"
              value={stadiumForm.latitude}
              onChange={(value) => setStadiumForm({ ...stadiumForm, latitude: value })}
            />
          </FormField>
          <FormField label="Longitude" htmlFor="stadium-longitude">
            <NumberInput
              id="stadium-longitude"
              name="longitude"
              step="any"
              value={stadiumForm.longitude}
              onChange={(value) => setStadiumForm({ ...stadiumForm, longitude: value })}
            />
          </FormField>
        </div>
      </FormWrapper>
  );
}
